import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createJsonStorage } from './json.js';
import { createPostgresStorage } from './postgres.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = path.join(__dirname, '..', '..', 'data');

export { createJsonStorage, createPostgresStorage };

export function createStorage(options = {}) {
  const driver = String(options.driver ?? process.env.STORAGE_DRIVER ?? 'json').toLowerCase();
  if (process.env.VERCEL && driver !== 'postgres') {
    throw new Error(
      'Vercel requires durable PostgreSQL storage. Set STORAGE_DRIVER=postgres and DATABASE_URL.',
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
  throw new Error(`Unsupported storage driver "${driver}". Use "json" or "postgres".`);
}

export const defaultStorage = createStorage();
export { defaultStorage as storage };
export default defaultStorage;
