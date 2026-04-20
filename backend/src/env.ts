import path from 'path';
import dotenv from 'dotenv';

// 1. Try to load from the file (local development)
// Use silent: true so it doesn't crash if the file is missing (like on Render)
dotenv.config({ 
  path: path.resolve(__dirname, '..', '.env') 
});

// 2. Export the variables
// This will take the value from the .env file OR from Render's Environment tab
export const MONGODB_URI = process.env.MONGODB_URI;
export const PORT = process.env.PORT || 3001;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
