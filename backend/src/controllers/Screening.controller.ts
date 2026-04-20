import { Request, Response } from 'express';
import { Applicant, Job, ScreeningRequestModel, ScreeningResultModel } from '../models';
import { aiScreeningService } from '../services/Aiscreening.service';
import { resumeParserService } from '../services/Resumeparser.service';
import { logger } from '../lib/Logger';
import type { ApiResponse, TalentProfile } from '../types';
import multer from 'multer';
import * as XLSX from 'xlsx';
import crypto from 'crypto';


// Create a new screening job
export async function createScreening(req: Request, res: Response) {
  try {
    const { jobId, applicantIds, shortlistSize = 10 } = req.body;
    const idempotencyKey = String(req.headers['idempotency-key'] || '').trim() || undefined;

    // Validate job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' } satisfies ApiResponse);
    }

    // Fetch applicants
    const ids = applicantIds && applicantIds.length > 0 ? applicantIds : undefined;
    const applicants = ids
      ? await Applicant.find({ _id: { $in: ids } })
      : await Applicant.find({});

    if (applicants.length === 0) {
      return res.status(400).json({ success: false, error: 'No applicants found to screen' } satisfies ApiResponse);
    }

    const applicantSetHash = hashApplicantSet(applicants.map((a) => a._id.toString()));
    if (idempotencyKey) {
      const existingByKey = await ScreeningRequestModel.findOne({ idempotencyKey });
      if (existingByKey) {
        return res.status(200).json({
          success: true,
          data: {
            screeningRequestId: existingByKey._id.toString(),
            status: existingByKey.status,
            applicantsCount: existingByKey.applicantIds.length,
            message: 'Reused existing request by idempotency key',
          },
        } satisfies ApiResponse);
      }
    }

    const existingInFlight = await ScreeningRequestModel.findOne({
      jobId: job._id.toString(),
      applicantSetHash,
      status: { $in: ['pending', 'processing'] },
    });
    if (existingInFlight) {
      return res.status(409).json({
        success: false,
        error: 'A screening request for this job and applicant set is already processing',
        data: { screeningRequestId: existingInFlight._id.toString() },
      } satisfies ApiResponse);
    }

    // Create screening request record
    const screeningRequest = await ScreeningRequestModel.create({
      jobId: job._id.toString(),
      applicantIds: applicants.map((a) => a._id.toString()),
      applicantSetHash,
      idempotencyKey,
      shortlistSize,
      status: 'processing',
    });

    // Run screening asynchronously 
    runScreeningAsync(screeningRequest._id.toString(), job.toObject(), applicants, shortlistSize);

    return res.status(202).json({
      success: true,
      data: {
        screeningRequestId: screeningRequest._id.toString(),
        status: 'processing',
        applicantsCount: applicants.length,
        message: `Screening ${applicants.length} candidates for "${job.title}"`,
      },
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Screening] createScreening error:', err);
    return res.status(500).json({ success: false, error: 'Failed to start screening' } satisfies ApiResponse);
  }
}

