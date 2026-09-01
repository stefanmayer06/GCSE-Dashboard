import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createJsonStorage } from './json.js';
import { createSupabaseStorage } from './supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = path.join(__dirname, '..', '..', 'data');

export { createJsonStorage, createSupabaseStorage };

export function createStorage(options = {}) {
  const driver = String(options.driver ?? process.env.STORAGE_DRIVER ?? 'json').toLowerCase();
  if (process.env.VERCEL && driver !== 'supabase') {
    throw new Error(
      'Vercel requires Supabase storage. Set STORAGE_DRIVER=supabase with SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY.',
    );
  }
  if (driver === 'json') {
    return createJsonStorage({
      dataDir: options.dataDir ?? process.env.DATA_DIR ?? DEFAULT_DATA_DIR,
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
  throw new Error(`Unsupported storage driver "${driver}". Supabase is the application database; use "supabase" in production or "json" for local development.`);
}

export const defaultStorage = createStorage();
export { defaultStorage as storage };
export default defaultStorage;