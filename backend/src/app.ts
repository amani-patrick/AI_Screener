import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import mongoose from 'mongoose';
import { logger } from './lib/Logger';
import crypto from 'crypto';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from './docs/openapi';

import * as jobsCtrl from './controllers/Jobs.controller';
import * as screeningCtrl from './controllers/Screening.controller';
import * as applicantsCtrl from './controllers/Applicants.controller';

const app: express.Express = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const correlationId = String(req.headers['x-correlation-id'] || crypto.randomUUID());
  res.setHeader('x-correlation-id', correlationId);
  (req as express.Request & { correlationId?: string }).correlationId = correlationId;
  logger.info(`[HTTP] ${req.method} ${req.path} cid=${correlationId}`);
  next();
});
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Too many requests' },
});
app.use('/api', apiLimiter);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype) || file.originalname.endsWith('.csv'));
  },
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'TalentIQ API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/api/docs.json', (_req, res) => {
  res.json(openapiSpec);
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { explorer: true }));

const jobsRouter = express.Router();
jobsRouter.get('/', jobsCtrl.listJobs);
jobsRouter.post('/', jobsCtrl.createJob);
jobsRouter.get('/stats', jobsCtrl.getDashboardStats);
jobsRouter.get('/:id', jobsCtrl.getJob);
jobsRouter.put('/:id', jobsCtrl.updateJob);
jobsRouter.delete('/:id', jobsCtrl.deleteJob);
app.use('/api/jobs', jobsRouter);

const applicantsRouter = express.Router();
applicantsRouter.get('/', applicantsCtrl.listApplicants);
applicantsRouter.post('/', applicantsCtrl.createApplicant);
applicantsRouter.get('/:id', applicantsCtrl.getApplicant);
applicantsRouter.put('/:id', applicantsCtrl.updateApplicant);
applicantsRouter.delete('/:id', applicantsCtrl.deleteApplicant);
app.use('/api/applicants', applicantsRouter);

const screeningRouter = express.Router();
screeningRouter.post('/', screeningCtrl.createScreening);
screeningRouter.get('/', screeningCtrl.listScreenings);
screeningRouter.get('/metrics/evaluate', screeningCtrl.evaluateScreeningQuality);
screeningRouter.get('/:id', screeningCtrl.getScreeningResult);
screeningRouter.post('/upload/csv', upload.single('file'), screeningCtrl.uploadCSVApplicants);
app.use('/api/screenings', screeningRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error', message: 'ERR_INTERNAL' });
});

export default app;
