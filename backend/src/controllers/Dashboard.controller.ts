import { Request, Response } from 'express';
import { Applicant, Job, ScreeningRequestModel } from '../models';
import { logger } from '../lib/Logger';
import type { ApiResponse } from '../types';

export interface DashboardStats {
  submissions: number;
  pending: number;
  totalApplicants: number;
  activeJobs: number;
}

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    
    // Count total applicants
    const totalApplicants = await Applicant.countDocuments();
    
    // Count jobs created by the user
    const activeJobs = await Job.countDocuments();
    
    // Count applicants by their application status (for backwards compatibility)
    const applicants = await Applicant.find({});
    
    let submissions = 0;
    let pending = 0;

    applicants.forEach((applicant) => {
      if (applicant.applications && applicant.applications.length > 0) {
        applicant.applications.forEach((app: any) => {
          submissions++;
          switch (app.status) {
            case 'new':
            case 'under_review':
              pending++;
              break;
          }
        });
      }
    });

    // If no application data, fall back to total applicant count
    if (submissions === 0) {
      submissions = totalApplicants;
      pending = totalApplicants;
    }

    const stats: DashboardStats = {
      submissions,
      pending,
      totalApplicants,
      activeJobs,
    };

    logger.info('[Dashboard] Stats fetched:', stats);

    return res.json({
      success: true,
      data: stats,
    } satisfies ApiResponse);
  } catch (err) {
    logger.error('[Dashboard] getDashboardStats error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' } satisfies ApiResponse);
  }
}
