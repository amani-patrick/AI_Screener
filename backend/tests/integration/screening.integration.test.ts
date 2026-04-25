import request from 'supertest';
import app from '../../src/app';
import { Applicant, Job, ScreeningRequestModel, ScreeningResultModel } from '../../src/models';

jest.mock('../../src/models', () => ({
  Applicant: {
    find: jest.fn(),
  },
  Job: {
    findById: jest.fn(),
    find: jest.fn(),
  },
  ScreeningRequestModel: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
  ScreeningResultModel: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

const mockedApplicant = Applicant as jest.Mocked<typeof Applicant>;
const mockedJob = Job as jest.Mocked<typeof Job>;
const mockedRequest = ScreeningRequestModel as jest.Mocked<typeof ScreeningRequestModel>;
const mockedResult = ScreeningResultModel as jest.Mocked<typeof ScreeningResultModel>;

describe('Integration: screenings routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reuses screening request by idempotency key', async () => {
    (mockedJob.findById as jest.Mock).mockResolvedValue({
      _id: { toString: () => 'job-1' },
      title: 'Backend Engineer',
      toObject: () => ({ title: 'Backend Engineer' }),
    });
    (mockedApplicant.find as jest.Mock).mockResolvedValue([{ _id: { toString: () => 'app-1' } }]);
    (mockedRequest.findOne as jest.Mock).mockResolvedValueOnce({
      _id: { toString: () => 'existing-req' },
      status: 'processing',
      applicantIds: ['app-1'],
    });

    const response = await request(app)
      .post('/api/screenings')
      .set('idempotency-key', 'idem-1')
      .send({ jobId: 'job-1', applicantIds: ['app-1'], shortlistSize: 10 });

    expect(response.status).toBe(200);
    expect(response.body.data.screeningRequestId).toBe('existing-req');
  });

  it('returns evaluation metrics for shortlist', async () => {
    (mockedResult.findOne as jest.Mock).mockResolvedValue({
      modelUsed: 'gemini-1.5-pro',
      promptVersion: 'v2.1',
      processingTimeMs: 1200,
      fallbackUsed: false,
      shortlist: [
        { recommendation: 'yes', confidenceScore: 0.81, needsHumanReview: false },
        { recommendation: 'maybe', confidenceScore: 0.52, needsHumanReview: true },
      ],
    });

    const response = await request(app).get('/api/screenings/metrics/evaluate?screeningRequestId=req-1&topK=2');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(expect.objectContaining({
      screeningRequestId: 'req-1',
      topK: 2,
    }));
    expect(response.body.data.transparentContract.fallbackUsed).toBe(false);
  });

  it('should create screening request for single applicant', async () => {
    (mockedJob.findById as jest.Mock).mockResolvedValue({
      _id: { toString: () => 'job-1' },
      title: 'Backend Engineer',
      toObject: () => ({ title: 'Backend Engineer' }),
    });
    (mockedApplicant.find as jest.Mock).mockResolvedValue([{ 
      _id: { toString: () => 'app-1' },
      fullName: 'Single Applicant',
    }]);
    (mockedRequest.findOne as jest.Mock).mockResolvedValue(null);
    (mockedRequest.create as jest.Mock).mockResolvedValue({
      _id: { toString: () => 'new-req' },
      status: 'processing',
      applicantIds: ['app-1'],
    });
    (mockedRequest.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    const response = await request(app)
      .post('/api/screenings')
      .send({ jobId: 'job-1', applicantIds: ['app-1'], shortlistSize: 10 });

    expect(response.status).toBe(202);
    expect(response.body.success).toBe(true);
    expect(response.body.data.screeningRequestId).toBe('new-req');
    expect(mockedRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        applicantIds: ['app-1'],
        totalBatches: expect.any(Number),
        currentBatch: 0,
        progressPercentage: 0,
        currentStep: expect.any(String),
      })
    );
  });
});
