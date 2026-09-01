import { ApiClient, ApiError } from '../api';
import { Button, DeskHeader, Notice, PaperPattern, SectionHeader, Skeleton } from '../components';
import { useAuth, useNetwork, usePreferences } from '../providers';
import { subjectTokens, useTheme, type Subject } from '../theme';
import { isNewProgress, nextPaper, parsePapers, parseProgress, parseTopics, rankedTopics, recommendSession } from './model';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { daysToExam, planStateKey, parsePlanState, readinessEvidence, stablePlan, startMission, type PlanState } from '../planning';
import { dueMistakes, notebookKey, type MistakeRow } from '../notebook';

const subjects: { id: Subject; short: string }[] = [
  { id: 'maths', short: 'Foundation' },
  { id: 'maths-higher', short: 'Higher' },
  { id: 'english', short: 'English' },
];

export function TodayScreen() {
  const { subject, planning, setSubject } = usePreferences();
  const { session } = useAuth();
  const { colors, subject: subjectTheme } = useTheme();
  const { online } = useNetwork();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [todayNow] = useState(() => new Date());
  const [mistakes, setMistakes] = useState<MistakeRow[]>([]);
  const [planState, setPlanState] = useState<PlanState | null>(null);
  const [planLoaded, setPlanLoaded] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([
      AsyncStorage.getItem(notebookKey(session?.user.id)),
      AsyncStorage.getItem(planStateKey(session?.user.id, subject)),
    ]).then(([notebook, plan]) => {
      if (!active) return;
      try { const rows=JSON.parse(notebook??'[]'); setMistakes(Array.isArray(rows)?rows:[]); } catch { setMistakes([]); }
      setPlanState(parsePlanState(plan));
      setPlanLoaded(true);
    });
    return () => { active = false; };
  }, [session?.user.id, subject]));
  const client = new ApiClient(subject);
  const queries = useQueries({ queries: [
    { queryKey: ['today', subject, 'progress'], queryFn: () => client.progress() },
    { queryKey: ['today', subject, 'topics'], queryFn: () => client.topics() },
    { queryKey: ['today', subject, 'papers'], queryFn: () => client.papers() },
  ] });
  const [progressQuery, topicsQuery, papersQuery] = queries;
  const loading = queries.some((query) => query.isPending);
  const error = queries.find((query) => query.error)?.error;
  const hasAllData = queries.every((query) => query.data !== undefined);

  const refresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ['today', subject] }).finally(() => setRefreshing(false));
  };

  useEffect(() => {
    if (!planLoaded || loading || !hasAllData || !topicsQuery.data) return;
    const prioritized = rankedTopics(parseTopics(topicsQuery.data), planning.passMode === 'foundation-pass' && subject === 'maths');
    const { plan, changed } = stablePlan(planState, subject, planning.passMode, prioritized.slice(0, 3).map(topic => ({ id: topic.id, name: topic.name })), todayNow);
    if (changed) {
      // Seeding mirrors external AsyncStorage hydration for today's plan anchor.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlanState(plan);
      void AsyncStorage.setItem(planStateKey(session?.user.id, subject), JSON.stringify(plan));
    }
  }, [planLoaded, loading, hasAllData, planState, subject, planning.passMode, topicsQuery.data, todayNow, session?.user.id]);

  if (loading && !hasAllData) return <SafeAreaView style={[styles.screen, { backgroundColor: colors.paper }]}><PaperPattern/><View style={styles.content}><DeskHeader title="Today at the desk" eyebrow="REVISION REGISTER"/><Skeleton height={44}/><Skeleton height={210}/><Skeleton height={92}/></View></SafeAreaView>;

  if (error && !hasAllData) {
    const configuration = error instanceof Error && error.message.includes('EXPO_PUBLIC_API_URL');
    const authentication = error instanceof ApiError && error.status === 401;
    return <SafeAreaView style={[styles.screen, { backgroundColor: colors.paper }]}><PaperPattern/><View style={styles.content}><DeskHeader title="Today at the desk" eyebrow="REVISION REGISTER"/><Notice kind="error" title={configuration ? 'APP CONFIGURATION NEEDED' : authentication ? 'SIGN-IN REQUIRED' : 'TODAY COULD NOT LOAD'}>{configuration ? 'The API address is missing or invalid. Ask the app administrator to check the production configuration.' : authentication ? 'Your secure session has expired. Sign in again to return to your desk.' : error instanceof Error ? error.message : 'The study service did not respond.'}</Notice><Button variant="secondary" onPress={() => void refresh()}>TRY AGAIN</Button></View></SafeAreaView>;
  }

  const progress = parseProgress(progressQuery.data!);
  const topics = parseTopics(topicsQuery.data);
  const papers = parsePapers(papersQuery.data);
  const prioritized = rankedTopics(topics, planning.passMode === 'foundation-pass' && subject === 'maths');
  const recommendation = recommendSession(subject, prioritized);
  const paperPrompt = nextPaper(papers, progress.history);
  const focus = prioritized.slice(0, 3);
  const countdown = daysToExam(planning.examDate, todayNow);
  const planDone = (planState?.days ?? []).filter(day => day.status === 'done').length;
  const dueCount = dueMistakes(mistakes.filter(row => row.subject === subject), todayNow).length;
  const readiness = readinessEvidence(progress);
  const xpProgress = progress.xpNeeded > 0 ? Math.min(1, progress.xpInto / progress.xpNeeded) : 0;

  return <SafeAreaView style={[styles.screen, { backgroundColor: colors.paper }]}><PaperPattern/><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={subjectTheme.accent}/>}>
    <View style={styles.topline}><View style={{ flex: 1 }}><DeskHeader title="Today at the desk" eyebrow="REVISION REGISTER"/></View><Link href="/settings" asChild><Pressable accessibilityRole="link" accessibilityLabel="Open profile and settings" style={StyleSheet.flatten([styles.settings, { borderColor: colors.strong }])}><Text style={[styles.mono, { color: colors.ink }]}>PROFILE</Text></Pressable></Link></View>
    <View accessibilityRole="radiogroup" accessibilityLabel="Active subject" style={[styles.switcher, { borderColor: colors.ink }]}>{subjects.map((item) => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ selected: item.id === subject }} accessibilityLabel={`${subjectTokens[item.id].label}${item.id === subject ? ', selected' : ''}`} onPress={() => setSubject(item.id)} style={[styles.subjectChoice, { backgroundColor: item.id === subject ? subjectTheme.accent : colors.raised, borderColor: colors.line }]}><Text style={[styles.mono, { color: item.id === subject ? '#fff' : colors.ink }]}>{item.short}</Text></Pressable>)}</View>
    {!online && <Notice kind="offline" title="OFFLINE / SESSION COPY">You are viewing server data held in this app session. Pull to refresh when your connection returns.</Notice>}
    {error && hasAllData && online && <Notice kind="offline" title="SESSION COPY">The latest refresh failed, so data held in this app session is shown.</Notice>}
    {isNewProgress(progress) && <Notice title="A CLEAR START">There is no recorded study yet. Start with one manageable session; there is no need to make up for time away.</Notice>}
    <View style={{borderColor:colors.strong,backgroundColor:colors.raised,borderWidth:1,borderLeftWidth:6,padding:16,gap:8}}><Text style={[styles.mono,{color:subjectTheme.accent}]}>READINESS / EVIDENCE</Text><Text style={{color:colors.ink,fontFamily:'serif',fontSize:27,fontWeight:'700'}}>{readiness.ready?`${readiness.score}% recorded`:'Building your score'}</Text><Text style={{color:colors.quiet,lineHeight:20}}>{readiness.ready?'Readiness uses your server-marked paper accuracy after the evidence threshold is met.':`Complete ${Math.max(0,2-readiness.tests)} more paper${2-readiness.tests===1?'':'s'} and ${Math.max(0,20-readiness.practiceAnswered)} more practice answers to unlock a score.`} This is a revision guide, not a predicted grade.</Text><Text style={[styles.mono,{color:colors.ink}]}>{countdown===null?'SET EXAM DATE IN SETTINGS':`${countdown} DAYS TO EXAM`} / {dueCount} MISTAKES DUE</Text></View>
    {progress.tests===0&&<Button variant="secondary" onPress={()=>router.push({pathname:'/practice',params:{diagnostic:'1'}})}>START DIAGNOSTIC CHECK</Button>}
    {recommendation ? <View style={[styles.hero, { backgroundColor: colors.raised, borderColor: colors.ink, borderLeftColor: subjectTheme.accent }]}>
      <View style={styles.heroMeta}><Text style={[styles.mono, { color: subjectTheme.accent }]}>NEXT SESSION</Text><Text style={[styles.mono, { color: colors.quiet }]}>{recommendation.minutes} MIN / {recommendation.topic.area}</Text></View>
      <Text accessibilityRole="header" style={[styles.heroTitle, { color: colors.ink }]}>{recommendation.topic.name}</Text>
      <Text style={[styles.reason, { color: colors.ink }]}>{recommendation.outcome}</Text>
      <View style={[styles.why, { borderTopColor: colors.line }]}><Text style={[styles.mono, { color: colors.quiet }]}>WHY THIS?</Text><Text style={{ color: colors.quiet, lineHeight: 20, flex: 1 }}>{recommendation.reason}</Text></View>
      <Button accessibilityLabel={`Start ${recommendation.topic.name} lesson`} onPress={() => { if (planState) { const next = startMission(planState, planState.from, recommendation.topic.id); setPlanState(next); void AsyncStorage.setItem(planStateKey(session?.user.id, subject), JSON.stringify(next)); } router.push(`/lesson/${encodeURIComponent(recommendation.topic.id)}` as never); }}>START SESSION</Button>
    </View> : <Notice title="NO TOPICS AVAILABLE">This course has no revision topics available yet. Pull to refresh or choose another subject.</Notice>}
    <View style={[styles.summary, { borderTopColor: colors.ink, borderBottomColor: colors.ink }]} accessibilityLabel={`Level ${progress.level}, ${progress.xp} XP, ${progress.streak} day streak, ${progress.accuracy ?? 'no'} percent accuracy, ${progress.lessons} lessons completed`}>
      <View style={styles.level}><Text style={[styles.mono, { color: colors.quiet }]}>LEVEL</Text><Text style={[styles.levelNumber, { color: subjectTheme.accent }]}>{progress.level}</Text></View>
      <View style={{ flex: 1, gap: 8 }}><Text style={[styles.summaryLine, { color: colors.ink }]}>{progress.xp.toLocaleString()} XP / {progress.streak} day streak</Text><Text style={[styles.mono, { color: colors.quiet }]}>{progress.accuracy === null ? 'NO PAPER ACCURACY YET' : `${progress.accuracy}% PAPER ACCURACY`} / {progress.lessons} LESSONS</Text><View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(xpProgress * 100) }} style={[styles.track, { backgroundColor: colors.muted }]}><View style={{ width: `${xpProgress * 100}%`, height: '100%', backgroundColor: subjectTheme.accent }}/></View></View>
    </View>
    {focus.length > 0 && <View><SectionHeader title="Current focus" meta="UP TO THREE"/>{focus.map((topic, index) => <View key={topic.id} style={[styles.focusRow, { borderBottomColor: colors.line }]}><Text style={[styles.mono, { color: colors.quiet }]}>{String(index + 1).padStart(2, '0')}</Text><View style={{ flex: 1 }}><Text style={[styles.focusName, { color: colors.ink }]}>{topic.name}</Text><Text style={{ color: colors.quiet, marginTop: 3 }}>{topic.answered === 0 ? 'Not practised yet' : `${topic.accuracy ?? 0}% across ${topic.answered} answers`}{topic.completed ? ' / lesson complete' : ''}</Text></View></View>)}</View>}
    {paperPrompt && <View><SectionHeader title={paperPrompt.hasRecordedHistory ? 'Next paper' : 'Paper practice'} meta={paperPrompt.paper.code}/><View style={[styles.paperRow, { borderBottomColor: colors.ink }]}><View style={{ flex: 1, minWidth: 220, gap: 5 }}><Text style={[styles.paperTitle, { color: colors.ink }]}>{paperPrompt.paper.name}</Text><Text style={[styles.mono, { color: colors.quiet }]}>{paperPrompt.paper.minutes ? `${paperPrompt.paper.minutes} MIN` : 'TIMING ON START'}{paperPrompt.paper.calculator !== undefined ? ` / ${paperPrompt.paper.calculator ? 'CALCULATOR' : 'NON-CALCULATOR'}` : ''}</Text><Text style={{ color: colors.quiet }}>{paperPrompt.hasRecordedHistory ? 'Selected after your latest recorded paper.' : 'Available when you are ready; no previous paper attempt is recorded.'}</Text></View><Button variant="secondary" onPress={() => router.push('/practice')}>OPEN</Button></View></View>}
    <View><SectionHeader title="Rolling 7-day plan" meta={planState ? `${planDone}/7 DONE · SAVED TODAY` : 'SAVED ON THIS DEVICE'}/>{planState ? planState.days.map(day => { const done = day.status === 'done'; const startable = !done && !!day.topicId; const row = <View style={[styles.planRow, { backgroundColor: done ? colors.positiveWash : 'transparent', borderLeftColor: done ? colors.positive : colors.line }]}><Text style={[styles.mono, { color: colors.quiet, width: 92 }]}>{day.label}</Text><View style={{ flex: 1, gap: 3 }}><Text style={[styles.planTask, { color: done ? colors.positive : colors.ink }]}>{done ? '✓ ' : ''}{day.task}</Text>{done && day.result && <Text style={{ color: colors.positive, fontSize: 13, fontWeight: '700' }}>{day.result.percent}% scored · {day.result.correctMarks}/{day.result.totalMarks} marks{day.result.xpEarned != null ? ` · +${day.result.xpEarned} XP` : ''}{day.result.weakTopics.length ? ` · weaker: ${day.result.weakTopics.join(', ')}` : ''}</Text>}</View>{done ? <Text style={[styles.mono, { color: colors.positive }]}>DONE</Text> : startable ? <Text style={[styles.mono, { color: subjectTheme.accent }]}>START ›</Text> : <Text style={[styles.mono, { color: colors.quiet }]}>{day.minutes} MIN</Text>}</View>; return startable ? <Pressable key={day.date} accessibilityRole="button" accessibilityLabel={`Start today's mission: ${day.task}`} onPress={() => { const next = startMission(planState!, day.date, day.topicId); setPlanState(next); void AsyncStorage.setItem(planStateKey(session?.user.id, subject), JSON.stringify(next)); router.push(`/lesson/${encodeURIComponent(day.topicId!)}` as never); }} style={{ borderBottomWidth: 1, borderBottomColor: colors.line }}>{row}</Pressable> : <View key={day.date} style={{ borderBottomWidth: 1, borderBottomColor: colors.line }}>{row}</View>; }) : <Text style={{ color: colors.quiet }}>{planLoaded ? 'Your plan appears once course topics are available.' : 'Reading your saved plan…'}</Text>}</View>
    <Button variant="secondary" onPress={()=>router.push('/notebook')}>MISTAKE NOTEBOOK / {dueCount} DUE</Button><Button variant="secondary" onPress={()=>router.push('/weekly-summary')}>WEEKLY SUMMARY</Button>
    <Link href="/settings" asChild><Pressable accessibilityRole="link" style={StyleSheet.flatten([styles.profile, { borderColor: colors.strong }])}><Text style={[styles.profileTitle, { color: colors.ink }]}>Profile and settings</Text><Text style={{ color: colors.quiet }}>Course, appearance and account &gt;</Text></Pressable></Link>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { padding: 20, paddingBottom: 52, gap: 20 }, topline: { flexDirection: 'row', flexWrap:'wrap', alignItems: 'center', gap: 12 }, settings: { minWidth: 48, minHeight: 48, padding:8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, switcher: { flexDirection: 'row', flexWrap:'wrap', borderWidth: 1 }, subjectChoice: { flexGrow: 1, flexBasis:100, minHeight: 48, padding:8, alignItems: 'center', justifyContent: 'center', borderRightWidth: StyleSheet.hairlineWidth }, mono: { fontFamily: 'monospace', fontSize: 11, fontWeight: '700', letterSpacing: .7, textTransform: 'uppercase' },
  planRow: { minHeight: 58, paddingVertical: 10, paddingLeft: 10, borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center', gap: 10 },
  planTask: { fontWeight: '700', fontSize: 16 }, hero: { borderWidth: 1, borderLeftWidth: 7, padding: 19, gap: 15 }, heroMeta: { flexDirection: 'row', flexWrap:'wrap', justifyContent: 'space-between', gap: 8 }, heroTitle: { fontFamily: 'serif', fontSize: 32, lineHeight: 40 }, reason: { fontSize: 16, lineHeight: 23 }, why: { borderTopWidth: 1, paddingTop: 12, flexDirection: 'row', flexWrap:'wrap', gap: 12 }, summary: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 15, flexDirection: 'row', flexWrap:'wrap', alignItems: 'center', gap: 18 }, level: { alignItems: 'center', minWidth: 62 }, levelNumber: { fontFamily: 'serif', fontSize: 42, lineHeight: 50 }, summaryLine: { fontSize: 17, fontWeight: '700' }, track: { height: 5, width: '100%' }, focusRow: { minHeight: 68, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1 }, focusName: { fontFamily: 'serif', fontSize: 20 }, paperRow: { paddingVertical: 15, flexDirection: 'row', flexWrap:'wrap', alignItems: 'center', gap: 12, borderBottomWidth: 1 }, paperTitle: { fontFamily: 'serif', fontSize: 23 }, profile: { borderWidth: 1, padding: 15, gap: 4 }, profileTitle: { fontSize: 16, fontWeight: '700' },
});
