import { useEffect, useState } from 'react';

export default function LoginScreen({ subjectName, tag, letter, authApi, onSignedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

  const submit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Enter your username and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await authApi.login(username, password);
      onSignedIn(data.user);
    } catch (err) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  const next = `${window.location.pathname}${window.location.search}`;

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
        <h1>Sign in</h1>
        <p className="login-sub">Your progress, papers and tutor history are stored locally and follow this account.</p>
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
              autoComplete="current-password"
              required
            />
          </label>
          <button className="login-submit" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        {oauth && (
          <a className="login-oauth" href={`/api/auth/oauth?next=${encodeURIComponent(next)}`}>
            Continue with {provider}
          </a>
        )}
        <p className="login-local">Local account · data stored on this device</p>
      </div>
    </div>
  );
}