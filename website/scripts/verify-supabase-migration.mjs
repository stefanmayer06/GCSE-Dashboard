import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createPostgresStorage } from '../server/src/storage/index.js';
import postgres from 'postgres';

const subjects = ['maths', 'maths-higher', 'english'];

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function compactState(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    xp: Math.max(0, Math.trunc(Number(source.xp) || 0)),
    streak: Math.max(0, Math.trunc(Number(source.streak) || 0)),
    lastActiveDate: source.lastActiveDate ? String(source.lastActiveDate).slice(0, 10) : null,
    testsTaken: Math.max(0, Math.trunc(Number(source.testsTaken) || 0)),
    practiceAnswered: Math.max(0, Math.trunc(Number(source.practiceAnswered) || 0)),
    totalTestMarks: Math.max(0, Math.trunc(Number(source.totalTestMarks) || 0)),
    totalTestCorrect: Math.max(0, Math.trunc(Number(source.totalTestCorrect) || 0)),
    topicStats: source.topicStats && typeof source.topicStats === 'object' && !Array.isArray(source.topicStats)
      ? source.topicStats
      : {},
    completedLessons: Array.isArray(source.completedLessons)
      ? [...new Set(source.completedLessons.filter((id) => typeof id === 'string' && id.trim()))]
      : [],
  };
}

function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

const source = createPostgresStorage({ connectionString: requiredEnv('DATABASE_URL') });
const targetUrl = String(process.env.SUPABASE_DB_URL || '').trim();
const target = targetUrl
  ? postgres(targetUrl, {
      max: 1,
      ssl: process.env.SUPABASE_DB_SSL === 'disable' ? false : 'require',
    })
  : null;
const root = fileURLToPath(new URL('..', import.meta.url));

async function query(sql) {
  if (target) return target.unsafe(sql);
  const output = execFileSync('npx', [
    'supabase', 'db', 'query', '--linked', '--output-format', 'json', sql,
  ], { cwd: root, encoding: 'utf8' });
  return JSON.parse(output);
}

try {
  await source.init();
  const users = await source.listUsers();
  const legacyUsers = await query(`
    select legacy_user_id, username, email, role, oauth_provider, oauth_subject
    from migration_private.legacy_users
  `);
  const legacyProgress = await query(`
    select legacy_user_id, subject, xp, streak, last_active_date,
      tests_taken, practice_answered, total_test_marks, total_test_correct,
      topic_stats, completed_lessons, source_hash
    from migration_private.legacy_subject_progress
  `);
  const expectedUsers = new Map(users.map((user) => [
    String(user.id || Buffer.from(user.username, 'utf8').toString('base64url')),
    user,
  ]));
  const actualUsers = new Map(legacyUsers.map((user) => [String(user.legacy_user_id), user]));
  const mismatches = [];

  for (const [legacyUserId, user] of expectedUsers) {
    const actual = actualUsers.get(legacyUserId);
    if (!actual || actual.username !== user.username) {
      mismatches.push({ type: 'user', legacyUserId, reason: 'missing or username mismatch' });
    }
  }

  const expectedProgress = [];
  for (const [legacyUserId, user] of expectedUsers) {
    for (const subject of subjects) {
      const state = await source.getProgress(user.id, subject);
      if (state == null) continue;
      const compact = compactState(state);
      expectedProgress.push({ legacyUserId, subject, sourceHash: hash(compact) });
    }
  }
  const actualProgress = new Map(
    legacyProgress.map((row) => [`${row.legacy_user_id}:${row.subject}`, row]),
  );
  for (const expected of expectedProgress) {
    const actual = actualProgress.get(`${expected.legacyUserId}:${expected.subject}`);
    if (!actual || actual.source_hash !== expected.sourceHash) {
      mismatches.push({
        type: 'progress',
        legacyUserId: expected.legacyUserId,
        subject: expected.subject,
        reason: 'missing or source hash mismatch',
      });
    }
  }

  const [{ publicProfiles }] = await query(`
    select count(*)::integer as "publicProfiles" from public.profiles
  `);
  const [{ publicProgress }] = await query(`
    select count(*)::integer as "publicProgress" from public.subject_progress
  `);
  const [latestRun] = await query(`
    select id, status, users_seen, progress_seen, users_migrated, progress_migrated,
      mismatches, source_fingerprint, started_at, completed_at
    from migration_private.migration_runs
    order by started_at desc
    limit 1
  `);

  const result = {
    ok: mismatches.length === 0,
    usersExpected: expectedUsers.size,
    usersStaged: legacyUsers.length,
    progressExpected: expectedProgress.length,
    progressStaged: legacyProgress.length,
    publicProfiles,
    publicProgress,
    latestRun: latestRun || null,
    mismatches,
  };
  console.log(JSON.stringify(result));
  if (mismatches.length) process.exitCode = 1;
} finally {
  await source.close();
  if (target) await target.end({ timeout: 5 });
}
