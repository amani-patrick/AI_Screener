import { Request, Response } from 'express';
import { Applicant, Job, ScreeningRequestModel, ScreeningResultModel, UserSettingsModel } from '../models';
import { aiScreeningService, createAIScreeningService } from '../services/Aiscreening.service';
import { resumeParserService, createResumeParserService } from '../services/Resumeparser.service';
import { logger } from '../lib/Logger';
import type { ApiResponse, TalentProfile } from '../types';
import multer from 'multer';
import * as XLSX from 'xlsx';
import pdfparse from 'pdf-parse';
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

    const userId = req.userId || 'demo-recruiter';

    // Fetch applicants - filter by user's applicants or system applicants (createdBy is null/undefined)
    const ids = applicantIds && applicantIds.length > 0 ? applicantIds : undefined;
    const applicants = ids
      ? await Applicant.find({ _id: { $in: ids }, $or: [{ createdBy: userId }, { createdBy: { $exists: false } }] })
      : await Applicant.find({ $or: [{ createdBy: userId }, { createdBy: { $exists: false } }] });

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
    // Check if the existing screening is stale (older than 30 minutes)
    if (existingInFlight) {
      const screeningAge = Date.now() - new Date(existingInFlight.createdAt).getTime();
      const STALE_THRESHOLD = 30 * 60 * 1000; // 30 minutes

      // Also check if the applicants in the screening request still exist
      const existingApplicants = await Applicant.find({ _id: { $in: existingInFlight.applicantIds } });
      const applicantsStillExist = existingApplicants.length === existingInFlight.applicantIds.length;

      if (screeningAge > STALE_THRESHOLD || !applicantsStillExist) {
        const reason = !applicantsStillExist ? 'applicants deleted' : 'timeout';
        logger.warn(`[Screening] Found stale screening request (${screeningAge}ms old, ${reason}), marking as failed`);
        await ScreeningRequestModel.findByIdAndUpdate(existingInFlight._id, {
          status: 'failed',
          errorMessage: `Screening request expired (${reason})`,
          completedAt: new Date().toISOString(),
        });
        // Don't return, allow new screening to proceed
      } else {
        return res.status(409).json({
          success: false,
          error: 'A screening request for this job and applicant set is already in progress',
          data: { screeningRequestId: existingInFlight._id.toString() },
        } satisfies ApiResponse);
      }
    }

    // Create screening request record
    const screeningRequest = await ScreeningRequestModel.create({
      jobId: job._id.toString(),
      applicantIds: applicants.map((a) => a._id.toString()),
      applicantSetHash,
      idempotencyKey,
      shortlistSize,
      userId,
      status: 'processing',
    });

    // Increment job's applicant count
    await Job.findByIdAndUpdate(job._id, {
      $inc: { applicantsCount: applicants.length }
    });

    // Fetch user's API key from settings (BYOK - hybrid approach)
    const userSettings = await UserSettingsModel.findOne({ userId });
    const userApiKey = userSettings?.geminiApiKey;

    // Check if using server key BEFORE starting screening
    const hasApiKey = !!(userApiKey || process.env.GEMINI_API_KEY);
    const usingServerKey = !userApiKey && !!process.env.GEMINI_API_KEY;

    // If no API key at all, reject immediately
    if (!hasApiKey) {
      return res.status(400).json({
        success: false,
        error: 'API key required',
        data: {
          requiresApiKey: true,
          message: 'AI screening requires a Gemini API key. Please add your API key in Settings to enable AI-powered screening.',
        },
      } satisfies ApiResponse);
    }

    // If using server fallback key, require explicit confirmation
    if (usingServerKey) {
      const confirmFallback = req.body.confirmFallback === true;
      if (!confirmFallback) {
        return res.status(409).json({
          success: false,
          error: 'Fallback API key confirmation required',
          data: {
            requiresFallbackConfirmation: true,
            message: 'You are about to use the default fallback API key for AI screening. This may have rate limits. Please confirm to proceed or add your own API key in Settings.',
          },
        } satisfies ApiResponse);
      }
      logger.warn('[Screening] User confirmed usage of fallback API key');
    }

    // Create AI service to check initialization
    const aiService = createAIScreeningService(userApiKey);

    // Log screening start with detailed information
    logger.info(`[Screening] Starting screening for job "${job.title}" with ${applicants.length} candidates`, {
      jobId: job._id.toString(),
      userId,
      applicantCount: applicants.length,
      shortlistSize,
      hasApiKey,
      usingServerKey,
    });

    // Run screening asynchronously 
    runScreeningAsync(screeningRequest._id.toString(), job.toObject(), applicants, shortlistSize, userId);

    return res.status(202).json({
      success: true,
      data: {
        screeningRequestId: screeningRequest._id.toString(),
        status: 'processing',
        applicantsCount: applicants.length,
        message: `Screening ${applicants.length} candidates for "${job.title}"`,
        fallbackUsed: usingServerKey,
        hasApiKey,
        aiServiceReady: true,
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
  shortlistSize: 5 | 10 | 15 | 20,
  userId: string = 'demo-recruiter',
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

    // Fetch user's API key from settings (BYOK - hybrid approach)
    const userSettings = await UserSettingsModel.findOne({ userId });
    const userApiKey = userSettings?.geminiApiKey;

    // Create AI service with user's API key (will fall back to server key if not provided)
    const aiService = createAIScreeningService(userApiKey);

    const result = await aiService.screenApplicants(jobPosting, profiles, shortlistSize);

    // Persist the result
    await ScreeningResultModel.create({
      screeningRequestId,
      ...result,
    });

    // Update request with completed status
    await ScreeningRequestModel.findByIdAndUpdate(screeningRequestId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    logger.info(`[Screening] Request ${screeningRequestId} completed successfully`);
  } catch (err) {
    logger.error(`[Screening] Request ${screeningRequestId} failed:`, err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    // Update request with failed status and error details
    await ScreeningRequestModel.findByIdAndUpdate(screeningRequestId, {
      status: 'failed',
      errorMessage,
      errorDetails: {
        fallbackUsed: true,
        errorType: err instanceof Error ? err.constructor.name : 'Unknown',
      },
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

// Clear stuck screenings (admin endpoint)
export async function clearStuckScreenings(req: Request, res: Response) {
  try {
    const { jobId } = req.query;
    const userId = req.userId || 'demo-recruiter';

    const filter: Record<string, any> = {
      status: { $in: ['pending', 'processing'] },
    };

    if (jobId) {
      filter.jobId = jobId;
    } else {
      // Only clear screenings for the current user if no jobId specified
      filter.userId = userId;
    }

    const stuckScreenings = await ScreeningRequestModel.find(filter);
    const stuckCount = stuckScreenings.length;

    if (stuckCount === 0) {
      return res.json({
        success: true,
        data: { message: 'No stuck screenings found', cleared: 0 },
      } satisfies ApiResponse);
    }

    // Mark all stuck screenings as failed
    await ScreeningRequestModel.updateMany(filter, {
      status: 'failed',
      errorMessage: 'Screening cleared by user',
      completedAt: new Date().toISOString(),
    });

    logger.info(`[Screening] Cleared ${stuckCount} stuck screenings for user ${userId}${jobId ? ` and job ${jobId}` : ''}`);

    return res.json({
      success: true,
      data: { message: `Cleared ${stuckCount} stuck screenings`, cleared: stuckCount },
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Screening] clearStuckScreenings error:', err);
    return res.status(500).json({ success: false, error: 'Failed to clear screenings' } satisfies ApiResponse);
  }
}

// ------ Upload applicants (CSV/Excel/PDF) ------
export async function uploadCSVApplicants(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' } satisfies ApiResponse);
    }

    const userId = req.userId || 'demo-recruiter';
    const userSettings = await UserSettingsModel.findOne({ userId });
    const userApiKey = userSettings?.geminiApiKey;
    const parserService = createResumeParserService(userApiKey);

    let profiles: TalentProfile[] = [];
    let totalRows = 0;
    const rowErrors: Array<{ row: number; error: string }> = [];

    // Check if file is PDF
    if (req.file.mimetype === 'application/pdf' || req.file.originalname?.toLowerCase().endsWith('.pdf')) {
      // Handle PDF parsing
      try {
        const pdfData = await pdfparse(req.file.buffer);
        const pdfText = pdfData.text;
        
        logger.info(`[Upload] Parsing PDF with ${pdfData.numpages} pages, ${pdfText.length} characters`);
        
        // Parse the PDF text using the resume parser service
        const profile = await parserService.parseResumeText(pdfText);
        profiles.push(profile);
        totalRows = 1;
        
        logger.info(`[Upload] Successfully parsed PDF profile: ${profile.fullName}`);
      } catch (pdfError) {
        logger.error('[Upload] PDF parsing error:', pdfError);
        return res.status(400).json({ 
          success: false, 
          error: 'Failed to parse PDF file. Please ensure it contains readable text.' 
        } satisfies ApiResponse);
      }
    } else {
      // Handle CSV/Excel parsing
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as Record<string, string>[];
      totalRows = rows.length;

      profiles = rows.flatMap((row, idx) => {
        const validation = validateCSVRow(row);
        if (!validation.valid) {
          rowErrors.push({ row: idx + 2, error: validation.error });
          return [];
        }
        return [resumeParserService.parseCSVRow(normalizeCSVRow(row))];
      });
    }

    const inserted: any[] = [];
    for (const profile of profiles) {
      try {
        const doc = await Applicant.findOneAndUpdate(
          { email: profile.email },
          { $set: { createdBy: userId }, $setOnInsert: { ...profile } },
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
        totalRows,
        importedCount: inserted.length,
        applicantIds: inserted.map((a) => a._id.toString()),
        rowErrors,
        fallbackUsed: parserService.isUsingServerKey(),
      },
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Upload] File upload error:', err);
    return res.status(500).json({ success: false, error: 'Failed to process file' } satisfies ApiResponse);
  }
}

//  Get all screening history 
export async function listScreenings(req: Request, res: Response) {
  try {
    const userId = req.userId || 'demo-recruiter';
    
    const screenings = await ScreeningRequestModel.find({ userId })
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