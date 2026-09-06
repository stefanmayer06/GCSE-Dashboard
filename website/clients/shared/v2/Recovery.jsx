import { useEffect, useState } from "react";
import { supabase } from "../supabase.js";
const arrivedForRecovery =
  typeof window !== "undefined" &&
  /(?:[?#&])type=recovery(?:&|$)/.test(window.location.hash);
export function usePasswordRecovery() {
  const [recovering, setRecovering] = useState(arrivedForRecovery);
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return recovering;
}
export function ForgotPassword() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  if (!supabase) return null;
  return (
    <div className="password-help">
      <button
        type="button"
        className="link link-button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        Forgot your password?
      </button>
      {open && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(
                email,
                {
                  redirectTo: `${window.location.origin}${window.location.pathname}`,
                },
              );
              if (error) throw error;
              setMessage(
                "If this email has an account, a recovery link will arrive shortly.",
              );
            } catch (e) {
              setMessage(`Could not request a link: ${e.message}`);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="login-field">
            Account email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <button className="btn" disabled={busy}>
            {busy ? "Requesting link…" : "Send recovery link"}
          </button>
          <p role="status">{message}</p>
        </form>
      )}
    </div>
  );
}
export default function Recovery() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>A fresh way back in.</h1>
        {done ? (
          <>
            <p role="status">Your password has been updated.</p>
            <a className="btn btn-primary" href={window.location.pathname}>
              Return to learning
            </a>
          </>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (password !== confirm) {
                setMessage("Passwords do not match.");
                return;
              }
              setBusy(true);
              try {
                if (!supabase)
                  throw new Error("Password recovery is unavailable.");
                const { error } = await supabase.auth.updateUser({ password });
                if (error) throw error;
                setDone(true);
              } catch (e) {
                setMessage(`Could not update your password: ${e.message}`);
              } finally {
                setBusy(false);
              }
            }}
          >
            <p>Choose a new password of at least eight characters.</p>
            <label className="login-field">
              New password
              <input
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label className="login-field">
              Confirm new password
              <input
                type="password"
                minLength={8}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            {message && <p role="alert">{message}</p>}
            <button className="login-submit" disabled={busy}>
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
