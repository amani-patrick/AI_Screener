import type { TalentProfile, Skill, WorkExperience, Education } from '../types';
import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import { logger } from '../lib/Logger';
import { v4 as uuidv4 } from 'uuid';

// Convert unstructured PDFs / CSV rows → TalentProfile

export class ResumeParserService {
  private model: GenerativeModel | null = null;
  private usingServerKey: boolean = false;

  constructor(userApiKey?: string) {
    // Prioritize user-provided key, fall back to server environment key
    const apiKey = (userApiKey || process.env.GEMINI_API_KEY || process.env.GEMININI_API_KEY || '').trim();
    
    if (!apiKey) {
      logger.warn('[Parser] GEMINI_API_KEY is not set; PDF resume parsing will return minimal profiles only. Add it to backend/.env or configure in user settings to enable Gemini.');
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    });

    // Track if we're using the server key (for warning purposes)
    this.usingServerKey = !userApiKey && !!process.env.GEMINI_API_KEY;
    
    if (this.usingServerKey) {
      logger.warn('[Parser] Using server-wide Gemini API key for resume parsing. This may have rate limits. Consider adding your own API key in Settings for better performance and reliability.');
    } else if (userApiKey) {
      logger.info('[Parser] Using user-provided Gemini API key for resume parsing.');
    }
  }

  // Method to check if using server key
  isUsingServerKey(): boolean {
    return this.usingServerKey;
  }

  // Parse raw resume text → structured TalentProfile 
  async parseResumeText(rawText: string, email?: string): Promise<TalentProfile> {
    if (!this.model) {
      return this.minimalProfileFromRaw(rawText, email);
    }

    const prompt = this.buildParsePrompt(rawText);

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(clean);

      return {
        id: uuidv4(),
        fullName: parsed.fullName || 'Unknown Candidate',
        email: email || parsed.email || `unknown-${uuidv4()}@randomguy.com`,
        phone: parsed.phone,
        location: {
          city: parsed.location?.city || '',
          country: parsed.location?.country || '',
          remote: parsed.location?.remote || false,
        },
        headline: parsed.headline || '',
        summary: parsed.summary || rawText.slice(0, 300),
        skills: (parsed.skills || []) as Skill[],
        workExperience: (parsed.workExperience || []) as WorkExperience[],
        education: (parsed.education || []) as Education[],
        certifications: parsed.certifications || [],
        languages: parsed.languages || [],
        portfolioUrl: parsed.portfolioUrl,
        linkedinUrl: parsed.linkedinUrl,
        githubUrl: parsed.githubUrl,
        availability: parsed.availability || { immediateStart: false },
        source: 'external_pdf',
        rawResumeText: rawText,
      };
    } catch (err) {
      logger.error('[Parser] Failed to parse resume text:', err);
      return this.minimalProfileFromRaw(rawText, email);
    }
  }

  private minimalProfileFromRaw(rawText: string, email?: string): TalentProfile {
    return {
      id: uuidv4(),
      fullName: 'Unknown Candidate',
      email: email || `unknown-${uuidv4()}@placeholder.com`,
      location: { city: '', country: '', remote: false },
      headline: '',
      summary: rawText.slice(0, 500),
      skills: [],
      workExperience: [],
      education: [],
      certifications: [],
      languages: [],
      availability: { immediateStart: false },
      source: 'external_pdf',
      rawResumeText: rawText,
    };
  }

  // Parse a CSV row (with headers) into a TalentProfile 
  parseCSVRow(row: Record<string, string>): TalentProfile {
    const skillsList = (row['skills'] || row['Skills'] || '')
      .split(/[,;|]/)
      .filter(Boolean)
      .map((s): Skill => ({
        name: s.trim(),
        yearsOfExperience: 0,
        level: 'intermediate',
        category: 'technical',
      }));

    return {
      id: uuidv4(),
      fullName: row['name'] || row['fullName'] || row['full_name'] || 'Unknown',
      email: row['email'] || `csv-${uuidv4()}@placeholder.com`,
      phone: row['phone'],
      location: {
        city: row['city'] || '',
        country: row['country'] || '',
        remote: (row['remote'] || '').toLowerCase() === 'yes',
      },
      headline: row['headline'] || row['title'] || '',
      summary: row['summary'] || row['bio'] || '',
      skills: skillsList,
      workExperience: this.parseExperienceFromCSV(row),
      education: this.parseEducationFromCSV(row),
      certifications: [],
      languages: [],
      availability: { immediateStart: false },
      source: 'external_csv',
      rawResumeText: JSON.stringify(row),
    };
  }

  private parseExperienceFromCSV(row: Record<string, string>): WorkExperience[] {
    const company = row['company'] || row['employer'] || row['current_company'];
    const role = row['role'] || row['position'] || row['job_title'];
    if (!company && !role) return [];

    return [{
      company: company || 'Not specified',
      role: role || 'Not specified',
      startDate: row['start_date'] || '2020-01-01',
      isCurrent: true,
      description: row['job_description'] || '',
      achievements: [],
      skills: [],
    }];
  }

  private parseEducationFromCSV(row: Record<string, string>): Education[] {
    const institution = row['university'] || row['school'] || row['institution'];
    const degree = row['degree'] || row['qualification'];
    if (!institution && !degree) return [];

    return [{
      institution: institution || 'Not specified',
      degree: degree || 'Not specified',
      field: row['field'] || row['major'] || '',
      startYear: parseInt(row['edu_start_year'] || '2015'),
      endYear: parseInt(row['graduation_year'] || row['edu_end_year'] || '2019') || undefined,
    }];
  }

  private buildParsePrompt(resumeText: string): string {
    return `You are a resume parser. Extract structured information from the resume text below.

Return ONLY valid JSON with this exact structure. Use null for missing optional fields.

{
  "fullName": "string",
  "email": "string or null",
  "phone": "string or null",
  "location": { "city": "string", "country": "string", "remote": boolean },
  "headline": "string — professional headline in 1 line",
  "summary": "string — 2-4 sentence professional summary",
  "skills": [
    { "name": "string", "yearsOfExperience": number, "level": "beginner|intermediate|advanced|expert", "category": "technical|soft|domain|tool" }
  ],
  "workExperience": [
    {
      "company": "string",
      "role": "string",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD or null if current",
      "isCurrent": boolean,
      "description": "string",
      "achievements": ["string"],
      "skills": ["skill name"]
    }
  ],
  "education": [
    { "institution": "string", "degree": "string", "field": "string", "startYear": number, "endYear": number or null, "grade": "string or null" }
  ],
  "certifications": [
    { "name": "string", "issuer": "string", "issueDate": "YYYY-MM-DD", "expiryDate": "YYYY-MM-DD or null" }
  ],
  "languages": [{ "name": "string", "proficiency": "basic|conversational|professional|native" }],
  "portfolioUrl": "string or null",
  "linkedinUrl": "string or null",
  "githubUrl": "string or null",
  "availability": { "immediateStart": boolean, "noticePeriod": number or null }
}

RESUME TEXT:
${resumeText.slice(0, 6000)}`;
  }
}

export const resumeParserService = new ResumeParserService();

// Factory function to create service with user-specific API key
export function createResumeParserService(userApiKey?: string): ResumeParserService {
  return new ResumeParserService(userApiKey);
}