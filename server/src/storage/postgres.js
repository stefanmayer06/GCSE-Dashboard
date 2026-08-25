import { readFile } from 'node:fs/promises';

const SCHEMA_VERSION = 1;
const DEFAULT_STUDY_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LEASE_MS = 30 * 1000;
const STUDY_COLUMNS = `
  id, user_id, subject, kind, status, payload, result,
  created_at, updated_at, expires_at, lease_until
`;

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function storageError(code, message, details = {}) {
  const error = new Error(message);
  error.name = 'StorageError';
  error.code = code;
  Object.assign(error, details);
  return error;
}

function requiredString(value, name) {
  if (typeof value !== 'string' || !value) {
    throw storageError('STORAGE_INVALID_ARGUMENT', `${name} must be a non-empty string`);
  }
  return value;
}

function requiredIdentifier(value, name) {
  if (value == null) return requiredString(value, name);
  return requiredString(String(value), name);
}

function cloneJson(value, name = 'value') {
  let encoded;
  try {
    encoded = JSON.stringify(value);
  } catch (cause) {
    throw storageError('STORAGE_INVALID_JSON', `${name} must be JSON-serializable`, { cause });
  }
  if (encoded === undefined) {
    throw storageError('STORAGE_INVALID_JSON', `${name} must be JSON-serializable`);
  }
  return JSON.parse(encoded);
}

function parsedJson(value, name) {
  if (typeof value !== 'string') return cloneJson(value, name);
  try {
    return JSON.parse(value);
  } catch (cause) {
    throw storageError('STORAGE_CORRUPT_DATA', `Invalid ${name} returned by PostgreSQL`, { cause });
  }
}

function isoDate(value, name, fallback) {
  const candidate = value ?? fallback;
  const date = candidate instanceof Date ? candidate : new Date(candidate);
  if (!Number.isFinite(date.getTime())) {
    throw storageError('STORAGE_INVALID_ARGUMENT', `${name} must be a valid date`);
  }
  return date.toISOString();
}

function nullableIsoDate(value) {
  return value == null ? null : isoDate(value, 'stored date');
}

function userIdFor(username) {
  return Buffer.from(String(username), 'utf8').toString('base64url');
}

function oauthIdentity(user) {
  const provider = user.oauthIdentity?.provider ?? user.oauthProvider ?? null;
  const subject = user.oauthIdentity?.subject ?? user.oauthSubject ?? null;
  if ((provider == null) !== (subject == null)) {
    throw storageError(
      'STORAGE_INVALID_ARGUMENT',
      'OAuth identity requires both provider and subject',
    );
  }
  return provider == null
    ? null
    : {
        provider: requiredString(String(provider), 'oauth provider'),
        subject: requiredString(String(subject), 'oauth subject'),
      };
}

function normalizedUser(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw storageError('STORAGE_INVALID_ARGUMENT', 'user must be an object');
  }
  const username = requiredString(input.username, 'username');
  const data = cloneJson(input, 'user');
  const identity = oauthIdentity(data);
  return {
    id: input.id == null ? userIdFor(username) : requiredIdentifier(input.id, 'id'),
    username,
    passwordHash: data.password ?? data.passwordHash ?? null,
    oauth: Boolean(data.oauth),
    oauthProvider: identity?.provider ?? null,
    oauthSubject: identity?.subject ?? null,
    data,
    createdAt: isoDate(data.createdAt, 'createdAt', Date.now()),
  };
}

function rowToUser(row) {
  const data = parsedJson(row.data ?? {}, 'user data');
  const user = {
    ...data,
    id: row.id,
    username: row.username,
    oauth: Boolean(row.oauth),
    createdAt: isoDate(row.created_at, 'createdAt'),
  };
  if (row.password_hash != null) {
    if (hasOwn(data, 'passwordHash') && !hasOwn(data, 'password')) user.passwordHash = row.password_hash;
    else user.password = row.password_hash;
  }
  return user;
}

function rowToAuthSession(row) {
  return {
    tokenHash: row.token_hash,
    userId: row.user_id,
    ...(row.username ? { username: row.username } : {}),
    createdAt: isoDate(row.created_at, 'createdAt'),
    expiresAt: isoDate(row.expires_at, 'expiresAt'),
  };
}

function rowToOAuthState(row) {
  return {
    stateHash: row.state_hash,
    payload: parsedJson(row.payload, 'OAuth state payload'),
    createdAt: isoDate(row.created_at, 'createdAt'),
    expiresAt: isoDate(row.expires_at, 'expiresAt'),
  };
}

