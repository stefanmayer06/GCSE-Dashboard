import crypto from 'node:crypto';
import path from 'node:path';
import {
  mkdir,
  readFile,
  rename,
  rm,
  unlink,
  writeFile,
} from 'node:fs/promises';

const SCHEMA_VERSION = 1;
const DEFAULT_STUDY_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LEASE_MS = 30 * 1000;
const locks = new Map();

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

function fileComponent(value, name) {
  const component = requiredIdentifier(value, name);
  if (!/^[A-Za-z0-9._-]+$/.test(component)) {
    throw storageError('STORAGE_INVALID_ARGUMENT', `${name} contains unsupported characters`);
  }
  return component;
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

function isoDate(value, name, fallback) {
  const candidate = value ?? fallback;
  const date = candidate instanceof Date ? candidate : new Date(candidate);
  if (!Number.isFinite(date.getTime())) {
    throw storageError('STORAGE_INVALID_ARGUMENT', `${name} must be a valid date`);
  }
  return date.toISOString();
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

function persistedUser(input, existing = null) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw storageError('STORAGE_INVALID_ARGUMENT', 'user must be an object');
  }
  const username = requiredString(input.username, 'username');
  const merged = cloneJson({ ...(existing || {}), ...input }, 'user');
  merged.username = username;
  merged.createdAt = isoDate(merged.createdAt, 'createdAt', Date.now());
  const id = input.id == null ? existing?.id ?? userIdFor(username) : requiredIdentifier(input.id, 'id');
  if (id === userIdFor(username)) delete merged.id;
  else merged.id = id;
  oauthIdentity(merged);
  return { id, username, record: merged };
}

function readableUser(record, username) {
  const user = cloneJson(record, 'stored user');
  user.username = username;
  user.id = user.id || userIdFor(username);
  return user;
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

async function withLock(key, callback) {
  const previous = locks.get(key) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  locks.set(key, current);
  await previous;
  try {
    return await callback();
  } finally {
    release();
    if (locks.get(key) === current) locks.delete(key);
  }
}

async function withLocks(keys, callback) {
  const ordered = [...new Set(keys)].sort();
  const run = async (index) => {
    if (index === ordered.length) return callback();
    return withLock(ordered[index], () => run(index + 1));
  };
  return run(0);
}

async function readJson(file) {
  try {
    return { found: true, value: JSON.parse(await readFile(file, 'utf8')) };
  } catch (cause) {
    if (cause?.code === 'ENOENT') return { found: false, value: null };
    if (cause instanceof SyntaxError) {
      throw storageError('STORAGE_CORRUPT_DATA', `Invalid JSON in ${file}`, { cause });
    }
    throw cause;
  }
}

async function readObject(file) {
  const stored = await readJson(file);
  if (!stored.found) return {};
  if (!stored.value || typeof stored.value !== 'object' || Array.isArray(stored.value)) {
    throw storageError('STORAGE_CORRUPT_DATA', `Expected a JSON object in ${file}`);
  }
  return stored.value;
}

async function atomicWrite(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    await writeFile(temp, JSON.stringify(value));
    await rename(temp, file);
  } catch (error) {
    await rm(temp, { force: true }).catch(() => {});
    throw error;
  }
}

