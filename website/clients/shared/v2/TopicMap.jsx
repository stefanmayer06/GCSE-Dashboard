import { useState } from "react";
import { Link } from "react-router-dom";
import { useResource } from "../resource-cache.js";
export function topicState(topic) {
  if (topic.accuracy == null) return "Not practised";
  if (topic.accuracy < 40) return "Needs attention";
  if (topic.accuracy < 70) return "Developing";
  return "Strong";
}
export default function TopicMap({ api, subject, userId }) {
  const { data, error, refresh } = useResource(
    `topics:${subject}:${userId}`,
    () => api.topics(),
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All topics");
  const groups = Object.values(data?.strands || data?.sections || {});
  let count = 0;
  return (
    <div className="page topic-map">
      <header className="page-head">
        <div>
          <h1>
            A clearer picture,
            <br />
            one idea at a time.
          </h1>
          <p className="sub">
            Explore the course. Find a method. Put it into practice.
          </p>
        </div>
        {subject === "english" && (
          <Link className="btn" to="/texts">
            Open source library
          </Link>
        )}
      </header>
      <div className="map-controls">
        <label className="studio-search">
          <span>Find a topic</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your course…"
          />
        </label>
        <div
          className="map-filters"
          role="group"
          aria-label="Filter topics by evidence"
        >
          {["All topics", "Needs attention", "Not practised", "Strong"].map(
            (f) => (
              <button
                key={f}
                className={filter === f ? "selected" : ""}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ),
          )}
        </div>
      </div>
      <p className="map-legend">
        States describe marked-answer accuracy: needs attention below 40%,
        developing below 70%, strong from 70%. A completed lesson is separate
        from demonstrated understanding.
      </p>
      {error && (
        <div role="alert">
          Your topic map could not be refreshed.{" "}
          <button className="btn" onClick={refresh}>
            Try again
          </button>
        </div>
      )}
      {!data && !error && <p role="status">Opening your course…</p>}
      {groups.map((group) => {
        const topics = group.topics.filter(
          (t) =>
            `${t.name} ${t.blurb}`
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (filter === "All topics" || topicState(t) === filter),
        );
        count += topics.length;
        if (!topics.length) return null;
        return (
          <section className="map-group strand-panel" key={group.id}>
            <div className="map-group-heading">
              <h2>{group.name}</h2>
              <p>{group.blurb}</p>
              <span>{topics.length} topics</span>
            </div>
            <div className="map-topics">
              {topics.map((t) => (
                <Link className="map-topic" to={`/learn/${t.id}`} key={t.id}>
                  <span
                    className={`map-evidence state-${topicState(t).toLowerCase().replaceAll(" ", "-")}`}
                    aria-hidden="true"
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <i
                        key={i}
                        className={
                          t.accuracy != null && t.accuracy > i * 25
                            ? "filled"
                            : ""
                        }
                      />
                    ))}
                  </span>
                  <div>
                    <h3>{t.name}</h3>
                    <p>{t.blurb}</p>
                    <small>
                      {topicState(t)}
                      {t.accuracy != null ? ` · ${t.accuracy}% accuracy` : ""}
                      {t.completed ? " · Lesson completed" : ""}
                    </small>
                  </div>
                  <span className="map-go" aria-hidden="true">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      {data && count === 0 && (
        <div className="studio-empty">
          <h2>No topics match this view.</h2>
          <p>Clear your search or choose another evidence filter.</p>
          <button
            className="btn"
            onClick={() => {
              setQuery("");
              setFilter("All topics");
            }}
          >
            Show all topics
          </button>
        </div>
      )}
    </div>
  );
}
