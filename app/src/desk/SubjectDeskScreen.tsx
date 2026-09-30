import { useQueries, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { InteractionManager, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiClient } from '@/api';
import { Button, DeskHeader, HeroCard, MasteryLegend, Notice, PaperPattern, ReadinessRing, SectionLabel, StagePill, StatCard, SubjectStrip } from '@/components';
import { hydratePersonal } from '@/personal';
import { useAuth, useNetwork, usePreferences } from '@/providers';
import { queryKeys, warmSubjectCache } from '@/query-cache';
import { useTheme } from '@/theme';
import { isNewProgress, nextPaper, parsePapers, parseProgress, parseTopics, rankedTopics, recommendSession } from '@/today/model';
import { dateKey, daysToExam, fixupEnglishPlan, fixupTargets, milestonesFor, missionForToday, readinessEvidence, stablePlan, startMission, type PlanState } from '@/planning';
import { dueMistakes, memriDue, type MistakeRow } from '@/notebook';

// Today tab: the selected subject's desk. Lives inside the tab bar, so all
// navigation is standard tabs — no custom bars, no stack dead ends.
export function SubjectDeskScreen() {
  const { subject, planning } = usePreferences();
  const { session } = useAuth();
  const { online } = useNetwork();
  const { colors, subject: tokens } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [todayNow] = useState(() => new Date());
  const [mistakes, setMistakes] = useState<MistakeRow[]>([]);
  const [planState, setPlanState] = useState<PlanState | null>(null);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [planError, setPlanError] = useState('');
  const personalClient = new ApiClient(subject);

  useFocusEffect(useCallback(() => {
    let live = true;
    setPlanLoaded(false);
    setPlanError('');
    queryClient.fetchQuery({ queryKey: queryKeys.personal(subject, session?.user.id), queryFn: () => hydratePersonal(personalClient, session?.user.id, subject) }).then((personal) => {
      if (!live) return;
      setPlanState(personal.plan);
      setMistakes(personal.mistakes);
      setPlanLoaded(true);
    }).catch(() => {
      if (!live) return;
      setPlanError('Your saved plan could not be loaded. Check your connection and try again.');
      setPlanLoaded(true);
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, session?.user.id, subject]));

  const client = new ApiClient(subject);
  const queries = useQueries({
    queries: [
      { queryKey: queryKeys.progress(subject), queryFn: () => client.progress() },
      { queryKey: queryKeys.topics(subject), queryFn: () => client.topics(), staleTime: 10 * 60_000 },
      { queryKey: queryKeys.papers(subject), queryFn: () => client.papers(), staleTime: 10 * 60_000 },
    ],
  });
  const [progressQuery, topicsQuery, papersQuery] = queries;
  const loading = queries.some((q) => q.isPending);
  const error = queries.find((q) => q.error)?.error;
  const hasAllData = queries.every((q) => q.data !== undefined);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.refetchQueries({ queryKey: queryKeys.progress(subject) }),
      queryClient.refetchQueries({ queryKey: queryKeys.topics(subject) }),
      queryClient.refetchQueries({ queryKey: queryKeys.papers(subject) }),
      queryClient.refetchQueries({ queryKey: queryKeys.personal(subject, session?.user.id) }),
    ]).finally(() => setRefreshing(false));
  };

  useEffect(() => {
    if (!hasAllData || !topicsQuery.data) return;
    const topicIds = parseTopics(topicsQuery.data).map((t) => t.id);
    const task = InteractionManager.runAfterInteractions(() => void warmSubjectCache(queryClient, subject, topicIds));
    return () => task.cancel();
  }, [hasAllData, queryClient, subject, topicsQuery.data]);

  useEffect(() => {
    if (!planLoaded || loading || !hasAllData || !topicsQuery.data || !session?.user.id) return;
    const prioritized = rankedTopics(parseTopics(topicsQuery.data));
    const { plan, changed } = stablePlan(planState, subject, prioritized.slice(0, 3).map((t) => ({ id: t.id, name: t.name })), todayNow, planning);
    if (changed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlanState(plan);
      personalClient.savePlan(plan).catch(() => setPlanError('Plan could not be saved. Check your connection and try again.'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planLoaded, loading, hasAllData, planState, subject, topicsQuery.data, todayNow, session?.user.id]);

  if (loading && !hasAllData) {
    return <SafeAreaView style={[styles.screen, { backgroundColor: colors.paper }]}><PaperPattern /><View style={styles.content}><DeskHeader title={`${tokens.label} today`} eyebrow={tokens.code} /><Notice kind="loading" title="OPENING STUDY AREA">Fetching topics, papers and progress.</Notice></View></SafeAreaView>;
  }
  if (error && !hasAllData) {
    return <SafeAreaView style={[styles.screen, { backgroundColor: colors.paper }]}><PaperPattern /><View style={styles.content}><DeskHeader title={`${tokens.label} today`} eyebrow={tokens.code} /><Notice kind="error" title="STUDY AREA COULD NOT LOAD">{error instanceof Error ? error.message : 'The study service did not respond.'}</Notice><Button variant="secondary" onPress={() => void refresh()}>TRY AGAIN</Button></View></SafeAreaView>;
  }

  const progress = parseProgress(progressQuery.data!);
  const topics = parseTopics(topicsQuery.data);
  const papers = parsePapers(papersQuery.data);
  const prioritized = rankedTopics(topics);
  const recommendation = recommendSession(subject, prioritized);
  const paperPrompt = nextPaper(papers, progress.history);
  const focus = prioritized.slice(0, 5);
  const countdown = daysToExam(planning.examDate, todayNow);
  const planDone = (planState?.days ?? []).filter((d) => d.status === 'done').length;
  const { mission: todayMission, done: todayDone } = missionForToday(planState, todayNow);
  const todayKey = dateKey(todayNow);
  const scopedMistakes = mistakes.filter((r) => r.subject === subject || !r.subject);
  const dueCount = dueMistakes(scopedMistakes, todayNow).length;
  const fadedCount = memriDue(scopedMistakes, todayNow).length;
  const readiness = readinessEvidence(progress);
  const milestones = milestonesFor({ streak: progress.streak, testsTaken: progress.tests, lessonsCompleted: progress.lessons });
  const reached = milestones.filter((m) => m.reached);
  const nextMilestone = milestones.find((m) => !m.reached) ?? null;
  const fixupIds = subject === 'english'
    ? fixupEnglishPlan(dueMistakes(scopedMistakes, todayNow).map((r) => r.topicId).filter((id): id is string => !!id)).skillIds
    : fixupTargets(focus.slice(0, 3).map((t) => ({ id: t.id, accuracy: t.accuracy, answered: t.answered })), scopedMistakes);

  async function shareMilestone(id: string, label: string) {
    const message = `I just earned "${label}" revising ${tokens.label} on GCSE Study Desk — ${progress.tests} timed papers, ${progress.streak}-day streak and counting. Free AQA practice with worked solutions and a mistake notebook that brings misses back until they stick.`;
    try {
      await Share.share({ message, title: 'GCSE Study Desk milestone' });
      new ApiClient(subject).trackEvent('milestone_shared', { milestone: id });
    } catch { /* dismissed */ }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.paper }]}>
      <PaperPattern />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={tokens.accent} />}>
        <DeskHeader title={`${tokens.label} today`} eyebrow={`${tokens.code} · STUDY AREA`} />
        <SubjectStrip spec={tokens.spec} />
        {!online && <Notice kind="offline" title="OFFLINE / SESSION COPY">You are viewing server data held in this app session. Pull to refresh when your connection returns.</Notice>}
        {isNewProgress(progress) && <Notice title="A CLEAR START">No recorded study yet in this area. Start with the 10-question check — there is no need to make up for time away.</Notice>}
        {progress.tests === 0 && <Button variant="secondary" onPress={() => router.push({ pathname: '/(tabs)/practice', params: { diagnostic: '1' } } as never)}>START DIAGNOSTIC CHECK · 10 QUESTIONS</Button>}
        <SectionLabel index="01" label="Your next move" />
        {todayMission?.rest ? (
          <HeroCard eyebrow="REST DAY · PLANNED RECOVERY" title="Rest day" body="No mission today by your plan. Light retrieval only — reread one mastered note, or take the day fully off." note="Rest is part of the plan." ring={<ReadinessRing score={readiness.ready ? readiness.score : null} ready={readiness.ready} />} />
        ) : todayMission ? (
          <HeroCard eyebrow={`TODAY'S MISSION · ${todayMission.minutes} MIN`} title={todayMission.task} body={todayMission.topicId ? 'Complete the lesson, then finish the short practice so this day is marked done.' : 'Use the practice desk to keep your plan on track.'} note="One step is enough today." ring={<ReadinessRing score={readiness.ready ? readiness.score : null} ready={readiness.ready} />}
            actions={<Button accessibilityLabel={`Start today's mission: ${todayMission.task}`} onPress={() => { if (todayMission.topicId) { const next = startMission(planState!, todayMission.date, todayMission.topicId); setPlanState(next); personalClient.savePlan(next).catch(() => setPlanError('Plan could not be saved.')); router.push(`/lesson/${encodeURIComponent(todayMission.topicId)}` as never); } else { router.push(todayMission.task === 'Mistake retry' ? '/notebook' : '/(tabs)/practice'); } }}>START TODAY&apos;S MISSION</Button>} />
        ) : todayDone ? (
          <HeroCard eyebrow="TODAY'S MISSION COMPLETE" title={`✓ ${todayDone.task}`} body={todayDone.result ? `${todayDone.result.percent}% · ${todayDone.result.correctMarks}/${todayDone.result.totalMarks} marks${todayDone.result.xpEarned != null ? ` · +${todayDone.result.xpEarned} XP` : ''}. Come back tomorrow.` : 'Come back tomorrow. The rest of the week stays locked until a new day starts.'} note="Paused — rest is part of the plan." ring={<ReadinessRing score={readiness.ready ? readiness.score : null} ready={readiness.ready} />} />
        ) : recommendation ? (
          <HeroCard eyebrow={`NEXT SESSION · ${recommendation.minutes} MIN`} title={recommendation.topic.name} body={`${recommendation.outcome} ${recommendation.reason}`} note="One step is enough today." ring={<ReadinessRing score={readiness.ready ? readiness.score : null} ready={readiness.ready} />}
            actions={<Button accessibilityLabel={`Start ${recommendation.topic.name}`} onPress={() => router.push(`/lesson/${encodeURIComponent(recommendation.topic.id)}` as never)}>START SESSION</Button>} />
        ) : <Notice title="NO TOPICS AVAILABLE">This course has no revision topics yet. Pull to refresh.</Notice>}
        <View style={[styles.readiness, { borderColor: colors.line, backgroundColor: tokens.tint }]}>
          <Text style={[styles.mono, { color: tokens.accent }]}>READINESS / EVIDENCE</Text>
          <Text style={[styles.readinessTitle, { color: colors.ink }]}>{readiness.ready ? `${readiness.score}% recorded` : 'Building your score'}</Text>
          <Text style={{ color: colors.quiet, lineHeight: 20 }}>{readiness.ready ? 'From server-marked paper accuracy after the evidence threshold.' : `Complete ${Math.max(0, 2 - readiness.tests)} more papers and ${Math.max(0, 20 - readiness.practiceAnswered)} more answers to unlock.`} A guide, not a predicted grade.</Text>
          <Text style={[styles.mono, { color: colors.ink }]}>{countdown === null ? 'SET EXAM DATE IN SETTINGS' : `${countdown} DAYS TO EXAM`} / {dueCount} DUE</Text>
        </View>
        {planError ? <Notice kind="error" title="PLAN NOT SAVED">{planError}</Notice> : null}
        <SectionLabel index="02" label="Where you stand" />
        <View style={styles.statGrid}>
          <View style={styles.statRow}><StatCard value={String(progress.tests)} label="Timed papers" caption="Each one makes the real thing familiar." tone="paper" /><StatCard value={progress.accuracy == null ? '—' : `${progress.accuracy}%`} label="Avg paper score" caption="From papers you have marked." tone="score" /></View>
          <View style={styles.statRow}><StatCard value={String(progress.practiceAnswered)} label="Questions answered" caption="Every one decides what returns." tone="answered" /><StatCard value={progress.streak > 0 ? String(progress.streak) : '—'} label="Day streak" caption={progress.streak > 0 ? 'Rest pauses it — never shatters.' : 'Fresh start whenever you open this.'} tone="streak" /></View>
        </View>
        <SectionLabel index="03" label="This week" />
        <View style={[styles.weekCard, { borderColor: colors.line, backgroundColor: colors.raised }]}>
          <Text style={[styles.mono, { color: colors.quiet }]}>ROLLING 7-DAY PLAN · {planDone}/7 DONE</Text>
          {(planState?.days ?? []).map((day) => {
            const done = day.status === 'done';
            const startable = !done && !!day.topicId && day.date === todayKey && !day.rest;
            return (
              <View key={day.date} style={[styles.planRow, { backgroundColor: done ? colors.positiveWash : day.rest ? colors.muted : 'transparent', borderLeftColor: done || day.rest ? colors.positive : day.date === todayKey && day.topicId ? tokens.accent : colors.line }]}>
                <Text style={[styles.mono, { color: colors.quiet, width: 92 }]}>{day.label}</Text>
                <View style={{ flex: 1, gap: 3 }}><Text style={[styles.planTask, { color: colors.ink }]}>{done ? '✓ ' : ''}{day.task}</Text>{done && day.result && <Text style={{ color: colors.positive, fontSize: 13, fontWeight: '700' }}>{day.result.percent}% · {day.result.correctMarks}/{day.result.totalMarks}{day.result.xpEarned != null ? ` · +${day.result.xpEarned} XP` : ''}</Text>}</View>
                {startable ? <Pressable accessibilityRole="button" onPress={() => { const next = startMission(planState!, day.date, day.topicId); setPlanState(next); personalClient.savePlan(next).catch(() => undefined); router.push(`/lesson/${encodeURIComponent(day.topicId!)}` as never); }}><Text style={[styles.mono, { color: tokens.accent }]}>START ›</Text></Pressable> : <Text style={[styles.mono, { color: colors.quiet }]}>{done ? 'DONE' : day.rest ? 'REST' : `${day.minutes} MIN`}</Text>}
              </View>
            );
          })}
          {!planState && <Text style={{ color: colors.quiet }}>Your plan builds when this desk first loads today.</Text>}
        </View>
        <SectionLabel index="04" label="Mastery trail" />
        <MasteryLegend />
        {focus.map((topic) => (
          <Pressable key={topic.id} accessibilityRole="link" accessibilityLabel={`${topic.name}, ${topic.answered === 0 ? 'not tried yet' : `${topic.accuracy ?? 0} percent over ${topic.answered} answers`}`} onPress={() => router.push(`/lesson/${encodeURIComponent(topic.id)}` as never)} style={[styles.masteryRow, { borderColor: colors.line, backgroundColor: colors.raised }]}>
            <View style={[styles.strandDot, { backgroundColor: tokens.accent }]} />
            <View style={{ flex: 1, gap: 4 }}><Text style={[styles.masteryName, { color: colors.ink }]}>{topic.name}</Text><Text style={{ color: colors.quiet }}>{topic.answered === 0 ? 'Not tried yet' : `${topic.accuracy ?? 0}% · ${topic.answered} answered`}{topic.completed ? ' · lesson complete' : ''}</Text></View>
            <StagePill percent={topic.accuracy} answered={topic.answered} />
          </Pressable>
        ))}
        <SectionLabel index="05" label="Exam practice" />
        {paperPrompt && (
          <View style={[styles.ticket, { backgroundColor: colors.raised, borderColor: colors.line }]}>
            <View style={[styles.ticketBand, { backgroundColor: tokens.accent }]} />
            <Text style={[styles.mono, { color: tokens.accent }]}>{paperPrompt.paper.code} · {paperPrompt.hasRecordedHistory ? 'NEXT AFTER LAST PAPER' : 'READY WHEN YOU ARE'}</Text>
            <Text style={[styles.ticketTitle, { color: colors.ink }]}>{paperPrompt.paper.name}</Text>
            <Text style={{ color: colors.quiet }}>{paperPrompt.paper.minutes ? `${paperPrompt.paper.minutes} min` : 'Timing on start'}{paperPrompt.paper.calculator !== undefined ? ` · ${paperPrompt.paper.calculator ? 'Calculator' : 'Non-calculator'}` : ''}</Text>
            <View style={styles.ticketActions}><Button onPress={() => router.push('/(tabs)/practice')}>OPEN PRACTICE DESK</Button></View>
          </View>
        )}
        <Button variant="secondary" onPress={() => router.push('/notebook')}>MISTAKE NOTEBOOK / {dueCount} DUE{fadedCount ? ` · ${fadedCount} FADING` : ''}</Button>
        <Button variant="secondary" onPress={() => router.push('/weekly-summary')}>WEEKLY SUMMARY · SHARE VIEW</Button>
        {fixupIds.length > 0 && <Button onPress={() => { new ApiClient(subject).trackEvent('fixup_start', {}); router.push({ pathname: '/(tabs)/practice', params: { fixup: '1', targets: fixupIds.join(',') } } as never); }}>FIX-UP 5 · WEAK SPOTS</Button>}
        {(reached.length > 0 || nextMilestone) && (
          <View>
            <SectionLabel index="06" label="Proof it's sticking" />
            {reached.slice(-3).map((m) => (
              <View key={m.id} style={[styles.mileRow, { borderLeftColor: tokens.accent, backgroundColor: colors.raised, borderColor: colors.line }]}>
                <Text style={[styles.mono, { color: tokens.accent }]}>★</Text>
                <View style={{ flex: 1, gap: 2 }}><Text style={[styles.planTask, { color: colors.ink }]}>{m.label}</Text><Text style={{ color: colors.quiet }}>{m.detail}</Text></View>
                <Pressable accessibilityRole="button" onPress={() => void shareMilestone(m.id, m.label)} style={[styles.shareBtn, { borderColor: colors.strong }]}><Text style={[styles.mono, { color: colors.ink }]}>SHARE</Text></Pressable>
              </View>
            ))}
            {nextMilestone && <Text style={{ color: colors.quiet }}>Next seal: {nextMilestone.label} — {nextMilestone.value}/{nextMilestone.at}.</Text>}
          </View>
        )}
        <Text style={[styles.footnote, { color: colors.quiet }]}>AI tutor and English feedback is guidance, may be inaccurate, and is not an official grade. GCSE Study Desk is independent — not affiliated with, approved by, or endorsed by AQA.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 32, gap: 18 },
  mono: { fontFamily: 'Menlo', fontSize: 11, fontWeight: '700', letterSpacing: .7, textTransform: 'uppercase' },
  readiness: { borderWidth: 1, padding: 18, gap: 8, borderRadius: 20 },
  readinessTitle: { fontFamily: 'Georgia', fontSize: 27, fontWeight: '900', letterSpacing: -.5 },
  statGrid: { gap: 12 },
  statRow: { flexDirection: 'row', gap: 12 },
  weekCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 4 },
  planRow: { minHeight: 62, paddingVertical: 11, paddingLeft: 12, paddingRight: 8, borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center', gap: 10 },
  planTask: { fontWeight: '700', fontSize: 16 },
  masteryRow: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  strandDot: { width: 10, height: 10, borderRadius: 5 },
  masteryName: { fontSize: 17, fontWeight: '800' },
  ticket: { borderWidth: 1, borderRadius: 20, overflow: 'hidden', padding: 18, gap: 8 },
  ticketBand: { position: 'absolute', top: 0, left: 0, right: 0, height: 5 },
  ticketTitle: { fontFamily: 'Georgia', fontSize: 22, fontWeight: '800' },
  ticketActions: { gap: 8, marginTop: 6, borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 12, borderStyle: 'dashed' },
  mileRow: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  shareBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderRadius: 10 },
  footnote: { fontSize: 12, lineHeight: 18 },
});