async function removeFile(file) {
  try {
    await unlink(file);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

export function createJsonStorage({ dataDir } = {}) {
  const root = path.resolve(requiredString(dataDir, 'dataDir'));
  const usersFile = path.join(root, 'users.json');
  const authSessionsFile = path.join(root, 'sessions.json');
  const oauthStatesFile = path.join(root, 'oauth-states.json');
  const studySessionsFile = path.join(root, 'study-sessions.json');
  const metadataFile = path.join(root, 'storage-meta.json');
  const transactionFile = path.join(root, 'storage-transaction.json');
  const rootLock = `${root}:init`;
  const transactionLock = `${root}:transaction`;
  let initPromise = null;

  const progressFile = (userId, subject) => path.join(
    root,
    'users',
    fileComponent(userId, 'userId'),
    `${fileComponent(subject, 'subject')}.json`,
  );

  async function recoverFinalizeTransaction() {
    const stored = await readJson(transactionFile);
    if (!stored.found) return;
    const transaction = stored.value;
    if (
      !transaction
      || transaction.schemaVersion !== SCHEMA_VERSION
      || transaction.type !== 'finalize-study-session'
      || !transaction.session
    ) {
      throw storageError('STORAGE_CORRUPT_DATA', 'Invalid JSON storage transaction record');
    }
    const file = progressFile(transaction.userId, transaction.subject);
    await atomicWrite(file, transaction.progressState);
    const sessions = await readObject(studySessionsFile);
    sessions[transaction.session.id] = transaction.session;
    await atomicWrite(studySessionsFile, sessions);
    await removeFile(transactionFile);
  }

  async function migrateLegacySessions() {
    const sessions = await readObject(authSessionsFile);
    let changed = false;
    const now = Date.now();
    for (const [storedKey, value] of Object.entries(sessions)) {
      if (!value || typeof value !== 'object') {
        delete sessions[storedKey];
        changed = true;
        continue;
      }
      const expiresAt = isoDate(value.expiresAt ?? value.exp, 'session expiresAt');
      if (Date.parse(expiresAt) <= now) {
        delete sessions[storedKey];
        changed = true;
        continue;
      }
      let tokenHash = storedKey;
      let userId = value.userId;
      if (!userId && value.username) {
        tokenHash = crypto.createHash('sha256').update(storedKey).digest('hex');
        userId = userIdFor(value.username);
      }
      if (!userId) {
        delete sessions[storedKey];
        changed = true;
        continue;
      }
      const normalized = {
        userId: String(userId),
        ...(value.username ? { username: String(value.username) } : {}),
        createdAt: isoDate(value.createdAt, 'session createdAt', now),
        expiresAt,
        exp: Date.parse(expiresAt),
      };
      if (tokenHash !== storedKey) delete sessions[storedKey];
      if (JSON.stringify(sessions[tokenHash]) !== JSON.stringify(normalized)) changed = true;
      sessions[tokenHash] = normalized;
    }
    if (changed) await atomicWrite(authSessionsFile, sessions);
  }

  async function pruneOAuthStates() {
    const states = await readObject(oauthStatesFile);
    const now = Date.now();
    let changed = false;
    for (const [stateHash, state] of Object.entries(states)) {
      if (!state?.expiresAt || Date.parse(state.expiresAt) <= now) {
        delete states[stateHash];
        changed = true;
      }
    }
    if (changed) await atomicWrite(oauthStatesFile, states);
  }

  async function initialize() {
    await mkdir(root, { recursive: true });
    const metadata = await readJson(metadataFile);
    if (metadata.found && Number(metadata.value?.schemaVersion) > SCHEMA_VERSION) {
      throw storageError(
        'STORAGE_SCHEMA_TOO_NEW',
        `JSON storage schema ${metadata.value.schemaVersion} is newer than supported schema ${SCHEMA_VERSION}`,
      );
    }
    if (!metadata.found || metadata.value?.schemaVersion !== SCHEMA_VERSION) {
      await atomicWrite(metadataFile, { schemaVersion: SCHEMA_VERSION, driver: 'json' });
    }
    await withLock(transactionLock, recoverFinalizeTransaction);
    await withLock(authSessionsFile, migrateLegacySessions);
    await withLock(oauthStatesFile, pruneOAuthStates);
  }

  async function init() {
    if (!initPromise) {
      initPromise = withLock(rootLock, initialize).catch((error) => {
        initPromise = null;
        throw error;
      });
    }
    return initPromise;
  }

  async function close() {
    if (initPromise) await initPromise;
  }

  async function listUsers() {
    await init();
    const users = await readObject(usersFile);
    return Object.entries(users)
      .map(([username, record]) => readableUser(record, username))
      .sort((a, b) => a.username.localeCompare(b.username));
  }

  async function getUserById(userId) {
    const id = requiredIdentifier(userId, 'userId');
    const users = await listUsers();
    return users.find((user) => user.id === id) || null;
  }

  async function getUserByUsername(username) {
    await init();
    const name = requiredString(username, 'username');
    const users = await readObject(usersFile);
    return users[name] ? readableUser(users[name], name) : null;
  }

  async function getUserByOAuthIdentity(provider, subject) {
    const expectedProvider = requiredString(provider, 'provider');
    const expectedSubject = requiredString(subject, 'subject');
    const users = await listUsers();
    return users.find((user) => {
      const identity = oauthIdentity(user);
      return identity?.provider === expectedProvider && identity.subject === expectedSubject;
    }) || null;
  }

  function assertUniqueOAuth(users, candidate, exceptUsername = null) {
    const candidateIdentity = oauthIdentity(candidate);
    if (!candidateIdentity) return;
    for (const [username, record] of Object.entries(users)) {
      if (username === exceptUsername) continue;
      const identity = oauthIdentity(record);
      if (
        identity?.provider === candidateIdentity.provider
        && identity.subject === candidateIdentity.subject
      ) {
        throw storageError('STORAGE_CONFLICT', 'OAuth identity is already in use', {
          field: 'oauthIdentity',
        });
      }
    }
  }

  async function createUser(input) {
    await init();
    return withLock(usersFile, async () => {
      const user = persistedUser(input);
      const users = await readObject(usersFile);
      if (users[user.username]) {
        throw storageError('STORAGE_CONFLICT', 'Username is already in use', { field: 'username' });
      }
      if (Object.entries(users).some(([name, record]) => readableUser(record, name).id === user.id)) {
        throw storageError('STORAGE_CONFLICT', 'User id is already in use', { field: 'id' });
      }
      assertUniqueOAuth(users, user.record);
      users[user.username] = user.record;
      await atomicWrite(usersFile, users);
      return readableUser(user.record, user.username);
    });
  }

  async function upsertMigrationUser(input) {
    await init();
    return withLock(usersFile, async () => {
      const users = await readObject(usersFile);
      const requestedUsername = requiredString(input?.username, 'username');
      const usernameMatch = users[requestedUsername] ? requestedUsername : null;
      const idMatch = input?.id == null
        ? null
        : Object.entries(users).find(
            ([name, record]) => readableUser(record, name).id === String(input.id),
          )?.[0] || null;
      if (usernameMatch && idMatch && usernameMatch !== idMatch) {
        throw storageError('STORAGE_CONFLICT', 'Migration user matches different existing users', {
          field: 'id',
        });
      }
      const existingUsername = usernameMatch || idMatch;
      const existing = existingUsername ? readableUser(users[existingUsername], existingUsername) : null;
      const user = persistedUser(input, existing);
      assertUniqueOAuth(users, user.record, existingUsername);
      if (existingUsername && existingUsername !== user.username) delete users[existingUsername];
      users[user.username] = user.record;
      await atomicWrite(usersFile, users);
      return readableUser(user.record, user.username);
    });
  }

  async function putAuthSession(input) {
    await init();
    if (!input || typeof input !== 'object') {
      throw storageError('STORAGE_INVALID_ARGUMENT', 'auth session must be an object');
    }
    const tokenHash = requiredString(input.tokenHash, 'tokenHash');
    const userId = requiredIdentifier(input.userId, 'userId');
    const createdAt = isoDate(input.createdAt, 'createdAt', Date.now());
    const expiresAt = isoDate(input.expiresAt, 'expiresAt');
    const user = await getUserById(userId);
    const record = {
      userId,
      ...(user ? { username: user.username } : {}),
      createdAt,
      expiresAt,
      exp: Date.parse(expiresAt),
    };
    await withLock(authSessionsFile, async () => {
      const sessions = await readObject(authSessionsFile);
      sessions[tokenHash] = record;
      await atomicWrite(authSessionsFile, sessions);
    });
    return { tokenHash, userId, ...(user ? { username: user.username } : {}), createdAt, expiresAt };
  }

  async function getAuthSession(tokenHash) {
    await init();
    const hash = requiredString(tokenHash, 'tokenHash');
    return withLock(authSessionsFile, async () => {
      const sessions = await readObject(authSessionsFile);
      const record = sessions[hash];
      if (!record) return null;
      const expiresAt = isoDate(record.expiresAt ?? record.exp, 'session expiresAt');
      if (Date.parse(expiresAt) <= Date.now()) {
        delete sessions[hash];
        await atomicWrite(authSessionsFile, sessions);
        return null;
      }
      const userId = record.userId || (record.username ? userIdFor(record.username) : null);
      if (!userId) return null;
      return {
        tokenHash: hash,
        userId: String(userId),
        ...(record.username ? { username: String(record.username) } : {}),
        createdAt: isoDate(record.createdAt, 'session createdAt', Date.now()),
        expiresAt,
      };
    });
  }

  async function deleteAuthSession(tokenHash) {
    await init();
    const hash = requiredString(tokenHash, 'tokenHash');
    return withLock(authSessionsFile, async () => {
      const sessions = await readObject(authSessionsFile);
      if (!hasOwn(sessions, hash)) return false;
      delete sessions[hash];
      await atomicWrite(authSessionsFile, sessions);
      return true;
    });
  }

  async function putOAuthState(input) {
    await init();
    if (!input || typeof input !== 'object') {
      throw storageError('STORAGE_INVALID_ARGUMENT', 'OAuth state must be an object');
    }
    const stateHash = requiredString(input.stateHash, 'stateHash');
    const record = {
      payload: cloneJson(input.payload ?? null, 'OAuth state payload'),
      createdAt: isoDate(input.createdAt, 'createdAt', Date.now()),
      expiresAt: isoDate(input.expiresAt, 'expiresAt'),
    };
    await withLock(oauthStatesFile, async () => {
      const states = await readObject(oauthStatesFile);
      states[stateHash] = record;
      await atomicWrite(oauthStatesFile, states);
    });
    return { stateHash, ...cloneJson(record) };
  }

  async function consumeOAuthState(stateHash) {
    await init();
    const hash = requiredString(stateHash, 'stateHash');
    return withLock(oauthStatesFile, async () => {
      const states = await readObject(oauthStatesFile);
      const record = states[hash];
      if (!record) return null;
      delete states[hash];
      await atomicWrite(oauthStatesFile, states);
      if (Date.parse(record.expiresAt) <= Date.now()) return null;
      return { stateHash: hash, ...cloneJson(record) };
    });
  }

  async function getProgress(userId, subject) {
    await init();
    const file = progressFile(userId, subject);
    return withLock(file, async () => {
      const stored = await readJson(file);
      return stored.found ? cloneJson(stored.value, 'progress state') : null;
    });
  }

  async function mutateProgress(userId, subject, callback) {
    await init();
    if (typeof callback !== 'function') {
      throw storageError('STORAGE_INVALID_ARGUMENT', 'mutateProgress callback is required');
    }
    const file = progressFile(userId, subject);
    return withLock(file, async () => {
      const stored = await readJson(file);
      const result = await callback(stored.found ? cloneJson(stored.value, 'progress state') : null);
      if (!result || typeof result !== 'object' || !hasOwn(result, 'state') || !hasOwn(result, 'value')) {
        throw storageError(
          'STORAGE_INVALID_MUTATION',
          'mutateProgress callback must return { state, value }',
        );
      }
      const state = cloneJson(result.state, 'progress state');
      await atomicWrite(file, state);
      return result.value;
    });
  }

  async function importProgressIfAbsent(userId, subject, state) {
    await init();
    const file = progressFile(userId, subject);
    const importedState = cloneJson(state, 'progress state');
    return withLock(file, async () => {
      const stored = await readJson(file);
      if (stored.found) return false;
      await atomicWrite(file, importedState);
      return true;
    });
  }

  async function createStudySession(input) {
    await init();
    const session = normalizeStudySession(input);
    return withLock(studySessionsFile, async () => {
      const sessions = await readObject(studySessionsFile);
      if (sessions[session.id]) return { status: 'conflict' };
      sessions[session.id] = session;
      await atomicWrite(studySessionsFile, sessions);
      return { status: 'created', session: cloneJson(session) };
    });
  }

  async function restoreStudySession(input) {
    await init();
    const session = normalizeStudySession(input, true);
    return withLock(studySessionsFile, async () => {
      const sessions = await readObject(studySessionsFile);
      if (sessions[session.id]) return { status: 'conflict' };
      sessions[session.id] = session;
      await atomicWrite(studySessionsFile, sessions);
      return { status: 'created', session: cloneJson(session) };
    });
  }

  async function getStudySession(input) {
    await init();
    const criteria = sessionCriteria(input);
    return withLock(studySessionsFile, async () => {
      const sessions = await readObject(studySessionsFile);
      const session = sessions[criteria.id];
      const outcome = lifecycleOutcome(session, criteria);
      if (outcome) return outcome;
      return { status: 'ok', session: cloneJson(session) };
    });
  }

  async function updateStudySession(input, callback) {
    await init();
    const criteria = sessionCriteria(input);
    if (typeof callback !== 'function') {
      throw storageError('STORAGE_INVALID_ARGUMENT', 'updateStudySession callback is required');
    }
    return withLock(studySessionsFile, async () => {
      const sessions = await readObject(studySessionsFile);
      const session = sessions[criteria.id];
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
      if (hasOwn(update, 'payload')) session.payload = cloneJson(update.payload, 'study session payload');
      if (hasOwn(update, 'expiresAt')) session.expiresAt = isoDate(update.expiresAt, 'expiresAt');
      session.updatedAt = new Date().toISOString();
      sessions[session.id] = session;
      await atomicWrite(studySessionsFile, sessions);
      return {
        status: 'updated',
        session: cloneJson(session),
        ...(hasOwn(update, 'value') ? { value: update.value } : {}),
      };
    });
  }

  async function claimStudySession(input) {
    await init();
    const criteria = sessionCriteria(input);
    const requestedLeaseUntil = input.leaseUntil == null
      ? null
      : isoDate(input.leaseUntil, 'leaseUntil');
    return withLock(studySessionsFile, async () => {
      const now = Date.now();
      const leaseUntil = requestedLeaseUntil
        ?? new Date(now + DEFAULT_LEASE_MS).toISOString();
      if (Date.parse(leaseUntil) <= now) {
        throw storageError('STORAGE_INVALID_ARGUMENT', 'leaseUntil must be in the future');
      }
      const sessions = await readObject(studySessionsFile);
      const session = sessions[criteria.id];
      const outcome = lifecycleOutcome(session, criteria, now);
      if (outcome) return outcome;
      if (session.status === 'claimed' && Date.parse(session.leaseUntil) > now) {
        return { status: 'busy', leaseUntil: session.leaseUntil };
      }
      session.status = 'claimed';
      session.leaseUntil = leaseUntil;
      session.updatedAt = new Date(now).toISOString();
      sessions[session.id] = session;
      await atomicWrite(studySessionsFile, sessions);
      return { status: 'claimed', session: cloneJson(session) };
    });
  }

  async function releaseStudySession(input) {
    await init();
    const criteria = sessionCriteria(input);
    return withLock(studySessionsFile, async () => {
      const sessions = await readObject(studySessionsFile);
      const session = sessions[criteria.id];
      const outcome = lifecycleOutcome(session, criteria);
      if (outcome) return outcome;
      if (session.status === 'active') {
        return { status: 'active', session: cloneJson(session) };
      }
      session.status = 'active';
      session.leaseUntil = null;
      session.updatedAt = new Date().toISOString();
      sessions[session.id] = session;
      await atomicWrite(studySessionsFile, sessions);
      return { status: 'released', session: cloneJson(session) };
    });
  }

  async function discardStudySession(input) {
    await init();
    const criteria = sessionCriteria(input);
    return withLock(studySessionsFile, async () => {
      const sessions = await readObject(studySessionsFile);
      const session = sessions[criteria.id];
      const mismatch = sessionMismatch(session, criteria);
      if (mismatch) return mismatch;
      if (session.status === 'completed') return completedOutcome(session);
      delete sessions[criteria.id];
      await atomicWrite(studySessionsFile, sessions);
      return { status: 'discarded' };
    });
  }

  async function finalizeStudySession(input, callback) {
    await init();
    const criteria = sessionCriteria(input);
    if (typeof callback !== 'function') {
      throw storageError('STORAGE_INVALID_ARGUMENT', 'finalizeStudySession callback is required');
    }
    const file = progressFile(criteria.userId, criteria.subject);
    return withLocks([transactionLock, studySessionsFile, file], async () => {
      await recoverFinalizeTransaction();
      const sessions = await readObject(studySessionsFile);
      const session = sessions[criteria.id];
      const outcome = lifecycleOutcome(session, criteria);
      if (outcome) return outcome;
      const progress = await readJson(file);
      const finalized = await callback(
        cloneJson(session, 'study session'),
        progress.found ? cloneJson(progress.value, 'progress state') : null,
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
      const progressState = cloneJson(finalized.state, 'progress state');
      const response = cloneJson(finalized.response, 'study session response');
      const completed = {
        ...session,
        status: 'completed',
        result: response,
        updatedAt: new Date().toISOString(),
        leaseUntil: null,
      };
      const transaction = {
        schemaVersion: SCHEMA_VERSION,
        type: 'finalize-study-session',
        userId: criteria.userId,
        subject: criteria.subject,
        progressState,
        session: completed,
      };
      await atomicWrite(transactionFile, transaction);
      await atomicWrite(file, progressState);
      sessions[criteria.id] = completed;
      await atomicWrite(studySessionsFile, sessions);
      await removeFile(transactionFile);
      return completedOutcome(completed, false);
    });
  }

  return {
    driver: 'json',
    schemaVersion: SCHEMA_VERSION,
    init,
    close,
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
