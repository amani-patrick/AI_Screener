import { Request, Response } from 'express';
import { Applicant } from '../models';
import { logger } from '../lib/Logger';
import type { ApiResponse } from '../types';

export async function listApplicants(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { page = 1, pageSize = 7, search, country } = req.query;
    const filter: Record<string, any> = {};
    
    // Filter applicants by the logged-in user (createdBy)
    if (userId) {
      filter.createdBy = userId;
    }
    
    if (search) filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { headline: { $regex: search, $options: 'i' } },
    ];
    if (country) filter['location.country'] = country;

    const skip = (Number(page) - 1) * Number(pageSize);
    const [applicants, total] = await Promise.all([
      Applicant.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(pageSize)),
      Applicant.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: applicants,
      meta: { total, page: Number(page), pageSize: Number(pageSize) },
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Applicants] listApplicants error:', err);
    return res.status(500).json({ success: false, error: 'Failed to list applicants' } satisfies ApiResponse);
  }
}

export async function createApplicant(req: Request, res: Response) {
  try {
    const applicant = await Applicant.create(req.body);
    return res.status(201).json({ success: true, data: applicant } satisfies ApiResponse);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'Applicant with this email already exists' } satisfies ApiResponse);
    }
    logger.error('[Applicants] createApplicant error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create applicant' } satisfies ApiResponse);
  }
}

export async function getApplicant(req: Request, res: Response) {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) {
      return res.status(404).json({ success: false, error: 'Applicant not found' } satisfies ApiResponse);
    }
    return res.json({ success: true, data: applicant } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Applicants] getApplicant error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch applicant' } satisfies ApiResponse);
  }
}

export async function updateApplicant(req: Request, res: Response) {
  try {
    const applicant = await Applicant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!applicant) {
      return res.status(404).json({ success: false, error: 'Applicant not found' } satisfies ApiResponse);
    }
    return res.json({ success: true, data: applicant } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Applicants] updateApplicant error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update applicant' } satisfies ApiResponse);
  }
}

export async function deleteApplicant(req: Request, res: Response) {
  try {
    await Applicant.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Applicant deleted' } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Applicants] deleteApplicant error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete applicant' } satisfies ApiResponse);
  }
}