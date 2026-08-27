import { applyApiAuthResponse } from '../auth';

function client(setSession: jest.Mock) {
  return { auth: { setSession } } as never;
}

test('imports an API-issued Supabase session before continuing', async () => {
  const setSession = jest.fn().mockResolvedValue({ error: null });
  await expect(applyApiAuthResponse(client(setSession), {
    session: { access_token: 'access', refresh_token: 'refresh' },
  })).resolves.toBe('authenticated');
  expect(setSession).toHaveBeenCalledWith({ access_token: 'access', refresh_token: 'refresh' });
});

test('surfaces a session import failure', async () => {
  const error = new Error('Invalid JWT issuer');
  await expect(applyApiAuthResponse(client(jest.fn().mockResolvedValue({ error })), {
    session: { access_token: 'access', refresh_token: 'refresh' },
  })).rejects.toBe(error);
});

test('accepts confirmation-required signup responses but rejects empty responses', async () => {
  const authClient = client(jest.fn());
  await expect(applyApiAuthResponse(authClient, { pendingEmailConfirmation: true }))
    .resolves.toBe('confirmation-required');
  await expect(applyApiAuthResponse(authClient, {}))
    .rejects.toThrow('did not return a session');
});
