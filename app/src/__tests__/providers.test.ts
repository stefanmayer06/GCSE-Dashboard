import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';
import { networkIsOnline, startAuthSession, updateAuthIdentity } from '../providers';

const flush = () => new Promise<void>(resolve => setImmediate(() => resolve()));

function session(userId = 'user-1') {
  return { access_token: 'token', user: { id: userId } } as Session;
}

function authClient(options: {
  restored?: Session | null;
  sessionError?: Error;
  user?: { id: string } | null;
  userError?: Error;
  signOutImplementation?: () => Promise<{ error: null }>;
} = {}) {
  let listener: (event: AuthChangeEvent, session: Session | null) => void = () => undefined;
  const unsubscribe = jest.fn();
  const signOut = jest.fn(options.signOutImplementation ?? (() => Promise.resolve({ error: null as null })));
  const getSession = jest.fn().mockResolvedValue({
    data: { session: options.restored ?? null },
    error: options.sessionError ?? null,
  });
  const getUser = jest.fn().mockResolvedValue({
    data: { user: options.user === undefined ? { id: 'user-1' } : options.user },
    error: options.userError ?? null,
  });
  const client = {
    auth: {
      getSession,
      getUser,
      signOut,
      onAuthStateChange: jest.fn((callback) => {
        listener = callback;
        return { data: { subscription: { unsubscribe } } };
      }),
    },
  } as unknown as SupabaseClient;
  return { client, emit: (event: AuthChangeEvent, value: Session | null) => listener(event, value), getUser, signOut };
}

test.each([
  [{isConnected:true,isInternetReachable:true},true],
  [{isConnected:true,isInternetReachable:null},true],
  [{isConnected:true,isInternetReachable:false},false],
  [{isConnected:false,isInternetReachable:true},false],
  [{isConnected:null,isInternetReachable:null},false],
] as const)('derives connectivity from connection and reachability (%o)',(state,expected)=>{
  expect(networkIsOnline(state)).toBe(expected);
});

test('finishes startup unauthenticated when there is no restored session', async () => {
  const { client, getUser } = authClient();
  const publish = jest.fn();
  startAuthSession(client, publish);
  await flush();
  expect(getUser).not.toHaveBeenCalled();
  expect(publish).toHaveBeenCalledWith(null, 'BOOTSTRAP');
});

test('publishes a restored session only after getUser validates it', async () => {
  const restored = session();
  const { client, getUser } = authClient({ restored });
  const publish = jest.fn();
  startAuthSession(client, publish);
  await flush();
  expect(getUser).toHaveBeenCalledWith('token');
  expect(publish).toHaveBeenCalledWith(restored, 'BOOTSTRAP');
});

test('clears and rejects a confirmed revoked restored session once', async () => {
  let setup!: ReturnType<typeof authClient>;
  setup = authClient({
    restored: session(),
    user: null,
    userError: Object.assign(new Error('revoked'), { status: 401 }),
    signOutImplementation: async () => {
      setup.emit('SIGNED_OUT', null);
      return { error: null };
    },
  });
  const publish = jest.fn();
  startAuthSession(setup.client, publish);
  await flush();
  expect(publish).toHaveBeenCalledWith(null, 'SIGNED_OUT');
  expect(publish).toHaveBeenCalledTimes(1);
  expect(setup.signOut).toHaveBeenCalledWith({ scope: 'local' });
});

test('does not swallow a later genuine SIGNED_OUT when local sign-out emitted no echo', async () => {
  const setup = authClient({
    restored: session(),
    user: null,
    userError: Object.assign(new Error('deleted'), { status: 403 }),
  });
  const publish = jest.fn();
  startAuthSession(setup.client, publish);
  await flush();
  expect(publish).toHaveBeenCalledTimes(1);
  expect(publish).toHaveBeenLastCalledWith(null, 'SIGNED_OUT');

  setup.emit('SIGNED_OUT', null);
  expect(publish).toHaveBeenCalledTimes(2);
  expect(publish).toHaveBeenLastCalledWith(null, 'SIGNED_OUT');
});

test('does not erase persisted auth after a transient validation failure', async () => {
  const { client, signOut } = authClient({
    restored: session(),
    user: null,
    userError: Object.assign(new Error('service unavailable'), { status: 503 }),
  });
  const publish = jest.fn();
  startAuthSession(client, publish);
  await flush();
  expect(publish).toHaveBeenCalledWith(null, 'BOOTSTRAP');
  expect(signOut).not.toHaveBeenCalled();
});

test('INITIAL_SESSION cannot bypass validation and newer events beat bootstrap', async () => {
  let resolveSession!: (value: object) => void;
  const pending = new Promise(resolve => { resolveSession = resolve; });
  const setup = authClient();
  setup.client.auth.getSession = jest.fn(() => pending) as never;
  const publish = jest.fn();
  startAuthSession(setup.client, publish);
  setup.emit('INITIAL_SESSION', session('stale'));
  expect(publish).not.toHaveBeenCalled();
  setup.emit('SIGNED_IN', session('new'));
  resolveSession({ data: { session: session('stale') }, error: null });
  await flush();
  expect(publish).toHaveBeenCalledTimes(1);
  expect(publish).toHaveBeenCalledWith(expect.objectContaining({ user: { id: 'new' } }), 'SIGNED_IN');
});

test('startup transport errors finish loading without clearing persisted auth', async () => {
  const { client } = authClient({ sessionError: new Error('storage failed') });
  const publish = jest.fn();
  startAuthSession(client, publish);
  await flush();
  expect(publish).toHaveBeenCalledWith(null, 'BOOTSTRAP');
});

test('bounded startup timeout finishes loading without clearing persisted auth', async () => {
  jest.useFakeTimers();
  const setup = authClient();
  setup.client.auth.getSession = jest.fn(() => new Promise(() => undefined)) as never;
  const publish = jest.fn();
  startAuthSession(setup.client, publish, 25);
  jest.advanceTimersByTime(25);
  await Promise.resolve();
  await Promise.resolve();
  expect(publish).toHaveBeenCalledWith(null, 'BOOTSTRAP');
  expect(setup.signOut).not.toHaveBeenCalled();
  jest.useRealTimers();
});

test('clears cached queries when identity changes or signs out', () => {
  const clear = jest.fn();
  expect(updateAuthIdentity(undefined, session('a'), 'BOOTSTRAP', clear)).toBe('a');
  expect(updateAuthIdentity('a', session('a'), 'TOKEN_REFRESHED', clear)).toBe('a');
  expect(clear).not.toHaveBeenCalled();
  expect(updateAuthIdentity('a', session('b'), 'SIGNED_IN', clear)).toBe('b');
  expect(updateAuthIdentity('b', null, 'SIGNED_OUT', clear)).toBeNull();
  expect(clear).toHaveBeenCalledTimes(2);
});
