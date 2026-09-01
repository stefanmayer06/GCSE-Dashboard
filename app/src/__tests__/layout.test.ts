import type { Session } from '@supabase/supabase-js';
import { authRedirect } from '../../app/_layout';

const session = { user: { id: 'user-1' } } as Session;

test.each([
  [null, ['(tabs)'], '/auth/sign-in'],
  [null, ['auth', 'sign-in'], null],
  [session, ['auth', 'sign-in'], '/'],
  [session, ['auth', 'recover'], null],
  [session, ['(tabs)'], null],
] as const)('selects the render-time auth redirect for %p at %p', (authSession, segments, expected) => {
  expect(authRedirect(authSession, [...segments])).toBe(expected);
});
