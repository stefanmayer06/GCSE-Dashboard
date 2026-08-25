import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import { rm, writeFile } from 'node:fs/promises';
import { createPostgresStorage } from '../server/src/storage/index.js';
import postgres from 'postgres';

const subjects = ['maths', 'maths-higher', 'english'];
const writeMode = process.argv.includes('--write');
const dryRun = !writeMode;

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function compactState(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const topicStats = source.topicStats && typeof source.topicStats === 'object' && !Array.isArray(source.topicStats)
    ? source.topicStats
    : {};
  const completedLessons = Array.isArray(source.completedLessons)
    ? [...new Set(source.completedLessons.filter((id) => typeof id === 'string' && id.trim()))]
    : [];
  return {
    xp: Math.max(0, Math.trunc(Number(source.xp) || 0)),
    streak: Math.max(0, Math.trunc(Number(source.streak) || 0)),
    lastActiveDate: source.lastActiveDate ? String(source.lastActiveDate).slice(0, 10) : null,
    testsTaken: Math.max(0, Math.trunc(Number(source.testsTaken) || 0)),
    practiceAnswered: Math.max(0, Math.trunc(Number(source.practiceAnswered) || 0)),
    totalTestMarks: Math.max(0, Math.trunc(Number(source.totalTestMarks) || 0)),
    totalTestCorrect: Math.max(0, Math.trunc(Number(source.totalTestCorrect) || 0)),
    topicStats,
    completedLessons,
  };
}

function userMetadata(user) {
  const identity = user.oauthIdentity || null;
  return {
    username: user.username,
    oauth: Boolean(user.oauth),
    provider: identity?.provider || user.oauthProvider || null,
    hasOAuthSubject: Boolean(identity?.subject || user.oauthSubject),
    createdAt: user.createdAt || null,
  };
}

function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return 'NULL';
  if (value && typeof value === 'object' && value.__gcseJson !== undefined) {
    return `${sqlString(JSON.stringify(value.__gcseJson))}::jsonb`;
  }
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return sqlString(value);
}

function createCliTarget() {
  const statements = ['begin'];
  const target = (strings, ...values) => {
    let statement = strings[0];
    for (let index = 0; index < values.length; index += 1) {
      statement += sqlLiteral(values[index]);
      statement += strings[index + 1];
    }
    statements.push(statement.trim());
    return Promise.resolve([]);
  };
  target.json = (value) => ({ __gcseJson: value });
  target.flush = async () => {
    statements.push('commit');
    const tempFile = path.join(os.tmpdir(), `gcse-supabase-migration-${crypto.randomUUID()}.sql`);
    try {
      await writeFile(tempFile, `${statements.join(';\n')};\n`, { mode: 0o600 });
      execFileSync('npx', [
        'supabase', 'db', 'query', '--linked', '--file', tempFile,
      ], { cwd: fileURLToPath(new URL('..', import.meta.url)), stdio: 'inherit' });
    } finally {
      await rm(tempFile, { force: true });
    }
  };
  target.end = async () => {};
  return target;
}

const source = createPostgresStorage({ connectionString: requiredEnv('DATABASE_URL') });
const targetUrl = writeMode ? String(process.env.SUPABASE_DB_URL || '').trim() : null;
if (writeMode && process.env.SUPABASE_MIGRATION_CONFIRM !== 'YES') {
  throw new Error('Set SUPABASE_MIGRATION_CONFIRM=YES when using --write.');
}

const target = targetUrl
  ? postgres(targetUrl, {
      max: 1,
      ssl: process.env.SUPABASE_DB_SSL === 'disable' ? false : 'require',
    })
  : writeMode ? createCliTarget() : null;
const targetKind = targetUrl ? 'postgres' : 'cli';
let runId = null;

