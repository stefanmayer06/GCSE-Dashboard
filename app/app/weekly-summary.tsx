import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ApiClient } from '@/api';
import { DeskHeader, Notice, ScrollScreen, SectionHeader } from '@/components';
import { dueMistakes, notebookKey, type MistakeRow } from '@/notebook';
import { daysToExam, planStateKey, parsePlanState, type PlanState } from '@/planning';
import { useAuth, usePreferences } from '@/providers';
import { parseProgress } from '@/today/model';
import { useTheme } from '@/theme';

export default function WeeklySummary() {
  const { subject, planning } = usePreferences();
  const { session } = useAuth();
  const { colors, subject: tokens } = useTheme();
  const [rows, setRows] = useState<MistakeRow[]>([]);
  const [plan, setPlan] = useState<PlanState | null>(null);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [now] = useState(() => new Date());
  const query = useQuery({ queryKey: ['weekly-summary', subject], queryFn: () => new ApiClient(subject).progress() });
  useEffect(() => { Promise.all([AsyncStorage.getItem(notebookKey(session?.user.id)), AsyncStorage.getItem(planStateKey(session?.user.id, subject))]).then(([notebook, planValue]) => { try { const value = JSON.parse(notebook ?? '[]'); setRows(Array.isArray(value) ? value : []); } catch { setRows([]); } setPlan(parsePlanState(planValue)); setPlanLoaded(true); }); }, [session?.user.id, subject]);
  const progress = query.data ? parseProgress(query.data) : null;
  const recent = rows.filter(row => row.subject === subject && Date.parse(row.capturedAt) >= now.getTime() - 7 * 86_400_000);
  const countdown = daysToExam(planning.examDate, now);
  return <ScrollScreen>
    <DeskHeader title="Weekly summary" eyebrow="STUDENT-CONTROLLED SHARE VIEW" />
    <Notice title="FOR A CONVERSATION">Show this screen when you choose. It creates no parent account, sends no email and shares nothing automatically.</Notice>
    {query.isError && <Notice kind="error" title="SERVER PROGRESS UNAVAILABLE">Pull to refresh from Today, then reopen this summary.</Notice>}
    {progress && <View style={{ borderWidth: 2, borderColor: tokens.accent, backgroundColor: colors.raised, padding: 18, gap: 8 }}><Text style={{ fontFamily: 'serif', fontSize: 28, color: colors.ink }}>{subject === 'english' ? 'English' : subject === 'maths-higher' ? 'Maths Higher' : 'Maths Foundation'}</Text><Text style={{ color: colors.ink, fontSize: 17 }}>{progress.lessons} lessons / {progress.tests} tests / {progress.practiceAnswered} practice answers</Text><Text style={{ color: colors.quiet }}>Server-recorded accuracy: {progress.accuracy === null ? 'not measured' : `${progress.accuracy}%`} / streak: {progress.streak} days</Text></View>}
    <SectionHeader title="This week's plan" meta={plan ? `${plan.days.filter(day => day.status === 'done').length}/7 DONE` : 'LOCAL PLAN'} />
    {plan ? plan.days.map(day => { const done = day.status === 'done'; return <View key={day.date} style={{ borderBottomWidth: 1, borderBottomColor: colors.line }}><View style={{ borderLeftWidth: 4, borderLeftColor: done ? colors.positive : colors.line, backgroundColor: done ? colors.positiveWash : 'transparent', paddingLeft: 10, paddingVertical: 10, gap: 3 }}><Text style={{ color: colors.ink, fontWeight: '700' }}>{done ? '✓ ' : ''}{day.label} · {day.task}</Text>{done && day.result ? <Text style={{ color: colors.positive, fontWeight: '700' }}>{day.result.percent}% scored · {day.result.correctMarks}/{day.result.totalMarks} marks{day.result.xpEarned != null ? ` · +${day.result.xpEarned} XP` : ''} on {new Date(day.result.completedAt).toLocaleDateString()}</Text> : <Text style={{ color: colors.quiet }}>{day.minutes} focused minutes{day.topicId ? ' · lesson-based' : ''}</Text>}</View></View>; }) : <Text style={{ color: colors.quiet }}>{planLoaded ? 'Open Today to build your 7-day plan.' : 'Reading your saved plan…'}</Text>}
    <SectionHeader title="Planning context" meta="LOCAL PREFERENCES" />
    <Text style={{ color: colors.ink }}>Target grade: {planning.targetGrade || 'not set'} / exam: {countdown === null ? 'not set' : `${countdown} days`} / mode: {planning.passMode === 'foundation-pass' ? 'Foundation pass priority' : 'Balanced'}</Text>
    <SectionHeader title="This week's notebook" meta={`${recent.length} CAPTURED`} />
    <Text style={{ color: colors.ink }}>{dueMistakes(rows.filter(row => row.subject === subject), now).length} mistake reviews are currently due.</Text>
    {recent.slice(0, 5).map(row => <Text key={row.id} style={{ color: colors.quiet }}>- {row.topicName}: {row.prompt}</Text>)}
  </ScrollScreen>;
}
