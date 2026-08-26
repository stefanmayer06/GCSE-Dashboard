import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createJsonStorage, createPostgresStorage } from '../server/src/storage/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const dataDirArg = process.argv.find((value, index) => value === '--data-dir' && process.argv[index + 1]);
const dataDir = path.resolve(dataDirArg ? process.argv[process.argv.indexOf(dataDirArg) + 1] : (
  process.env.DATA_DIR || path.join(root, 'server', 'data')
));
const dryRun = process.argv.includes('--dry-run');

function userIdFor(username) {
  return Buffer.from(String(username), 'utf8').toString('base64url');
}

async function readObject(file) {
  try {
    const value = JSON.parse(await readFile(file, 'utf8'));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch (error) {
    if (error?.code === 'ENOENT') return {};
    throw error;
  }
}

function dateValue(value, fallback = Date.now()) {
  const date = new Date(value ?? fallback);
  if (!Number.isFinite(date.getTime())) return new Date(fallback).toISOString();
  return date.toISOString();
}

if (!process.env.DATABASE_URL && !dryRun) {
  throw new Error('DATABASE_URL is required. Use --dry-run to inspect JSON data without importing it.');
}

const source = createJsonStorage({ dataDir });
const target = dryRun ? null : createPostgresStorage({ connectionString: process.env.DATABASE_URL });
await source.init();
if (target) await target.init();

try {
  const users = await source.listUsers();
  const idMap = new Map();
  for (const user of users) {
    const migrated = target ? await target.upsertMigrationUser(user) : user;
    idMap.set(user.id || userIdFor(user.username), migrated.id);
  }

  let progressCount = 0;
  for (const user of users) {
    const userId = idMap.get(user.id || userIdFor(user.username));
    for (const subject of ['maths', 'maths-higher', 'english']) {
      const state = await source.getProgress(user.id, subject);
      if (state == null) continue;
      if (target) await target.importProgressIfAbsent(userId, subject, state);
      progressCount += 1;
    }
  }

  const sessions = await readObject(path.join(dataDir, 'sessions.json'));
  let sessionCount = 0;
  for (const [tokenHash, record] of Object.entries(sessions)) {
    const sourceUserId = record?.userId || (record?.username && userIdFor(record.username));
    const userId = sourceUserId && idMap.get(String(sourceUserId));
    if (!userId || !record) continue;
    const expiresAt = dateValue(record.expiresAt ?? record.exp);
    if (Date.parse(expiresAt) <= Date.now()) continue;
    if (target) {
      await target.putAuthSession({
        tokenHash,
        userId,
        createdAt: dateValue(record.createdAt),
        expiresAt,
      });
    }
    sessionCount += 1;
  }

  const oauthStates = await readObject(path.join(dataDir, 'oauth-states.json'));
  let oauthStateCount = 0;
  for (const [stateHash, record] of Object.entries(oauthStates)) {
    const expiresAt = dateValue(record?.expiresAt);
    if (!record || Date.parse(expiresAt) <= Date.now()) continue;
    if (target) {
      await target.putOAuthState({
        stateHash,
        payload: record.payload ?? null,
        createdAt: dateValue(record.createdAt),
        expiresAt,
      });
    }
    oauthStateCount += 1;
  }

  const studySessions = await readObject(path.join(dataDir, 'study-sessions.json'));
  let studySessionCount = 0;
  for (const record of Object.values(studySessions)) {
    const userId = record?.userId && idMap.get(String(record.userId));
    if (!userId || !record) continue;
    if (target) await target.restoreStudySession({ ...record, userId });
    studySessionCount += 1;
  }

  const mode = dryRun ? 'would migrate' : 'migrated';
  console.log(
    `[migration] ${mode} ${users.length} users, ${progressCount} progress records, `
      + `${sessionCount} auth sessions, ${oauthStateCount} OAuth states and `
      + `${studySessionCount} study sessions from ${dataDir}`,
  );
} finally {
  await source.close();
  if (target) await target.close();
}
