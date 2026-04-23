import { Request, Response } from 'express';
import { Job, Applicant, ScreeningRequestModel } from '../models';
import { logger } from '../lib/Logger';
import type { ApiResponse } from '../types';

// =========================================================
// TalentIQ — Jobs Controller
// =========================================================

export async function createJob(req: Request, res: Response) {
  try {
    const { requirements, skills, ...rest } = req.body;

    // Transform frontend form data to backend structure
    const responsibilities = requirements ? requirements.split('\n').filter((r: string) => r.trim()) : [];
    
    const requiredSkills = skills
      ? skills.split(',').map((skill: string) => ({
          name: skill.trim(),
          yearsRequired: 0,
          mandatory: true,
          weight: 3,
        }))
      : [];

    const job = await Job.create({
      ...rest,
      responsibilities,
      requiredSkills,
      createdBy: req.headers['x-user-id'] || 'demo-recruiter',
    });

    logger.info(`[Jobs] Created job: ${job.title} (${job._id})`);

    return res.status(201).json({
      success: true,
      data: job,
      message: 'Job created successfully',
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Jobs] createJob error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create job' } satisfies ApiResponse);
  }
}

export async function listJobs(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 20, experienceLevel, search } = req.query;

    const filter: Record<string, any> = {};
    if (experienceLevel) filter.experienceLevel = experienceLevel;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(pageSize)),
      Job.countDocuments(filter),
    ]);

    // Attach screening counts
    const jobIds = jobs.map((j) => j._id.toString());
    const screenings = await ScreeningRequestModel.find({
      jobId: { $in: jobIds },
      status: 'completed',
    });
    const screeningMap = new Map<string, number>();
    screenings.forEach((s) => {
      screeningMap.set(s.jobId, (screeningMap.get(s.jobId) || 0) + 1);
    });

    const enriched = jobs.map((j) => ({
      ...j.toObject(),
      screeningCount: screeningMap.get(j._id.toString()) || 0,
    }));

    return res.json({
      success: true,
      data: enriched,
      meta: { total, page: Number(page), pageSize: Number(pageSize) },
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Jobs] listJobs error:', err);
    return res.status(500).json({ success: false, error: 'Failed to list jobs' } satisfies ApiResponse);
  }
}

export async function getJob(req: Request, res: Response) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' } satisfies ApiResponse);
    }
    return res.json({ success: true, data: job } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Jobs] getJob error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch job' } satisfies ApiResponse);
  }
}

export async function updateJob(req: Request, res: Response) {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date().toISOString() },
      { new: true, runValidators: true },
    );
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' } satisfies ApiResponse);
    }
    return res.json({ success: true, data: job } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Jobs] updateJob error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update job' } satisfies ApiResponse);
  }
}

export async function deleteJob(req: Request, res: Response) {
  try {
    await Job.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Job deleted' } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Jobs] deleteJob error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete job' } satisfies ApiResponse);
  }
}

// ------ Stats for dashboard ------
export async function getDashboardStats(req: Request, res: Response) {
  try {
    const [totalJobs, totalApplicants, completedScreenings, recentScreenings] = await Promise.all([
      Job.countDocuments(),
      Applicant.countDocuments(),
      ScreeningRequestModel.countDocuments({ status: 'completed' }),
      ScreeningRequestModel.find({ status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Get job titles for recent screenings
    const jobIds = recentScreenings.map((s) => s.jobId);
    const jobs = await Job.find({ _id: { $in: jobIds } }).select('title');
    const jobMap = new Map(jobs.map((j) => [j._id.toString(), j.title]));

    return res.json({
      success: true,
      data: {
        totalJobs,
        totalApplicants,
        completedScreenings,
        recentActivity: recentScreenings.map((s) => ({
          screeningId: s._id.toString(),
          jobTitle: jobMap.get(s.jobId) || 'Unknown',
          applicantsCount: s.applicantIds.length,
          completedAt: s.completedAt,
          status: s.status,
        })),
      },
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Dashboard] stats error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch stats' } satisfies ApiResponse);
  }
}