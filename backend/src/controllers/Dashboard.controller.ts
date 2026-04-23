import { Request, Response } from 'express';
import { Applicant, Job, ScreeningRequestModel } from '../models';
import { logger } from '../lib/Logger';
import type { ApiResponse } from '../types';

export interface DashboardStats {
  submissions: number;
  pending: number;
  hired: number;
  declined: number;
}

export async function getDashboardStats(req: Request, res: Response) {
  try {
    // Count applicants by their application status
    const applicants = await Applicant.find({});
    
    let submissions = 0;
    let pending = 0;
    let hired = 0;
    let declined = 0;

    applicants.forEach((applicant) => {
      if (applicant.applications && applicant.applications.length > 0) {
        applicant.applications.forEach((app: any) => {
          submissions++;
          switch (app.status) {
            case 'new':
            case 'under_review':
              pending++;
              break;
            case 'hired':
              hired++;
              break;
            case 'rejected':
              declined++;
              break;
          }
        });
      }
    });

    // If no application data, fall back to total applicant count
    if (submissions === 0) {
      submissions = applicants.length;
      pending = applicants.length;
    }

    const stats: DashboardStats = {
      submissions,
      pending,
      hired,
      declined,
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
