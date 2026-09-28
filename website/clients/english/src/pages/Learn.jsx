import { api } from '../api.js';
import { useResource } from '../../../shared/resource-cache.js';
import CourseMap, { recommendTile } from '../../../shared/CourseMap.jsx';

export default function Learn({ userId }) {
  const { data, error } = useResource(userId ? `topics:english:${userId}` : null, () => api.topics());
  const groups = data ? Object.values(data.sections).filter((section) => section.topics?.length) : [];

  return (
    <div className="page learn-page">
      {!data && !error && <div className="loading">Loading your map…</div>}
      {error && !data && <div className="loading">Could not load skills. Check your connection and try again.</div>}
      {data ? (
        <CourseMap
          groups={groups}
          title="English Language map"
          sub="Every skill behind the 8700 papers as a level: watch the explainer, learn the moves, practise, then replay to earn all three stars."
          recommendedId={recommendTile(groups)}
          bossLabel="Sit a full paper"
        />
      ) : null}
    </div>
  );
}
