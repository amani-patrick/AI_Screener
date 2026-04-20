// =========================================================
// TalentIQ — Redux Store
// =========================================================
import { configureStore, createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({ baseURL: API_BASE });

// ================= TYPES =================
export interface Job {
  _id: string;
  title: string;
  department: string;
  company: string;
  location: string;
  remote: boolean;
  employmentType: string;
  experienceLevel: string;
  description: string;
  responsibilities: string[];
  requiredSkills: { name: string; yearsRequired: number; mandatory: boolean; weight: number }[];
  niceToHaveSkills: string[];
  requiredEducation?: string;
  requiredExperienceYears: number;
  shortlistSize: 10 | 20;
  screeningCount?: number;
  createdAt: string;
}

export interface Applicant {
  _id: string;
  fullName: string;
  email: string;
  headline: string;
  location: { city: string; country: string; remote: boolean };
  skills: { name: string; yearsOfExperience: number; level: string; category: string }[];
  workExperience: any[];
  education: any[];
  availability: { immediateStart: boolean; noticePeriod?: number };
  source: string;
  createdAt: string;
}

export interface CandidateScore {
  applicantId: string;
  rank: number;
  overallScore: number;
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
  estimatedFitScore: number;
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
  applicant?: Applicant;
}

export interface ScreeningResult {
  _id: string;
  screeningRequestId: string;
  jobId: string;
  shortlist: CandidateScore[];
  totalApplicantsEvaluated: number;
  processingTimeMs: number;
  modelUsed: string;
  promptVersion: string;
  fallbackUsed: boolean;
  createdAt: string;
}

export interface ScreeningQualityMetrics {
  screeningRequestId: string;
  topK: number;
  precisionAtKProxy: number;
  averageConfidence: number;
  humanReviewRate: number;
  transparentContract: {
    modelUsed: string;
    promptVersion: string;
    processingTimeMs: number;
    fallbackUsed: boolean;
  };
}

export interface DashboardStats {
  totalJobs: number;
  totalApplicants: number;
  completedScreenings: number;
  recentActivity: {
    screeningId: string;
    jobTitle: string;
    applicantsCount: number;
    completedAt?: string;
    status: string;
  }[];
}

// ================= THUNKS =================
export const fetchJobs = createAsyncThunk('jobs/fetchAll', async (params: any = {}) => {
  const { data } = await api.get('/jobs', { params });
  return data;
});

export const createJob = createAsyncThunk('jobs/create', async (payload: Partial<Job>) => {
  const { data } = await api.post('/jobs', payload);
  return data.data;
});

export const fetchApplicants = createAsyncThunk('applicants/fetchAll', async (params: any = {}) => {
  const { data } = await api.get('/applicants', { params });
  return data;
});

export const startScreening = createAsyncThunk('screenings/start', async (payload: {
  jobId: string;
  applicantIds?: string[];
  shortlistSize: 10 | 20;
  idempotencyKey?: string;
}) => {
  const { idempotencyKey, ...body } = payload;
  const { data } = await api.post('/screenings', body, {
    headers: idempotencyKey ? { 'idempotency-key': idempotencyKey } : undefined,
  });
  return data.data;
});

export const fetchScreeningResult = createAsyncThunk('screenings/fetchResult', async (id: string) => {
  const { data } = await api.get(`/screenings/${id}`);
  return data.data;
});

export const fetchScreeningHistory = createAsyncThunk('screenings/fetchHistory', async () => {
  const { data } = await api.get('/screenings');
  return data.data;
});

export const fetchDashboardStats = createAsyncThunk('dashboard/fetchStats', async () => {
  const { data } = await api.get('/jobs/stats');
  return data.data as DashboardStats;
});

export const fetchScreeningQuality = createAsyncThunk(
  'screenings/fetchQuality',
  async ({ screeningRequestId, topK = 10 }: { screeningRequestId: string; topK?: number }) => {
    const { data } = await api.get('/screenings/metrics/evaluate', { params: { screeningRequestId, topK } });
    return data.data as ScreeningQualityMetrics;
  },
);

export const uploadCSV = createAsyncThunk('applicants/uploadCSV', async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/screenings/upload/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
});

