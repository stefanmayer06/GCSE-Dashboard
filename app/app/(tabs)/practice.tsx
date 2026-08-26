import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiClient } from '@/api';
import { Button, DeskHeader, Notice, OfflineBanner, ScrollScreen, SectionHeader } from '@/components';
import { useAuth, useNetwork, usePreferences } from '@/providers';
import { activeId, draftId, finite, parseDraft, parsePapers, parseTopics, persistNewSession, sessionFromResponse, text, type PracticeKind, type UnknownRecord } from '@/practice/core';
import { useTheme } from '@/theme';

const label = (item: UnknownRecord) => text(item.name) ?? text(item.title) ?? text(item.blurb) ?? text(item.id) ?? 'Untitled';

export default function PracticeHome() {
  const { subject } = usePreferences();
  const { session } = useAuth();
  const { online } = useNetwork();
  const { colors, subject: tokens } = useTheme();
  const router = useRouter();
  const api = new ApiClient(subject);
  const papers = useQuery({ queryKey: ['practice-papers', subject], queryFn: () => api.papers() });
  const topics = useQuery({ queryKey: ['practice-topics', subject], queryFn: () => api.topics() as Promise<unknown> });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [activeSession, setActiveSession] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySession, setRecoverySession] = useState('');
  const [selected, setSelected] = useState<{ kind: PracticeKind; title: string; paper?: number; type?: string; topicId?: string; count?: number; sources?: string[] } | null>(null);
  useEffect(() => {
    let mounted = true;
    const activeKey = activeId(session?.user.id, subject);
    void AsyncStorage.getItem(activeKey).then(async value => {
      if (!value) return;
      const raw = await AsyncStorage.getItem(draftId(session?.user.id, subject, value));
      const saved = parseDraft(raw, subject, value);
      if (!saved || saved.expiredAt) {
        if (mounted) setRecoverySession(value);
        await AsyncStorage.removeItem(activeKey);
        if (mounted) setRecoveryError(saved?.expiredAt ? 'The saved practice timer has expired.' : 'The saved practice draft is damaged or missing.');
        return;
      }
      if (mounted) setActiveSession(value);
    }).catch(() => { if (mounted) setRecoveryError('The saved practice draft could not be checked.'); });
    return () => { mounted = false; };
  }, [session?.user.id, subject]);

  async function start() {
    if (!selected || busy || !online) return;
    setBusy('Preparing your questions...'); setError('');
    try {
      const response = selected.kind === 'paper'
        ? await api.newTest(selected.type ?? 'full', selected.paper ?? 1)
        : selected.kind === 'practice'
          ? await api.practice(selected.topicId!, selected.count)
          : await api.adhoc(selected.count ?? (subject === 'english' ? 10 : 15), selected.sources ?? (subject === 'english' ? ['listing', 'truefalse', 'analysis'] : ['1', '2', '3']));
      const local = sessionFromResponse(subject, selected.kind, response, selected.title, selected.topicId);
      await persistNewSession(AsyncStorage, session?.user.id, local);
      setActiveSession(local.id);
      router.push({ pathname: '/practice/[id]', params: { id: local.id } });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not start this session.'); }
    finally { setBusy(''); }
  }

  const paperList = parsePapers(papers.data);
  const topicList = parseTopics(topics.data);
  return <ScrollScreen>
    <DeskHeader title="Practice desk" eyebrow="PAPERS AND TARGETED ROUNDS" />
    <OfflineBanner />
    {activeSession && <Notice title="SAVED SESSION">A draft for this subject is stored on this device.</Notice>}
    {activeSession && <Button variant="secondary" onPress={() => router.push({ pathname: '/practice/[id]', params: { id: activeSession } })}>Resume saved session</Button>}
    {recoveryError && <Notice kind="error" title="SAVED DRAFT UNUSABLE">{recoveryError}</Notice>}
    {recoveryError && <Button variant="secondary" onPress={async () => { await AsyncStorage.multiRemove([activeId(session?.user.id, subject), ...(recoverySession ? [draftId(session?.user.id, subject, recoverySession)] : [])]); setActiveSession(''); setRecoverySession(''); setRecoveryError(''); }}>Remove unusable draft</Button>}
    <Text style={[styles.intro, { color: colors.quiet }]}>Choose a real paper structure, a shorter paper, or a focused round. Questions and marks come from the server.</Text>
    <SectionHeader title="Exam papers" meta={papers.isFetching ? 'LOADING' : `${paperList.length} AVAILABLE`} />
    {papers.isError && <><Notice kind="error" title="PAPERS UNAVAILABLE">Paper definitions could not be loaded.</Notice><Button variant="secondary" disabled={papers.isFetching} onPress={() => void papers.refetch()}>Retry papers</Button></>}
    {papers.isFetching && <ActivityIndicator color={tokens.accent} accessibilityLabel="Loading paper definitions" />}
    {paperList.map((paper, index) => {
      const id = finite(paper.id) ?? index + 1;
      const code = text(paper.code) ?? `Paper ${id}`;
      const calculator = paper.calculator === true ? 'Calculator allowed' : paper.calculator === false ? 'No calculator' : id === 1 && subject === 'english' ? 'Fiction source' : id === 2 && subject === 'english' ? 'Two sources' : 'Source rules shown in paper';
      const fullMarks = finite(paper.marks) ?? 80;
      const fullMinutes = finite(paper.minutes) ?? (subject === 'english' ? 105 : 90);
      return <View key={String(paper.id ?? code)} style={[styles.docket, { backgroundColor: colors.raised, borderColor: colors.strong, borderLeftColor: tokens.accent }]}>
        <Text style={[styles.code, { color: tokens.accent }]}>{code}</Text><Text style={[styles.title, { color: colors.ink }]}>{label(paper)}</Text>
        <Text style={{ color: colors.quiet }}>{calculator} · {fullMarks} marks · {fullMinutes} min</Text>
        <View style={styles.actions}><Button onPress={() => setSelected({ kind: 'paper', paper: id, type: 'full', title: `${code} full paper` })}>Prepare full exam</Button><Button variant="secondary" onPress={() => setSelected({ kind: 'paper', paper: id, type: 'short', title: `${code} quick paper` })}>Prepare quick paper</Button></View>
      </View>;
    })}
    <SectionHeader title="Target a topic" meta={`${topicList.length} TOPICS`} />
    {topics.isError && <><Notice kind="error" title="TOPICS UNAVAILABLE">The topic list could not be loaded.</Notice><Button variant="secondary" disabled={topics.isFetching} onPress={() => void topics.refetch()}>Retry topics</Button></>}
    <View style={styles.chips}>{topicList.map((topic, index) => { const id = text(topic.id); if (!id) return null; const name = label(topic); return <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: selected?.topicId === id }} onPress={() => setSelected({ kind: 'practice', topicId: id, count: subject === 'english' ? 3 : 8, title: name })} style={[styles.chip, { borderColor: selected?.topicId === id ? tokens.accent : colors.strong, backgroundColor: colors.raised }]}><Text style={{ color: colors.ink, fontWeight: '700' }}>{name}</Text>{finite(topic.accuracy) != null && <Text style={{ color: colors.quiet }}>{finite(topic.accuracy)}% accuracy</Text>}</Pressable>; })}</View>
    <SectionHeader title="Mixed quick round" />
    <Text style={{ color: colors.quiet }}>A server-built mix of {subject === 'english' ? 'listing, true/false and analysis' : 'questions from all three papers'}.</Text>
    <Button variant="secondary" onPress={() => setSelected({ kind: 'adhoc', count: subject === 'english' ? 10 : 15, sources: subject === 'english' ? ['listing', 'truefalse', 'analysis'] : ([1, 2, 3] as unknown as string[]), title: 'Mixed quick round' })}>Prepare mixed round</Button>
    {selected && <View accessibilityLiveRegion="polite" style={[styles.prep, { borderColor: tokens.accent, backgroundColor: colors.raised }]}><Text style={[styles.code, { color: tokens.accent }]}>READY TO PREPARE</Text><Text style={[styles.title, { color: colors.ink }]}>{selected.title}</Text><Text style={{ color: colors.quiet }}>Your timer starts only after the server creates the session. Draft answers are stored on this device.</Text><Button disabled={Boolean(busy) || !online} onPress={start}>{busy || (online ? 'Start session' : 'Connect to start')}</Button><Button variant="secondary" disabled={Boolean(busy)} onPress={() => setSelected(null)}>Cancel</Button></View>}
    {error && <Notice kind="error" title="COULD NOT START">{error}</Notice>}
  </ScrollScreen>;
}

const styles = StyleSheet.create({ intro: { fontSize: 16, lineHeight: 23 }, docket: { borderWidth: 1, borderLeftWidth: 6, padding: 17, gap: 8 }, code: { fontFamily: 'monospace', fontSize: 11, fontWeight: '800', letterSpacing: 1 }, title: { fontFamily: 'serif', fontSize: 23, fontWeight: '700' }, actions: { gap: 8, marginTop: 6 }, chips: { gap: 8 }, chip: { minHeight: 54, padding: 12, borderWidth: 1, gap: 3 }, prep: { borderWidth: 2, padding: 16, gap: 12 } });
