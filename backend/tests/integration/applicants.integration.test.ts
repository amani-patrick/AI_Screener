import request from 'supertest';
import app from '../../src/app';
import { Applicant } from '../../src/models';

jest.mock('../../src/models', () => ({
  Applicant: {
    find: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
  Job: {},
  ScreeningRequestModel: {},
  ScreeningResultModel: {},
}));

const mockedApplicant = Applicant as jest.Mocked<typeof Applicant>;

describe('Integration: applicants routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/applicants returns paginated applicants', async () => {
    const applicants = [{ _id: 'a1', fullName: 'Jane Doe', email: 'jane@example.com' }];
    const findChain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(applicants),
    };

    (mockedApplicant.find as jest.Mock).mockReturnValue(findChain);
    (mockedApplicant.countDocuments as jest.Mock).mockResolvedValue(1);

    const response = await request(app).get('/api/applicants?page=1&pageSize=20');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta).toEqual(expect.objectContaining({
      total: 1,
      page: 1,
      pageSize: 20,
    }));
  });

  it('POST /api/applicants creates an applicant', async () => {
    (mockedApplicant.create as jest.Mock).mockResolvedValue({
      _id: 'a1',
      fullName: 'Jane Doe',
      email: 'jane@example.com',
    });

    const response = await request(app)
      .post('/api/applicants')
      .send({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        location: { city: 'Kigali', country: 'Rwanda', remote: true },
        headline: 'Backend Engineer',
        summary: 'Experienced engineer',
        skills: [],
        workExperience: [],
        education: [],
        certifications: [],
        languages: [],
        availability: { immediateStart: true },
        source: 'manual',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(mockedApplicant.create).toHaveBeenCalled();
  });

  it('POST /api/applicants returns 409 for duplicate email', async () => {
    (mockedApplicant.create as jest.Mock).mockRejectedValue({ code: 11000 });

    const response = await request(app)
      .post('/api/applicants')
      .send({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it('GET /api/applicants/:id returns 404 when missing', async () => {
    (mockedApplicant.findById as jest.Mock).mockResolvedValue(null);

    const response = await request(app).get('/api/applicants/missing-id');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('PUT /api/applicants/:id updates applicant', async () => {
    (mockedApplicant.findByIdAndUpdate as jest.Mock).mockResolvedValue({
      _id: 'a1',
      fullName: 'Updated Name',
    });

    const response = await request(app)
      .put('/api/applicants/a1')
      .send({ fullName: 'Updated Name' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.fullName).toBe('Updated Name');
  });
});