try {
  await source.init();
  const users = await source.listUsers();
  const staged = [];
  let progressCount = 0;

  for (const user of users) {
    const legacyUserId = String(user.id || Buffer.from(user.username, 'utf8').toString('base64url'));
    const identity = user.oauthIdentity || {};
    const email = user.email || user.data?.email || null;
    staged.push({
      legacyUserId,
      username: user.username,
      email,
      passwordHash: user.passwordHash || user.password || null,
      role: user.data?.role === 'admin' || user.username === 'admin' ? 'admin' : 'student',
      oauthProvider: identity.provider || user.oauthProvider || null,
      oauthSubject: identity.subject || user.oauthSubject || null,
      rawRecord: userMetadata(user),
    });

    for (const subject of subjects) {
      const state = await source.getProgress(user.id, subject);
      if (state == null) continue;
      const compact = compactState(state);
      staged.push({
        legacyUserId,
        subject,
        state: compact,
        sourceHash: hash(compact),
      });
      progressCount += 1;
    }
  }

  const usersStaged = staged.filter((entry) => entry.username).length;
  const progressStaged = staged.filter((entry) => entry.subject).length;
  const sourceFingerprint = hash({
    users: staged.filter((entry) => entry.username).map((entry) => ({
      id: entry.legacyUserId,
      username: entry.username,
      email: entry.email,
      role: entry.role,
      oauthProvider: entry.oauthProvider,
      oauthSubject: entry.oauthSubject,
    })),
    progress: staged.filter((entry) => entry.subject).map((entry) => ({
      id: entry.legacyUserId,
      subject: entry.subject,
      sourceHash: entry.sourceHash,
    })),
  });

  if (target) {
    if (targetKind === 'postgres') {
      const [run] = await target`
        insert into migration_private.migration_runs
          (source, source_fingerprint, status, users_seen, progress_seen)
        values
          ('neon', ${sourceFingerprint}, 'started', ${usersStaged}, ${progressStaged})
        returning id
      `;
      runId = run.id;
    } else {
      runId = crypto.randomUUID();
      await target`
        insert into migration_private.migration_runs
          (id, source, source_fingerprint, status, users_seen, progress_seen)
        values
          (${runId}, 'neon', ${sourceFingerprint}, 'started', ${usersStaged}, ${progressStaged})
      `;
    }

    for (const entry of staged.filter((value) => value.username)) {
      await target`
        insert into migration_private.legacy_users
          (legacy_user_id, username, email, password_hash, role,
           oauth_provider, oauth_subject, raw_record)
        values
          (${entry.legacyUserId}, ${entry.username}, ${entry.email}, ${entry.passwordHash}, ${entry.role},
           ${entry.oauthProvider}, ${entry.oauthSubject}, ${target.json(entry.rawRecord)})
        on conflict (legacy_user_id) do update set
          username = excluded.username,
          email = excluded.email,
          password_hash = excluded.password_hash,
          role = excluded.role,
          oauth_provider = excluded.oauth_provider,
          oauth_subject = excluded.oauth_subject,
          raw_record = excluded.raw_record,
          imported_at = timezone('utc', now())
      `;
    }

    for (const entry of staged.filter((value) => value.subject)) {
      await target`
        insert into migration_private.legacy_subject_progress
          (legacy_user_id, subject, xp, streak, last_active_date,
           tests_taken, practice_answered, total_test_marks, total_test_correct,
           topic_stats, completed_lessons, source_hash)
        values
          (${entry.legacyUserId}, ${entry.subject}, ${entry.state.xp}, ${entry.state.streak},
           ${entry.state.lastActiveDate}, ${entry.state.testsTaken}, ${entry.state.practiceAnswered},
           ${entry.state.totalTestMarks}, ${entry.state.totalTestCorrect}, ${target.json(entry.state.topicStats)},
           ${target.json(entry.state.completedLessons)}, ${entry.sourceHash})
        on conflict (legacy_user_id, subject) do update set
          xp = excluded.xp,
          streak = excluded.streak,
          last_active_date = excluded.last_active_date,
          tests_taken = excluded.tests_taken,
          practice_answered = excluded.practice_answered,
          total_test_marks = excluded.total_test_marks,
          total_test_correct = excluded.total_test_correct,
          topic_stats = excluded.topic_stats,
          completed_lessons = excluded.completed_lessons,
          source_hash = excluded.source_hash,
          imported_at = timezone('utc', now())
      `;
    }

    await target`
      update migration_private.migration_runs
      set status = 'completed', users_migrated = ${usersStaged},
          progress_migrated = ${progressStaged}, completed_at = timezone('utc', now())
      where id = ${runId}
    `;
    if (targetKind === 'cli') await target.flush();
  }

  console.log(JSON.stringify({
    mode: dryRun ? 'dry-run' : 'write',
    source: 'neon',
    users: usersStaged,
    progress: progressCount,
    activeSessions: 'not imported by design; use maintenance mode during cutover',
    sourceFingerprint,
    ...(runId ? { runId } : {}),
  }));
} catch (error) {
  if (target && runId) {
    if (targetKind === 'postgres') {
      await target`
        update migration_private.migration_runs
        set status = 'failed', details = ${target.json({ message: error.message })},
            completed_at = timezone('utc', now())
        where id = ${runId}
      `.catch(() => {});
    }
  }
  throw error;
} finally {
  await source.close();
  if (target) await target.end({ timeout: 5 });
}
