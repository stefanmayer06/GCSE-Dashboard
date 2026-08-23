import { useEffect, useState } from 'react';

export default function LoginScreen({ subjectName, tag, letter, authApi, onSignedIn }) {
  const [mode, setMode] = useState('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [oauth, setOauth] = useState(false);
  const [provider, setProvider] = useState('OAuth');

  useEffect(() => {
    authApi
      .config()
      .then((c) => {
        setOauth(!!c.oauth);
        if (c.provider) setProvider(c.provider);
      })
      .catch(() => {});
  }, [authApi]);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setPassword('');
    setConfirm('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Enter your username and password.');
      return;
    }
    if (mode === 'signup') {
      if (password !== confirm) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
    }
    setBusy(true);
    setError('');
    try {
      const data =
        mode === 'signup'
          ? await authApi.signup(username, password)
          : await authApi.login(username, password);
      onSignedIn(data.user);
    } catch (err) {
      setError(err.message || (mode === 'signup' ? 'Sign up failed.' : 'Sign in failed.'));
    } finally {
      setBusy(false);
    }
  };

  const next = `${window.location.pathname}${window.location.search}`;
  const isSignup = mode === 'signup';

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
        <h1>{isSignup ? 'Create an account' : 'Sign in'}</h1>
        <p className="login-sub">
          {isSignup
            ? 'Make a local account to keep your progress, papers and tutor history on this device.'
            : 'Your progress, papers and tutor history are stored locally and follow this account.'}
        </p>
        {error && (
          <div className="login-error" role="alert">{error}</div>
        )}
        <form onSubmit={submit}>
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
          <label className="login-field">
            <span>Password</span>
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
            {busy ? (isSignup ? 'Creating account…' : 'Signing in…') : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>
        {oauth && (
          <a className="login-oauth" href={`/api/auth/oauth?next=${encodeURIComponent(next)}`}>
            Continue with {provider}
          </a>
        )}
        <button type="button" className="login-switch" onClick={() => switchMode(isSignup ? 'signin' : 'signup')}>
          {isSignup ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
        <p className="login-local">Local account · data stored on this device</p>
      </div>
    </div>
  );
}