import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { ApiClient } from '@/api';
import { Button, BackLink, DeskHeader, Notice, ScrollScreen, SectionHeader } from '@/components';
import { useAuth, usePreferences } from '@/providers';
import {
  GRADES,
  classifyMistake,
  dueMistakes,
  errorTypeLabel,
  gradeMistake,
  markWarmupDone,
  memriDue,
  saveCorrection,
  touchMistakes,
  type MistakeRow,
} from '@/notebook';
import { hydratePersonal } from '@/personal';
import { formatAnswerValue } from '@/review-format';
import { useTheme } from '@/theme';

const CLASSIFY_REASONS: { id: string; label: string }[] = [
  { id: 'knowledge', label: 'DID NOT KNOW IT' },
  { id: 'method', label: 'WRONG METHOD' },
  { id: 'misread', label: 'MISREAD IT' },
  { id: 'arithmetic', label: 'ARITHMETIC SLIP' },
  { id: 'timing', label: 'RAN OUT OF TIME' },
  { id: 'incomplete', label: 'MISSING EXPLANATION' },
];

const fixupTargets = (rows: MistakeRow[]) => {
  const ordered: string[] = [];
  for (const row of rows) {
    if (row.mastered || !row.topicId) continue;
    const due = row.dueDates?.[row.reviewIndex ?? 0];
    if (due && Date.parse(due) <= Date.now() && !ordered.includes(row.topicId) && ordered.length < 5) ordered.push(row.topicId);
  }
  return ordered;
};