function rowToStudySession(row) {
  return {
    id: row.id,
    userId: row.user_id,
    subject: row.subject,
    kind: row.kind,
    status: row.status,
    payload: parsedJson(row.payload, 'study session payload'),
    result: row.result == null ? null : parsedJson(row.result, 'study session result'),
    createdAt: isoDate(row.created_at, 'createdAt'),
    updatedAt: isoDate(row.updated_at, 'updatedAt'),
    expiresAt: isoDate(row.expires_at, 'expiresAt'),
    leaseUntil: nullableIsoDate(row.lease_until),
  };
}

function sessionCriteria(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw storageError('STORAGE_INVALID_ARGUMENT', 'study session criteria must be an object');
  }
  return {
    id: requiredString(input.id, 'id'),
    userId: requiredIdentifier(input.userId, 'userId'),
    subject: requiredString(input.subject, 'subject'),
    kind: requiredString(input.kind, 'kind'),
  };
}

function sessionMismatch(session, criteria) {
  if (!session) return { status: 'not_found' };
  if (session.userId !== criteria.userId) return { status: 'forbidden' };
  if (session.subject !== criteria.subject || session.kind !== criteria.kind) {
    return { status: 'mismatch' };
  }
  return null;
}

function completedOutcome(session, replayed = true) {
  return {
    status: 'completed',
    result: cloneJson(session.result, 'study session result'),
    replayed,
    session: cloneJson(session, 'study session'),
  };
}

function lifecycleOutcome(session, criteria, now = Date.now()) {
  const mismatch = sessionMismatch(session, criteria);
  if (mismatch) return mismatch;
  if (session.status === 'completed') return completedOutcome(session);
  if (Date.parse(session.expiresAt) <= now) {
    return { status: 'expired', session: cloneJson(session, 'study session') };
  }
  return null;
}

function normalizeStudySession(input, preserveStatus = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw storageError('STORAGE_INVALID_ARGUMENT', 'study session must be an object');
  }
  const now = Date.now();
  const createdAt = isoDate(input.createdAt, 'createdAt', now);
  const status = preserveStatus && ['active', 'claimed', 'completed'].includes(input.status)
    ? input.status
    : 'active';
  return {
    id: requiredString(input.id, 'id'),
    userId: requiredIdentifier(input.userId, 'userId'),
    subject: requiredString(input.subject, 'subject'),
    kind: requiredString(input.kind, 'kind'),
    status,
    payload: cloneJson(input.payload ?? {}, 'study session payload'),
    result: preserveStatus && input.result != null
      ? cloneJson(input.result, 'study session result')
      : null,
    createdAt,
    updatedAt: isoDate(input.updatedAt, 'updatedAt', createdAt),
    expiresAt: isoDate(input.expiresAt, 'expiresAt', now + DEFAULT_STUDY_SESSION_TTL_MS),
    leaseUntil: status === 'claimed'
      ? isoDate(input.leaseUntil, 'leaseUntil', Date.now() + DEFAULT_LEASE_MS)
      : null,
  };
}

function conflictError(error) {
  if (error?.code !== '23505') return error;
  const constraint = String(error.constraint || '');
  let field = 'unknown';
  if (constraint.includes('username')) field = 'username';
  else if (constraint.includes('oauth_identity')) field = 'oauthIdentity';
  else if (constraint.includes('pkey')) field = 'id';
  return storageError('STORAGE_CONFLICT', `${field} is already in use`, { field, cause: error });
}

