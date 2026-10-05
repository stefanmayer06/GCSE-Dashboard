import { api } from '../api.js';
import { useResource } from '../../../shared/resource-cache.js';
import CourseMap, { recommendTile } from '../../../shared/CourseMap.jsx';

export default function Learn({ userId }) {
  const higherTier = window.location.pathname.startsWith('/maths-higher');
  const subject = higherTier ? 'maths-higher' : 'maths';
  const { data, error } = useResource(userId ? `topics:${subject}:${userId}` : null, () => api.topics());
  const groups = data ? Object.values(data.strands).filter((strand) => strand.topics?.length) : [];

  return (
    <div className="page learn-page">
      {!data && !error && <div className="loading">Loading your map…</div>}
      {error && !data && <div className="loading">Could not load topics. Check your connection and try again.</div>}
      {data ? (
        <CourseMap
          groups={groups}
          title="Learn"
          sub={`Every AQA ${higherTier ? 'Higher' : 'Foundation'} topic, unit by unit. Each lesson is watch, learn, practise, and replays earn all three stars.`}
          recommendedId={recommendTile(groups)}
          bossLabel="Sit a timed paper"
        />
      ) : null}
    </div>
  );
}