// ================= SLICES =================
interface JobsState {
  items: Job[];
  total: number;
  loading: boolean;
  error: string | null;
}

const jobsSlice = createSlice({
  name: 'jobs',
  initialState: { items: [], total: 0, loading: false, error: null } as JobsState,
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.meta?.total || 0;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch jobs';
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      });
  },
});

interface ApplicantsState {
  items: Applicant[];
  total: number;
  loading: boolean;
  error: string | null;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  lastUploadResult: any;
}

const applicantsSlice = createSlice({
  name: 'applicants',
  initialState: { items: [], total: 0, loading: false, error: null, uploadStatus: 'idle', lastUploadResult: null } as ApplicantsState,
  reducers: {
    resetUploadStatus: (state) => { state.uploadStatus = 'idle'; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplicants.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchApplicants.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.meta?.total || 0;
      })
      .addCase(fetchApplicants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch applicants';
      })
      .addCase(uploadCSV.pending, (state) => { state.uploadStatus = 'uploading'; })
      .addCase(uploadCSV.fulfilled, (state, action) => {
        state.uploadStatus = 'success';
        state.lastUploadResult = action.payload;
      })
      .addCase(uploadCSV.rejected, (state) => { state.uploadStatus = 'error'; });
  },
});

interface ScreeningState {
  currentRequestId: string | null;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  result: ScreeningResult | null;
  history: any[];
  historyLoading: boolean;
  quality: ScreeningQualityMetrics | null;
  loading: boolean;
  error: string | null;
}

const screeningSlice = createSlice({
  name: 'screenings',
  initialState: { currentRequestId: null, status: 'idle', result: null, history: [], historyLoading: false, quality: null, loading: false, error: null } as ScreeningState,
  reducers: {
    resetScreening: (state) => {
      state.status = 'idle';
      state.result = null;
      state.currentRequestId = null;
      state.error = null;
    },
    setStatus: (state, action: PayloadAction<ScreeningState['status']>) => {
      state.status = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startScreening.pending, (state) => { state.loading = true; state.error = null; state.status = 'idle'; })
      .addCase(startScreening.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRequestId = action.payload.screeningRequestId;
        state.status = 'processing';
      })
      .addCase(startScreening.rejected, (state, action) => {
        state.loading = false;
        state.status = 'failed';
        state.error = action.error.message || 'Failed to start screening';
      })
      .addCase(fetchScreeningResult.fulfilled, (state, action) => {
        const payload = action.payload;
        if (payload.status === 'completed' && payload.result) {
          state.status = 'completed';
          state.result = payload.result;
        } else if (payload.status === 'completed' && payload.shortlist) {
          state.status = 'completed';
          state.result = payload as ScreeningResult;
        } else if (payload.status === 'failed') {
          state.status = 'failed';
          state.error = payload.message || 'Screening failed';
        }
        // else still processing
      })
      .addCase(fetchScreeningQuality.fulfilled, (state, action) => {
        state.quality = action.payload;
      })
      .addCase(fetchScreeningHistory.pending, (state) => { state.historyLoading = true; })
      .addCase(fetchScreeningHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload || [];
      })
      .addCase(fetchScreeningHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = action.error.message || 'Failed to fetch history';
      });
  },
});

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { stats: null, loading: false, error: null } as DashboardState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => { state.loading = true; })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch stats';
      });
  },
});

// ================= STORE =================
export const store = configureStore({
  reducer: {
    jobs: jobsSlice.reducer,
    applicants: applicantsSlice.reducer,
    screenings: screeningSlice.reducer,
    dashboard: dashboardSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const { clearError } = jobsSlice.actions;
export const { resetUploadStatus } = applicantsSlice.actions;
export const { resetScreening, setStatus } = screeningSlice.actions;