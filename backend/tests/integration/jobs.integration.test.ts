import request from 'supertest';
import app from '../../src/app';
import { Applicant, Job, ScreeningRequestModel } from '../../src/models';

jest.mock('../../src/models', () => ({
  Applicant: {
    countDocuments: jest.fn(),
  },
  Job: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
  ScreeningRequestModel: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

const mockedJob = Job as jest.Mocked<typeof Job>;
const mockedApplicant = Applicant as jest.Mocked<typeof Applicant>;
const mockedScreeningRequest = ScreeningRequestModel as jest.Mocked<typeof ScreeningRequestModel>;

describe('Integration: jobs routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/jobs creates a job', async () => {
    (mockedJob.create as jest.Mock).mockResolvedValue({
      _id: { toString: () => 'job-1' },
      title: 'Backend Engineer',
    });

    const response = await request(app)
      .post('/api/jobs')
      .set('x-user-id', 'recruiter-1')
      .send({
        title: 'Backend Engineer',
        department: 'Engineering',
        company: 'TalentIQ',
        location: 'Kigali',
        description: 'Build APIs',
        responsibilities: ['Ship features'],
        requiredSkills: [{ name: 'TypeScript', yearsRequired: 2, mandatory: true, weight: 5 }],
        niceToHaveSkills: [],
        requiredExperienceYears: 2,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(mockedJob.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Backend Engineer',
      createdBy: 'recruiter-1',
    }));
  });

  it('GET /api/jobs returns paginated jobs with screening counts', async () => {
    const jobs = [
      {
        _id: { toString: () => 'job-1' },
        toObject: () => ({ title: 'Backend Engineer' }),
      },
    ];

    const jobFindChain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(jobs),
    };

    (mockedJob.find as jest.Mock).mockImplementation((query?: Record<string, unknown>) => {
      if (query && query._id) {
        return {
          select: jest.fn().mockResolvedValue([]),
        };
      }
      return jobFindChain;
    });
    (mockedJob.countDocuments as jest.Mock).mockResolvedValue(1);
    (mockedScreeningRequest.find as jest.Mock).mockResolvedValue([]);

    const response = await request(app).get('/api/jobs?page=1&pageSize=20');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toEqual(expect.objectContaining({
      title: 'Backend Engineer',
      screeningCount: 0,
    }));
    expect(response.body.meta).toEqual(expect.objectContaining({
      total: 1,
      page: 1,
      pageSize: 20,
    }));
  });

  it('GET /api/jobs/stats returns dashboard stats', async () => {
    const recentScreenings = [
      {
        _id: { toString: () => 'screening-1' },
        jobId: 'job-1',
        applicantIds: ['a1', 'a2'],
        completedAt: new Date().toISOString(),
        status: 'completed',
      },
    ];

    const screeningFindChain = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(recentScreenings),
    };

    (mockedJob.countDocuments as jest.Mock).mockResolvedValue(5);
    (mockedApplicant.countDocuments as jest.Mock).mockResolvedValue(23);
    (mockedScreeningRequest.countDocuments as jest.Mock).mockResolvedValue(7);
    (mockedScreeningRequest.find as jest.Mock).mockImplementation((query: Record<string, unknown>) => {
      if ('jobId' in query) return Promise.resolve([]);
      return screeningFindChain;
    });
    (mockedJob.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue([
        { _id: { toString: () => 'job-1' }, title: 'Backend Engineer' },
      ]),
    });

    const response = await request(app).get('/api/jobs/stats');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(expect.objectContaining({
      totalJobs: 5,
      totalApplicants: 23,
      completedScreenings: 7,
    }));
    expect(response.body.data.recentActivity).toHaveLength(1);
    expect(response.body.data.recentActivity[0].jobTitle).toBe('Backend Engineer');
  });
});