//  Background screening task
async function runScreeningAsync(
  screeningRequestId: string,
  job: any,
  applicants: any[],
  shortlistSize: 10 | 20,
) {
  try {
    const profiles: TalentProfile[] = applicants.map((a) => ({
      id: a._id.toString(),
      fullName: a.fullName,
      email: a.email,
      phone: a.phone,
      location: a.location,
      headline: a.headline,
      summary: a.summary,
      skills: a.skills,
      workExperience: a.workExperience,
      education: a.education,
      certifications: a.certifications,
      languages: a.languages,
      portfolioUrl: a.portfolioUrl,
      linkedinUrl: a.linkedinUrl,
      githubUrl: a.githubUrl,
      availability: a.availability,
      expectedSalary: a.expectedSalary,
      source: a.source,
      rawResumeText: a.rawResumeText,
    }));

    const jobPosting = {
      id: job._id.toString(),
      ...job,
    };

    const result = await aiScreeningService.screenApplicants(jobPosting, profiles, shortlistSize);

    // Persist the result
    await ScreeningResultModel.create({
      screeningRequestId,
      ...result,
    });

    // Mark request as completed
    await ScreeningRequestModel.findByIdAndUpdate(screeningRequestId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    logger.info(`[Screening] Request ${screeningRequestId} completed successfully`);
  } catch (err) {
    logger.error(`[Screening] Request ${screeningRequestId} failed:`, err);
    await ScreeningRequestModel.findByIdAndUpdate(screeningRequestId, {
      status: 'failed',
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

// Get screening status + result 
export async function getScreeningResult(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const screeningRequest = await ScreeningRequestModel.findById(id);
    if (!screeningRequest) {
      return res.status(404).json({ success: false, error: 'Screening request not found' } satisfies ApiResponse);
    }

    if (screeningRequest.status !== 'completed') {
      return res.json({
        success: true,
        data: {
          status: screeningRequest.status,
          message: screeningRequest.status === 'processing'
            ? 'AI is evaluating candidates...'
            : screeningRequest.errorMessage || 'Unknown error',
        },
      } satisfies ApiResponse);
    }

    const result = await ScreeningResultModel.findOne({ screeningRequestId: id });
    if (!result) {
      return res.status(404).json({ success: false, error: 'Screening result not found' } satisfies ApiResponse);
    }

    // Enrich shortlist with applicant details
    const applicantIds = result.shortlist.map((s) => s.applicantId);
    const applicants = await Applicant.find({ _id: { $in: applicantIds } });
    const applicantMap = new Map(applicants.map((a) => [a._id.toString(), a.toObject()]));

    const enrichedShortlist = result.shortlist.map((score: any) => ({
      ...(score.toObject ? score.toObject() : score),
      applicant: applicantMap.get(score.applicantId) || null,
    }));

    return res.json({
      success: true,
      data: {
        status: 'completed',
        result: {
          ...result.toObject(),
          shortlist: enrichedShortlist,
        },
      },
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Screening] getScreeningResult error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve result' } satisfies ApiResponse);
  }
}

// ------ Upload CSV applicants ------
export async function uploadCSVApplicants(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' } satisfies ApiResponse);
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as Record<string, string>[];

    const rowErrors: Array<{ row: number; error: string }> = [];
    const profiles = rows.flatMap((row, idx) => {
      const validation = validateCSVRow(row);
      if (!validation.valid) {
        rowErrors.push({ row: idx + 2, error: validation.error });
        return [];
      }
      return [resumeParserService.parseCSVRow(normalizeCSVRow(row))];
    });

    const inserted: any[] = [];
    for (const profile of profiles) {
      try {
        const doc = await Applicant.findOneAndUpdate(
          { email: profile.email },
          { $setOnInsert: { ...profile } },
          { upsert: true, new: true },
        );
        inserted.push(doc);
      } catch (err) {
        logger.warn(`[Upload] Skipping duplicate email: ${profile.email}`);
      }
    }

    return res.json({
      success: true,
      data: {
        totalRows: rows.length,
        importedCount: inserted.length,
        applicantIds: inserted.map((a) => a._id.toString()),
        rowErrors,
      },
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Upload] CSV upload error:', err);
    return res.status(500).json({ success: false, error: 'Failed to process CSV' } satisfies ApiResponse);
  }
}

//  Get all screening history 
export async function listScreenings(req: Request, res: Response) {
  try {
    const screenings = await ScreeningRequestModel.find()
      .sort({ createdAt: -1 })
      .limit(50);

    // Enrich with job titles
    const jobIds = [...new Set(screenings.map((s) => s.jobId))];
    const jobs = await Job.find({ _id: { $in: jobIds } });
    const jobMap = new Map(jobs.map((j) => [j._id.toString(), j.title]));

    const enriched = screenings.map((s) => ({
      ...s.toObject(),
      jobTitle: jobMap.get(s.jobId) || 'Unknown Job',
    }));

    return res.json({ success: true, data: enriched } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Screening] listScreenings error:', err);
    return res.status(500).json({ success: false, error: 'Failed to list screenings' } satisfies ApiResponse);
  }
}

export async function evaluateScreeningQuality(req: Request, res: Response) {
  try {
    const { screeningRequestId, topK = 10 } = req.query;
    if (!screeningRequestId || typeof screeningRequestId !== 'string') {
      return res.status(400).json({ success: false, error: 'screeningRequestId is required' } satisfies ApiResponse);
    }

    const result = await ScreeningResultModel.findOne({ screeningRequestId });
    if (!result) {
      return res.status(404).json({ success: false, error: 'Screening result not found' } satisfies ApiResponse);
    }

    const k = Math.max(1, Math.min(20, Number(topK) || 10));
    const top = result.shortlist.slice(0, k);
    const strongOrYes = top.filter((c) => c.recommendation === 'strong_yes' || c.recommendation === 'yes').length;
    const avgConfidence = top.reduce((acc, c) => acc + (c.confidenceScore || 0), 0) / Math.max(1, top.length);
    const reviewQueueSize = top.filter((c) => c.needsHumanReview).length;

    return res.json({
      success: true,
      data: {
        screeningRequestId,
        topK: k,
        precisionAtKProxy: Math.round((strongOrYes / Math.max(1, top.length)) * 1000) / 1000,
        averageConfidence: Math.round(avgConfidence * 1000) / 1000,
        humanReviewRate: Math.round((reviewQueueSize / Math.max(1, top.length)) * 1000) / 1000,
        transparentContract: {
          modelUsed: result.modelUsed,
          promptVersion: result.promptVersion,
          processingTimeMs: result.processingTimeMs,
          fallbackUsed: result.fallbackUsed,
        },
      },
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Screening] evaluateScreeningQuality error:', err);
    return res.status(500).json({ success: false, error: 'Failed to evaluate screening quality' } satisfies ApiResponse);
  }
}

function hashApplicantSet(ids: string[]): string {
  return crypto.createHash('sha256').update(ids.slice().sort().join('|')).digest('hex');
}

function normalizeCSVRow(row: Record<string, string>): Record<string, string> {
  const normalized = { ...row };
  const rawSkills = normalized.skills || normalized.Skills || '';
  normalized.skills = rawSkills
    .split(/[,;|]/)
    .map((s) => normalizeSkillName(s))
    .filter(Boolean)
    .join(', ');
  return normalized;
}

function validateCSVRow(row: Record<string, string>): { valid: boolean; error: string } {
  const fullName = row.name || row.fullName || row.full_name;
  const email = row.email;
  if (!fullName) return { valid: false, error: 'Missing candidate name' };
  if (!email) return { valid: false, error: 'Missing candidate email' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, error: 'Invalid email format' };
  return { valid: true, error: '' };
}

function normalizeSkillName(name: string): string {
  const v = name.trim().toLowerCase();
  if (v === 'node' || v === 'node js') return 'Node.js';
  if (v === 'js') return 'JavaScript';
  if (v === 'ts') return 'TypeScript';
  return name.trim();
}