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

function dateKey(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function rowToPreferences(row) {
  if (!row) return null;
  return {
    examDate: row.exam_date ? dateKey(row.exam_date) ?? '' : '',
    targetGrade: row.target_grade ?? '',
    passMode: row.pass_mode === 'foundation-pass' ? 'foundation-pass' : 'balanced',
  };
}

function rowToMistake(row) {
  if (!row) return null;
  const dueDates = Array.isArray(row.due_dates) ? row.due_dates : [];
  const reviewIndex = Math.max(0, Math.min(4, Number(row.review_index) || 0));
  const mastered = row.status === 'mastered' || reviewIndex >= 4;
  return {
    id: String(row.legacy_id),
    ...(row.session_id ? { sessionId: row.session_id } : {}),
    ...(row.question_id ? { qid: row.question_id } : {}),
    ...(row.topic_id ? { topicId: row.topic_id } : {}),
    topicName: row.topic_name || 'Unassigned topic',
    prompt: row.prompt || '',
    ...(row.answer != null ? { answer: row.answer } : {}),
    ...(row.marks != null ? { marks: row.marks } : {}),
    ...(row.max_marks != null ? { maxMarks: row.max_marks } : {}),
    capturedAt: isoDate(row.captured_at, 'capturedAt'),
    dueDates,
    reviewIndex,
    mastered,
  };
}

function rowsToPlan(planRow, dayRows) {
  if (!planRow) return null;
  const days = (Array.isArray(dayRows) ? dayRows : [])
    .sort((a, b) => String(a.day_date).localeCompare(String(b.day_date)))
    .map((row) => ({
      date: dateKey(row.day_date) ?? '',
      label: row.label || 'Today',
      task: row.task || 'Study session',
      minutes: Math.max(1, Math.min(120, Number(row.minutes) || 15)),
      ...(row.topic_id ? { topicId: row.topic_id } : {}),
      status: row.status === 'done' ? 'done' : 'todo',
      ...(row.result != null ? { result: row.result } : {}),
    }));
  const intent = planRow.intent_date
    ? { date: dateKey(planRow.intent_date), ...(planRow.intent_topic_id ? { topicId: planRow.intent_topic_id } : {}) }
    : undefined;
  return { from: dateKey(planRow.from_date), days, ...(intent ? { intent } : {}) };
}

function rowToProgress(row) {
  if (!row) return null;
  const xp = Math.max(0, Number(row.xp) || 0);
  const totalTestMarks = Math.max(0, Number(row.total_test_marks) || 0);
  const totalTestCorrect = Math.max(0, Number(row.total_test_correct) || 0);
  const completedLessonIds = cloneJson(row.completed_lessons || [], 'completedLessons');
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const xpInto = xp - (level - 1) ** 2 * 50;
  const xpNeeded = (level ** 2 - (level - 1) ** 2) * 50;
  return {
    xp,
    level,
    xpInto,
    xpNeeded,
    streak: row.streak,
    lastActiveDate: row.last_active_date,
    testsTaken: row.tests_taken,
    practiceAnswered: row.practice_answered,
    totalTestMarks,
    totalTestCorrect,
    overallPercent: totalTestMarks
      ? Math.round((100 * totalTestCorrect) / totalTestMarks)
      : null,
    topicStats: cloneJson(row.topic_stats || {}, 'topicStats'),
    completedLessonIds,
    completedLessons: completedLessonIds,
    lessonsCompleted: completedLessonIds.length,
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

  async function finalizeStudySession(input, operation) {
    const criteria = sessionCriteria(input);
    if (!operation || typeof operation !== 'object' || Array.isArray(operation)) {
      throw storageError('STORAGE_INVALID_ARGUMENT', 'finalizeStudySession operation is required');
    }
    const progressOperation = {
      ...(operation.testResult !== undefined ? { testResult: operation.testResult } : {}),
      ...(operation.practiceRecords !== undefined ? { practiceRecords: operation.practiceRecords } : {}),
      scoreXp: operation.scoreXp,
      lessonId: operation.lessonId,
    };
    const result = await rpc('finalize_study_session_operation', {
      p_id: criteria.id,
      p_user_id: criteria.userId,
      p_subject: criteria.subject,
      p_kind: criteria.kind,
      p_operation: cloneJson(progressOperation, 'progress operation'),
      p_response: cloneJson(operation.response ?? {}, 'study session response'),
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

  async function getPreferences(userId, subject) {
    await init();
    const { data, error } = await service
      .from('subject_preferences')
      .select('exam_date, target_grade, pass_mode')
      .eq('user_id', requiredString(String(userId), 'userId'))
      .eq('subject', requiredString(subject, 'subject'))
      .maybeSingle();
    if (error) throw supabaseStorageError(error);
    return rowToPreferences(data);
  }

  async function savePreferences(userId, subject, preferences) {
    const clean = preferences && typeof preferences === 'object' ? preferences : {};
    const examDate = typeof clean.examDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(clean.examDate) ? clean.examDate : null;
    const targetGrade = typeof clean.targetGrade === 'string' && clean.targetGrade.trim() ? clean.targetGrade.trim().slice(0, 1) : null;
    const passMode = clean.passMode === 'foundation-pass' ? 'foundation-pass' : 'balanced';
    const { data, error } = await service
      .from('subject_preferences')
      .upsert({
        user_id: requiredString(String(userId), 'userId'),
        subject: requiredString(subject, 'subject'),
        exam_date: examDate,
        target_grade: targetGrade,
        pass_mode: passMode,
      }, { onConflict: 'user_id,subject' })
      .select('exam_date, target_grade, pass_mode')
      .maybeSingle();
    if (error) throw supabaseStorageError(error);
    return rowToPreferences(data);
  }

  async function getPlan(userId, subject) {
    await init();
    const id = requiredString(String(userId), 'userId');
    const { data: plans, error } = await service
      .from('study_plans')
      .select('id, from_date, intent_date, intent_topic_id')
      .eq('user_id', id)
      .eq('subject', requiredString(subject, 'subject'))
      .order('from_date', { ascending: false })
      .limit(1);
    if (error) throw supabaseStorageError(error);
    const plan = Array.isArray(plans) && plans.length ? plans[0] : null;
    if (!plan) return null;
    const { data: days, error: dayError } = await service
      .from('study_plan_days')
      .select('day_date, label, task, minutes, topic_id, status, result')
      .eq('plan_id', plan.id)
      .order('day_date', { ascending: true });
    if (dayError) throw supabaseStorageError(dayError);
    return rowsToPlan(plan, days);
  }

  async function savePlan(userId, subject, plan) {
    const clean = plan === undefined || plan === null
      ? { from: dateKey(new Date()), days: [], intent: undefined }
      : plan && typeof plan === 'object' ? plan : {};
    const days = Array.isArray(clean.days) ? clean.days : [];
    if (!days.length) {
      const { error } = await service
        .from('study_plans')
        .delete({ count: 'exact' })
        .eq('user_id', requiredString(String(userId), 'userId'))
        .eq('subject', requiredString(subject, 'subject'));
      if (error) throw supabaseStorageError(error);
      return null;
    }
    const { data, error } = await service.rpc('save_study_plan', {
      p_user_id: requiredString(String(userId), 'userId'),
      p_subject: requiredString(subject, 'subject'),
      p_from_date: clean.from && /^\d{4}-\d{2}-\d{2}$/.test(String(clean.from)) ? clean.from : dateKey(new Date()),
      p_intent: clean.intent ? clean.intent : null,
      p_days: cloneJson(days, 'plan days'),
    });
    if (error) throw supabaseStorageError(error);
    data; // reserved for future plan_json echo
    return getPlan(userId, subject);
  }

  async function getMistakes(userId, subject) {
    await init();
    const { data, error } = await service
      .from('mistake_notebook')
      .select('legacy_id, session_id, question_id, topic_id, topic_name, prompt, answer, marks, max_marks, due_dates, review_index, status, captured_at')
      .eq('user_id', requiredString(String(userId), 'userId'))
      .eq('subject', requiredString(subject, 'subject'))
      .order('captured_at', { ascending: false });
    if (error) throw supabaseStorageError(error);
    return (data || []).map(rowToMistake).filter(Boolean);
  }

  async function saveMistakes(userId, subject, rows) {
    const clean = Array.isArray(rows) ? rows : [];
    await service.rpc('replace_mistakes', {
      p_user_id: requiredString(String(userId), 'userId'),
      p_subject: requiredString(subject, 'subject'),
      p_rows: cloneJson(clean, 'mistake rows'),
    }).then(({ error }) => {
      if (error) throw supabaseStorageError(error);
    });
    return getMistakes(userId, subject);
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
    getPersonal: async (userId, subject) => ({
      preferences: await getPreferences(userId, subject),
      plan: await getPlan(userId, subject),
      mistakes: await getMistakes(userId, subject),
    }),
    savePreferences,
    savePlan,
    saveMistakes,
  };
}

export { rowToProgress };
