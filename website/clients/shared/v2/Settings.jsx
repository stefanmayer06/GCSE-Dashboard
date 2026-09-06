import { useEffect, useState } from "react";
import { useResource, invalidateResources } from "../resource-cache.js";
import { hydratePersonal } from "../study-personal.js";
export default function Settings({
  api,
  subject,
  userId,
  auth,
  theme,
  toggleTheme,
  signOut,
}) {
  const { data, error, refresh } = useResource(
    `personal:${userId}:${subject}`,
    () => hydratePersonal(api, userId, subject),
  );
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data)
      setDraft({
        examDate: "",
        targetGrade: "",
        passMode: "balanced",
        ...data.preferences,
      });
  }, [data]);
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await api.savePreferences(draft);
      invalidateResources("personal:");
      setMessage("Your study preferences are saved.");
    } catch (e) {
      setMessage(`Could not save: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page settings-page">
      <header className="page-head">
        <div>
          <h1>Make this space yours.</h1>
          <p className="sub">
            Signed in as {auth.username || auth.email}. Your subject goals
            follow your account.
          </p>
        </div>
      </header>
      {error && (
        <p role="alert">
          Could not load preferences.{" "}
          <button className="btn" onClick={refresh}>
            Try again
          </button>
        </p>
      )}
      <section className="settings-section">
        <h2>Your revision goal</h2>
        {draft ? (
          <form onSubmit={save}>
            <label>
              Exam date
              <input
                type="date"
                value={draft.examDate || ""}
                onChange={(e) =>
                  setDraft({ ...draft, examDate: e.target.value })
                }
              />
            </label>
            <label>
              Target grade
              <select
                value={draft.targetGrade || ""}
                onChange={(e) =>
                  setDraft({ ...draft, targetGrade: e.target.value })
                }
              >
                <option value="">Still deciding</option>
                {(subject === "maths"
                  ? [1, 2, 3, 4, 5]
                  : subject === "maths-higher"
                    ? [4, 5, 6, 7, 8, 9]
                    : [1, 2, 3, 4, 5, 6, 7, 8, 9]
                ).map((g) => (
                  <option key={g} value={String(g)}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </label>
            {subject === "maths" && (
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={draft.passMode === "foundation-pass"}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      passMode: e.target.checked
                        ? "foundation-pass"
                        : "balanced",
                    })
                  }
                />
                Focus on core skills for a grade 4
              </label>
            )}
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Save my preferences"}
            </button>
            <p role="status">{message}</p>
          </form>
        ) : (
          !error && <p role="status">Loading your preferences…</p>
        )}
      </section>
      <section className="settings-section">
        <h2>Comfort & appearance</h2>
        <p>
          Choose the light that suits your study space. Your device’s
          reduced-motion setting is respected.
        </p>
        <button
          className="btn"
          onClick={toggleTheme}
          aria-pressed={theme === "dark"}
        >
          {theme === "dark" ? "Use light appearance" : "Use dark appearance"}
        </button>
      </section>
      <section className="settings-section">
        <h2>Your account</h2>
        <div className="study-actions">
          <a href="/support">Help & support</a>
          <a href="/feedback">Share feedback</a>
          <a href="/privacy">Privacy</a>
          <a href="/delete-account">Delete account</a>
        </div>
        <button className="btn" onClick={signOut}>
          Sign out
        </button>
      </section>
    </div>
  );
}
