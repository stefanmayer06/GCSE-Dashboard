import { Link } from "react-router-dom";
import { useResource } from "../resource-cache.js";
import { StudyDashboard } from "../StudyTools.jsx";
import { flattenTopics, priorityTopics } from "../study.js";

export default function LearningHome({ api, subject, userId, progress }) {
  const { data, error, refresh } = useResource(
    `topics:${subject}:${userId}`,
    () => api.topics(),
  );
  const topics = flattenTopics(
    data,
    subject === "english" ? "sections" : "strands",
  );
  const next = priorityTopics(topics, progress).slice(0, 3);
  return (
    <div className="page learning-home">
      <header className="home-heading">
        <h1>
          Make room for
          <br />
          <em>understanding.</em>
        </h1>
        <p>
          One idea. A little practice. A clearer picture.
          <br />
          Your next step is here.
        </p>
      </header>
      {error && (
        <div className="studio-notice" role="alert">
          Your topics could not be refreshed.{" "}
          <button className="btn" onClick={refresh}>
            Try again
          </button>
        </div>
      )}
      <StudyDashboard
        userId={userId}
        subject={subject}
        topics={topics}
        progress={progress}
        diagnosticUrl="/practice?diagnostic=1#adhoc"
        foundation={subject === "maths"}
        api={api}
      />
      <section className="home-explore">
        <div>
          <h2>Ideas worth another look</h2>
          <p className="sub">
            Your least practised topics, with a clear way in.
          </p>
          <Link className="link" to="/learn">
            Explore your topic map →
          </Link>
        </div>
        <div className="home-topic-list">
          {next.map((topic) => (
            <Link to={`/learn/${topic.id}`} key={topic.id}>
              <span>
                <strong>{topic.name}</strong>
                <small>
                  {topic.blurb ||
                    "Read the method, try it, and check your understanding."}
                </small>
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
          {!next.length && (
            <p className="sub">
              Your course topics will appear here as soon as they load. You can
              also choose a practice paper.
            </p>
          )}
        </div>
      </section>
      <div className="learning-invitation">
        <h2>There’s more than one way in.</h2>
        <Link to="/practice">Try exam practice →</Link>
        <Link to="/chat">Talk it through with your tutor →</Link>
        {subject === "english" && <Link to="/texts">Read a source text →</Link>}
      </div>
    </div>
  );
}
