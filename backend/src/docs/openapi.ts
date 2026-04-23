import type { OpenAPIV3 } from 'openapi-types';

export const openapiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'TalentIQ API',
    version: '1.0.0',
    description: [
      'Umurava AI Hackathon — AI-powered talent screening backend.',
      '',
      '**Scoring weights used by the AI engine:**',
      '- Skills: 35%',
      '- Experience: 30%',
      '- Education: 20%',
      '- Relevance: 15%',
      '',
      '**Screening is asynchronous.** POST `/api/screenings` returns `202 Accepted` with a `screeningRequestId`.',
      'Poll `GET /api/screenings/{id}` until `status === "completed"` to retrieve the ranked shortlist.',
    ].join('\n'),
    contact: { name: 'TalentIQ Team' },
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Local dev' },
  ],
  tags: [
    { name: 'Health',         description: 'Service liveness' },
    { name: 'Authentication', description: 'User registration and login' },
    { name: 'Jobs',           description: 'Job posting management' },
    { name: 'Applicants',     description: 'Candidate profile management' },
    { name: 'Screenings',     description: 'AI-powered screening pipeline' },
    { name: 'User',           description: 'User profile and settings' },
    { name: 'Dashboard',      description: 'Dashboard statistics and metrics' },
    { name: 'Reports',        description: 'Analytics and reporting' },
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // PATHS
  // ─────────────────────────────────────────────────────────────────────────────
  paths: {

    // ── Health ──────────────────────────────────────────────────────────────
    '/health': {
      get: {
        tags: ['Health'],
        operationId: 'healthCheck',
        summary: 'Health check',
        description: 'Returns service status and MongoDB connection state.',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Health' } } },
          },
        },
      },
    },

    // ── Jobs ─────────────────────────────────────────────────────────────────
    '/api/jobs': {
      get: {
        tags: ['Jobs'],
        operationId: 'listJobs',
        summary: 'List jobs',
        description: 'Returns a paginated list of job postings. Each job is enriched with the count of completed screenings.',
        parameters: [
          { in: 'query', name: 'page',            schema: { type: 'integer', minimum: 1, default: 1 },             description: 'Page number (1-indexed)' },
          { in: 'query', name: 'pageSize',         schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }, description: 'Items per page' },
          { in: 'query', name: 'experienceLevel',  schema: { type: 'string', enum: ['entry', 'mid', 'senior', 'lead', 'executive'] }, description: 'Filter by experience level' },
          { in: 'query', name: 'search',           schema: { type: 'string' }, description: 'Partial-match on title or company (case-insensitive)' },
        ],
        responses: {
          '200': {
            description: 'Paginated jobs list',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/JobListResponse' } } },
          },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        tags: ['Jobs'],
        operationId: 'createJob',
        summary: 'Create a job',
        description: 'Creates a new job posting. The `createdBy` field is populated from the `x-user-id` header, defaulting to `"demo-recruiter"` if omitted.',
        parameters: [
          { in: 'header', name: 'x-user-id',        required: false, schema: { type: 'string' }, description: 'Recruiter identifier (defaults to "demo-recruiter")' },
          { in: 'header', name: 'x-correlation-id', required: false, schema: { type: 'string' }, description: 'Optional trace ID for log correlation' },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/JobCreate' } } },
        },
        responses: {
          '201': {
            description: 'Job created successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/JobCreateResponse' } } },
          },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/jobs/stats': {
      get: {
        tags: ['Jobs'],
        operationId: 'getDashboardStats',
        summary: 'Dashboard stats',
        description: 'Returns aggregate counts (jobs, applicants, completed screenings) and the 5 most recent completed screenings.',
        responses: {
          '200': {
            description: 'Dashboard statistics',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardStatsResponse' } } },
          },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/jobs/{id}': {
      get: {
        tags: ['Jobs'],
        operationId: 'getJob',
        summary: 'Get job by id',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'MongoDB ObjectId of the job' }],
        responses: {
          '200': { description: 'Job found',  content: { 'application/json': { schema: { $ref: '#/components/schemas/JobResponse' } } } },
          '404': { description: 'Job not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      put: {
        tags: ['Jobs'],
        operationId: 'updateJob',
        summary: 'Update job',
        description: 'Partially updates a job posting. Only send the fields you want to change.',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/JobUpdate' } } },
        },
        responses: {
          '200': { description: 'Updated job', content: { 'application/json': { schema: { $ref: '#/components/schemas/JobResponse' } } } },
          '404': { description: 'Not found',   content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['Jobs'],
        operationId: 'deleteJob',
        summary: 'Delete job',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted',   content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessage' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ── Applicants ────────────────────────────────────────────────────────────
    '/api/applicants': {
      get: {
        tags: ['Applicants'],
        operationId: 'listApplicants',
        summary: 'List applicants',
        description: 'Returns a paginated list of candidate profiles.',
        parameters: [
          { in: 'query', name: 'page',     schema: { type: 'integer', minimum: 1, default: 1 } },
          { in: 'query', name: 'pageSize', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
          { in: 'query', name: 'search',   schema: { type: 'string' }, description: 'Partial-match on fullName or headline' },
          { in: 'query', name: 'country',  schema: { type: 'string' }, description: 'Filter by location.country (exact match)' },
        ],
        responses: {
          '200': { description: 'Paginated applicants', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApplicantListResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        tags: ['Applicants'],
        operationId: 'createApplicant',
        summary: 'Create applicant',
        description: 'Creates a new candidate profile. `email` must be unique.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApplicantCreate' } } },
        },
        responses: {
          '201': { description: 'Created',        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApplicantResponse' } } } },
          '409': { description: 'Duplicate email', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/applicants/{id}': {
      get: {
        tags: ['Applicants'],
        operationId: 'getApplicant',
        summary: 'Get applicant by id',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Applicant found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApplicantResponse' } } } },
          '404': { description: 'Not found',       content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      put: {
        tags: ['Applicants'],
        operationId: 'updateApplicant',
        summary: 'Update applicant',
        description: 'Partially updates a candidate profile.',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApplicantUpdate' } } },
        },
        responses: {
          '200': { description: 'Updated',   content: { 'application/json': { schema: { $ref: '#/components/schemas/ApplicantResponse' } } } },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['Applicants'],
        operationId: 'deleteApplicant',
        summary: 'Delete applicant',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted',   content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessage' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ── Screenings ────────────────────────────────────────────────────────────
    '/api/screenings': {
      get: {
        tags: ['Screenings'],
        operationId: 'listScreenings',
        summary: 'List screenings (recent)',
        description: 'Returns the 50 most recently created screening requests, each enriched with the associated job title.',
        responses: {
          '200': { description: 'List of screening requests', content: { 'application/json': { schema: { $ref: '#/components/schemas/ScreeningListResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        tags: ['Screenings'],
        operationId: 'createScreening',
        summary: 'Start screening request (async)',
        description: [
          'Starts an AI screening run for the given job and candidate pool.',
          'The screening is executed in the background (fire-and-forget); the response is returned immediately with status `"processing"`.',
          '',
          '**Idempotency:** send an `idempotency-key` header to safely retry without creating duplicate screening runs.',
          '',
          '**Deduplication:** if an identical job + applicant set is already being processed, a `409` is returned with the existing `screeningRequestId`.',
        ].join('\n'),
        parameters: [
          {
            in: 'header', name: 'idempotency-key', required: false,
            schema: { type: 'string' },
            description: 'Client-generated unique key to de-duplicate retries. Reuses and re-returns the existing request if found.',
          },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ScreeningCreate' } } },
        },
        responses: {
          '200': { description: 'Existing request reused (idempotency key matched)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ScreeningStartResponse' } } } },
          '202': { description: 'Screening accepted and processing in background',   content: { 'application/json': { schema: { $ref: '#/components/schemas/ScreeningStartResponse' } } } },
          '400': { description: 'No applicants found to screen',                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Job not found',                                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '409': { description: 'Duplicate in-flight screening for this job + applicant set', content: { 'application/json': { schema: { $ref: '#/components/schemas/ScreeningConflictResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/screenings/{id}': {
      get: {
        tags: ['Screenings'],
        operationId: 'getScreeningResult',
        summary: 'Get screening status / result',
        description: [
          'Polls the status of a screening request.',
          '- While `status` is `"processing"` or `"pending"`, only status and message are returned.',
          '- When `status === "completed"`, the full ranked shortlist is returned with enriched applicant details.',
          '- When `status === "failed"`, the `message` field contains the error reason.',
        ].join('\n'),
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'screeningRequestId returned by POST /api/screenings' }],
        responses: {
          '200': { description: 'Screening status or completed result', content: { 'application/json': { schema: { $ref: '#/components/schemas/ScreeningGetResponse' } } } },
          '404': { description: 'Screening request not found',         content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/screenings/upload/csv': {
      post: {
        tags: ['Screenings'],
        operationId: 'uploadCSVApplicants',
        summary: 'Bulk-import applicants from CSV / Excel',
        description: [
          'Accepts a `.csv` or `.xlsx` file and upserts applicants by email (skips duplicates).',
          '',
          '**Required columns:** `name` (or `fullName` / `full_name`), `email`.',
          '**Optional columns:** `headline`, `skills` (comma / semicolon / pipe-separated), `location`, `summary`, etc.',
          '',
          'Returns a summary of how many rows were imported and any per-row validation errors.',
        ].join('\n'),
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary', description: 'CSV or Excel file (.csv / .xlsx)' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Import summary',          content: { 'application/json': { schema: { $ref: '#/components/schemas/UploadCsvResponse' } } } },
          '400': { description: 'No file uploaded',        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/screenings/metrics/evaluate': {
      get: {
        tags: ['Screenings'],
        operationId: 'evaluateScreeningQuality',
        summary: 'Evaluate screening quality metrics',
        description: [
          'Returns quality proxy metrics for a completed screening result.',
          '',
          '**Metrics:**',
          '- `precisionAtKProxy` — fraction of top-K candidates with `recommendation: strong_yes | yes`',
          '- `averageConfidence` — mean AI confidence score across top-K (0–1)',
          '- `humanReviewRate` — fraction of top-K candidates flagged for human review',
          '- `transparentContract` — model metadata (name, prompt version, processing time, fallback usage)',
        ].join('\n'),
        parameters: [
          { in: 'query', name: 'screeningRequestId', required: true,  schema: { type: 'string' }, description: 'ID of the completed screening request' },
          { in: 'query', name: 'topK',               required: false, schema: { type: 'integer', minimum: 1, maximum: 20, default: 10 }, description: 'Number of top-ranked candidates to evaluate (1–20)' },
        ],
        responses: {
          '200': { description: 'Screening quality metrics', content: { 'application/json': { schema: { $ref: '#/components/schemas/ScreeningMetricsResponse' } } } },
          '400': { description: 'Missing screeningRequestId', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Screening result not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/screenings/shortlists': {
      get: {
        tags: ['Screenings'],
        operationId: 'getScreeningShortlists',
        summary: 'Get all screening shortlists',
        description: 'Returns all completed screening shortlists with candidate details for each job.',
        responses: {
          '200': { description: 'List of shortlists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ShortlistsResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ── Authentication ─────────────────────────────────────────────────────────
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        operationId: 'register',
        summary: 'Register new user',
        description: 'Creates a new recruiter account and returns auth token.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          '201': { description: 'User registered successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          '409': { description: 'Email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        operationId: 'login',
        summary: 'User login',
        description: 'Authenticates user and returns JWT token.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          '200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        operationId: 'getCurrentUser',
        summary: 'Get current user',
        description: 'Returns the currently authenticated user profile.',
        responses: {
          '200': { description: 'Current user data', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ── User Profile & Settings ────────────────────────────────────────────────
    '/api/user/profile': {
      get: {
        tags: ['User'],
        operationId: 'getUserProfile',
        summary: 'Get user profile',
        responses: {
          '200': { description: 'User profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      put: {
        tags: ['User'],
        operationId: 'updateUserProfile',
        summary: 'Update user profile',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserUpdate' } } },
        },
        responses: {
          '200': { description: 'Profile updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/user/settings': {
      get: {
        tags: ['User'],
        operationId: 'getUserSettings',
        summary: 'Get user settings',
        responses: {
          '200': { description: 'User settings', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserSettingsResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      put: {
        tags: ['User'],
        operationId: 'updateUserSettings',
        summary: 'Update user settings',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserSettingsUpdate' } } },
        },
        responses: {
          '200': { description: 'Settings updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserSettingsResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/user/api-key': {
      put: {
        tags: ['User'],
        operationId: 'updateApiKey',
        summary: 'Update Gemini API key',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiKeyUpdate' } } },
        },
        responses: {
          '200': { description: 'API key updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessage' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ── Dashboard ─────────────────────────────────────────────────────────────
    '/api/dashboard/stats': {
      get: {
        tags: ['Dashboard'],
        operationId: 'getDashboardStats',
        summary: 'Get dashboard statistics',
        description: 'Returns dashboard stats including submissions, pending, hired, and declined counts.',
        responses: {
          '200': { description: 'Dashboard stats', content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardStatsResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ── Reports ─────────────────────────────────────────────────────────────────
    '/api/reports/summary': {
      get: {
        tags: ['Reports'],
        operationId: 'getReportsSummary',
        summary: 'Get reports summary',
        description: 'Returns summary statistics for reports including total screened, accuracy, and efficiency.',
        responses: {
          '200': { description: 'Reports summary', content: { 'application/json': { schema: { $ref: '#/components/schemas/ReportsSummaryResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/reports/detailed': {
      get: {
        tags: ['Reports'],
        operationId: 'getDetailedReports',
        summary: 'Get detailed analytics',
        description: 'Returns detailed analytics and breakdowns.',
        responses: {
          '200': { description: 'Detailed analytics', content: { 'application/json': { schema: { $ref: '#/components/schemas/DetailedAnalyticsResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPONENTS
  // ─────────────────────────────────────────────────────────────────────────────
  components: {
    responses: {
      InternalError: {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/InternalError' } } },
      },
    },

    schemas: {

      // ── Shared ─────────────────────────────────────────────────────────────
      Health: {
        type: 'object',
        required: ['status', 'service', 'version', 'timestamp', 'db'],
        properties: {
          status:    { type: 'string', example: 'ok' },
          service:   { type: 'string', example: 'TalentIQ API' },
          version:   { type: 'string', example: '1.0.0' },
          timestamp: { type: 'string', format: 'date-time' },
          db:        { type: 'string', enum: ['connected', 'disconnected'] },
        },
      },

      ErrorResponse: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: { type: 'boolean', example: false },
          error:   { type: 'string', example: 'Job not found' },
          message: { type: 'string' },
          data:    { type: 'object', nullable: true },
        },
      },

      InternalError: {
        allOf: [
          { $ref: '#/components/schemas/ErrorResponse' },
          {
            type: 'object',
            properties: {
              error: { type: 'string', example: 'Failed to create job' },
            },
          },
        ],
      },

      SuccessMessage: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Job deleted' },
        },
      },

      PaginationMeta: {
        type: 'object',
        required: ['total', 'page', 'pageSize'],
        properties: {
          total:    { type: 'integer', example: 42 },
          page:     { type: 'integer', example: 1 },
          pageSize: { type: 'integer', example: 20 },
        },
      },

      // ── Job sub-schemas ────────────────────────────────────────────────────
      JobRequiredSkill: {
        type: 'object',
        required: ['name'],
        properties: {
          name:          { type: 'string', example: 'TypeScript' },
          yearsRequired: { type: 'number', example: 2, default: 0 },
          mandatory:     { type: 'boolean', example: true, default: true },
          weight:        { type: 'number', minimum: 1, maximum: 5, example: 4, description: 'Priority weight for screening (1=low, 5=high)' },
        },
      },

      SalaryRange: {
        type: 'object',
        properties: {
          min:      { type: 'number', example: 60000 },
          max:      { type: 'number', example: 100000 },
          currency: { type: 'string', example: 'USD', default: 'USD' },
        },
      },

      JobCreate: {
        type: 'object',
        required: ['title', 'department', 'company', 'location', 'description'],
        properties: {
          title:                   { type: 'string', example: 'Senior Backend Engineer' },
          department:              { type: 'string', example: 'Engineering' },
          company:                 { type: 'string', example: 'Acme Corp' },
          location:                { type: 'string', example: 'Kigali, Rwanda' },
          remote:                  { type: 'boolean', example: true, default: false },
          employmentType:          { type: 'string', enum: ['full-time', 'part-time', 'contract', 'freelance'], default: 'full-time' },
          experienceLevel:         { type: 'string', enum: ['entry', 'mid', 'senior', 'lead', 'executive'], default: 'mid' },
          description:             { type: 'string', example: 'We are looking for a senior backend engineer to join our distributed team...' },
          responsibilities:        { type: 'array', items: { type: 'string' }, example: ['Design and maintain REST APIs', 'Mentor junior engineers'] },
          requiredSkills:          { type: 'array', items: { $ref: '#/components/schemas/JobRequiredSkill' } },
          niceToHaveSkills:        { type: 'array', items: { type: 'string' }, example: ['GraphQL', 'Kubernetes'] },
          requiredEducation:       { type: 'string', example: "Bachelor's in Computer Science or equivalent" },
          requiredExperienceYears: { type: 'number', example: 4, default: 0 },
          salaryRange:             { $ref: '#/components/schemas/SalaryRange' },
          applicationDeadline:     { type: 'string', format: 'date', example: '2025-06-30' },
          shortlistSize:           { type: 'integer', enum: [10, 20], default: 10, description: 'Maximum number of candidates in the AI shortlist' },
        },
      },

      JobUpdate: {
        type: 'object',
        description: 'Partial job update — include only the fields you wish to change.',
        properties: {
          title:                   { type: 'string' },
          department:              { type: 'string' },
          company:                 { type: 'string' },
          location:                { type: 'string' },
          remote:                  { type: 'boolean' },
          employmentType:          { type: 'string', enum: ['full-time', 'part-time', 'contract', 'freelance'] },
          experienceLevel:         { type: 'string', enum: ['entry', 'mid', 'senior', 'lead', 'executive'] },
          description:             { type: 'string' },
          responsibilities:        { type: 'array', items: { type: 'string' } },
          requiredSkills:          { type: 'array', items: { $ref: '#/components/schemas/JobRequiredSkill' } },
          niceToHaveSkills:        { type: 'array', items: { type: 'string' } },
          requiredEducation:       { type: 'string' },
          requiredExperienceYears: { type: 'number' },
          salaryRange:             { $ref: '#/components/schemas/SalaryRange' },
          applicationDeadline:     { type: 'string', format: 'date' },
          shortlistSize:           { type: 'integer', enum: [10, 20] },
        },
      },

      Job: {
        type: 'object',
        required: ['_id', 'title', 'department', 'company', 'location', 'description', 'createdBy'],
        properties: {
          _id:                     { type: 'string', example: '663f2a1b4e0c3d2a1b4e0c3d' },
          title:                   { type: 'string', example: 'Senior Backend Engineer' },
          department:              { type: 'string', example: 'Engineering' },
          company:                 { type: 'string', example: 'Acme Corp' },
          location:                { type: 'string', example: 'Kigali, Rwanda' },
          remote:                  { type: 'boolean', example: true },
          employmentType:          { type: 'string', enum: ['full-time', 'part-time', 'contract', 'freelance'] },
          experienceLevel:         { type: 'string', enum: ['entry', 'mid', 'senior', 'lead', 'executive'] },
          description:             { type: 'string' },
          responsibilities:        { type: 'array', items: { type: 'string' } },
          requiredSkills:          { type: 'array', items: { $ref: '#/components/schemas/JobRequiredSkill' } },
          niceToHaveSkills:        { type: 'array', items: { type: 'string' } },
          requiredEducation:       { type: 'string' },
          requiredExperienceYears: { type: 'number' },
          salaryRange:             { $ref: '#/components/schemas/SalaryRange' },
          applicationDeadline:     { type: 'string', format: 'date' },
          shortlistSize:           { type: 'integer', enum: [10, 20] },
          createdBy:               { type: 'string', example: 'demo-recruiter' },
          screeningCount:          { type: 'integer', example: 3, description: 'Number of completed screenings for this job (only on list endpoint)' },
          createdAt:               { type: 'string', format: 'date-time' },
          updatedAt:               { type: 'string', format: 'date-time' },
        },
      },

      JobResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', example: true },
          data:    { $ref: '#/components/schemas/Job' },
        },
      },

      JobCreateResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Job created successfully' },
          data:    { $ref: '#/components/schemas/Job' },
        },
      },

      JobListResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', example: true },
          data:    { type: 'array', items: { $ref: '#/components/schemas/Job' } },
          meta:    { $ref: '#/components/schemas/PaginationMeta' },
        },
      },

      DashboardStatsResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            required: ['totalJobs', 'totalApplicants', 'completedScreenings', 'recentActivity'],
            properties: {
              totalJobs:           { type: 'integer', example: 12 },
              totalApplicants:     { type: 'integer', example: 384 },
              completedScreenings: { type: 'integer', example: 7 },
              recentActivity: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['screeningId', 'jobTitle', 'applicantsCount', 'status'],
                  properties: {
                    screeningId:     { type: 'string' },
                    jobTitle:        { type: 'string', example: 'Senior Backend Engineer' },
                    applicantsCount: { type: 'integer', example: 45 },
                    completedAt:     { type: 'string', format: 'date-time', nullable: true },
                    status:          { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
                  },
                },
              },
            },
          },
        },
      },

      // ── Applicant sub-schemas ──────────────────────────────────────────────
      Skill: {
        type: 'object',
        required: ['name'],
        properties: {
          name:              { type: 'string', example: 'TypeScript' },
          yearsOfExperience: { type: 'number', example: 3, default: 0 },
          level:             { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' },
          category:          { type: 'string', enum: ['technical', 'soft', 'domain', 'tool'], default: 'technical' },
        },
      },

      WorkExperience: {
        type: 'object',
        required: ['company', 'role', 'startDate'],
        properties: {
          company:      { type: 'string', example: 'Acme Corp' },
          role:         { type: 'string', example: 'Backend Engineer' },
          startDate:    { type: 'string', example: '2021-03' },
          endDate:      { type: 'string', example: '2023-07', nullable: true },
          isCurrent:    { type: 'boolean', default: false },
          description:  { type: 'string', default: '' },
          achievements: { type: 'array', items: { type: 'string' } },
          skills:       { type: 'array', items: { type: 'string' }, description: 'Skill names relevant to this role' },
        },
      },

      Education: {
        type: 'object',
        required: ['institution', 'degree', 'field', 'startYear'],
        properties: {
          institution: { type: 'string', example: 'University of Rwanda' },
          degree:      { type: 'string', example: 'Bachelor of Science' },
          field:       { type: 'string', example: 'Computer Science' },
          startYear:   { type: 'integer', example: 2016 },
          endYear:     { type: 'integer', example: 2020, nullable: true },
          grade:       { type: 'string', example: 'First Class Honours', nullable: true },
        },
      },

      Certification: {
        type: 'object',
        required: ['name', 'issuer', 'issueDate'],
        properties: {
          name:          { type: 'string', example: 'AWS Certified Solutions Architect' },
          issuer:        { type: 'string', example: 'Amazon Web Services' },
          issueDate:     { type: 'string', example: '2023-01' },
          expiryDate:    { type: 'string', example: '2026-01', nullable: true },
          credentialUrl: { type: 'string', format: 'uri', nullable: true },
        },
      },

      Language: {
        type: 'object',
        properties: {
          name:        { type: 'string', example: 'French' },
          proficiency: { type: 'string', enum: ['basic', 'conversational', 'professional', 'native'] },
        },
      },

      ApplicantLocation: {
        type: 'object',
        properties: {
          city:    { type: 'string', example: 'Kigali' },
          country: { type: 'string', example: 'Rwanda' },
          remote:  { type: 'boolean', default: false },
        },
      },

      ApplicantAvailability: {
        type: 'object',
        properties: {
          immediateStart: { type: 'boolean', default: false },
          noticePeriod:   { type: 'integer', example: 30, description: 'Notice period in days' },
        },
      },

      ApplicantSalary: {
        type: 'object',
        properties: {
          min:      { type: 'number', example: 50000 },
          max:      { type: 'number', example: 80000 },
          currency: { type: 'string', example: 'USD' },
        },
      },

      ApplicantCreate: {
        type: 'object',
        required: ['fullName', 'email'],
        properties: {
          fullName:         { type: 'string', example: 'Alice Uwimana' },
          email:            { type: 'string', format: 'email', example: 'alice@example.com' },
          phone:            { type: 'string', example: '+250700000000', nullable: true },
          location:         { $ref: '#/components/schemas/ApplicantLocation' },
          headline:         { type: 'string', example: 'Full-Stack Engineer with 5 years experience', default: '' },
          summary:          { type: 'string', default: '' },
          skills:           { type: 'array', items: { $ref: '#/components/schemas/Skill' } },
          workExperience:   { type: 'array', items: { $ref: '#/components/schemas/WorkExperience' } },
          education:        { type: 'array', items: { $ref: '#/components/schemas/Education' } },
          certifications:   { type: 'array', items: { $ref: '#/components/schemas/Certification' } },
          languages:        { type: 'array', items: { $ref: '#/components/schemas/Language' } },
          portfolioUrl:     { type: 'string', format: 'uri', nullable: true },
          linkedinUrl:      { type: 'string', format: 'uri', nullable: true },
          githubUrl:        { type: 'string', format: 'uri', nullable: true },
          availability:     { $ref: '#/components/schemas/ApplicantAvailability' },
          expectedSalary:   { $ref: '#/components/schemas/ApplicantSalary' },
          source:           { type: 'string', enum: ['umurava_platform', 'external_csv', 'external_pdf', 'manual'], default: 'umurava_platform' },
          rawResumeText:    { type: 'string', nullable: true, description: 'Raw text extracted from a PDF resume, used as additional context for AI screening' },
        },
      },

      ApplicantUpdate: {
        type: 'object',
        description: 'Partial applicant update — all fields are optional.',
        properties: {
          fullName:       { type: 'string' },
          phone:          { type: 'string' },
          location:       { $ref: '#/components/schemas/ApplicantLocation' },
          headline:       { type: 'string' },
          summary:        { type: 'string' },
          skills:         { type: 'array', items: { $ref: '#/components/schemas/Skill' } },
          workExperience: { type: 'array', items: { $ref: '#/components/schemas/WorkExperience' } },
          education:      { type: 'array', items: { $ref: '#/components/schemas/Education' } },
          certifications: { type: 'array', items: { $ref: '#/components/schemas/Certification' } },
          languages:      { type: 'array', items: { $ref: '#/components/schemas/Language' } },
          portfolioUrl:   { type: 'string', format: 'uri' },
          linkedinUrl:    { type: 'string', format: 'uri' },
          githubUrl:      { type: 'string', format: 'uri' },
          availability:   { $ref: '#/components/schemas/ApplicantAvailability' },
          expectedSalary: { $ref: '#/components/schemas/ApplicantSalary' },
        },
      },

      Applicant: {
        type: 'object',
        required: ['_id', 'fullName', 'email'],
        properties: {
          _id:                  { type: 'string', example: '663f2a1b4e0c3d2a1b4e0c3d' },
          fullName:             { type: 'string', example: 'Alice Uwimana' },
          email:                { type: 'string', format: 'email' },
          phone:                { type: 'string', nullable: true },
          location:             { $ref: '#/components/schemas/ApplicantLocation' },
          headline:             { type: 'string' },
          summary:              { type: 'string' },
          skills:               { type: 'array', items: { $ref: '#/components/schemas/Skill' } },
          workExperience:       { type: 'array', items: { $ref: '#/components/schemas/WorkExperience' } },
          education:            { type: 'array', items: { $ref: '#/components/schemas/Education' } },
          certifications:       { type: 'array', items: { $ref: '#/components/schemas/Certification' } },
          languages:            { type: 'array', items: { $ref: '#/components/schemas/Language' } },
          portfolioUrl:         { type: 'string', format: 'uri', nullable: true },
          linkedinUrl:          { type: 'string', format: 'uri', nullable: true },
          githubUrl:            { type: 'string', format: 'uri', nullable: true },
          availability:         { $ref: '#/components/schemas/ApplicantAvailability' },
          expectedSalary:       { $ref: '#/components/schemas/ApplicantSalary' },
          source:               { type: 'string', enum: ['umurava_platform', 'external_csv', 'external_pdf', 'manual'] },
          totalExperienceYears: { type: 'number', readOnly: true, description: 'Virtual: computed total years across all work experience entries' },
          createdAt:            { type: 'string', format: 'date-time' },
          updatedAt:            { type: 'string', format: 'date-time' },
        },
      },

      ApplicantResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', example: true },
          data:    { $ref: '#/components/schemas/Applicant' },
        },
      },

      ApplicantListResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', example: true },
          data:    { type: 'array', items: { $ref: '#/components/schemas/Applicant' } },
          meta:    { $ref: '#/components/schemas/PaginationMeta' },
        },
      },

      // ── Screening sub-schemas ──────────────────────────────────────────────
      ScoreBreakdown: {
        type: 'object',
        required: ['weightedSkills', 'weightedExperience', 'weightedEducation', 'weightedRelevance'],
        description: 'Weighted contribution of each dimension to the overall score.',
        properties: {
          weightedSkills:     { type: 'number', example: 29.75, description: 'skillsScore × 0.35' },
          weightedExperience: { type: 'number', example: 24.0,  description: 'experienceScore × 0.30' },
          weightedEducation:  { type: 'number', example: 16.0,  description: 'educationScore × 0.20' },
          weightedRelevance:  { type: 'number', example: 10.5,  description: 'relevanceScore × 0.15' },
        },
      },

      CandidateScore: {
        type: 'object',
        required: ['applicantId', 'rank', 'overallScore', 'recommendation', 'reasoning', 'confidenceScore', 'needsHumanReview', 'finalDecisionNote'],
        properties: {
          applicantId:       { type: 'string', example: '663f2a1b4e0c3d2a1b4e0001' },
          rank:              { type: 'integer', example: 1, description: 'Position in the shortlist (1 = best match)' },
          overallScore:      { type: 'number', minimum: 0, maximum: 100, example: 80.2, description: 'Weighted composite score' },
          estimatedFitScore: { type: 'number', minimum: 0, maximum: 100, example: 80.2 },
          skillsScore:       { type: 'number', minimum: 0, maximum: 100, example: 85 },
          experienceScore:   { type: 'number', minimum: 0, maximum: 100, example: 80 },
          educationScore:    { type: 'number', minimum: 0, maximum: 100, example: 80 },
          relevanceScore:    { type: 'number', minimum: 0, maximum: 100, example: 70 },
          strengths:         { type: 'array', items: { type: 'string' }, example: ['Strong TypeScript background', '5 years of Node.js'] },
          gaps:              { type: 'array', items: { type: 'string' }, example: ['No Kubernetes experience'] },
          recommendation:    { type: 'string', enum: ['strong_yes', 'yes', 'maybe', 'no'], example: 'yes', description: 'strong_yes ≥85, yes 70-84, maybe 50-69, no <50' },
          reasoning:         { type: 'string', example: 'Alice demonstrates strong TypeScript and Node.js expertise...' },
          keyHighlights:     { type: 'array', items: { type: 'string' } },
          riskFactors:       { type: 'array', items: { type: 'string' } },
          confidenceScore:   { type: 'number', minimum: 0, maximum: 1, example: 0.87, description: 'AI confidence in this evaluation (0–1)' },
          needsHumanReview:  { type: 'boolean', example: false, description: 'True when confidence < 0.6 or recommendation is "maybe"' },
          uncertaintyReasons:    { type: 'array', items: { type: 'string' }, example: ['Confidence acceptable'] },
          finalDecisionNote:     { type: 'string', example: 'AI recommendation only. Final hiring decision must be made by a human recruiter.' },
          scoreBreakdown:        { $ref: '#/components/schemas/ScoreBreakdown' },
          evidence:              { type: 'array', items: { type: 'string' }, description: 'Up to 6 key evidence items drawn from highlights, strengths, and gaps' },
        },
      },

      EnrichedCandidateScore: {
        description: 'CandidateScore enriched with the full applicant profile.',
        allOf: [
          { $ref: '#/components/schemas/CandidateScore' },
          {
            type: 'object',
            properties: {
              applicant: {
                nullable: true,
                allOf: [{ $ref: '#/components/schemas/Applicant' }],
                description: 'Full applicant document, or null if not found',
              },
            },
          },
        ],
      },

      ScreeningRequest: {
        type: 'object',
        required: ['_id', 'jobId', 'status'],
        properties: {
          _id:              { type: 'string', example: '663f2a1b4e0c3d2a1b4e0c99' },
          jobId:            { type: 'string' },
          applicantIds:     { type: 'array', items: { type: 'string' } },
          idempotencyKey:   { type: 'string', nullable: true },
          applicantSetHash: { type: 'string', description: 'SHA-256 of sorted applicant IDs — used for deduplication' },
          status:           { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
          shortlistSize:    { type: 'integer', enum: [10, 20] },
          completedAt:      { type: 'string', format: 'date-time', nullable: true },
          errorMessage:     { type: 'string', nullable: true },
          jobTitle:         { type: 'string', example: 'Senior Backend Engineer', description: 'Enriched job title (list endpoint only)' },
          createdAt:        { type: 'string', format: 'date-time' },
          updatedAt:        { type: 'string', format: 'date-time' },
        },
      },

      ScreeningCreate: {
        type: 'object',
        required: ['jobId'],
        properties: {
          jobId: {
            type: 'string',
            example: '663f2a1b4e0c3d2a1b4e0c3d',
            description: 'MongoDB ObjectId of the job to screen for',
          },
          applicantIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional list of specific applicant IDs to screen. If omitted, ALL applicants in the database are evaluated.',
            example: ['663f2a1b00001', '663f2a1b00002'],
          },
          shortlistSize: {
            type: 'integer',
            enum: [10, 20],
            default: 10,
            description: 'Maximum number of candidates to include in the final shortlist',
          },
        },
      },

      ScreeningStartResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            required: ['screeningRequestId', 'status', 'applicantsCount', 'message'],
            properties: {
              screeningRequestId: { type: 'string', example: '663f2a1b4e0c3d2a1b4e0c99' },
              status:             { type: 'string', enum: ['processing'], example: 'processing' },
              applicantsCount:    { type: 'integer', example: 45 },
              message:            { type: 'string', example: 'Screening 45 candidates for "Senior Backend Engineer"' },
            },
          },
        },
      },

      ScreeningConflictResponse: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: { type: 'boolean', example: false },
          error:   { type: 'string', example: 'A screening request for this job and applicant set is already processing' },
          data: {
            type: 'object',
            properties: {
              screeningRequestId: { type: 'string', description: 'ID of the already in-flight request' },
            },
          },
        },
      },

      ScreeningListResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', example: true },
          data:    { type: 'array', items: { $ref: '#/components/schemas/ScreeningRequest' } },
        },
      },

      ScreeningResultData: {
        type: 'object',
        required: ['screeningRequestId', 'jobId', 'shortlist', 'totalApplicantsEvaluated', 'processingTimeMs', 'modelUsed', 'promptVersion'],
        properties: {
          screeningRequestId:      { type: 'string' },
          jobId:                   { type: 'string' },
          shortlist:               { type: 'array', items: { $ref: '#/components/schemas/EnrichedCandidateScore' }, description: 'Top-ranked candidates, ordered by overallScore descending' },
          totalApplicantsEvaluated:{ type: 'integer', example: 45 },
          processingTimeMs:        { type: 'integer', example: 12400, description: 'Total AI processing time in milliseconds' },
          modelUsed:               { type: 'string', example: 'gemini-1.5-pro' },
          promptVersion:           { type: 'string', example: 'v2.1' },
          fallbackUsed:            { type: 'boolean', example: false, description: 'True when Gemini was unavailable and rule-based scoring was used' },
          createdAt:               { type: 'string', format: 'date-time' },
        },
      },

      ScreeningGetResponse: {
        type: 'object',
        required: ['success'],
        description: 'Response shape changes based on current status.',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            required: ['status'],
            properties: {
              status:  { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
              message: { type: 'string', description: 'Human-readable message when status is pending/processing/failed' },
              result:  {
                nullable: true,
                description: 'Only present when status === "completed"',
                allOf: [{ $ref: '#/components/schemas/ScreeningResultData' }],
              },
            },
          },
        },
      },

      UploadCsvResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            required: ['totalRows', 'importedCount', 'applicantIds', 'rowErrors'],
            properties: {
              totalRows:     { type: 'integer', example: 50, description: 'Total data rows found in the file (excluding header)' },
              importedCount: { type: 'integer', example: 47, description: 'Number of applicants successfully upserted' },
              applicantIds:  { type: 'array', items: { type: 'string' }, description: 'MongoDB IDs of upserted applicants' },
              rowErrors: {
                type: 'array',
                description: 'Per-row validation failures',
                items: {
                  type: 'object',
                  required: ['row', 'error'],
                  properties: {
                    row:   { type: 'integer', example: 5, description: 'Spreadsheet row number (1-indexed, header = row 1)' },
                    error: { type: 'string', example: 'Missing candidate email' },
                  },
                },
              },
            },
          },
        },
      },

      ScreeningMetricsResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            required: ['screeningRequestId', 'topK', 'precisionAtKProxy', 'averageConfidence', 'humanReviewRate', 'transparentContract'],
            properties: {
              screeningRequestId: { type: 'string' },
              topK:               { type: 'integer', example: 10 },
              precisionAtKProxy:  { type: 'number', minimum: 0, maximum: 1, example: 0.7,  description: 'Fraction of top-K with strong_yes or yes recommendation' },
              averageConfidence:  { type: 'number', minimum: 0, maximum: 1, example: 0.83, description: 'Mean AI confidence score across top-K candidates' },
              humanReviewRate:    { type: 'number', minimum: 0, maximum: 1, example: 0.2,  description: 'Fraction of top-K candidates flagged for human review' },
              transparentContract: {
                type: 'object',
                required: ['modelUsed', 'promptVersion', 'processingTimeMs', 'fallbackUsed'],
                description: 'Audit metadata for the AI run',
                properties: {
                  modelUsed:       { type: 'string', example: 'gemini-1.5-pro' },
                  promptVersion:   { type: 'string', example: 'v2.1' },
                  processingTimeMs:{ type: 'integer', example: 12400 },
                  fallbackUsed:    { type: 'boolean', example: false },
                },
              },
            },
          },
        },
      },

      // ── Authentication Schemas ──────────────────────────────────────────────────
      RegisterRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password'],
        properties: {
          firstName: { type: 'string', example: 'John' },
          lastName:  { type: 'string', example: 'Doe' },
          email:     { type: 'string', format: 'email', example: 'john@example.com' },
          password:  { type: 'string', format: 'password', example: 'SecurePass123!', minLength: 8 },
          role:      { type: 'string', enum: ['recruiter', 'admin', 'manager'], default: 'recruiter' },
          company:   { type: 'string', example: 'Acme Corp' },
          jobTitle:  { type: 'string', example: 'HR Manager' },
        },
      },

      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email:    { type: 'string', format: 'email', example: 'john@example.com' },
          password: { type: 'string', format: 'password', example: 'SecurePass123!' },
        },
      },

      AuthResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login successful' },
          data: {
            type: 'object',
            required: ['user', 'token'],
            properties: {
              user: {
                type: 'object',
                required: ['id', 'email', 'firstName', 'lastName', 'role'],
                properties: {
                  id:        { type: 'string', example: '663f2a1b4e0c3d2a1b4e0c3d' },
                  email:     { type: 'string', example: 'john@example.com' },
                  firstName: { type: 'string', example: 'John' },
                  lastName:  { type: 'string', example: 'Doe' },
                  role:      { type: 'string', enum: ['admin', 'manager', 'recruiter'] },
                  avatarUrl: { type: 'string', nullable: true },
                  company:   { type: 'string', nullable: true },
                  jobTitle:  { type: 'string', nullable: true },
                  profileCompletion: { type: 'number', example: 85 },
                },
              },
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            },
          },
        },
      },

      // ── User Schemas ──────────────────────────────────────────────────────────
      User: {
        type: 'object',
        required: ['id', 'email', 'firstName', 'lastName', 'role'],
        properties: {
          id:                { type: 'string' },
          email:             { type: 'string' },
          firstName:         { type: 'string' },
          lastName:          { type: 'string' },
          role:              { type: 'string', enum: ['admin', 'manager', 'recruiter'] },
          avatarUrl:         { type: 'string', nullable: true },
          company:           { type: 'string', nullable: true },
          jobTitle:          { type: 'string', nullable: true },
          profileCompletion: { type: 'number' },
          geminiApiKey:      { type: 'string', nullable: true },
          settings:          { $ref: '#/components/schemas/UserSettings' },
        },
      },

      UserResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', example: true },
          data:    { $ref: '#/components/schemas/User' },
        },
      },

      UserUpdate: {
        type: 'object',
        description: 'Partial user update - include only fields to change',
        properties: {
          firstName:  { type: 'string' },
          lastName:   { type: 'string' },
          email:      { type: 'string', format: 'email' },
          company:    { type: 'string' },
          jobTitle:   { type: 'string' },
          avatarUrl:  { type: 'string' },
        },
      },

      UserSettings: {
        type: 'object',
        properties: {
          theme: { type: 'string', enum: ['light', 'dark', 'system'], default: 'system' },
          language: { type: 'string', default: 'en' },
        },
      },

      UserSettingsResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', example: true },
          data:    { $ref: '#/components/schemas/UserSettings' },
        },
      },

      UserSettingsUpdate: {
        type: 'object',
        properties: {
          theme:    { type: 'string', enum: ['light', 'dark', 'system'] },
          language: { type: 'string' },
        },
      },

      ApiKeyUpdate: {
        type: 'object',
        required: ['apiKey'],
        properties: {
          apiKey: { type: 'string', description: 'Gemini API key for AI screening' },
        },
      },

      // ── Dashboard Schema ───────────────────────────────────────────────────────
      DashboardStats: {
        type: 'object',
        properties: {
          submissions: { type: 'integer', example: 122 },
          pending:     { type: 'integer', example: 45 },
          hired:       { type: 'integer', example: 67 },
          declined:    { type: 'integer', example: 10 },
        },
      },

      // ── Reports Schemas ────────────────────────────────────────────────────────
      ReportsSummary: {
        type: 'object',
        properties: {
          totalScreened:       { type: 'integer', example: 122 },
          avgAccuracy:         { type: 'number', example: 87 },
          efficiencyMultiplier:{ type: 'number', example: 3.2 },
        },
      },

      ReportsSummaryResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', example: true },
          data:    { $ref: '#/components/schemas/ReportsSummary' },
        },
      },

      DetailedAnalytics: {
        type: 'object',
        properties: {
          screeningPerformance: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                jobId:      { type: 'string' },
                jobTitle:   { type: 'string' },
                applicants: { type: 'integer' },
                shortlisted:{ type: 'integer' },
                avgScore:   { type: 'number' },
              },
            },
          },
          skillDistribution: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                skill:  { type: 'string' },
                count:  { type: 'integer' },
              },
            },
          },
        },
      },

      DetailedAnalyticsResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', example: true },
          data:    { $ref: '#/components/schemas/DetailedAnalytics' },
        },
      },

      // ── Shortlists Schema ──────────────────────────────────────────────────────
      ShortlistCandidate: {
        type: 'object',
        properties: {
          name:        { type: 'string', example: 'Alice Johnson' },
          role:        { type: 'string', example: 'Senior Developer' },
          score:       { type: 'number', example: 92 },
          description: { type: 'string', example: 'Strong match with required skills' },
        },
      },

      Shortlist: {
        type: 'object',
        properties: {
          id:         { type: 'string' },
          jobTitle:   { type: 'string', example: 'Senior Backend Engineer' },
          date:       { type: 'string', format: 'date', example: '2024-01-15' },
          candidates: { type: 'integer', example: 10 },
          topScore:   { type: 'number', example: 95 },
          status:     { type: 'string', enum: ['Complete', 'Pending Review'] },
          list:       { type: 'array', items: { $ref: '#/components/schemas/ShortlistCandidate' } },
        },
      },

      ShortlistsResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean', example: true },
          data:    { type: 'array', items: { $ref: '#/components/schemas/Shortlist' } },
        },
      },
    },
  },
};
