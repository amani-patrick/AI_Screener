import path from 'path';
import dotenv from 'dotenv';

// Resolve `.env` next to the package root so startup works even if cwd is not `backend/`.
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
