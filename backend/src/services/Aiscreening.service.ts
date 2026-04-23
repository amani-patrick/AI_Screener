import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import type { TalentProfile, JobPosting, CandidateScore, ScreeningResult } from '../types';
import { logger } from '../lib/Logger';
import { z } from 'zod';
import crypto from 'crypto';

const PROMPT_VERSION = 'v2.1';
const MODEL_NAME = 'gemini-3-flash-preview';

// Scoring weight distribution (sum = 1)
const SCORING_WEIGHTS = {
  skills: 0.35,
  experience: 0.30,
  education: 0.20,
  relevance: 0.15,
} as const;

interface GeminiCandidateOutput {
  applicantId: string;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  relevanceScore: number;
  strengths: string[];
  gaps: string[];
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no';
  reasoning: string;
  keyHighlights: string[];
  riskFactors: string[];
}

const geminiOutputSchema = z.array(z.object({
  applicantId: z.string(),
  skillsScore: z.number().min(0).max(100),
  experienceScore: z.number().min(0).max(100),
  educationScore: z.number().min(0).max(100),
  relevanceScore: z.number().min(0).max(100),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  recommendation: z.enum(['strong_yes', 'yes', 'maybe', 'no']),
  reasoning: z.string(),
  keyHighlights: z.array(z.string()).default([]),
  riskFactors: z.array(z.string()).default([]),
}));

export class AIScreeningService {
  private model: GenerativeModel | null = null;
  private usingServerKey: boolean = false;

  constructor(userApiKey?: string) {
    // Prioritize user-provided key, fall back to server environment key
    const apiKey = (userApiKey || process.env.GEMINI_API_KEY || process.env.GEMININI_API_KEY || '').trim();
    
    if (!apiKey) {
      logger.warn('[AI] GEMINI_API_KEY is not set; screening will use placeholder scores. Add it to backend/.env or configure in user settings to enable Gemini.');
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.2,
        topP: 0.85,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });

    // Track if we're using the server key (for warning purposes)
    this.usingServerKey = !userApiKey && !!process.env.GEMINI_API_KEY;
    
    if (this.usingServerKey) {
      logger.warn('[AI] Using server-wide Gemini API key. This may have rate limits. Consider adding your own API key in Settings for better performance and reliability.');
    } else if (userApiKey) {
      logger.info('[AI] Using user-provided Gemini API key.');
    }
  }

  // Method to check if using server key
  isUsingServerKey(): boolean {
    return this.usingServerKey;
  }

  async screenApplicants(
    job: JobPosting,
    applicants: TalentProfile[],
    shortlistSize: number,
  ): Promise<Omit<ScreeningResult, 'id' | 'screeningRequestId'>> {
    const startTime = Date.now();

    if (!this.model) {
      const processingTimeMs = Date.now() - startTime;
      logger.warn(`[AI] Skipping Gemini for job "${job.title}" — no API key configured`);
      const shortlist = applicants
        .map((a) => this.ruleBasedScore(job, a, true))
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, shortlistSize)
        .map((s, idx) => ({ ...s, rank: idx + 1 }));
      return {
        jobId: job.id,
        shortlist,
        totalApplicantsEvaluated: applicants.length,
        processingTimeMs,
        modelUsed: 'none (GEMINI_API_KEY not set)',
        promptVersion: PROMPT_VERSION,
        createdAt: new Date().toISOString(),
        fallbackUsed: true,
      };
    }

    logger.info(`[AI] Starting screening for job "${job.title}" with ${applicants.length} applicants`);
    const BATCH_SIZE = 15;
    const batches = this.chunk(applicants, BATCH_SIZE);
    const allScores: GeminiCandidateOutput[] = [];

    for (let i = 0; i < batches.length; i++) {
      logger.info(`[AI] Processing batch ${i + 1}/${batches.length}`);
      const batchScores = await this.evaluateBatch(job, batches[i]);
      allScores.push(...batchScores);
    }

    // Compute final weighted scores and rank
    const scoredCandidates = allScores
      .map((raw): CandidateScore => ({
        applicantId: raw.applicantId,
        rank: 0, // assigned below
        skillsScore: this.clamp(raw.skillsScore),
        experienceScore: this.clamp(raw.experienceScore),
        educationScore: this.clamp(raw.educationScore),
        relevanceScore: this.clamp(raw.relevanceScore),
        overallScore: this.computeWeightedScore(raw),
        estimatedFitScore: this.computeWeightedScore(raw),
        strengths: raw.strengths || [],
        gaps: raw.gaps || [],
        recommendation: raw.recommendation,
        reasoning: raw.reasoning,
        keyHighlights: raw.keyHighlights || [],
        riskFactors: raw.riskFactors || [],
        confidenceScore: this.computeConfidence(raw),
        needsHumanReview: this.computeConfidence(raw) < 0.6 || raw.recommendation === 'maybe',
        uncertaintyReasons: this.buildUncertaintyReasons(raw),
        finalDecisionNote: 'AI recommendation only. Final hiring decision must be made by a human recruiter.',
        scoreBreakdown: this.computeBreakdown(raw),
        evidence: this.extractEvidence(raw),
      }))
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, shortlistSize)
      .map((c, idx) => ({ ...c, rank: idx + 1 }));
 
    const processingTimeMs = Date.now() - startTime;
    logger.info(`[AI] Screening complete in ${processingTimeMs}ms. Shortlisted ${scoredCandidates.length} candidates.`);
    this.logFairnessDiagnostics(scoredCandidates, applicants);

    return {
      jobId: job.id,
      shortlist: scoredCandidates,
      totalApplicantsEvaluated: applicants.length,
      processingTimeMs,
      modelUsed: MODEL_NAME,
      promptVersion: PROMPT_VERSION,
      createdAt: new Date().toISOString(),
      fallbackUsed: false,
      usingServerKey: this.usingServerKey,
    };
  }

