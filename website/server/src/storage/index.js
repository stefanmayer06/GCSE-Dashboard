import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createJsonStorage } from './json.js';
import { createPostgresStorage } from './postgres.js';
import { createSupabaseStorage } from './supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = path.join(__dirname, '..', '..', 'data');

export { createJsonStorage, createPostgresStorage, createSupabaseStorage };

export function createStorage(options = {}) {
  const driver = String(options.driver ?? process.env.STORAGE_DRIVER ?? 'json').toLowerCase();
  if (process.env.VERCEL && !['postgres', 'supabase'].includes(driver)) {
    throw new Error(
      'Vercel requires durable PostgreSQL storage. Set STORAGE_DRIVER=postgres with DATABASE_URL or STORAGE_DRIVER=supabase with Supabase credentials.',
    );
  }
  if (driver === 'json') {
    return createJsonStorage({
      dataDir: options.dataDir ?? process.env.DATA_DIR ?? DEFAULT_DATA_DIR,
    });
  }
  if (driver === 'postgres') {
    return createPostgresStorage({
      connectionString: options.connectionString ?? process.env.DATABASE_URL,
    });
  }
  if (driver === 'supabase') {
    return createSupabaseStorage({
      url: options.supabaseUrl ?? process.env.SUPABASE_URL,
      secretKey: options.supabaseSecretKey
        ?? process.env.SUPABASE_SECRET_KEY
        ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
      publishableKey: options.supabasePublishableKey
        ?? process.env.SUPABASE_PUBLISHABLE_KEY
        ?? process.env.SUPABASE_ANON_KEY,
    });
  }
  throw new Error(`Unsupported storage driver "${driver}". Use "json", "postgres" or "supabase".`);
}

export const defaultStorage = createStorage();
export { defaultStorage as storage };
export default defaultStorage;
