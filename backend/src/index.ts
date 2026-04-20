import './env';
import mongoose from 'mongoose';
import { logger } from './lib/Logger';
import app from './app';
const PORT = process.env.PORT || 3001;

// ------ MongoDB Connection + Server Start ------
async function start() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/talentiq';

  try {
    await mongoose.connect(mongoUri);
    logger.info(`✅ MongoDB connected: ${mongoUri}`);
  } catch (err) {
    logger.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    logger.info(`🚀 TalentIQ API running on http://localhost:${PORT}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    
  });
}

start();

export default app;