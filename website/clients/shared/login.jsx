import { useEffect, useState } from 'react';
import { supabase } from './supabase.js';

export default function LoginScreen({ subjectName, tag, letter, authApi, onSignedIn }) {
  const [mode, setMode] = useState('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirm, setNewConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [oauth, setOauth] = useState(false);
  const [provider, setProvider] = useState('OAuth');
  const [authDriver, setAuthDriver] = useState(supabase ? 'supabase' : 'legacy');

  useEffect(() => {
    authApi
      .config()
      .then((c) => {
        setOauth(!!c.oauth);
        if (c.provider) setProvider(c.provider);
        if (c.driver) setAuthDriver(c.driver);
      })
      .catch(() => {});
  }, [authApi]);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setPassword('');
    setConfirm('');
    setNewPassword('');
    setNewConfirm('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const supabaseAuth = authDriver === 'supabase';
    const isClaim = mode === 'claim';
    const isSignup = mode === 'signup';
    if ((!supabaseAuth && !username) || (supabaseAuth && !email) || !password) {
      setError(supabaseAuth ? 'Enter your email and password.' : 'Enter your username and password.');
      return;
    }
    if (supabaseAuth && (isSignup || isClaim) && !username) {
      setError('Choose a username.');
      return;
    }
    if (isSignup && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (isClaim) {
      if (newPassword.length < 8) {
        setError('Your new password must be at least 8 characters.');
        return;
      }
      if (newPassword !== newConfirm) {
        setError('Passwords do not match.');
        return;
      }
    } else if (isSignup && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data =
        isClaim
          ? await authApi.claim({ username, email, currentPassword: password, newPassword })
          : isSignup
          ? await authApi.signup({ username, email, password })
          : await authApi.login(supabaseAuth ? email : username, password);
      if (data.pendingEmailConfirmation) {
        setError('Check your email to confirm your account, then sign in.');
        setMode('signin');
        return;
      }
      onSignedIn(data.user);
    } catch (err) {
      setError(err.message || (mode === 'signup' ? 'Sign up failed.' : 'Sign in failed.'));
    } finally {
      setBusy(false);
    }
  };

  const next = `${window.location.pathname}${window.location.search}`;
  const isSignup = mode === 'signup';
  const isClaim = mode === 'claim';

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-letter" aria-hidden="true">{letter}</span>
          <div>
            <div className="login-brand-name">{subjectName}</div>
            <div className="login-brand-tag">{tag}</div>
          </div>
        </div>
        <h1>{isClaim ? 'Move your account' : isSignup ? 'Create an account' : 'Sign in'}</h1>
        <p className="login-sub">
          {isClaim
            ? 'Move your existing progress into a secure account. Your old password verifies the transfer; choose a new password below.'
            : authDriver === 'supabase'
              ? 'Use your email to keep one secure account across every Study Desk subject.'
            : isSignup
              ? 'Make a local account to keep your progress and papers on this device.'
              : 'Your progress and papers are stored locally and follow this account.'}
        </p>
        {error && (
          <div className="login-error" role="alert">{error}</div>
        )}
        <form onSubmit={submit}>
          {(authDriver !== 'supabase' || isSignup || isClaim) && (
            <label className="login-field">
              <span>Username</span>
              <input
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                minLength={3}
                maxLength={32}
                required
              />
            </label>
          )}
          {authDriver === 'supabase' && (
            <label className="login-field">
              <span>Email address</span>
              <input
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
          )}
          <label className="login-field">
              <span>{isClaim ? 'Old password' : 'Password'}</span>
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={isSignup ? 8 : undefined}
              required
            />
          </label>
          {isClaim && (
            <>
              <label className="login-field">
                <span>New password</span>
                <input
                  name="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <label className="login-field">
                <span>Confirm new password</span>
                <input
                  name="new-confirm"
                  type="password"
                  value={newConfirm}
                  onChange={(e) => setNewConfirm(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
            </>
          )}
          {isSignup && (
            <label className="login-field">
              <span>Confirm password</span>
              <input
                name="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
          )}
          <button className="login-submit" type="submit" disabled={busy}>
            {busy
              ? (isClaim ? 'Moving account…' : isSignup ? 'Creating account…' : 'Signing in…')
              : isClaim ? 'Move account' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>
        {oauth && !isClaim && (
          <a className="login-oauth" href={`/api/auth/oauth?next=${encodeURIComponent(next)}`}>
            Continue with {provider}
          </a>
        )}
        {!isClaim && (
          <button type="button" className="login-switch" onClick={() => switchMode(isSignup ? 'signin' : 'signup')}>
            {isSignup ? 'Already have an account? Sign in' : 'New here? Create an account'}
          </button>
        )}
        {authDriver === 'supabase' && (
          <button
            type="button"
            className="login-switch"
            onClick={() => switchMode(isClaim ? 'signin' : 'claim')}
          >
            {isClaim ? 'Back to sign in' : 'Move an existing account'}
          </button>
        )}
        <p className="login-local">
          {authDriver === 'supabase' ? 'Secure account · shared across subjects' : 'Local account · data stored on this device'}
        </p>
      </div>
    </div>
  );
}
