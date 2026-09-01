import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { ApiClient } from '@/api';
import { Button, DeskHeader, Notice, ScrollScreen, SectionHeader } from '@/components';
import { useAuth, usePreferences } from '@/providers';
import {
  advanceMistake,
  classifyMistake,
  dueMistakes,
  errorTypeLabel,
  markWarmupDone,
  type MistakeRow,
} from '@/notebook';
import { hydratePersonal } from '@/personal';
import { useTheme } from '@/theme';

const CLASSIFY_REASONS: { id: string; label: string }[] = [
  { id: 'knowledge', label: 'DID NOT KNOW IT' },
  { id: 'method', label: 'WRONG METHOD' },
  { id: 'misread', label: 'MISREAD IT' },
  { id: 'arithmetic', label: 'ARITHMETIC SLIP' },
  { id: 'timing', label: 'RAN OUT OF TIME' },
  { id: 'incomplete', label: 'MISSING EXPLANATION' },
];

export default function Notebook() {
  const { session } = useAuth();
  const { subject } = usePreferences();
  const { colors, subject: tokens } = useTheme();
  const [rows, setRows] = useState<MistakeRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
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

  async function save(next: MistakeRow[]) {
    setRows(next);
    try {
      await client.saveMistakes(next);
    } catch (cause) {
      setError(cause instanceof Error ? `Notebook could not be saved: ${cause.message}` : 'Notebook could not be saved.');
    }
  }

  function reviewed(id: string) { void save(advanceMistake(rows, id)); }
  function classify(id: string, errorType: string) { void save(classifyMistake(rows, id, errorType)); }
  function warmup(id: string) { void save(markWarmupDone(rows, id)); }

  return (
    <ScrollScreen>
      <DeskHeader title="Mistake notebook" eyebrow="ACCOUNT STUDY RECORD" />
      <Notice title="HOW THIS WORKS">
        Incorrect rows are copied from server marking and saved to your account. Tag why you missed
        each one, do the warm-up, then retry after 1, 3, 7 and 21 days. Reopening an old result never
        resets your progress.
      </Notice>
      {error && <Notice kind="error" title="ACTION NOT COMPLETED">{error}</Notice>}
      <SectionHeader title="Captured mistakes" meta={`${due.size} DUE / ${visible.length} SAVED / ${mastered.length} MASTERED`} />
      {!loaded && <Notice kind="loading" title="LOADING NOTEBOOK">Reading your saved mistakes.</Notice>}
      {loaded && visible.length === 0 && <Notice title="NOTEBOOK CLEAR">Incorrect server-marked result rows will appear here after a submission.</Notice>}
      {visible.map(row => {
        const reviewIndex = row.reviewIndex ?? 0;
        const dueDate = row.dueDates?.[reviewIndex];
        const label = errorTypeLabel(row.errorType);
        return (
          <View key={row.id} style={{ borderWidth: 1, borderLeftWidth: due.has(row.id) ? 6 : 1, borderColor: due.has(row.id) ? tokens.accent : colors.strong, backgroundColor: colors.raised, padding: 14, gap: 8 }}>
            <Text style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: '800', color: tokens.accent }}>
              {due.has(row.id) ? 'DUE TO RETRY' : 'SCHEDULED'} / {row.topicName}{label ? ` / ${label.toUpperCase()}` : ''}
            </Text>
            <Text style={{ fontFamily: 'serif', fontSize: 20, color: colors.ink }}>{row.prompt}</Text>
            {row.answer !== undefined && <Text style={{ color: colors.quiet }}>Your answer: {typeof row.answer === 'string' ? row.answer : JSON.stringify(row.answer)}</Text>}
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
            {row.topicId && <Button variant="secondary" onPress={() => router.push({ pathname: '/practice', params: { topicId: row.topicId } })}>{row.warmupCount ? 'WARM-UP AGAIN' : 'WARM-UP MICRO-PRACTICE'}</Button>}
            {row.topicId && <Button variant="secondary" onPress={() => warmup(row.id)}>LOG WARM-UP DONE</Button>}
            <Button variant="secondary" onPress={() => reviewed(row.id)}>{reviewIndex >= row.dueDates.length - 1 ? 'MARK MASTERED' : 'I RETRIED THIS'}</Button>
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
          {row.lastReviewedAt && <Text style={{ color: colors.quiet }}>Proven {new Date(row.lastReviewedAt).toLocaleDateString()}</Text>}
        </View>
      ))}
    </ScrollScreen>
  );
}
