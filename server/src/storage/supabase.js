import {
  createSupabaseAuthClient,
  createSupabaseServiceClient,
  requireSupabaseConfig,
  supabaseStorageError,
} from '../supabase/client.js';

const DEFAULT_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LEASE_MS = 30 * 1000;

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

function compactState(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    xp: Math.max(0, Number(source.xp) || 0),
    streak: Math.max(0, Number(source.streak) || 0),
    lastActiveDate: source.lastActiveDate || null,
    testsTaken: Math.max(0, Number(source.testsTaken) || 0),
    practiceAnswered: Math.max(0, Number(source.practiceAnswered) || 0),
    totalTestMarks: Math.max(0, Number(source.totalTestMarks) || 0),
    totalTestCorrect: Math.max(0, Number(source.totalTestCorrect) || 0),
    topicStats: source.topicStats && typeof source.topicStats === 'object' && !Array.isArray(source.topicStats)
      ? cloneJson(source.topicStats, 'topicStats')
      : {},
    completedLessons: Array.isArray(source.completedLessons)
      ? [...new Set(source.completedLessons.filter((id) => typeof id === 'string' && id.trim()))]
      : [],
  };
}

function rowToProgress(row) {
  if (!row) return null;
  return {
    xp: row.xp,
    streak: row.streak,
    lastActiveDate: row.last_active_date,
    testsTaken: row.tests_taken,
    practiceAnswered: row.practice_answered,
    totalTestMarks: row.total_test_marks,
    totalTestCorrect: row.total_test_correct,
    topicStats: cloneJson(row.topic_stats || {}, 'topicStats'),
    completedLessons: cloneJson(row.completed_lessons || [], 'completedLessons'),
  };
}

function rowToSession(row) {
  if (!row) return null;
  const leaseUntil = row.leaseUntil ?? row.lease_until;
  return {
    id: row.id,
    userId: row.userId ?? row.user_id,
    subject: row.subject,
    kind: row.kind,
    status: row.status,
    payload: cloneJson(row.payload || {}, 'study session payload'),
    result: row.result == null ? null : cloneJson(row.result, 'study session result'),
    createdAt: isoDate(row.createdAt ?? row.created_at, 'createdAt'),
    updatedAt: isoDate(row.updatedAt ?? row.updated_at, 'updatedAt'),
    expiresAt: isoDate(row.expiresAt ?? row.expires_at, 'expiresAt'),
    leaseUntil: leaseUntil == null ? null : isoDate(leaseUntil, 'leaseUntil'),
  };
}

function sessionCriteria(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw storageError('STORAGE_INVALID_ARGUMENT', 'study session criteria must be an object');
  }
  return {
    id: requiredString(input.id, 'id'),
    userId: requiredString(String(input.userId), 'userId'),
    subject: requiredString(input.subject, 'subject'),
    kind: requiredString(input.kind, 'kind'),
  };
}

function normalizeSession(input, preserveStatus = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw storageError('STORAGE_INVALID_ARGUMENT', 'study session must be an object');
  }
  const now = Date.now();
  const status = preserveStatus && ['active', 'claimed', 'completed', 'expired'].includes(input.status)
    ? input.status
    : 'active';
  return {
    id: requiredString(input.id, 'id'),
    userId: requiredString(String(input.userId), 'userId'),
    subject: requiredString(input.subject, 'subject'),
    kind: requiredString(input.kind, 'kind'),
    status,
    payload: cloneJson(input.payload ?? {}, 'study session payload'),
    result: input.result == null ? null : cloneJson(input.result, 'study session result'),
    createdAt: isoDate(input.createdAt, 'createdAt', now),
    updatedAt: isoDate(input.updatedAt, 'updatedAt', now),
    expiresAt: isoDate(input.expiresAt, 'expiresAt', now + DEFAULT_SESSION_TTL_MS),
    leaseUntil: input.leaseUntil == null ? null : isoDate(input.leaseUntil, 'leaseUntil'),
  };
}

function normalizeRpcResult(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw storageError('STORAGE_CORRUPT_DATA', 'Invalid response returned by Supabase');
  }
  return data;
}