export default function Notebook() {
  const { session } = useAuth();
  const { subject } = usePreferences();
  const { colors, subject: tokens } = useTheme();
  const [rows, setRows] = useState<MistakeRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const client = new ApiClient(subject);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoaded(false);
    setError('');
    hydratePersonal(client, session?.user.id, subject)
      .then(personal => { if (!active) return; setRows(personal.mistakes); setLoaded(true); })
      .catch(() => {
        if (!active) return;
        setError('The notebook could not be loaded. Check your connection and try again.');
        setLoaded(true);
      });
    return () => { active = false; };
    // The client is scoped to the active subject; reload whenever either identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, subject]));

  const visible = rows.filter(row => !row.mastered);
  const mastered = rows.filter(row => row.mastered);
  const due = new Set(dueMistakes(visible).map(row => row.id));
  const faded = memriDue(rows);

  async function save(next: MistakeRow[], event?: string, metadata: Record<string, unknown> = {}) {
    setRows(next);
    try {
      await client.saveMistakes(next);
      if (event) client.trackEvent(event, metadata);
    } catch (cause) {
      setError(cause instanceof Error ? `Notebook could not be saved: ${cause.message}` : 'Notebook could not be saved.');
    }
  }

  function grade(id: string, gradeId: string) {
    const next = gradeMistake(rows, id, gradeId);
    const row = next.find(item => item.id === id);
    void save(next, 'mistake_retry', { qid: row?.qid, reviewIndex: row?.reviewIndex ?? 0, grade: gradeId });
  }
  function classify(id: string, errorType: string) { void save(classifyMistake(rows, id, errorType)); }
  function warmup(id: string) { void save(markWarmupDone(rows, id)); }
  function correction(id: string) {
    const value = (drafts[id] ?? '').trim().slice(0, 500);
    void save(saveCorrection(rows, id, value), 'mistake_corrected', { id });
  }
  function resurrect(ids: string[]) {
    void save(touchMistakes(rows, ids), 'memri_complete', { count: ids.length }).then(() => {
      const targets = fixupTargets(rows);
      router.push({ pathname: '/practice', params: { memri: '1', targets: targets.join(','), touch: ids.join(',') } });
    });
  }

  return (
    <ScrollScreen>
      <BackLink label="BACK" />
      <DeskHeader title="Mistake notebook" eyebrow="ACCOUNT STUDY RECORD" />
      <Notice title="HOW THIS WORKS">
        Incorrect rows are copied from server marking and saved to your account. Tag why you missed
        each one, write the correction in your own words, then grade every retry: Again sees it
        tomorrow, Easy pushes it weeks out.
      </Notice>
      {error && <Notice kind="error" title="ACTION NOT COMPLETED">{error}</Notice>}
      <SectionHeader title="Captured mistakes" meta={`${due.size} DUE / ${visible.length} SAVED / ${mastered.length} MASTERED`} />
      {!loaded && <Notice kind="loading" title="LOADING NOTEBOOK">Reading your saved mistakes.</Notice>}
      {loaded && !error && visible.length === 0 && <Notice title="NO MISTAKES SAVED YET">Server-marked mistakes from a practice or paper session will appear here. Finish a session, then come back to tag why each answer went wrong.</Notice>}
      {due.size > 0 && (
        <Button onPress={() => {
          const targets = fixupTargets(rows);
          client.trackEvent('fixup_start', { topics: targets });
          router.push({ pathname: '/practice', params: { fixup: '1', targets: targets.join(',') } });
        }}>
          FIX-UP 5 · WEAK SPOTS
        </Button>
      )}
      {faded.length > 0 && (
        <View style={{ borderWidth: 1, borderLeftWidth: 6, borderColor: colors.positive, backgroundColor: colors.raised, padding: 14, gap: 8 }}>
          <Text style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: '800', color: colors.positive }}>
            MEMORY CHECK · {faded.length} FADED
          </Text>
          <Text style={{ fontSize: 16, color: colors.ink }}>
            {faded.slice(0, 3).map(row => row.topicName).join(' · ')}{faded.length > 3 ? ` +${faded.length - 3} more` : ''} — mastered over 30 days ago. One mixed set keeps them honest.
          </Text>
          <Button variant="secondary" onPress={() => resurrect(faded.map(row => row.id))}>START MEMORY CHECK</Button>
        </View>
      )}
      {visible.map(row => {
        const reviewIndex = row.reviewIndex ?? 0;
        const dueDate = row.dueDates?.[reviewIndex];
        const label = errorTypeLabel(row.errorType);
        return (
          <View key={row.id} style={{ borderWidth: 1, borderLeftWidth: due.has(row.id) ? 6 : 1, borderColor: due.has(row.id) ? tokens.accent : colors.strong, backgroundColor: colors.raised, padding: 14, gap: 8 }}>
            <Text style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: '800', color: tokens.accent }}>
              {due.has(row.id) ? 'DUE TO RETRY' : 'SCHEDULED'} / {row.topicName}{label ? ` / ${label.toUpperCase()}` : ''}{row.lastGrade ? ` / LAST TRY ${row.lastGrade.toUpperCase()}` : ''}
            </Text>
            <Text style={{ fontFamily: 'serif', fontSize: 20, color: colors.ink }}>{row.prompt}</Text>
            {row.answer !== undefined && <Text style={{ color: colors.quiet }}>Your answer: {formatAnswerValue(row.answer)}</Text>}
            {row.correctAnswer && <Text style={{ color: colors.ink }}>Correct answer: {row.correctAnswer}</Text>}
            <Text style={{ color: colors.quiet }}>Retry {reviewIndex}/{row.dueDates.length}{row.warmupCount ? ` · warm-ups ${row.warmupCount}` : ''}{dueDate ? ` · next review ${new Date(dueDate).toLocaleDateString()}` : ''}</Text>
            {(row.workedSolution?.length ?? 0) > 0 && (
              <View style={{ borderWidth: 1, borderColor: colors.strong, backgroundColor: colors.paper, padding: 10, gap: 2 }}>
                <Text style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: '800', color: colors.quiet }}>WORKED METHOD</Text>
                {row.workedSolution!.map((step, index) => <Text key={index} style={{ color: colors.ink, fontSize: 13 }}>Step {index + 1}: {step}</Text>)}
              </View>
            )}
            <Text style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: '800', color: colors.quiet }}>WHY DID YOU MISS IT?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {CLASSIFY_REASONS.map(reason => {
                const on = row.errorType === reason.id;
                return (
                  <Button key={reason.id} variant={on ? 'primary' : 'secondary'} onPress={() => classify(row.id, reason.id)}>
                    {reason.label}
                  </Button>
                );
              })}
            </View>
            <Text style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: '800', color: colors.quiet }}>CORRECTION IN YOUR OWN WORDS</Text>
            <TextInput
              accessibilityLabel={`Correction for ${row.topicName}`}
              value={drafts[row.id] ?? row.correction ?? ''}
              onChangeText={value => setDrafts(previous => ({ ...previous, [row.id]: value }))}
              placeholder="e.g. Cross-multiply first, then solve."
              placeholderTextColor={colors.quiet}
              maxLength={500}
              multiline
              style={{ minHeight: 56, borderWidth: 1, borderColor: colors.strong, backgroundColor: colors.paper, color: colors.ink, padding: 10, fontSize: 14 }}
            />
            <Button variant="secondary" onPress={() => correction(row.id)}>SAVE CORRECTION</Button>
            <Text style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: '800', color: colors.quiet }}>RETRIED IT? GRADE YOUR RECALL</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {GRADES.map(option => (
                <Button key={option.id} variant={row.lastGrade === option.id ? 'primary' : 'secondary'} onPress={() => grade(row.id, option.id)}>
                  {option.label}
                </Button>
              ))}
            </View>
            {row.topicId && <Button variant="secondary" onPress={() => router.push({ pathname: '/practice', params: { topicId: row.topicId } })}>{row.warmupCount ? 'WARM-UP AGAIN' : 'WARM-UP MICRO-PRACTICE'}</Button>}
            {row.topicId && <Button variant="secondary" onPress={() => warmup(row.id)}>LOG WARM-UP DONE</Button>}
          </View>
        );
      })}
      {mastered.length > 0 && (
        <SectionHeader title="Mastered" meta={`${mastered.length} PROVEN`} />
      )}
      {mastered.slice(0, 10).map(row => (
        <View key={row.id} style={{ borderWidth: 1, borderColor: colors.strong, backgroundColor: colors.raised, padding: 14, gap: 4, opacity: 0.8 }}>
          <Text style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: '800', color: colors.positive }}>MASTERED / {row.topicName}</Text>
          <Text style={{ fontFamily: 'serif', fontSize: 16, color: colors.ink }}>{row.prompt}</Text>
          {row.lastReviewedAt && <Text style={{ color: colors.quiet }}>Proven {new Date(row.lastReviewedAt).toLocaleDateString()}{row.resurrectedCount ? ` · re-proven ${row.resurrectedCount}×` : ''}</Text>}
        </View>
      ))}
    </ScrollScreen>
  );
}
