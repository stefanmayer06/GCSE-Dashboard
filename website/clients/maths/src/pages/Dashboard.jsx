import { useMemo } from 'react';
import { api } from '../api.js';
import { STRAND_COLORS } from '../colors.js';
import { useResource } from '../../../shared/resource-cache.js';
import DashboardHome from '../../../shared/DashboardHome.jsx';
import { flattenTopics, readiness } from '../../../shared/study.js';
import { dueMistakeRows, hydratePersonal } from '../../../shared/study-personal.js';
import { computeNextStep, weakTopics } from '../../../shared/next-step.js';

const STRAND_NAMES_LIST = [
  { id: 'number', name: 'Number' },
  { id: 'algebra', name: 'Algebra' },
  { id: 'ratio', name: 'Ratio & Proportion' },
  { id: 'geometry', name: 'Geometry & Measures' },
  { id: 'probability', name: 'Probability' },
  { id: 'statistics', name: 'Statistics' },
];

export default function Dashboard({ health, progress, higherTier = false, userId }) {
  // Cached per user: returning from Learn/Practice renders instantly.
  // Shared with the app shell palette + StudyDashboard: one fetch, three readers.
  const subject = higherTier ? 'maths-higher' : 'maths';
  const { data: topics } = useResource(userId ? `topics:${subject}:${userId}` : null, () => api.topics());
  const { data: personal } = useResource(userId ? `personal:${userId}:${subject}` : null, () => hydratePersonal(api, userId, subject));

  // 2.1 command centre: "What should I study next?" from data on hand.
  const flatTopics = useMemo(() => flattenTopics(topics, 'strands'), [topics]);
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
      readinessScore: evidence.ready ? evidence.score : null,
    };
  }, [flatTopics, progress, personal]);

  const mastery = useMemo(() => {
    if (!topics || !progress) return null;
    const stats = progress.topicStats || {};
    return STRAND_NAMES_LIST.map((s) => {
      let correct = 0;
      let total = 0;
      for (const t of topics.strands[s.id]?.topics || []) {
        const st = stats[t.id];
        if (st) {
          correct += st.correct;
          total += st.total;
        }
      }
      return {
        id: s.id,
        name: s.name,
        color: STRAND_COLORS[s.id],
        percent: total ? Math.round((100 * correct) / total) : null,
        answered: total,
      };
    });
  }, [topics, progress]);

  const papers = higherTier
    ? {
        blurb:
          'All three AQA Higher papers — built from the bank with balanced 8300H coverage, a difficulty ramp and stretch questions. Predicted grade from averaged past boundaries, worked solutions and revision links for everything you miss.',
        items: [
          { id: 1, code: '8300/1H', calc: false, blurb: 'Non-calculator. Exact methods, Number, Algebra and proof.', meta: '80 marks · 90 min', fullHref: '/practice?paper=1&type=full', shortHref: '/practice?paper=1&type=short', fullLabel: 'Full · 80 marks', shortLabel: 'Quick · 40 marks' },
          { id: 2, code: '8300/2H', calc: true, blurb: 'Calculator. Algebra, proportion, geometry and statistics.', meta: '80 marks · 90 min', fullHref: '/practice?paper=2&type=full', shortHref: '/practice?paper=2&type=short', fullLabel: 'Full · 80 marks', shortLabel: 'Quick · 40 marks' },
          { id: 3, code: '8300/3H', calc: true, blurb: 'Calculator. Advanced geometry, probability and balanced Higher coverage.', meta: '80 marks · 90 min', fullHref: '/practice?paper=3&type=full', shortHref: '/practice?paper=3&type=short', fullLabel: 'Full · 80 marks', shortLabel: 'Quick · 40 marks' },
        ],
      }
    : {
        blurb:
          'All three AQA Foundation papers — built from the bank with per-paper topic allocation, a difficulty ramp and stretch questions. Predicted grade from averaged past boundaries, worked solutions and revision links for everything you miss.',
        items: [
          { id: 1, code: '8300/1F', calc: false, blurb: 'Non-calculator. Number, Algebra, Ratio, Probability & Statistics.', meta: '80 marks · 90 min', fullHref: '/practice?paper=1&type=full', shortHref: '/practice?paper=1&type=short', fullLabel: 'Full · 80 marks', shortLabel: 'Quick · 40 marks' },
          { id: 2, code: '8300/2F', calc: true, blurb: 'Calculator. Algebra, Ratio, Geometry, Probability & Statistics.', meta: '80 marks · 90 min', fullHref: '/practice?paper=2&type=full', shortHref: '/practice?paper=2&type=short', fullLabel: 'Full · 80 marks', shortLabel: 'Quick · 40 marks' },
          { id: 3, code: '8300/3F', calc: true, blurb: 'Calculator. Number, Ratio, Geometry, Probability & Statistics.', meta: '80 marks · 90 min', fullHref: '/practice?paper=3&type=full', shortHref: '/practice?paper=3&type=short', fullLabel: 'Full · 80 marks', shortLabel: 'Quick · 40 marks' },
        ],
      };

  return (
    <DashboardHome
      subjectKey={subject}
      title="Your Maths revision"
      subtitle={`AQA GCSE Maths ${higherTier ? 'Higher' : 'Foundation'} — train like it’s exam day.`}
      headChip={
        health ? (
          <div className="head-chip">
            <span className="dot-live" /> {health.bankSize?.toLocaleString()} questions live
          </div>
        ) : null
      }
      progress={progress}
      topics={flatTopics}
      nextStep={nextStep}
      userId={userId}
      api={api}
      diagnosticUrl="/practice?diagnostic=1#adhoc"
      foundation={!higherTier}
      masteryRows={mastery}
      masteryLoading={!mastery && !!progress}
      masteryEmptyHint="No mastery data yet — accuracy appears here, weakest first, once you answer questions in papers, lessons or mixed rounds."
      masteryTitle="Mastery by strand — weakest first"
      papers={papers}
      adhoc={{
        title: 'Mixed practice',
        copy: 'Ad-hoc questions mixed from all three papers — 10, 15 or 20 at a time.',
        cta: 'Start a mixed round →',
        href: '/practice#adhoc',
      }}
    />
  );
}
