import { useMemo } from 'react';
import { api } from '../api.js';
import { SECTION_NAMES } from '../colors.js';
import { useResource } from '../../../shared/resource-cache.js';
import DashboardHome from '../../../shared/DashboardHome.jsx';
import { flattenTopics, readiness } from '../../../shared/study.js';
import { dueMistakeRows, hydratePersonal } from '../../../shared/study-personal.js';
import { computeNextStep, weakTopics } from '../../../shared/next-step.js';

export default function Dashboard({ health, progress, userId }) {
  // Cached per user: returning from Learn/Practice renders instantly.
  // Shared with the app shell palette + StudyDashboard: one fetch, three readers.
  const { data: topics } = useResource(userId ? `topics:english:${userId}` : null, () => api.topics());
  const { data: personal } = useResource(userId ? `personal:${userId}:english` : null, () => hydratePersonal(api, userId, 'english'));

  // 2.1 command centre: "What should I study next?" from data on hand.
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
      step: computeNextStep({ topics: flatTopics, progress, personal, dueCount, options: { examDays } }),
      weak: weakTopics(flatTopics, progress, 3),
      dueCount,
      examDays,
      examDate: examDate || null,
      readinessScore: evidence.ready ? evidence.score : null,
    };
  }, [flatTopics, progress, personal]);

  const mastery = useMemo(() => {
    if (!topics || !progress) return null;
    const stats = progress.topicStats || {};
    return Object.entries(SECTION_NAMES).map(([id, name]) => {
      let correct = 0;
      let total = 0;
      for (const t of topics.sections[id]?.topics || []) {
        const st = stats[t.id];
        if (st) {
          correct += st.correct;
          total += st.total;
        }
      }
      return {
        id,
        name,
        color: id === 'reading' ? '#7c5cff' : '#e8b44c',
        percent: total ? Math.round((100 * correct) / total) : null,
        answered: total,
      };
    });
  }, [topics, progress]);

  return (
    <DashboardHome
      subjectKey="english"
      title="Your English revision"
      subtitle="AQA GCSE English Language (8700). Practise both papers with the correct timings and AQA-style marking."
      headChip={
        health ? (
          <div className="head-chip">
            <span className="dot-live" /> {health.texts} source texts · {health.aiMarking ? 'AI marking ready' : 'AI marking needs a key'}
          </div>
        ) : null
      }
      progress={progress}
      topics={flatTopics}
      nextStep={nextStep}
      userId={userId}
      api={api}
      diagnosticUrl="/practice?diagnostic=1#adhoc"
      masteryRows={mastery}
      masteryLoading={!mastery && !!progress}
      masteryEmptyHint="Answer questions in papers, drills or quick-fire rounds to see your topic accuracy here."
      masteryTitle="How you’re doing by skill"
      papers={{
        blurb:
          'Practise either English Language paper with the correct marks and 1 hour 45 minute timing. You’ll get AQA-style feedback, model answers and clear areas to work on next.',
        items: [
          { id: 1, code: '8700/1', calc: true, calcLabel: 'Fiction extract', blurb: 'Explorations in Creative Reading and Writing. Q1 list (4) · Q2 language (8) · Q3 structure (8) · Q4 evaluate (20) · Q5 creative writing (40).', meta: '80 marks · 1h 45', fullHref: '/practice?paper=1&type=full', shortHref: '/practice?paper=1&type=short', fullLabel: 'Full · 80 marks · 1h45', shortLabel: 'Quick · Q1+Q5 · 50 min' },
          { id: 2, code: '8700/2', calc: true, calcLabel: 'Two sources', blurb: 'Writers’ Viewpoints and Perspectives. Q1 true/false (4) · Q2 summary (8) · Q3 language (12) · Q4 compare (16) · Q5 writing to argue (40).', meta: '80 marks · 1h 45', fullHref: '/practice?paper=2&type=full', shortHref: '/practice?paper=2&type=short', fullLabel: 'Full · 80 marks · 1h45', shortLabel: 'Quick · Q1+Q5 · 50 min' },
        ],
      }}
      adhoc={{
        title: 'Quick-fire practice',
        copy: 'Try a short set of list, true or false, and language questions using texts from the bank.',
        cta: 'Choose questions →',
        href: '/practice#adhoc',
      }}
    />
  );
}