//Evaluate a single batch of candidates 
private async evaluateBatch(
    job: JobPosting,
    applicants: TalentProfile[],
  ): Promise<GeminiCandidateOutput[]> {
    if (!this.model) {
      return applicants.map((a) => this.zeroScoreFallback(a.id));
    }
    const prompt = this.buildScoringPrompt(job, applicants);
    let lastErr: unknown;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const result = await this.model.generateContent(prompt);
        const text = result.response.text();
        return this.parseGeminiResponse(text, applicants);
      } catch (err) {
        lastErr = err;
        // Check if it's a quota exceeded error
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
          logger.warn('[AI] Quota exceeded detected, falling back immediately');
          return applicants.map((a) => this.fallbackFromRuleBased(jobLike(applicants), a, 'Quota exceeded'));
        }
        logger.warn(`[AI] Gemini attempt ${attempt}/5 failed`, err);
        await this.sleep(attempt * 500); // Increase delay
      }
    }
    logger.error('[AI] Gemini API exhausted retries during batch evaluation:', lastErr);
    return applicants.map((a) => this.fallbackFromRuleBased(job, a, 'Gemini retry exhaustion'));
  }



  private buildScoringPrompt(job: JobPosting, applicants: TalentProfile[]): string {
    const jobContext = this.formatJobContext(job);
    const candidatesContext = applicants.map((a) => this.formatApplicantProfile(a)).join('\n\n---\n\n');

    return `You are TalentIQ, an expert AI recruiting assistant specialised in objective, bias-free talent evaluation.
 
## Your Task
Evaluate each candidate against the job requirements below. Score each candidate on four dimensions and provide structured reasoning that a recruiter can act on immediately.
 
## Scoring Rubric (apply rigorously)
Each dimension is scored 0–100:
 
**SKILLS SCORE (35% weight)**
- 90–100: Exceeds all required skills; deep expertise in mandatory skills
- 70–89: Meets all mandatory skills; good coverage of nice-to-haves
- 50–69: Meets most mandatory skills; minor gaps
- 30–49: Meets some mandatory skills; significant gaps
- 0–29: Significant skill mismatches; missing critical requirements
 
**EXPERIENCE SCORE (30% weight)**
- 90–100: Exceeds years required; roles are directly relevant
- 70–89: Meets years; most roles highly relevant
- 50–69: Slightly below years OR adjacent experience
- 30–49: Below years required; experience partially relevant
- 0–29: Significantly under-experienced for the role
 
**EDUCATION SCORE (20% weight)**
- 90–100: Exact or higher degree in the required field
- 70–89: Relevant degree; possibly different field
- 50–69: Different degree but compensated by certifications/experience
- 30–49: No formal degree but strong certifications
- 0–29: Minimal or no relevant education or certifications
 
**RELEVANCE SCORE (15% weight)**
- 90–100: Industry, company type, and role type are a perfect match
- 70–89: Strong industry overlap
- 50–69: Transferable domain experience
- 30–49: Tangentially related industry
- 0–29: Unrelated background
 
## Recommendation Criteria
- **strong_yes**: Overall score ≥ 85; ready to proceed immediately
- **yes**: Overall score 70–84; solid candidate, worth interviewing
- **maybe**: Overall score 50–69; some compelling attributes but notable gaps
- **no**: Overall score < 50; does not meet minimum requirements
 
## Job Requirements
${jobContext}
 
## Candidates to Evaluate
${candidatesContext}
 
## Required Output Format
Return ONLY a valid JSON array. No preamble, no markdown, no explanation outside the JSON.
Each element must have exactly these fields:
 
[
  {
    "applicantId": "string — exact ID from candidate profile",
    "skillsScore": number (0–100),
    "experienceScore": number (0–100),
    "educationScore": number (0–100),
    "relevanceScore": number (0–100),
    "strengths": ["string", "string", "string"],
    "gaps": ["string", "string"],
    "recommendation": "strong_yes" | "yes" | "maybe" | "no",
    "reasoning": "string — 3-5 sentence recruiter-facing explanation covering why this candidate does or does not fit. Be specific: mention skill names, years, achievements. Avoid vague language.",
    "keyHighlights": ["string — specific standout fact", "string"],
    "riskFactors": ["string — specific concern", "string"]
  }
]
 
Evaluate all ${applicants.length} candidates. Return all ${applicants.length} objects in the array.`;
  }
   // Format a job posting into prompt context

   private formatJobContext(job: JobPosting): string {
    const mandatorySkills = job.requiredSkills
      .filter((s) => s.mandatory)
      .map((s) => `  • ${s.name} (${s.yearsRequired}+ years, priority weight: ${s.weight}/5)`)
      .join('\n');
 
    const niceToHave = job.niceToHaveSkills.map((s) => `  • ${s}`).join('\n');
    return `
**Role:** ${job.title} at ${job.company} (${job.department})
**Location:** ${job.location}${job.remote ? ' (Remote-friendly)' : ''}
**Type:** ${job.employmentType} | **Level:** ${job.experienceLevel}
**Min Experience Required:** ${job.requiredExperienceYears} years
**Required Education:** ${job.requiredEducation || 'Not specified'}
 
**Job Description:**
${job.description}
 
**Key Responsibilities:**
${job.responsibilities.map((r) => `  • ${r}`).join('\n')}
 
**Mandatory Skills (weighted):**
${mandatorySkills || '  • Not specified'}
 
**Nice-to-Have Skills:**
${niceToHave || '  • None listed'}
    `.trim();
  }
  // Format a talent profile into prompt context

  private formatApplicantProfile(applicant: TalentProfile): string {
    const skills = applicant.skills
      .map((s) => `${s.name} (${s.yearsOfExperience}yr, ${s.level})`)
      .join(', ');
 
    const experience = applicant.workExperience
      .map((w) => {
        const end = w.isCurrent ? 'Present' : w.endDate || 'Unknown';
        const achievements = w.achievements.slice(0, 3).map((a) => `    - ${a}`).join('\n');
        return `  • ${w.role} @ ${w.company} (${w.startDate} – ${end})\n    ${w.description}\n${achievements}`;
      })
      .join('\n');
 
    const education = applicant.education
      .map((e) => `  • ${e.degree} in ${e.field} — ${e.institution} (${e.endYear || 'ongoing'})`)
      .join('\n');
 
    const certs = applicant.certifications
      .map((c) => `  • ${c.name} by ${c.issuer}`)
      .join('\n');
 
    // Include raw resume text for external applicants (parsed from PDF/CSV)
    const rawSection = applicant.rawResumeText
      ? `\n**Additional Resume Context:**\n${applicant.rawResumeText.slice(0, 1500)}...`
      : '';
  
      return `
**CANDIDATE ID:** ${applicant.id}
**Headline:** ${applicant.headline}
**Location Match Preference:** ${applicant.location.remote ? 'Open to remote' : 'Onsite/Hybrid'}
 
**Professional Summary:**
${applicant.summary}
 
**Skills:** ${skills}
 
**Work Experience:**
${experience || '  No experience listed'}
 
**Education:**
${education || '  No education listed'}
 
**Certifications:**
${certs || '  None'}
 
**Availability:** ${applicant.availability.immediateStart ? 'Immediate' : `${applicant.availability.noticePeriod || 'Unknown'} day notice`}
${rawSection}
    `.trim();
  }

  // Parse and validate Gemini's JSON response
  private parseGeminiResponse(text: string, applicants: TalentProfile[]): GeminiCandidateOutput[]{
    try {
      // Strip any accidental markdown fences
      let clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Normalize JSON: fix unquoted property names, single quotes, trailing commas
      clean = this.normalizeJson(clean);

      const parsed = JSON.parse(clean) as unknown;
      const validated = geminiOutputSchema.safeParse(parsed);
      if (!validated.success) {
        logger.warn('[AI] Invalid Gemini JSON shape, using fallback', validated.error.flatten());
        return applicants.map((a) => this.fallbackFromRuleBased(jobLike(applicants), a, 'Invalid Gemini JSON shape'));
      }
 
      const parsedRows = validated.data;
 
      // Validate each entry has required fields; fallback if malformed
      return parsedRows.map((entry) => {
        if (!entry.applicantId || typeof entry.skillsScore !== 'number') {
          logger.warn(`[AI] Malformed entry for applicant, using fallback`, entry);
          return this.zeroScoreFallback(entry.applicantId || 'unknown');
        }
        return entry;
      });
    } catch (err) {
      logger.error('[AI] Failed to parse Gemini JSON response:', err);
      logger.debug('[AI] Raw response:', text.slice(0, 500));
      // Return zero-scored fallbacks for all applicants in this batch
      return applicants.map((a) => this.zeroScoreFallback(a.id));
    }
  }

  // Helpers

  private computeWeightedScore(raw: GeminiCandidateOutput): number {
    const weighted =
      raw.skillsScore * SCORING_WEIGHTS.skills +
      raw.experienceScore * SCORING_WEIGHTS.experience +
      raw.educationScore * SCORING_WEIGHTS.education +
      raw.relevanceScore * SCORING_WEIGHTS.relevance;
    return Math.round(weighted * 10) / 10;
  }
 
  private clamp(n: number): number {
    return Math.min(100, Math.max(0, Math.round(n)));
  }

  private computeBreakdown(raw: GeminiCandidateOutput): CandidateScore['scoreBreakdown'] {
    return {
      weightedSkills: Math.round(raw.skillsScore * SCORING_WEIGHTS.skills * 10) / 10,
      weightedExperience: Math.round(raw.experienceScore * SCORING_WEIGHTS.experience * 10) / 10,
      weightedEducation: Math.round(raw.educationScore * SCORING_WEIGHTS.education * 10) / 10,
      weightedRelevance: Math.round(raw.relevanceScore * SCORING_WEIGHTS.relevance * 10) / 10,
    };
  }

  private computeConfidence(raw: GeminiCandidateOutput): number {
    const spread = Math.max(raw.skillsScore, raw.experienceScore, raw.educationScore, raw.relevanceScore)
      - Math.min(raw.skillsScore, raw.experienceScore, raw.educationScore, raw.relevanceScore);
    const base = this.computeWeightedScore(raw) / 100;
    return Math.max(0.05, Math.min(0.99, Math.round((base - spread / 500) * 100) / 100));
  }

  private buildUncertaintyReasons(raw: GeminiCandidateOutput): string[] {
    const reasons: string[] = [];
    if (raw.gaps.length > 1) reasons.push('Multiple fit gaps detected');
    if (raw.relevanceScore < 45) reasons.push('Low domain relevance');
    if (raw.experienceScore < 45) reasons.push('Experience level mismatch');
    if (reasons.length === 0) reasons.push('Confidence acceptable');
    return reasons;
  }

  private extractEvidence(raw: GeminiCandidateOutput): string[] {
    const pool = [...raw.keyHighlights, ...raw.strengths, ...raw.gaps];
    return pool.filter(Boolean).slice(0, 6);
  }

  private fallbackFromRuleBased(job: JobPosting, applicant: TalentProfile, reason: string): GeminiCandidateOutput {
    const base = this.ruleBasedRawScore(job, applicant);
    return {
      ...base,
      gaps: [...base.gaps, reason],
      riskFactors: [...base.riskFactors, 'Rule-based fallback used'],
    };
  }

  private ruleBasedRawScore(job: JobPosting, applicant: TalentProfile): GeminiCandidateOutput {
    const normalizedApplicantSkills = new Set(applicant.skills.map((s) => normalizeSkillName(s.name)));
    const mandatory = job.requiredSkills.filter((s) => s.mandatory);
    const mandatoryHits = mandatory.filter((s) => normalizedApplicantSkills.has(normalizeSkillName(s.name))).length;
    const skillsCoverage = mandatory.length ? mandatoryHits / mandatory.length : 0.5;

    const applicantYears = applicant.skills.reduce((acc, s) => acc + s.yearsOfExperience, 0) / Math.max(1, applicant.skills.length);
    const expRatio = Math.min(1, applicantYears / Math.max(1, job.requiredExperienceYears));
    const educationScore = applicant.education.length > 0 ? 65 : 35;
    const relevanceScore = applicant.summary.toLowerCase().includes(job.title.toLowerCase().split(' ')[0]) ? 70 : 50;

    const skillsScore = Math.round(skillsCoverage * 100);
    const experienceScore = Math.round(expRatio * 100);
    const recommendation: GeminiCandidateOutput['recommendation'] = (skillsScore + experienceScore + relevanceScore) / 3 >= 70 ? 'yes' : 'maybe';

    return {
      applicantId: applicant.id,
      skillsScore,
      experienceScore,
      educationScore,
      relevanceScore,
      strengths: [
        `Matched ${mandatoryHits}/${mandatory.length || 0} mandatory skills`,
        `Average skill experience ~${Math.round(applicantYears * 10) / 10} years`,
      ],
      gaps: mandatoryHits < mandatory.length ? ['Missing some mandatory skills'] : [],
      recommendation,
      reasoning: 'Generated via deterministic baseline scorer because AI was unavailable or failed validation.',
      keyHighlights: [`Skill coverage: ${Math.round(skillsCoverage * 100)}%`],
      riskFactors: ['Rule-based fallback may miss nuanced profile context'],
    };
  }

  private ruleBasedScore(job: JobPosting, applicant: TalentProfile, noGemini: boolean): CandidateScore {
    const raw = this.ruleBasedRawScore(job, applicant);
    const confidence = noGemini ? 0.45 : this.computeConfidence(raw);
    return {
      applicantId: applicant.id,
      rank: 0,
      skillsScore: this.clamp(raw.skillsScore),
      experienceScore: this.clamp(raw.experienceScore),
      educationScore: this.clamp(raw.educationScore),
      relevanceScore: this.clamp(raw.relevanceScore),
      overallScore: this.computeWeightedScore(raw),
      estimatedFitScore: this.computeWeightedScore(raw),
      strengths: raw.strengths,
      gaps: raw.gaps,
      recommendation: raw.recommendation,
      reasoning: raw.reasoning,
      keyHighlights: raw.keyHighlights,
      riskFactors: raw.riskFactors,
      confidenceScore: confidence,
      needsHumanReview: true,
      uncertaintyReasons: ['Fallback scoring mode'],
      finalDecisionNote: 'AI recommendation only. Final hiring decision must be made by a human recruiter.',
      scoreBreakdown: this.computeBreakdown(raw),
      evidence: this.extractEvidence(raw),
    };
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  private zeroScoreFallback(applicantId: string): GeminiCandidateOutput {
    return {
      applicantId,
      skillsScore: 0,
      experienceScore: 0,
      educationScore: 0,
      relevanceScore: 0,
      strengths: [],
      gaps: ['Unable to evaluate — processing error'],
      recommendation: 'no',
      reasoning: 'This candidate could not be evaluated due to a processing error. Please retry the screening.',
      keyHighlights: [],
      riskFactors: ['Evaluation failed'],
    };
  }

  private geminiDisabledFallback(applicantId: string): GeminiCandidateOutput {
    return {
      applicantId,
      skillsScore: 0,
      experienceScore: 0,
      educationScore: 0,
      relevanceScore: 0,
      strengths: [],
      gaps: ['AI screening is disabled — set GEMINI_API_KEY in backend/.env'],
      recommendation: 'no',
      reasoning:
        'Gemini is not configured. Add a valid GEMINI_API_KEY to backend/.env to run AI screening.',
      keyHighlights: [],
      riskFactors: ['GEMINI_API_KEY not configured'],
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Normalize malformed JSON from Gemini (unquoted keys, single quotes, trailing commas)
  private normalizeJson(text: string): string {
    let normalized = text;

    // Fix single-quoted strings to double-quoted
    normalized = normalized.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');

    // Fix unquoted property names (e.g., {key: value} -> {"key": value})
    // Match word characters followed by colon, but not inside strings
    normalized = normalized.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

    // Remove trailing commas before closing brackets/braces
    normalized = normalized.replace(/,\s*([}\]])/g, '$1');

    // Fix any remaining JavaScript-style values
    normalized = normalized.replace(/:\s*undefined\s*([,}])/g, ':null$1');

    return normalized;
  }

  private logFairnessDiagnostics(scores: CandidateScore[], applicants: TalentProfile[]): void {
    const byCountry = new Map<string, number[]>();
    for (const score of scores) {
      const applicant = applicants.find((a) => a.id === score.applicantId);
      const key = applicant?.location?.country || 'unknown';
      const arr = byCountry.get(key) || [];
      arr.push(score.overallScore);
      byCountry.set(key, arr);
    }
    const diagnostics = Array.from(byCountry.entries()).map(([country, vals]) => ({
      country,
      avgScore: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
      count: vals.length,
    }));
    logger.info('[AI] Fairness diagnostics (country buckets)', diagnostics);
  }
}

function normalizeSkillName(value: string): string {
  const canonical = value.trim().toLowerCase();
  if (canonical === 'node' || canonical === 'node js') return 'node.js';
  if (canonical === 'js') return 'javascript';
  if (canonical === 'ts') return 'typescript';
  return canonical;
}

function jobLike(applicants: TalentProfile[]): JobPosting {
  return {
    id: crypto.randomUUID(),
    title: 'Unknown Role',
    department: 'Unknown',
    company: 'Unknown',
    location: 'Unknown',
    remote: true,
    employmentType: 'full-time',
    experienceLevel: 'mid',
    description: '',
    responsibilities: [],
    requiredSkills: [],
    niceToHaveSkills: [],
    requiredExperienceYears: 1,
    status: 'active',
    applicantsCount: applicants.length,
    shortlistSize: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  };
}
 
export const aiScreeningService = new AIScreeningService();

// Factory function to create service with user-specific API key
export function createAIScreeningService(userApiKey?: string): AIScreeningService {
  return new AIScreeningService(userApiKey);
}