import type { SupabaseClient } from '@supabase/supabase-js';

export interface ApiAuthResponse {
  session?: { access_token?: string; refresh_token?: string };
  pendingEmailConfirmation?: boolean;
}

export async function applyApiAuthResponse(
  client: Pick<SupabaseClient, 'auth'>,
  result: ApiAuthResponse,
) {
  if (result.session) {
    const { access_token, refresh_token } = result.session;
    if (!access_token || !refresh_token) throw new Error('The API returned an incomplete session.');
    const { error } = await client.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
    return 'authenticated' as const;
  }
  if (result.pendingEmailConfirmation) return 'confirmation-required' as const;
  throw new Error('Account creation did not return a session.');
}
