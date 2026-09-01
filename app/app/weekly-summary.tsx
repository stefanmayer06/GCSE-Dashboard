import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { ApiClient } from '@/api';
import { DeskHeader, Notice, ScrollScreen, SectionHeader } from '@/components';
import { dueMistakes, errorTypeLabel, masteredSince, type MistakeRow } from '@/notebook';
import { hydratePersonal } from '@/personal';
import { daysToExam, type PlanState } from '@/planning';
import { useAuth, usePreferences } from '@/providers';
import { parseProgress } from '@/today/model';
import { useTheme } from '@/theme';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/query-cache';

export default function WeeklySummary() {
  const { subject, planning } = usePreferences();
  const { session } = useAuth();
  const { colors, subject: tokens } = useTheme();
  const [rows, setRows] = useState<MistakeRow[]>([]);
  const [plan, setPlan] = useState<PlanState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [now] = useState(() => new Date());
  const client = new ApiClient(subject);
  const query = useQuery({ queryKey: queryKeys.progress(subject), queryFn: () => client.progress() });
  useFocusEffect(useCallback(() => { let active = true; setLoaded(false); hydratePersonal(client, session?.user.id, subject).then(personal => { if (!active) return; setRows(personal.mistakes); setPlan(personal.plan); setLoaded(true); }).catch(() => { if (active) setLoaded(true); }); return () => { active = false; };
  // The client is scoped to the active subject; reload whenever either identity changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, subject]));
  const progress = query.data ? parseProgress(query.data) : null;
  const due = dueMistakes(rows, now).length;
  const masteredWeek = masteredSince(rows, 7 * 86_400_000, now);
  const countdown = daysToExam(planning.examDate, now);
  return <ScrollScreen>
    <DeskHeader title="Weekly summary" eyebrow="STUDENT-CONTROLLED SHARE VIEW" />
    <Notice title="FOR A CONVERSATION">Show this screen when you choose. It creates no parent account, sends no email and shares nothing automatically.</Notice>
    {query.isError && <Notice kind="error" title="SERVER PROGRESS UNAVAILABLE">Pull to refresh from Today, then reopen this summary.</Notice>}
    {progress && <View style={{ borderWidth: 2, borderColor: tokens.accent, backgroundColor: colors.raised, padding: 18, gap: 8 }}><Text style={{ fontFamily: 'serif', fontSize: 28, color: colors.ink }}>{subject === 'english' ? 'English' : subject === 'maths-higher' ? 'Maths Higher' : 'Maths Foundation'}</Text><Text style={{ color: colors.ink, fontSize: 17 }}>{progress.lessons} lessons / {progress.tests} tests / {progress.practiceAnswered} practice answers</Text><Text style={{ color: colors.quiet }}>Server-recorded accuracy: {progress.accuracy === null ? 'not measured' : `${progress.accuracy}%`} / streak: {progress.streak} days</Text></View>}
    <SectionHeader title="This week's plan" meta={plan ? `${plan.days.filter(day => day.status === 'done').length}/7 DONE` : 'ACCOUNT PLAN'} />
    {loaded && plan ? plan.days.map(day => { const done = day.status === 'done'; return <View key={day.date} style={{ borderBottomWidth: 1, borderBottomColor: colors.line }}><View style={{ borderLeftWidth: 4, borderLeftColor: done ? colors.positive : colors.line, backgroundColor: done ? colors.positiveWash : 'transparent', paddingLeft: 10, paddingVertical: 10, gap: 3 }}><Text style={{ color: colors.ink, fontWeight: '700' }}>{done ? '✓ ' : ''}{day.label} · {day.task}</Text>{done && day.result ? <Text style={{ color: colors.positive, fontWeight: '700' }}>{day.result.percent}% scored · {day.result.correctMarks}/{day.result.totalMarks} marks{day.result.xpEarned != null ? ` · +${day.result.xpEarned} XP` : ''} on {new Date(day.result.completedAt).toLocaleDateString()}</Text> : <Text style={{ color: colors.quiet }}>{day.minutes} focused minutes{day.topicId ? ' · lesson-based' : ''}</Text>}</View></View>; }) : <Text style={{ color: colors.quiet }}>{loaded ? 'Open Today to build your 7-day plan.' : 'Reading your saved plan…'}</Text>}
    <SectionHeader title="Planning context" meta="ACCOUNT PREFERENCES" />
    <Text style={{ color: colors.ink }}>Target grade: {planning.targetGrade || 'not set'} / exam: {countdown === null ? 'not set' : `${countdown} days`} / mode: {planning.passMode === 'foundation-pass' ? 'Foundation pass priority' : 'Balanced'}</Text>
    <SectionHeader title="This week's notebook" meta={`${rows.length} SAVED / ${masteredWeek.length} MASTERED`} />
    <Text style={{ color: colors.ink }}>{due} mistake reviews are currently due. {masteredWeek.length === 0 ? 'No mistakes mastered in the last 7 days yet.' : `${masteredWeek.length} mistake${masteredWeek.length === 1 ? '' : 's'} mastered in the last 7 days.`}</Text>
    {rows.slice(0, 5).map(row => <Text key={row.id} style={{ color: colors.quiet }}>- {row.topicName}: {row.prompt}{row.errorType ? ` (${errorTypeLabel(row.errorType) ?? 'tagged'})` : ''}</Text>)}
  </ScrollScreen>;
}
