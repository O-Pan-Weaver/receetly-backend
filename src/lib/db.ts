// src/lib/db.ts
import { neon } from '@neondatabase/serverless';

// Simple typed helper for running SQL queries against Neon
// Make sure DATABASE_URL is set in .env.local and in Vercel project settings
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export const sql = neon(process.env.DATABASE_URL);
