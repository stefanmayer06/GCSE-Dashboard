import { useEffect, useState } from 'react';
import { supabase } from './supabase.js';
import Emblem from './circuit/Emblem.jsx';
import Icon from './circuit/Icon.jsx';
import Pip from './circuit/Pip.jsx';
import { SubjectScene } from './circuit/Scenes.jsx';
import { subjectFromPath } from './circuit/palette.js';

export default function LoginScreen({ subjectName, tag, letter, authApi, onSignedIn }) {
  const [mode, setMode] = useState('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirm, setConfirm] = useState('');
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
  };

  const submit = async (e) => {
    e.preventDefault();
    const supabaseAuth = authDriver === 'supabase';
    const isSignup = mode === 'signup';
    if ((!supabaseAuth && !username) || (supabaseAuth && !email) || !password) {
      setError(supabaseAuth ? 'Enter your email and password.' : 'Enter your username and password.');
      return;
    }
    if (supabaseAuth && isSignup && !username) {
      setError('Choose a username.');
      return;
    }
    if (isSignup && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (isSignup && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = isSignup
        ? await authApi.signup({
            username,
            email,
            password,
            source: (() => {
              const value = new URLSearchParams(window.location.search).get('src') || '';
              return /^[a-z0-9][a-z0-9_-]{0,59}$/i.test(value) ? value : 'direct';
            })(),
          })
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

  const subject = subjectFromPath();
  return (
    <div className="login-screen">
      <aside className="login-stage" aria-hidden="true">
        <div className="login-stage-brand">
          <Emblem topicId={`subject:${subjectName}`} strand={subject === 'english' ? 'reading' : subject === 'maths-higher' ? 'algebra' : 'number'} layers={3} ring={false} size={34} />
          <span>GCSE Study Desk</span>
        </div>
        <div className="login-stage-art">
          <SubjectScene subject={subject} />
        </div>
        <p className="login-stage-line">Learn it. <em>Play</em> with it. Replay it until it sticks.</p>
        <ul className="login-stage-points">
          <li><Icon name="play" size={16} /> Interactive explainers that stop and ask you</li>
          <li><Icon name="learn" size={16} /> A map of levels — every topic earns stars</li>
          <li><Icon name="notebook" size={16} /> Misses come back for a scheduled retry</li>
        </ul>
        <Pip mood="happy" size={70} className="login-pip" bob />
      </aside>
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
          {authDriver === 'supabase'
            ? 'Use your email to keep one secure account across every Study Desk subject.'
            : isSignup
              ? 'One account keeps your progress in every Study Desk subject.'
              : 'Welcome back. One account covers every Study Desk subject.'}
        </p>
        {error && (
          <div className="login-error" role="alert">{error}</div>
        )}
        <form onSubmit={submit}>
          {(authDriver !== 'supabase' || isSignup) && (
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
            <span>Password</span>
            <span className="login-passwrap">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                minLength={isSignup ? 8 : undefined}
                required
              />
              <button
                type="button"
                className="login-show"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
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
            {busy
              ? (isSignup ? 'Creating account…' : 'Signing in…')
              : isSignup ? 'Create account' : 'Sign in'}
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
        <p className="login-local">
          {authDriver === 'supabase' ? 'Secure account · shared across subjects' : 'Local account · data stored on this device'}
        </p>
        <p className="login-trust">Your progress is private and follows your account.</p>
      </div>
    </div>
  );
}
