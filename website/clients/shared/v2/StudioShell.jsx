import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

const destinations = [
  ["/", "Today", "home"],
  ["/learn", "Learn", "book"],
  ["/practice", "Practice", "practice"],
  ["/reflect", "Reflect", "reflect"],
  ["/chat", "Tutor", "tutor"],
];
const paths = {
  home: "M3 10 12 3l9 7v10H3Z M9 20v-7h6v7",
  book: "M12 5v16 M12 5C8 2 4 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-4-1-7-2-10 1Z",
  practice: "M8 3h8v4H8Z M8 5H4v16h16V5h-4 M8 12h8 M8 16h5",
  reflect: "M4 19h16 M6 15v-4 M12 15V5 M18 15V8",
  tutor: "M3 4h18v13H9l-6 4Z M7 9h10 M7 13h6",
  search: "M21 21l-6-6 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  account:
    "M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2 M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
};
export function Icon({ name }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.book} />
    </svg>
  );
}

export default function StudioShell({
  subject,
  auth,
  theme,
  toggleTheme,
  signOut,
  children,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [focus, setFocus] = useState(false);
  const studyRoute = /^\/(learn\/|practice)/.test(location.pathname);
  useEffect(() => {
    const shortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        navigate("/search");
      }
      if (event.key === "Escape") setFocus(false);
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [navigate]);
  useEffect(() => {
    setFocus(false);
    document.getElementById("study-main")?.focus({ preventScroll: true });
  }, [location.pathname]);
  return (
    <div
      data-subject={subject}
      className={`studio ${focus ? "studio-focus" : ""}`}
    >
      <a className="skip-link" href="#study-main">
        Skip to learning
      </a>
      <header className="studio-header">
        <a href="/" className="studio-brand" aria-label="Study Desk home">
          <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
            <path
              d="M4 7h10c5 0 8 3 8 8v10H12c-5 0-8-3-8-8Z"
              fill="currentColor"
            />
            <path
              d="M13 7h15v10c0 5-3 8-8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <span>
            study desk
            <span className="studio-brand-note">
              A little further, every day.
            </span>
          </span>
        </a>
        <label className="studio-subject">
          <span className="sr-only">Current subject</span>
          <select
            value={subject}
            onChange={(event) => {
              window.location.assign(`/${event.target.value}/`);
            }}
          >
            <option value="maths">Maths · Foundation</option>
            <option value="maths-higher">Maths · Higher</option>
            <option value="english">English Language</option>
          </select>
        </label>
        <div className="studio-tools">
          <Link
            to="/search"
            className="studio-tool"
            aria-label="Search topics and study tools"
          >
            <Icon name="search" />
            <span>Search</span>
            <kbd>⌘ K</kbd>
          </Link>
          <Link
            to="/settings"
            className="studio-tool"
            aria-label="Profile and settings"
          >
            <Icon name="account" />
          </Link>
        </div>
      </header>
      <aside className="studio-navigation sidebar">
        <nav aria-label="Main navigation">
          {destinations.map(([to, label, icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `studio-nav ${isActive || (to === "/reflect" && ["/notebook", "/summary", "/results", "/insights"].includes(location.pathname)) ? "active" : ""}`
              }
            >
              <Icon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="studio-nav-foot">
          <a className="subject-switch" href="/subjects">
            All subjects
          </a>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-pressed={theme === "dark"}
          >
            {theme === "dark" ? "Light appearance" : "Dark appearance"}
          </button>
          <button className="sign-out" onClick={signOut}>
            Sign out <span>{auth.username}</span>
          </button>
        </div>
      </aside>
      <main id="study-main" className="studio-main content" tabIndex={-1}>
        {studyRoute && (
          <div className="focus-control">
            <button
              className="btn"
              aria-pressed={focus}
              onClick={() => setFocus(!focus)}
            >
              {focus ? "Leave focus mode" : "Focus on this session"}
            </button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