export function createPostgresStorage({ connectionString } = {}) {
  let poolPromise = null;
  let initPromise = null;

  async function getPool() {
    if (!poolPromise) {
      poolPromise = (async () => {
        const configured = requiredString(connectionString, 'connectionString');
        let neon;
        try {
          neon = await import('@neondatabase/serverless');
        } catch (cause) {
          throw storageError(
            'STORAGE_DRIVER_UNAVAILABLE',
            'PostgreSQL storage requires @neondatabase/serverless',
            { cause },
          );
        }
        return new neon.Pool({ connectionString: configured });
      })();
    }
    return poolPromise;
  }

  async function applySchema() {
    const pool = await getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT pg_advisory_xact_lock(hashtext('gcse-dashboard-storage-schema'))");
      const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
      await client.query(schema);
      const version = await client.query(
        'SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations',
      );
      if (Number(version.rows[0].version) > SCHEMA_VERSION) {
        throw storageError(
          'STORAGE_SCHEMA_TOO_NEW',
          `PostgreSQL storage schema ${version.rows[0].version} is newer than supported schema ${SCHEMA_VERSION}`,
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async function ensureSchema() {
    if (!initPromise) {
      initPromise = applySchema().catch((error) => {
        initPromise = null;
        throw error;
      });
    }
    return initPromise;
  }

  const init = ensureSchema;

  async function close() {
    const pendingPool = poolPromise;
    if (!pendingPool) return;
    const pool = await pendingPool;
    poolPromise = null;
    initPromise = null;
    await pool.end();
  }

  async function query(text, values = []) {
    await init();
    const pool = await getPool();
    return pool.query(text, values);
  }

  async function transaction(callback) {
    await init();
    const pool = await getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const value = await callback(client);
      await client.query('COMMIT');
      return value;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async function listUsers() {
    const result = await query(`
      SELECT id, username, password_hash, oauth, data, created_at
      FROM users
      ORDER BY username
    `);
    return result.rows.map(rowToUser);
  }

  async function getUserById(userId) {
    const result = await query(`
      SELECT id, username, password_hash, oauth, data, created_at
      FROM users
      WHERE id = $1
    `, [requiredIdentifier(userId, 'userId')]);
    return result.rows[0] ? rowToUser(result.rows[0]) : null;
  }

  async function getUserByUsername(username) {
    const result = await query(`
      SELECT id, username, password_hash, oauth, data, created_at
      FROM users
      WHERE username = $1
    `, [requiredString(username, 'username')]);
    return result.rows[0] ? rowToUser(result.rows[0]) : null;
  }

  async function getUserByOAuthIdentity(provider, subject) {
    const result = await query(`
      SELECT id, username, password_hash, oauth, data, created_at
      FROM users
      WHERE oauth_provider = $1 AND oauth_subject = $2
    `, [requiredString(provider, 'provider'), requiredString(subject, 'subject')]);
    return result.rows[0] ? rowToUser(result.rows[0]) : null;
  }

  async function createUser(input) {
    const user = normalizedUser(input);
    try {
      const result = await query(`
        INSERT INTO users (
          id, username, password_hash, oauth, oauth_provider, oauth_subject, data, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
        RETURNING id, username, password_hash, oauth, data, created_at
      `, [
        user.id,
        user.username,
        user.passwordHash,
        user.oauth,
        user.oauthProvider,
        user.oauthSubject,
        JSON.stringify(user.data),
        user.createdAt,
      ]);
      return rowToUser(result.rows[0]);
    } catch (error) {
      throw conflictError(error);
    }
  }

  async function upsertMigrationUser(input) {
    const user = normalizedUser(input);
    try {
      const result = await query(`
        INSERT INTO users (
          id, username, password_hash, oauth, oauth_provider, oauth_subject, data, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
        ON CONFLICT (username) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          oauth = EXCLUDED.oauth,
          oauth_provider = EXCLUDED.oauth_provider,
          oauth_subject = EXCLUDED.oauth_subject,
          data = users.data || EXCLUDED.data,
          created_at = LEAST(users.created_at, EXCLUDED.created_at),
          updated_at = now()
        RETURNING id, username, password_hash, oauth, data, created_at
      `, [
        user.id,
        user.username,
        user.passwordHash,
        user.oauth,
        user.oauthProvider,
        user.oauthSubject,
        JSON.stringify(user.data),
        user.createdAt,
      ]);
      return rowToUser(result.rows[0]);
    } catch (error) {
      throw conflictError(error);
    }
  }

  async function putAuthSession(input) {
    if (!input || typeof input !== 'object') {
      throw storageError('STORAGE_INVALID_ARGUMENT', 'auth session must be an object');
    }
    const tokenHash = requiredString(input.tokenHash, 'tokenHash');
    const userId = requiredIdentifier(input.userId, 'userId');
    const createdAt = isoDate(input.createdAt, 'createdAt', Date.now());
    const expiresAt = isoDate(input.expiresAt, 'expiresAt');
    const result = await query(`
      WITH saved AS (
        INSERT INTO auth_sessions (token_hash, user_id, created_at, expires_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (token_hash) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          created_at = EXCLUDED.created_at,
          expires_at = EXCLUDED.expires_at
        RETURNING token_hash, user_id, created_at, expires_at
      )
      SELECT saved.*, users.username
      FROM saved
      JOIN users ON users.id = saved.user_id
    `, [tokenHash, userId, createdAt, expiresAt]);
    return rowToAuthSession(result.rows[0]);
  }

  async function getAuthSession(tokenHash) {
    const result = await query(`
      SELECT auth_sessions.token_hash, auth_sessions.user_id,
        auth_sessions.created_at, auth_sessions.expires_at, users.username
      FROM auth_sessions
      JOIN users ON users.id = auth_sessions.user_id
      WHERE auth_sessions.token_hash = $1 AND auth_sessions.expires_at > now()
    `, [requiredString(tokenHash, 'tokenHash')]);
    return result.rows[0] ? rowToAuthSession(result.rows[0]) : null;
  }

  async function deleteAuthSession(tokenHash) {
    const result = await query(
      'DELETE FROM auth_sessions WHERE token_hash = $1',
      [requiredString(tokenHash, 'tokenHash')],
    );
    return result.rowCount > 0;
  }

  async function putOAuthState(input) {
    if (!input || typeof input !== 'object') {
      throw storageError('STORAGE_INVALID_ARGUMENT', 'OAuth state must be an object');
    }
    const stateHash = requiredString(input.stateHash, 'stateHash');
    const payload = cloneJson(input.payload ?? null, 'OAuth state payload');
    const createdAt = isoDate(input.createdAt, 'createdAt', Date.now());
    const expiresAt = isoDate(input.expiresAt, 'expiresAt');
    const result = await query(`
      INSERT INTO oauth_states (state_hash, payload, created_at, expires_at)
      VALUES ($1, $2::jsonb, $3, $4)
      ON CONFLICT (state_hash) DO UPDATE SET
        payload = EXCLUDED.payload,
        created_at = EXCLUDED.created_at,
        expires_at = EXCLUDED.expires_at
      RETURNING state_hash, payload, created_at, expires_at
    `, [stateHash, JSON.stringify(payload), createdAt, expiresAt]);
    return rowToOAuthState(result.rows[0]);
  }

  async function consumeOAuthState(stateHash) {
    const result = await query(`
      DELETE FROM oauth_states
      WHERE state_hash = $1
      RETURNING state_hash, payload, created_at, expires_at
    `, [requiredString(stateHash, 'stateHash')]);
    if (!result.rows[0] || new Date(result.rows[0].expires_at).getTime() <= Date.now()) return null;
    return rowToOAuthState(result.rows[0]);
  }

  async function getProgress(userId, subject) {
    const result = await query(`
      SELECT state
      FROM subject_progress
      WHERE user_id = $1 AND subject = $2
    `, [requiredIdentifier(userId, 'userId'), requiredString(subject, 'subject')]);
    return result.rows[0] ? parsedJson(result.rows[0].state, 'progress state') : null;
  }

  async function mutateProgress(userId, subject, callback) {
    const id = requiredIdentifier(userId, 'userId');
    const subjectName = requiredString(subject, 'subject');
    if (typeof callback !== 'function') {
      throw storageError('STORAGE_INVALID_ARGUMENT', 'mutateProgress callback is required');
    }
    return transaction(async (client) => {
      await client.query(`
        INSERT INTO subject_progress (user_id, subject, state)
        VALUES ($1, $2, 'null'::jsonb)
        ON CONFLICT (user_id, subject) DO NOTHING
      `, [id, subjectName]);
      const stored = await client.query(`
        SELECT state
        FROM subject_progress
        WHERE user_id = $1 AND subject = $2
        FOR UPDATE
      `, [id, subjectName]);
      const existing = parsedJson(stored.rows[0].state, 'progress state');
      const result = await callback(existing);
      if (!result || typeof result !== 'object' || !hasOwn(result, 'state') || !hasOwn(result, 'value')) {
        throw storageError(
          'STORAGE_INVALID_MUTATION',
          'mutateProgress callback must return { state, value }',
        );
      }
      const state = cloneJson(result.state, 'progress state');
      await client.query(`
        UPDATE subject_progress
        SET state = $3::jsonb, updated_at = now()
        WHERE user_id = $1 AND subject = $2
      `, [id, subjectName, JSON.stringify(state)]);
      return result.value;
    });
  }

  async function importProgressIfAbsent(userId, subject, state) {
    const imported = cloneJson(state, 'progress state');
    const result = await query(`
      INSERT INTO subject_progress (user_id, subject, state)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (user_id, subject) DO NOTHING
    `, [
      requiredIdentifier(userId, 'userId'),
      requiredString(subject, 'subject'),
      JSON.stringify(imported),
    ]);
    return result.rowCount > 0;
  }

  async function lockedStudySession(client, id) {
    const result = await client.query(`
      SELECT ${STUDY_COLUMNS}
      FROM study_sessions
      WHERE id = $1
      FOR UPDATE
    `, [id]);
    return result.rows[0] ? rowToStudySession(result.rows[0]) : null;
  }

  async function createStudySession(input) {
    const session = normalizeStudySession(input);
    const result = await query(`
      INSERT INTO study_sessions (
        id, user_id, subject, kind, status, payload, result,
        created_at, updated_at, expires_at, lease_until
      )
      VALUES ($1, $2, $3, $4, 'active', $5::jsonb, NULL, $6, $7, $8, NULL)
      ON CONFLICT (id) DO NOTHING
      RETURNING ${STUDY_COLUMNS}
    `, [
      session.id,
      session.userId,
      session.subject,
      session.kind,
      JSON.stringify(session.payload),
      session.createdAt,
      session.updatedAt,
      session.expiresAt,
    ]);
    if (!result.rows[0]) return { status: 'conflict' };
    return { status: 'created', session: rowToStudySession(result.rows[0]) };
  }

  async function restoreStudySession(input) {
    const session = normalizeStudySession(input, true);
    const result = await query(`
      INSERT INTO study_sessions (
        id, user_id, subject, kind, status, payload, result,
        created_at, updated_at, expires_at, lease_until
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10, $11)
      ON CONFLICT (id) DO NOTHING
      RETURNING ${STUDY_COLUMNS}
    `, [
      session.id,
      session.userId,
      session.subject,
      session.kind,
      session.status,
      JSON.stringify(session.payload),
      session.result == null ? null : JSON.stringify(session.result),
      session.createdAt,
      session.updatedAt,
      session.expiresAt,
      session.leaseUntil,
    ]);
    if (!result.rows[0]) return { status: 'conflict' };
    return { status: 'created', session: rowToStudySession(result.rows[0]) };
  }

  async function getStudySession(input) {
    const criteria = sessionCriteria(input);
    const result = await query(`
      SELECT ${STUDY_COLUMNS}
      FROM study_sessions
      WHERE id = $1
    `, [criteria.id]);
    const session = result.rows[0] ? rowToStudySession(result.rows[0]) : null;
    const outcome = lifecycleOutcome(session, criteria);
    if (outcome) return outcome;
    return { status: 'ok', session };
  }

  async function updateStudySession(input, callback) {
    const criteria = sessionCriteria(input);
    if (typeof callback !== 'function') {
      throw storageError('STORAGE_INVALID_ARGUMENT', 'updateStudySession callback is required');
    }
    return transaction(async (client) => {
      const session = await lockedStudySession(client, criteria.id);
      const outcome = lifecycleOutcome(session, criteria);
      if (outcome) return outcome;
      if (session.status === 'claimed') {
        return { status: 'busy', leaseUntil: session.leaseUntil };
      }
      const update = await callback(cloneJson(session, 'study session'));
      if (!update || typeof update !== 'object') {
        throw storageError(
          'STORAGE_INVALID_MUTATION',
          'updateStudySession callback must return an update object',
        );
      }
      const payload = hasOwn(update, 'payload')
        ? cloneJson(update.payload, 'study session payload')
        : session.payload;
      const expiresAt = hasOwn(update, 'expiresAt')
        ? isoDate(update.expiresAt, 'expiresAt')
        : session.expiresAt;
      const saved = await client.query(`
        UPDATE study_sessions
        SET payload = $2::jsonb, expires_at = $3, updated_at = now()
        WHERE id = $1
        RETURNING ${STUDY_COLUMNS}
      `, [session.id, JSON.stringify(payload), expiresAt]);
      return {
        status: 'updated',
        session: rowToStudySession(saved.rows[0]),
        ...(hasOwn(update, 'value') ? { value: update.value } : {}),
      };
    });
  }

  async function claimStudySession(input) {
    const criteria = sessionCriteria(input);
    const requestedLeaseUntil = input.leaseUntil == null
      ? null
      : isoDate(input.leaseUntil, 'leaseUntil');
    return transaction(async (client) => {
      const session = await lockedStudySession(client, criteria.id);
      const now = Date.now();
      const leaseUntil = requestedLeaseUntil
        ?? new Date(now + DEFAULT_LEASE_MS).toISOString();
      if (Date.parse(leaseUntil) <= now) {
        throw storageError('STORAGE_INVALID_ARGUMENT', 'leaseUntil must be in the future');
      }
      const outcome = lifecycleOutcome(session, criteria, now);
      if (outcome) return outcome;
      if (session.status === 'claimed' && Date.parse(session.leaseUntil) > now) {
        return { status: 'busy', leaseUntil: session.leaseUntil };
      }
      const saved = await client.query(`
        UPDATE study_sessions
        SET status = 'claimed', lease_until = $2, updated_at = now()
        WHERE id = $1
        RETURNING ${STUDY_COLUMNS}
      `, [session.id, leaseUntil]);
      return { status: 'claimed', session: rowToStudySession(saved.rows[0]) };
    });
  }

  async function releaseStudySession(input) {
    const criteria = sessionCriteria(input);
    return transaction(async (client) => {
      const session = await lockedStudySession(client, criteria.id);
      const outcome = lifecycleOutcome(session, criteria);
      if (outcome) return outcome;
      if (session.status === 'active') return { status: 'active', session };
      const saved = await client.query(`
        UPDATE study_sessions
        SET status = 'active', lease_until = NULL, updated_at = now()
        WHERE id = $1
        RETURNING ${STUDY_COLUMNS}
      `, [session.id]);
      return { status: 'released', session: rowToStudySession(saved.rows[0]) };
    });
  }

  async function discardStudySession(input) {
    const criteria = sessionCriteria(input);
    return transaction(async (client) => {
      const session = await lockedStudySession(client, criteria.id);
      const mismatch = sessionMismatch(session, criteria);
      if (mismatch) return mismatch;
      if (session.status === 'completed') return completedOutcome(session);
      await client.query('DELETE FROM study_sessions WHERE id = $1', [session.id]);
      return { status: 'discarded' };
    });
  }

  async function finalizeStudySession(input, callback) {
    const criteria = sessionCriteria(input);
    if (typeof callback !== 'function') {
      throw storageError('STORAGE_INVALID_ARGUMENT', 'finalizeStudySession callback is required');
    }
    return transaction(async (client) => {
      const session = await lockedStudySession(client, criteria.id);
      const outcome = lifecycleOutcome(session, criteria);
      if (outcome) return outcome;
      await client.query(`
        INSERT INTO subject_progress (user_id, subject, state)
        VALUES ($1, $2, 'null'::jsonb)
        ON CONFLICT (user_id, subject) DO NOTHING
      `, [criteria.userId, criteria.subject]);
      const progress = await client.query(`
        SELECT state
        FROM subject_progress
        WHERE user_id = $1 AND subject = $2
        FOR UPDATE
      `, [criteria.userId, criteria.subject]);
      const finalized = await callback(
        cloneJson(session, 'study session'),
        parsedJson(progress.rows[0].state, 'progress state'),
      );
      if (
        !finalized
        || typeof finalized !== 'object'
        || !hasOwn(finalized, 'state')
        || !hasOwn(finalized, 'response')
      ) {
        throw storageError(
          'STORAGE_INVALID_MUTATION',
          'finalizeStudySession callback must return { state, response }',
        );
      }
      const state = cloneJson(finalized.state, 'progress state');
      const response = cloneJson(finalized.response, 'study session response');
      await client.query(`
        UPDATE subject_progress
        SET state = $3::jsonb, updated_at = now()
        WHERE user_id = $1 AND subject = $2
      `, [criteria.userId, criteria.subject, JSON.stringify(state)]);
      const saved = await client.query(`
        UPDATE study_sessions
        SET status = 'completed', result = $2::jsonb,
          lease_until = NULL, updated_at = now()
        WHERE id = $1
        RETURNING ${STUDY_COLUMNS}
      `, [session.id, JSON.stringify(response)]);
      return completedOutcome(rowToStudySession(saved.rows[0]), false);
    });
  }

  return {
    driver: 'postgres',
    schemaVersion: SCHEMA_VERSION,
    init,
    close,
    ensureSchema,
    listUsers,
    getUserById,
    getUserByUsername,
    getUserByOAuthIdentity,
    createUser,
    upsertMigrationUser,
    putAuthSession,
    getAuthSession,
    deleteAuthSession,
    putOAuthState,
    consumeOAuthState,
    getProgress,
    mutateProgress,
    importProgressIfAbsent,
    createStudySession,
    restoreStudySession,
    getStudySession,
    updateStudySession,
    claimStudySession,
    releaseStudySession,
    discardStudySession,
    finalizeStudySession,
  };
}
