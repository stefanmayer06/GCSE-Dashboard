import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiClient } from '../api';
import { DeskHeader, Notice, OfflineBanner, PaperPattern, SectionLabel, SubjectAreaCard } from '../components';
import { hydratePersonal } from '../personal';
import { useAuth, usePreferences } from '../providers';
import { queryKeys } from '../query-cache';
import { subjectTheme, useTheme, type Subject } from '../theme';
import { dueMistakes } from '../notebook';
import { parseProgressSafe, subjectHeadline, type SubjectSummary } from '../home';
import { activeId } from '../practice/core';

const ORDER: Subject[] = ['maths', 'maths-higher', 'english'];

function subjectBlurb(subject: Subject): string {
  if (subject === 'maths') return 'Number, Algebra, Ratio, Geometry, Probability and Statistics at Foundation level.';
  if (subject === 'maths-higher') return 'Higher topics, proof and grade 4–9 exam questions.';
  return 'Close reading and writing for both English Language papers.';
}

export function HomeScreen() {
  const { setSubject } = usePreferences();
  const { session } = useAuth();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [draftSubjects, setDraftSubjects] = useState<Subject[]>([]);
  const userId = session?.user.id;

  const progressQueries = useQueries({
    queries: ORDER.map((subject) => ({
      queryKey: queryKeys.progress(subject),
      queryFn: () => new ApiClient(subject).progress(),
      staleTime: 60_000,
    })),
  });
  const personalQueries = useQueries({
    queries: ORDER.map((subject) => ({
      queryKey: queryKeys.personal(subject, userId),
      queryFn: () => hydratePersonal(new ApiClient(subject), userId, subject),
      enabled: Boolean(userId),
      staleTime: 60_000,
    })),
  });

  useFocusEffect(useCallback(() => {
    let active = true;
    void (async () => {
      const found: Subject[] = [];
      for (const subject of ORDER) {
        try {
          const value = await AsyncStorage.getItem(activeId(userId, subject));
          if (value) found.push(subject);
        } catch { /* bookkeeping only */ }
      }
      if (active) setDraftSubjects(found);
    })();
    return () => { active = false; };
  }, [userId]));

  const loading = progressQueries.some((q) => q.isPending) && progressQueries.every((q) => q.data === undefined);
  const summaries: SubjectSummary[] = ORDER.map((subject, index) => {
    const progress = progressQueries[index].data ? parseProgressSafe(progressQueries[index].data) : null;
    const personal = personalQueries[index].data as { mistakes?: Parameters<typeof dueMistakes>[0] } | undefined;
    const rows = Array.isArray(personal?.mistakes) ? personal!.mistakes! : [];
    let due = 0;
    try {
      // Personal data is already scoped per subject via hydratePersonal(subject),
      // so rows belong to this study area — no cross-subject filtering needed.
      due = dueMistakes(rows as never, new Date()).length;
    } catch {
      due = 0;
    }
    const error = progressQueries[index].error instanceof Error ? progressQueries[index].error.message : null;
    return { subject, progress, due, faded: 0, error };
  });

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        ...ORDER.map((s) => queryClient.refetchQueries({ queryKey: queryKeys.progress(s) })),
        ...(userId ? ORDER.map((s) => queryClient.refetchQueries({ queryKey: queryKeys.personal(s, userId) })) : []),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const openSubject = (subject: Subject) => {
    setSubject(subject);
    router.push('/(tabs)/today' as never);
  };

  if (loading) {
    return <SafeAreaView style={[styles.screen, { backgroundColor: colors.paper }]}><PaperPattern /><View style={styles.content}><DeskHeader title="Choose your subject" eyebrow="SUBJECT SELECTOR" /><Notice kind="loading" title="OPENING SUBJECTS">Reading your three study areas.</Notice></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.paper }]}>
      <PaperPattern />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}>
        <View style={styles.topline}>
          <View style={{ flex: 1 }}><DeskHeader title="Choose your subject" eyebrow="SUBJECT SELECTOR" /></View>
          <Link href="/settings" asChild><Pressable accessibilityRole="link" accessibilityLabel="Open profile and settings" style={StyleSheet.flatten([styles.profileBtn, { borderColor: colors.strong }])}><Text style={[styles.mono, { color: colors.ink }]}>PROFILE</Text></Pressable></Link>
        </View>
        <Text style={[styles.intro, { color: colors.quiet }]}>Three separate desks, each with its own progress. Pick one to start learning — come back any time to switch.</Text>
        <OfflineBanner />
        {(() => {
          const totalAnswered = summaries.reduce((sum, s) => sum + (s.progress?.practiceAnswered ?? 0), 0);
          const totalPapers = summaries.reduce((sum, s) => sum + (s.progress?.tests ?? 0), 0);
          const totalDue = summaries.reduce((sum, s) => sum + s.due, 0);
          return (
            <View style={[styles.metricsStrip, { borderColor: colors.line, backgroundColor: colors.raised }]} accessibilityLabel={`Overall: ${totalPapers} papers, ${totalAnswered} questions answered, ${totalDue} retries due`}>
              <View style={styles.metricCell}><Text style={[styles.stripNum, { color: colors.ink }]}>{totalPapers}</Text><Text style={[styles.stripLabel, { color: colors.quiet }]}>PAPERS</Text></View>
              <View style={[styles.stripDiv, { backgroundColor: colors.line }]} />
              <View style={styles.metricCell}><Text style={[styles.stripNum, { color: colors.ink }]}>{totalAnswered}</Text><Text style={[styles.stripLabel, { color: colors.quiet }]}>ANSWERED</Text></View>
              <View style={[styles.stripDiv, { backgroundColor: colors.line }]} />
              <View style={styles.metricCell}><Text style={[styles.stripNum, { color: totalDue > 0 ? colors.warning : colors.positive }]}>{totalDue}</Text><Text style={[styles.stripLabel, { color: colors.quiet }]}>{totalDue === 1 ? 'RETRY DUE' : 'RETRIES DUE'}</Text></View>
            </View>
          );
        })()}
        {draftSubjects.length > 0 && (
          <View style={[styles.continue, { borderColor: colors.info, backgroundColor: colors.infoWash }]}>
            <Text style={[styles.mono, { color: colors.info }]}>PICK UP WHERE YOU LEFT OFF</Text>
            <Text style={{ color: colors.ink, lineHeight: 20 }}>A saved draft is waiting{draftSubjects.length > 1 ? ` in ${draftSubjects.length} study areas` : ''}. Drafts stay on this device until they submit.</Text>
            <View style={styles.rowWrap}>
              {draftSubjects.map((s) => {
                const t = subjectTheme(s, isDark);
                return <Pressable key={s} accessibilityRole="button" accessibilityLabel={`Resume saved session in ${t.label}`} onPress={() => { setSubject(s); router.push('/(tabs)/practice'); }} style={[styles.resumeChip, { backgroundColor: t.accent }]}><Text style={[styles.mono, { color: '#fff' }]}>RESUME {t.short.toUpperCase()}</Text></Pressable>;
              })}
            </View>
          </View>
        )}
        <SectionLabel index="01" label="All subjects · pick one" />
        <View style={styles.selectorList}>
          {summaries.map((s) => (
            <SubjectAreaCard
              key={s.subject}
              subjectId={s.subject}
              headline={subjectBlurb(s.subject)}
              stats={s.error && !s.progress ? 'COULD NOT LOAD · SESSION COPY' : `${s.progress ? `${s.progress.xp.toLocaleString()} XP · LEVEL ${s.progress.level} · ${s.progress.streak}-DAY STREAK` : 'LOADING'} / ${subjectHeadline(s.subject, s).toUpperCase()}`}
              metrics={s.progress ? { tests: s.progress.tests, answered: s.progress.practiceAnswered, streak: s.progress.streak, accuracy: s.progress.accuracy, level: s.progress.level, due: s.due, xp: s.progress.xp, xpInto: s.progress.xpInto, xpNeeded: s.progress.xpNeeded } : undefined}
              onOpen={() => openSubject(s.subject)}
              onLearn={() => openSubject(s.subject)}
              onPractice={() => openSubject(s.subject)}
            />
          ))}
        </View>
        <Text style={[styles.footnote, { color: colors.quiet }]}>GCSE Study Desk is independent and aligned to AQA course structures. It is not affiliated with, approved by, or endorsed by AQA. Tutor and AI feedback is revision guidance, not an official grade.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 108, gap: 20 },
  topline: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  profileBtn: { minWidth: 48, minHeight: 48, padding: 8, borderWidth: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  mono: { fontFamily: 'Menlo', fontSize: 11, fontWeight: '700', letterSpacing: .7, textTransform: 'uppercase' },
  intro: { fontSize: 16, lineHeight: 23 },
  continue: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  resumeChip: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 12 },
  metricsStrip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 8 },
  metricCell: { flex: 1, alignItems: 'center', gap: 2 },
  stripNum: { fontFamily: 'Georgia', fontSize: 26, fontWeight: '900' },
  stripLabel: { fontSize: 9, fontWeight: '700', letterSpacing: .7 },
  stripDiv: { width: 1, height: 34 },
  selectorList: { gap: 24 },
  footnote: { fontSize: 12, lineHeight: 18 },
});
