import { ResumeParserService } from '../../src/services/Resumeparser.service';

describe('ResumeParserService', () => {
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

  it('falls back to a minimal profile when GEMINI_API_KEY is missing', async () => {
    const service = new ResumeParserService();
    const profile = await service.parseResumeText('Senior Node.js Engineer with 5 years of experience.');

    expect(profile.source).toBe('external_pdf');
    expect(profile.skills).toEqual([]);
    expect(profile.fullName).toBe('Unknown Candidate');
    expect(profile.summary.length).toBeGreaterThan(0);
  });

  it('parses a CSV row into a profile', () => {
    const service = new ResumeParserService();
    const profile = service.parseCSVRow({
      name: 'Alice',
      email: 'alice@example.com',
      skills: 'TypeScript,Node.js',
      city: 'Kigali',
      country: 'Rwanda',
    });

    expect(profile.fullName).toBe('Alice');
    expect(profile.email).toBe('alice@example.com');
    expect(profile.skills).toHaveLength(2);
    expect(profile.source).toBe('external_csv');
  });
});