export function createSupabaseStorage(options = {}) {
  const config = requireSupabaseConfig({
    ...process.env,
    ...(options.url ? { SUPABASE_URL: options.url } : {}),
    ...(options.secretKey ? { SUPABASE_SECRET_KEY: options.secretKey } : {}),
    ...(options.publishableKey ? { SUPABASE_PUBLISHABLE_KEY: options.publishableKey } : {}),
  });
  const service = createSupabaseServiceClient(config);
  const auth = createSupabaseAuthClient(config);
  let initPromise = null;

  async function rpc(name, args) {
    const { data, error } = await service.rpc(name, args);
    if (error) throw supabaseStorageError(error);
    return normalizeRpcResult(data);
  }

  async function init() {
    if (!initPromise) {
      initPromise = service
        .from('profiles')
        .select('id')
        .limit(1)
        .then(async ({ error }) => {
          if (error) throw supabaseStorageError(error, 'Supabase schema is unavailable');
          const cleanup = await service.rpc('cleanup_expired_study_sessions');
          if (cleanup.error) throw supabaseStorageError(cleanup.error, 'Supabase schema is unavailable');
        })
        .catch((error) => {
          initPromise = null;
          throw error;
        });
    }
    return initPromise;
  }

  async function getProgress(userId, subject) {
    await init();
    const { data, error } = await service
      .from('subject_progress')
      .select('xp, streak, last_active_date, tests_taken, practice_answered, total_test_marks, total_test_correct, topic_stats, completed_lessons')
      .eq('user_id', requiredString(String(userId), 'userId'))
      .eq('subject', requiredString(subject, 'subject'))
      .maybeSingle();
    if (error) throw supabaseStorageError(error);
    return rowToProgress(data);
  }

  async function replaceProgress(userId, subject, state) {
    const result = await rpc('replace_subject_progress', {
      p_user_id: requiredString(String(userId), 'userId'),
      p_subject: requiredString(subject, 'subject'),
      p_next_state: compactState(state),
    });
    return result;
  }

  async function mutateProgress(userId, subject, callback) {
    if (typeof callback !== 'function') {
      throw storageError('STORAGE_INVALID_ARGUMENT', 'mutateProgress callback is required');
    }
    const stored = await getProgress(userId, subject);
    const result = await callback(stored || compactState({}));
    if (!result || typeof result !== 'object' || !hasOwn(result, 'state') || !hasOwn(result, 'value')) {
      throw storageError('STORAGE_INVALID_MUTATION', 'mutateProgress callback must return { state, value }');
    }
    await replaceProgress(userId, subject, result.state);
    return result.value;
  }

  async function mutateSubjectProgress(userId, subject, operation) {
    const result = await rpc('mutate_subject_progress', {
      p_user_id: requiredString(String(userId), 'userId'),
      p_subject: requiredString(subject, 'subject'),
      p_operation: cloneJson(operation, 'progress operation'),
    });
    return result;
  }

  async function importProgressIfAbsent(userId, subject, state) {
    const current = await getProgress(userId, subject);
    if (current) return false;
    await replaceProgress(userId, subject, state);
    return true;
  }

  async function createStudySession(input) {
    const session = normalizeSession(input);
    return rpc('create_study_session', {
      p_id: session.id,
      p_user_id: session.userId,
      p_subject: session.subject,
      p_kind: session.kind,
      p_payload: session.payload,
      p_created_at: session.createdAt,
      p_expires_at: session.expiresAt,
    }).then((result) => ({
      ...result,
      ...(result.session ? { session: rowToSession(result.session) } : {}),
    }));
  }

  async function restoreStudySession(input) {
    const session = normalizeSession(input, true);
    await init();
    const { data, error } = await service
      .from('study_sessions')
      .insert({
        id: session.id,
        user_id: session.userId,
        subject: session.subject,
        kind: session.kind,
        status: session.status,
        payload: session.payload,
        result: session.result,
        created_at: session.createdAt,
        updated_at: session.updatedAt,
        expires_at: session.expiresAt,
        lease_until: session.leaseUntil,
      })
      .select('*')
      .maybeSingle();
    if (error) {
      if (error.code === '23505') return { status: 'conflict' };
      throw supabaseStorageError(error);
    }
    return { status: 'created', session: rowToSession(data) };
  }

  async function getStudySession(input) {
    const criteria = sessionCriteria(input);
    const result = await rpc('get_study_session', {
      p_id: criteria.id,
      p_user_id: criteria.userId,
      p_subject: criteria.subject,
      p_kind: criteria.kind,
    });
    return {
      ...result,
      ...(result.session ? { session: rowToSession(result.session) } : {}),
    };
  }

  async function updateStudySession(input, callback) {
    const criteria = sessionCriteria(input);
    if (typeof callback !== 'function') {
      throw storageError('STORAGE_INVALID_ARGUMENT', 'updateStudySession callback is required');
    }
    const current = await getStudySession(criteria);
    if (current.status !== 'ok') return current;
    const update = await callback(cloneJson(current.session, 'study session'));
    if (!update || typeof update !== 'object') {
      throw storageError('STORAGE_INVALID_MUTATION', 'updateStudySession callback must return an update object');
    }
    const result = await rpc('update_study_session', {
      p_id: criteria.id,
      p_user_id: criteria.userId,
      p_subject: criteria.subject,
      p_kind: criteria.kind,
      p_payload: hasOwn(update, 'payload') ? cloneJson(update.payload, 'study session payload') : current.session.payload,
    });
    return {
      ...result,
      ...(result.session ? { session: rowToSession(result.session) } : {}),
      ...(hasOwn(update, 'value') ? { value: update.value } : {}),
    };
  }

  async function claimStudySession(input) {
    const criteria = sessionCriteria(input);
    const leaseUntil = input.leaseUntil == null
      ? new Date(Date.now() + DEFAULT_LEASE_MS).toISOString()
      : isoDate(input.leaseUntil, 'leaseUntil');
    const result = await rpc('claim_study_session', {
      p_id: criteria.id,
      p_user_id: criteria.userId,
      p_subject: criteria.subject,
      p_kind: criteria.kind,
      p_lease_until: leaseUntil,
    });
    return {
      ...result,
      ...(result.session ? { session: rowToSession(result.session) } : {}),
    };
  }

  async function releaseStudySession(input) {
    const criteria = sessionCriteria(input);
    const result = await rpc('release_study_session', {
      p_id: criteria.id,
      p_user_id: criteria.userId,
      p_subject: criteria.subject,
      p_kind: criteria.kind,
    });
    return {
      ...result,
      ...(result.session ? { session: rowToSession(result.session) } : {}),
    };
  }

  async function discardStudySession(input) {
    const criteria = sessionCriteria(input);
    const current = await getStudySession(criteria);
    if (current.status !== 'ok') return current;
    const { error } = await service
      .from('study_sessions')
      .delete()
      .eq('id', criteria.id)
      .eq('user_id', criteria.userId)
      .eq('subject', criteria.subject)
      .eq('kind', criteria.kind);
    if (error) throw supabaseStorageError(error);
    return { status: 'discarded' };
  }

  async function finalizeStudySession(input, callback) {
    const criteria = sessionCriteria(input);
    if (typeof callback !== 'function') {
      throw storageError('STORAGE_INVALID_ARGUMENT', 'finalizeStudySession callback is required');
    }
    const current = await getStudySession(criteria);
    if (current.status !== 'ok') return current;
    const state = await getProgress(criteria.userId, criteria.subject);
    const finalized = await callback(
      cloneJson(current.session, 'study session'),
      compactState(state || {}),
    );
    if (!finalized || typeof finalized !== 'object' || !hasOwn(finalized, 'state') || !hasOwn(finalized, 'response')) {
      throw storageError('STORAGE_INVALID_MUTATION', 'finalizeStudySession callback must return { state, response }');
    }
    const result = await rpc('finalize_study_session', {
      p_id: criteria.id,
      p_user_id: criteria.userId,
      p_subject: criteria.subject,
      p_kind: criteria.kind,
      p_next_state: compactState(finalized.state),
      p_result: cloneJson(finalized.response, 'study session response'),
    });
    return {
      ...result,
      ...(result.session ? { session: rowToSession(result.session) } : {}),
    };
  }

  async function profileForUser(user) {
    const { data, error } = await service
      .from('profiles')
      .select('id, username, role, legacy_user_id')
      .eq('id', user.id)
      .maybeSingle();
    if (error) throw supabaseStorageError(error);
    if (!data) return null;
    return {
      id: data.id,
      username: data.username,
      email: user.email || null,
      role: data.role,
      legacyUserId: data.legacy_user_id,
      oauth: user.app_metadata?.provider && user.app_metadata.provider !== 'email',
    };
  }

  async function getAuthUser(accessToken) {
    const token = requiredString(accessToken, 'accessToken');
    const { data, error } = await service.auth.getUser(token);
    if (error || !data.user) return null;
    return profileForUser(data.user);
  }

  async function signIn(email, password) {
    const result = await auth.auth.signInWithPassword({
      email: requiredString(String(email).trim().toLowerCase(), 'email'),
      password: String(password),
    });
    if (result.error) throw supabaseStorageError(result.error, 'Invalid email or password');
    return result.data;
  }

  async function signUp(email, password, username) {
    const result = await auth.auth.signUp({
      email: requiredString(String(email).trim().toLowerCase(), 'email'),
      password: String(password),
      options: { data: { username: requiredString(username, 'username') } },
    });
    if (result.error) throw supabaseStorageError(result.error, 'Could not create account');
    return result.data;
  }

  async function signInWithOAuth(provider, redirectTo) {
    const result = await auth.auth.signInWithOAuth({
      provider: requiredString(provider, 'provider'),
      options: { redirectTo: requiredString(redirectTo, 'redirectTo') },
    });
    if (result.error || !result.data?.url) {
      throw supabaseStorageError(result.error, 'Could not start OAuth sign-in');
    }
    return result.data;
  }

  async function lookupLegacyUserForClaim(username) {
    return rpc('lookup_legacy_user_for_claim', {
      p_username: requiredString(username, 'username'),
    });
  }

  async function startLegacyClaim(legacyUserId, email, tokenHash, expiresAt) {
    return rpc('start_account_claim', {
      p_legacy_user_id: requiredString(legacyUserId, 'legacyUserId'),
      p_email: requiredString(email, 'email'),
      p_token_hash: requiredString(tokenHash, 'tokenHash'),
      p_expires_at: isoDate(expiresAt, 'expiresAt'),
    });
  }

  async function createAuthUser(email, password, username) {
    const result = await service.auth.admin.createUser({
      email: requiredString(email, 'email'),
      password: String(password),
      email_confirm: false,
      user_metadata: { username: requiredString(username, 'username') },
    });
    if (result.error || !result.data.user) {
      throw supabaseStorageError(result.error, 'Could not create Supabase account');
    }
    return result.data.user;
  }

  async function completeLegacyClaim(tokenHash, targetUserId) {
    return rpc('complete_account_claim', {
      p_token_hash: requiredString(tokenHash, 'tokenHash'),
      p_target_user_id: requiredString(targetUserId, 'targetUserId'),
    });
  }

  async function deleteAuthUser(userId) {
    const result = await service.auth.admin.deleteUser(requiredString(userId, 'userId'));
    if (result.error) throw supabaseStorageError(result.error, 'Could not roll back Supabase account');
  }

  async function resendSignup(email, redirectTo = null) {
    const result = await auth.auth.resend({
      type: 'signup',
      email: requiredString(email, 'email'),
      ...(redirectTo ? { options: { emailRedirectTo: redirectTo } } : {}),
    });
    if (result.error) throw supabaseStorageError(result.error, 'Could not send the confirmation email');
    return result.data;
  }

  async function getUserById(userId) {
    const { data, error } = await service.auth.admin.getUserById(requiredString(String(userId), 'userId'));
    if (error || !data.user) return null;
    return profileForUser(data.user);
  }

  async function getUserByUsername(username) {
    const { data, error } = await service
      .from('profiles')
      .select('id')
      .eq('username', requiredString(username, 'username'))
      .maybeSingle();
    if (error) throw supabaseStorageError(error);
    return data ? getUserById(data.id) : null;
  }

  async function listUsers() {
    const { data, error } = await service.from('profiles').select('id, username, role, legacy_user_id');
    if (error) throw supabaseStorageError(error);
    return data || [];
  }

  async function unsupported(name) {
    throw storageError('STORAGE_UNSUPPORTED', `${name} is not available with Supabase Auth`);
  }

  return {
    driver: 'supabase',
    schemaVersion: 1,
    config,
    init,
    ensureSchema: init,
    close: async () => {},
    getProgress,
    mutateProgress,
    mutateSubjectProgress,
    importProgressIfAbsent,
    createStudySession,
    restoreStudySession,
    getStudySession,
    updateStudySession,
    claimStudySession,
    releaseStudySession,
    discardStudySession,
    finalizeStudySession,
    getAuthUser,
    signIn,
    signUp,
    signInWithOAuth,
    lookupLegacyUserForClaim,
    startLegacyClaim,
    createAuthUser,
    completeLegacyClaim,
    deleteAuthUser,
    resendSignup,
    getUserById,
    getUserByUsername,
    listUsers,
    getUserByOAuthIdentity: (...args) => unsupported('getUserByOAuthIdentity', ...args),
    createUser: (...args) => unsupported('createUser', ...args),
    upsertMigrationUser: (...args) => unsupported('upsertMigrationUser', ...args),
    putAuthSession: (...args) => unsupported('putAuthSession', ...args),
    getAuthSession: (...args) => unsupported('getAuthSession', ...args),
    deleteAuthSession: (...args) => unsupported('deleteAuthSession', ...args),
    putOAuthState: (...args) => unsupported('putOAuthState', ...args),
    consumeOAuthState: (...args) => unsupported('consumeOAuthState', ...args),
  };
}
