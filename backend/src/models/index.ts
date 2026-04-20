import mongoose , {Schema, Document} from 'mongoose';
import type { TalentProfile, JobPosting, ScreeningRequest, ScreeningResult } from '../types';

//Applicant profile
export interface IApplicant extends Omit<TalentProfile, 'id'>, Document {}

const SkillSchema = new Schema({
  name: { type: String, required: true },
  yearsOfExperience: { type: Number, default: 0 },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' },
  category: { type: String, enum: ['technical', 'soft', 'domain', 'tool'], default: 'technical' },
}, { _id: false });

const WorkExperienceSchema = new Schema({
  company: { type: String, required: true },
  role: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String },
  isCurrent: { type: Boolean, default: false },
  description: { type: String, default: '' },
  achievements: [{ type: String }],
  skills: [{ type: String }],
}, { _id: false });

const EducationSchema = new Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  field: { type: String, required: true },
  startYear: { type: Number, required: true },
  endYear: { type: Number },
  grade: { type: String },
}, { _id: false });

const CertificationSchema = new Schema({
  name: { type: String, required: true },
  issuer: { type: String, required: true },
  issueDate: { type: String, required: true },
  expiryDate: { type: String },
  credentialUrl: { type: String },
}, { _id: false });

const ApplicantSchema = new Schema<IApplicant>({
  fullName: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  location: {
    city: { type: String, default: '' },
    country: { type: String, default: '' },
    remote: { type: Boolean, default: false },
  },
  headline: { type: String, default: '' },
  summary: { type: String, default: '' },
  skills: [SkillSchema],
  workExperience: [WorkExperienceSchema],
  education: [EducationSchema],
  certifications: [CertificationSchema],
  languages: [{
    name: { type: String },
    proficiency: { type: String, enum: ['basic', 'conversational', 'professional', 'native'] },
  }],
  portfolioUrl: { type: String },
  linkedinUrl: { type: String },
  githubUrl: { type: String },
  availability: {
    immediateStart: { type: Boolean, default: false },
    noticePeriod: { type: Number },
  },
  expectedSalary: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String },
  },
  source: {
    type: String,
    enum: ['umurava_platform', 'external_csv', 'external_pdf', 'manual'],
    default: 'umurava_platform',
  },
  rawResumeText: { type: String },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

//Creating indexes in DB
ApplicantSchema.index({ 'skills.name': 1 });
ApplicantSchema.index({ 'location.country': 1 });
ApplicantSchema.index({ createdAt: -1 });
 
// Computed field: total years of experience
ApplicantSchema.virtual('totalExperienceYears').get(function () {
  if (!this.workExperience?.length) return 0;
  return this.workExperience.reduce((acc, exp) => {
    const start = new Date(exp.startDate);
    const end = exp.isCurrent ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
    return acc + Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
  }, 0);
});

export const Applicant = mongoose.model<IApplicant>('Applicant', ApplicantSchema);

//Job Posting
export interface IJob extends Omit<JobPosting, 'id'>, Document {}

const JobSchema = new Schema<IJob>({
  title: { type: String, required: true, index: true },
  department: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  remote: { type: Boolean, default: false },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'freelance'],
    default: 'full-time',
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
    default: 'mid',
  },
  description: { type: String, required: true },
  responsibilities: [{ type: String }],
  requiredSkills: [{
    name: { type: String, required: true },
    yearsRequired: { type: Number, default: 0 },
    mandatory: { type: Boolean, default: true },
    weight: { type: Number, min: 1, max: 5, default: 3 },
  }],
  niceToHaveSkills: [{ type: String }],
  requiredEducation: { type: String },
  requiredExperienceYears: { type: Number, default: 0 },
  salaryRange: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'USD' },
  },
  applicationDeadline: { type: String },
  shortlistSize: { type: Number, enum: [10, 20], default: 10 },
  createdBy: { type: String, required: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

//Creating Index in DB
JobSchema.index({ createdAt: -1 });
JobSchema.index({ experienceLevel: 1 });

export const Job = mongoose.model<IJob>('Job', JobSchema);

// Screening Req
export interface IScreeningRequest extends Omit<ScreeningRequest, 'id'>, Document {}

const ScreeningRequestSchema = new Schema<IScreeningRequest>({
  jobId: { type: String, required: true, index: true },
  applicantIds: [{ type: String }],
  idempotencyKey: { type: String },
  applicantSetHash: { type: String, index: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  shortlistSize: { type: Number, enum: [10, 20], default: 10 },
  completedAt: { type: String },
  errorMessage: { type: String },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
ScreeningRequestSchema.index({ jobId: 1, applicantSetHash: 1, status: 1 });
ScreeningRequestSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export const ScreeningRequestModel = mongoose.model<IScreeningRequest>('ScreeningRequest', ScreeningRequestSchema);


//Screening Result
export interface IScreeningResult extends Omit<ScreeningResult, 'id'>, Document {}

const CandidateScoreSchema = new Schema({
  applicantId: { type: String, required: true },
  rank: { type: Number, required: true },
  overallScore: { type: Number, required: true },
  skillsScore: { type: Number, required: true },
  experienceScore: { type: Number, required: true },
  educationScore: { type: Number, required: true },
  relevanceScore: { type: Number, required: true },
  strengths: [{ type: String }],
  gaps: [{ type: String }],
  recommendation: {
    type: String,
    enum: ['strong_yes', 'yes', 'maybe', 'no'],
    required: true,
  },
  reasoning: { type: String, required: true },
  keyHighlights: [{ type: String }],
  riskFactors: [{ type: String }],
  estimatedFitScore: { type: Number, required: true },
  confidenceScore: { type: Number, required: true, min: 0, max: 1 },
  needsHumanReview: { type: Boolean, required: true, default: false },
  uncertaintyReasons: [{ type: String }],
  finalDecisionNote: { type: String, required: true },
  scoreBreakdown: {
    weightedSkills: { type: Number, required: true },
    weightedExperience: { type: Number, required: true },
    weightedEducation: { type: Number, required: true },
    weightedRelevance: { type: Number, required: true },
  },
  evidence: [{ type: String }],
}, { _id: false });

const ScreeningResultSchema = new Schema<IScreeningResult>({
  screeningRequestId: { type: String, required: true, index: true },
  jobId: { type: String, required: true, index: true },
  shortlist: [CandidateScoreSchema],
  totalApplicantsEvaluated: { type: Number, required: true },
  processingTimeMs: { type: Number, required: true },
  modelUsed: { type: String, required: true },
  promptVersion: { type: String, required: true },
  fallbackUsed: { type: Boolean, required: true, default: false },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

export const ScreeningResultModel = mongoose.model<IScreeningResult>('ScreeningResult', ScreeningResultSchema);