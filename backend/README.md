# TalentIQ Backend

An AI-powered talent screening backend service for the Umurava AI Hackathon. This system leverages Google's Gemini API to intelligently screen and rank job applicants while maintaining human oversight in the hiring process.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [AI Decision Flow](#ai-decision-flow)
- [API Documentation](#api-documentation)
- [Assumptions and Limitations](#assumptions-and-limitations)
- [Testing](#testing)
- [Contributing](#contributing)

## Overview

TalentIQ Backend is a production-ready Node.js/TypeScript API that provides intelligent candidate screening capabilities. The system accepts job descriptions and applicant profiles (structured data or unstructured resumes), uses AI to evaluate candidates against job requirements, and produces ranked shortlists with detailed reasoning for each candidate.

### Key Capabilities

- **Multi-format Applicant Ingestion**: Support for structured talent profiles, CSV/Excel uploads, and PDF resume parsing
- **AI-Powered Screening**: Gemini API-driven evaluation with weighted scoring across skills, experience, education, and relevance
- **Explainable AI**: Clear reasoning for each candidate including strengths, gaps, and risk factors
- **Human-in-the-Loop**: AI recommendations assist but do not replace human hiring decisions
- **BYOK (Bring Your Own Key)**: Hybrid authentication allowing users to provide their own Gemini API keys with server fallback
- **Real-time Screening**: Asynchronous processing with status tracking
- **Analytics Dashboard**: Comprehensive reporting on screening metrics and performance

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Jobs    │  │Applicants│  │ Screening│  │ Dashboard│      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (Express + TypeScript)           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Controllers Layer                       │  │
│  │  Jobs | Applicants | Screening | Reports | User | Dashboard│  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Services Layer                         │  │
│  │  AIScreeningService | ResumeParserService               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Models Layer (Mongoose)                │  │
│  │  Job | Applicant | ScreeningRequest | ScreeningResult    │  │
│  │  User | UserSettings                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database (MongoDB)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │   Jobs   │  │Applicants│  │Screenings│  │   Users  │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI Layer (Gemini API)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Multi-candidate evaluation | Weighted scoring           │  │
│  │  Natural language reasoning | Explainable AI             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### Core Features

1. **Job Management**
   - Create, update, delete job postings
   - Job status tracking (Active, Draft, Closed)
   - Applicant count per job
   - Structured job requirements with weighted skills

2. **Applicant Management**
   - Create and manage applicant profiles
   - Track job applications per applicant
   - Application status tracking (New, Under Review, Shortlisted, Rejected, Hired)
   - Match score storage per application

3. **AI Screening**
   - Batch screening of multiple candidates
   - Configurable shortlist size (Top 10 or Top 20)
   - Weighted scoring:
     - Skills: 35%
     - Experience: 30%
     - Education: 20%
     - Relevance: 15%
   - Natural language reasoning for each candidate
   - Confidence scoring and uncertainty indicators
   - Human review flags for borderline cases

4. **Resume Parsing**
   - PDF resume parsing using Gemini API
   - Extraction of structured talent profiles from unstructured text
   - Support for various resume formats

5. **File Upload**
   - CSV/Excel batch applicant import
   - PDF resume upload for parsing
   - Validation and error handling

6. **User Management**
   - User profile management
   - API key configuration (BYOK)
   - Notification preferences
   - Profile completion tracking

7. **Analytics & Reporting**
   - Dashboard statistics (submissions, pending, hired, declined)
   - Screening performance metrics
   - Time-series analytics
   - Skill distribution analysis

## Technology Stack

- **Language**: TypeScript 5.5+
- **Runtime**: Node.js 20+
- **Framework**: Express.js 4.19+
- **Database**: MongoDB with Mongoose 8.5+
- **AI/LLM**: Google Gemini API (@google/generative-ai)
- **File Processing**: Multer, XLSX, PDF-parse
- **Validation**: Zod, express-validator
- **Logging**: Winston
- **Security**: Helmet, CORS, express-rate-limit, JWT
- **Testing**: Jest, Supertest
- **API Documentation**: Swagger/OpenAPI

## Setup Instructions

### Prerequisites

- Node.js 20.x or higher
- MongoDB 6.x or higher (local or MongoDB Atlas)
- npm or pnpm package manager
- Gemini API key (from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   - Local: Ensure MongoDB is running on `localhost:27017`
   - Atlas: Update `MONGODB_URI` in `.env` with your connection string

5. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. **Build for production**
   ```bash
   npm run build
   npm start
   ```

7. **Seed database (optional)**
   ```bash
   npm run seed
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/umurava-talentiq
# or for MongoDB Atlas: mongodb+srv://<username>:<password>@cluster.mongodb.net/umurava-talentiq

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
# Alternative key (for compatibility)
GEMININI_API_KEY=your_gemini_api_key_here

# JWT Secret (for authentication - REQUIRED)
JWT_SECRET=your_secure_jwt_secret_here_change_in_production

# Server Configuration
PORT=4000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
```

### Environment Variable Descriptions

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `MONGODB_URI` | Yes | MongoDB connection string | - |
| `GEMINI_API_KEY` | Yes | Google Gemini API key | - |
| `JWT_SECRET` | Yes | Secret key for JWT token generation | - |
| `PORT` | No | Server port | 4000 |
| `NODE_ENV` | No | Environment (development/production) | development |
| `FRONTEND_URL` | No | Frontend URL for CORS | http://localhost:3000 |

## AI Decision Flow

### Screening Process

1. **Input Reception**
   - Job posting with requirements (skills, experience, education)
   - Array of applicant profiles (structured or parsed from resumes)

2. **Prompt Engineering**
   - Construct structured prompt with job requirements
   - Include all applicant profiles in single batch request
   - Define scoring criteria and output schema

3. **AI Evaluation**
   - Gemini API processes all candidates simultaneously
   - Evaluates each candidate against job criteria
   - Returns structured scores (0-100) for:
     - Skills match
     - Experience relevance
     - Education alignment
     - Overall job relevance

4. **Score Processing**
   - Apply weighted scoring formula:
     ```
     Overall Score = (Skills × 0.35) + (Experience × 0.30) + (Education × 0.20) + (Relevance × 0.15)
     ```
   - Rank candidates by overall score
   - Select top N candidates (10 or 20)

5. **Explanation Generation**
   - Extract strengths (skills/experience that match well)
   - Identify gaps (missing or weak areas)
   - Generate natural language reasoning
   - Flag candidates requiring human review

6. **Output Generation**
   - Return ranked shortlist with:
     - Rank position
     - Match score (0-100)
     - Detailed reasoning
     - Strengths and gaps
     - Recommendation (strong_yes/yes/maybe/no)
     - Confidence score
     - Human review flag

### BYOK (Bring Your Own Key) Flow

1. **User API Key Preference**
   - User can configure their own Gemini API key in settings
   - Stored in `UserSettings` model

2. **Key Selection Logic**
   - Priority: User-provided key > Server environment key
   - If user has configured key → use user's key
   - If no user key → fall back to server's `GEMINI_API_KEY`

3. **Warning System**
   - When using server key, log warning about rate limits
   - Advise users to configure their own key for better performance
   - Return `usingServerKey` flag in screening results for client notification

### Fallback Mechanisms

1. **API Quota Exceeded**
   - Detect quota/limit errors from Gemini API
   - Switch to rule-based scoring using skill matching
   - Log fallback event for monitoring

2. **No API Key Configured**
   - Return placeholder scores (0) when no key available
   - Log warning to configure API key
   - Allow system to continue without errors

## API Documentation

### Base URL
```
http://localhost:4000/api
```

### Endpoints

#### Jobs
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get job by ID
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/jobs/stats` - Get dashboard stats

#### Applicants
- `GET /api/applicants` - List all applicants
- `POST /api/applicants` - Create applicant
- `GET /api/applicants/:id` - Get applicant by ID
- `PUT /api/applicants/:id` - Update applicant
- `DELETE /api/applicants/:id` - Delete applicant

#### Screening
- `POST /api/screenings` - Start AI screening
- `GET /api/screenings` - List screening requests
- `GET /api/screenings/:id` - Get screening result
- `POST /api/screenings/upload/csv` - Upload CSV applicants
- `GET /api/screenings/metrics/evaluate` - Evaluate screening quality

#### Reports
- `GET /api/reports/summary` - Get reports summary
- `GET /api/reports/detailed` - Get detailed analytics

#### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/settings` - Get user settings
- `PUT /api/user/settings` - Update user settings
- `PUT /api/user/api-key` - Update Gemini API key
- `GET /api/me` - Get current user info

#### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Interactive API Documentation
Swagger UI is available at:
```
http://localhost:4000/api/docs
```

## Assumptions and Limitations

### Assumptions

1. **Data Quality**
   - Applicant profiles are assumed to be accurate and up-to-date
   - Resume parsing accuracy depends on resume format and structure
   - Skills are assumed to be correctly categorized and tagged

2. **AI Model Behavior**
   - Gemini API provides consistent scoring across similar inputs
   - AI reasoning is based on provided job requirements only
   - Model performance may vary with different job types and industries

3. **User Behavior**
   - Recruiters will review AI recommendations before making final decisions
   - Users will configure their own API keys for better performance
   - Screening results will be used ethically and without bias

4. **System Load**
   - Screening requests will be batched appropriately (not thousands at once)
   - Rate limits on Gemini API will be respected
   - Database can handle expected query volumes

### Limitations

1. **AI Model Constraints**
   - Gemini API has rate limits that may affect high-volume usage
   - Model accuracy depends on quality of input data
   - Cannot evaluate soft skills or cultural fit effectively
   - May have biases present in training data

2. **Technical Limitations**
   - Resume parsing may fail on highly non-standard formats
   - PDF parsing requires additional processing time
   - Large file uploads may timeout on slow connections
   - Concurrent screenings may impact performance

3. **Feature Limitations**
   - No video interview analysis
   - No reference checking integration
   - No automated candidate outreach
   - No calendar integration for scheduling

4. **Data Limitations**
   - No historical hiring outcome data for model improvement
   - No industry-specific calibration out of the box
   - Limited to job requirements provided (no external data sources)
   - Cannot account for team dynamics or culture fit

5. **Security Considerations**
   - API keys stored in database should be encrypted (future enhancement)
   - No end-to-end encryption for sensitive data
   - Rate limiting is basic and may need refinement
   - No audit logging for compliance requirements

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

### Test Structure

```
tests/
├── unit/           # Unit tests for individual functions
├── integration/    # Integration tests for API endpoints
└── fixtures/       # Test data fixtures
```

## Project Structure

```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   │   ├── Applicants.controller.ts
│   │   ├── Dashboard.controller.ts
│   │   ├── Jobs.controller.ts
│   │   ├── Reports.controller.ts
│   │   ├── Screening.controller.ts
│   │   └── User.controller.ts
│   ├── models/          # Database schemas
│   │   └── index.ts
│   ├── services/        # Business logic
│   │   ├── Aiscreening.service.ts
│   │   └── Resumeparser.service.ts
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   ├── lib/             # Utility libraries
│   │   └── Logger.ts
│   ├── docs/            # OpenAPI specification
│   │   └── openapi.ts
│   ├── app.ts           # Express app configuration
│   ├── env.ts           # Environment configuration
│   └── index.ts         # Server entry point
├── tests/               # Test files
├── .env                 # Environment variables (not in git)
├── .gitignore
├── jest.config.cjs      # Jest configuration
├── package.json
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

## Contributing

This project was developed for the Umurava AI Hackathon. For contributions:

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation for API changes
4. Ensure all tests pass before submitting

## License

This project is part of the Umurava AI Hackathon submission.

## Support

For questions or issues, please refer to the hackathon documentation or contact the development team.

---

**Built for Umurava AI Hackathon 2026**
