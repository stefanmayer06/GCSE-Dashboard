import { useMemo } from 'react';
import { api } from '../api.js';
import { useResource } from '../../../shared/resource-cache.js';
import TodayHome from '../../../shared/TodayHome.jsx';
import { flattenTopics, readiness } from '../../../shared/study.js';
import { dueMistakeRows, hydratePersonal } from '../../../shared/study-personal.js';
import { computeNextStep, weakTopics } from '../../../shared/next-step.js';

export default function Dashboard({ progress, userId }) {
  // Cached per user: returning from Learn/Practice renders instantly.
  // Shared with the app shell + Today: one fetch, several readers.
  const { data: topics } = useResource(userId ? `topics:english:${userId}` : null, () => api.topics());
  const { data: personal } = useResource(userId ? `personal:${userId}:english` : null, () => hydratePersonal(api, userId, 'english'));

  // "What should I study next?" from data on hand.
  const flatTopics = useMemo(() => flattenTopics(topics, 'sections'), [topics]);
  const nextStep = useMemo(() => {
    const mistakes = personal?.mistakes ?? [];
    let dueCount = 0;
    try {
      dueCount = dueMistakeRows(mistakes).length;
    } catch {}
    const examDate = personal?.preferences?.examDate;
    const examDays = examDate ? Math.ceil((new Date(`${examDate}T12:00:00`) - new Date()) / 86400000) : null;
    const evidence = readiness(progress);
    return {
      step: progress && personal ? computeNextStep({ topics: flatTopics, progress, personal, dueCount, options: { examDays } }) : null,
      weak: weakTopics(flatTopics, progress, 3),
      dueCount,
      examDays,
      examDate: examDate || null,
      readinessScore: evidence.ready ? evidence.score : null,
    };
  }, [flatTopics, progress, personal]);

  return (
    <TodayHome
      subjectKey="english"
      progress={progress}
      topics={flatTopics}
      nextStep={nextStep}
      userId={userId}
      api={api}
    />
  );
}
