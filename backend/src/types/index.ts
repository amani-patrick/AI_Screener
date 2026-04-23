export type ExperienceLevel =  'entry' | 'mid' | 'senior' | 'lead' | 'executive';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'freelance';

export type ScreeningStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type IngestionSource = 'umurava_platform' | 'external_csv' | 'external_pdf' | 'manual';

export type ApplicationStatus = 'new' | 'under_review' | 'shortlisted' | 'rejected' | 'hired';

export interface Application {
  jobId: string;
  jobTitle: string;
  status: ApplicationStatus;
  appliedAt: string;
  matchScore?: number;
}

// Profile schema 
export interface TalentProfile{
    id: string;
  fullName: string;
  email: string;
  phone?: string;
  createdBy?: string;
  location: {
    city: string;
    country: string;
    remote: boolean;
  };
  headline: string;
  summary: string;
  skills: Skill[];
  workExperience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  languages: Language[];
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  availability: {
    immediateStart: boolean;
    noticePeriod?: number; // In days
  };
  expectedSalary?: {
    min: number;
    max: number;
    currency: string;
  };
  source: IngestionSource;
  rawResumeText?: string;  // For external applicants parsed from PDF
  applications?: Application[]; // Track job applications
}

export interface Skill {
    name: string;
    yearsOfExperience: number;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    category: 'technical' | 'soft' | 'domain' | 'tool';
}

export interface WorkExperience {
  company: string;
  role: string;
  startDate: string;  // ISO date
  endDate?: string;   // null = current
  isCurrent: boolean;
  description: string;
  achievements: string[];
  skills: string[];
}


export interface Education {
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
  grade?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialUrl?: string;
}

export interface Language {
  name: string;
  proficiency: 'basic' | 'conversational' | 'professional' | 'native';
}

export type JobStatus = 'active' | 'draft' | 'closed';

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  company: string;
  location: string;
  remote: boolean;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  description: string;
  responsibilities: string[];
  requiredSkills: RequiredSkill[];
  niceToHaveSkills: string[];
  requiredEducation?: string;
  requiredExperienceYears: number;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  applicationDeadline?: string;
  shortlistSize: 10 | 20;
  status: JobStatus;
  applicantsCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
 

export interface RequiredSkill {
  name: string;
  yearsRequired: number;
  mandatory: boolean;
  weight: number;  // 1-5 priority weighting
}

export interface ScreeningRequest {
  id: string;
  jobId: string;
  applicantIds: string[];
  idempotencyKey?: string;
  applicantSetHash?: string;
  userId?: string;
  status: ScreeningStatus;
  shortlistSize: 10 | 20;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}
 

export interface CandidateScore {
  applicantId: string;
  rank: number;
  overallScore: number;      // 0–100
  skillsScore: number;       // 0–100 (35% weight)
  experienceScore: number;   // 0–100 (30% weight)
  educationScore: number;    // 0–100 (20% weight)
  relevanceScore: number;    // 0–100 (15% weight)
  strengths: string[];
  gaps: string[];
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no';
  reasoning: string;         // Natural language AI explanation
  keyHighlights: string[];
  riskFactors: string[];
  estimatedFitScore: number; // calibrated final score
  confidenceScore: number;
  needsHumanReview: boolean;
  uncertaintyReasons: string[];
  finalDecisionNote: string;
  scoreBreakdown: {
    weightedSkills: number;
    weightedExperience: number;
    weightedEducation: number;
    weightedRelevance: number;
  };
  evidence: string[];
}

export interface ScreeningResult {
  id: string;
  screeningRequestId: string;
  jobId: string;
  shortlist: CandidateScore[];
  totalApplicantsEvaluated: number;
  processingTimeMs: number;
  modelUsed: string;
  promptVersion: string;
  createdAt: string;
  fallbackUsed: boolean;
  usingServerKey?: boolean; // Flag to indicate if server API key was used (for warnings)
}

// Api Response Type
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface PaginatinoQuery {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// User / Recruiter Profile
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  role: 'admin' | 'manager' | 'recruiter';
  avatarUrl?: string;
  company?: string;
  jobTitle?: string;
  profileCompletion: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  userId: string;
  geminiApiKey?: string;
  notifications: {
    emailNewApplicants: boolean;
    emailScreeningAlerts: boolean;
    emailWeeklySummary: boolean;
  };
  updatedAt: string;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'admin' | 'manager' | 'recruiter';
  company?: string;
  jobTitle?: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Reports / Analytics
export interface ReportsSummary {
  totalApplicantsScreened: number;
  avgMatchAccuracy: number; // percentage
  efficiencyMultiplier: number; // e.g., 3.2x
  periodStart: string;
  periodEnd: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface DetailedAnalytics {
  summary: ReportsSummary;
  screeningTrend: TimeSeriesData[];
  accuracyTrend: TimeSeriesData[];
  topSkills: { name: string; count: number }[];
  hiringPipeline: {
    stage: string;
    count: number;
  }[];
}