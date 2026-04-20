import { AIScreeningService } from '../../src/services/Aiscreening.service';
import type { JobPosting, TalentProfile } from '../../src/types';

const sampleJob: JobPosting = {
  id: 'job-1',
  title: 'Backend Engineer',
  department: 'Engineering',
  company: 'TalentIQ',
  location: 'Kigali',
  remote: true,
  employmentType: 'full-time',
  experienceLevel: 'mid',
  description: 'Build backend systems',
  responsibilities: ['Build APIs'],
  requiredSkills: [{ name: 'TypeScript', yearsRequired: 2, mandatory: true, weight: 5 }],
  niceToHaveSkills: ['MongoDB'],
  requiredEducation: 'BSc',
  requiredExperienceYears: 2,
  shortlistSize: 10,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'tester',
};

const sampleApplicants: TalentProfile[] = [
  {
    id: 'app-1',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    location: { city: 'Kigali', country: 'Rwanda', remote: true },
    headline: 'Backend Developer',
    summary: 'Experienced backend developer.',
    skills: [{ name: 'TypeScript', yearsOfExperience: 3, level: 'advanced', category: 'technical' }],
    workExperience: [],
    education: [],
    certifications: [],
    languages: [],
    availability: { immediateStart: true },
    source: 'manual',
  },
  {
    id: 'app-2',
    fullName: 'John Doe',
    email: 'john@example.com',
    location: { city: 'Kampala', country: 'Uganda', remote: false },
    headline: 'Software Engineer',
    summary: 'Generalist software engineer.',
    skills: [{ name: 'Node.js', yearsOfExperience: 1, level: 'intermediate', category: 'technical' }],
    workExperience: [],
    education: [],
    certifications: [],
    languages: [],
    availability: { immediateStart: false, noticePeriod: 30 },
    source: 'manual',
  },
];

describe('AIScreeningService', () => {
  const originalGeminiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  afterAll(() => {
    if (originalGeminiKey) {
      process.env.GEMINI_API_KEY = originalGeminiKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
  });

  it('returns deterministic fallback shortlist when GEMINI_API_KEY is missing', async () => {
    const service = new AIScreeningService();
    const result = await service.screenApplicants(sampleJob, sampleApplicants, 10);

    expect(result.jobId).toBe(sampleJob.id);
    expect(result.totalApplicantsEvaluated).toBe(2);
    expect(result.modelUsed).toContain('none');
    expect(result.shortlist).toHaveLength(2);
    expect(result.shortlist[0].rank).toBe(1);
    expect(['yes', 'maybe', 'no']).toContain(result.shortlist[0].recommendation);
    expect(result.shortlist[0].finalDecisionNote).toContain('Final hiring decision');
    expect(result.shortlist[0].needsHumanReview).toBe(true);
  });
});
