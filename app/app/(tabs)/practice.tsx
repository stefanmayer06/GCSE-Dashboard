import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { ApiClient } from '@/api';
import { Button, DeskHeader, Notice, OfflineBanner, ScrollScreen, SectionHeader } from '@/components';
import { useAuth, useNetwork, usePreferences } from '@/providers';
import { activeId, draftId, finite, parseDraft, parsePapers, parseTopics, persistNewSession, sessionFromResponse, text, type PracticeKind, type UnknownRecord } from '@/practice/core';
import { useTheme } from '@/theme';
import { queryKeys } from '@/query-cache';

const label = (item: UnknownRecord) => text(item.name) ?? text(item.title) ?? text(item.blurb) ?? text(item.id) ?? 'Untitled';
type Selection = { kind: PracticeKind; title: string; paper?: number; type?: string; topicId?: string; count?: number; sources?: string[] };

if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);

function PreparationPanel({selection,busy,online,error,onStart,onCancel,colors,accent}:{selection:Selection;busy:string;online:boolean;error:string;onStart:()=>void;onCancel:()=>void;colors:Record<string,string>;accent:string}) {
  const [reveal]=useState(()=>new Animated.Value(0));
  useEffect(()=>{Animated.spring(reveal,{toValue:1,useNativeDriver:true,damping:18,stiffness:180,mass:.8}).start();},[reveal]);
  return <Animated.View accessibilityLiveRegion="polite" style={[styles.prep,{borderColor:accent,backgroundColor:colors.raised,opacity:reveal,transform:[{translateY:reveal.interpolate({inputRange:[0,1],outputRange:[-10,0]})},{scale:reveal.interpolate({inputRange:[0,1],outputRange:[.98,1]})}]}]}>
    <Text style={[styles.code,{color:accent}]}>READY TO PREPARE</Text><Text style={[styles.title,{color:colors.ink}]}>{selection.title}</Text><Text style={{color:colors.quiet,lineHeight:21}}>Your timer starts only after the server creates the session. Draft answers are stored on this device.</Text>
    {error&&<Notice kind="error" title="COULD NOT START">{error}</Notice>}
    <Button disabled={Boolean(busy)||!online} onPress={onStart}>{busy||(online?'Start session':'Connect to start')}</Button><Button variant="secondary" disabled={Boolean(busy)} onPress={onCancel}>Cancel</Button>
  </Animated.View>;
}

export default function PracticeHome() {
  const { subject } = usePreferences();
  const { session } = useAuth();
  const { online } = useNetwork();
  const { colors, subject: tokens } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ diagnostic?: string; topicId?: string }>();
  const api = new ApiClient(subject);
  const papers = useQuery({ queryKey: queryKeys.papers(subject), queryFn: () => api.papers(), staleTime: 10 * 60_000 });
  const topics = useQuery({ queryKey: queryKeys.topics(subject), queryFn: () => api.topics() as Promise<unknown>, staleTime: 10 * 60_000 });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [activeSession, setActiveSession] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySession, setRecoverySession] = useState('');
  const [selected, setSelected] = useState<Selection | null>(null);
  const choose=(next:Selection|null)=>{LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);setError('');setSelected(next)};
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
  // Route parameters intentionally initialize the preparation panel.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{const available=parseTopics(topics.data);const topic=available.find(item=>text(item.id)===params.topicId);if(params.diagnostic==='1')setSelected({kind:'adhoc',count:10,sources:subject==='english'?['listing','truefalse','analysis']:['1','2','3'],title:'Diagnostic mixed check'});else if(params.topicId&&topic)setSelected({kind:'practice',topicId:params.topicId,count:subject==='english'?3:8,title:label(topic)});},[params.diagnostic,params.topicId,subject,topics.data]);
  return <ScrollScreen contentContainerStyle={styles.content}>
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
      return <View key={String(paper.id ?? code)} style={[styles.docket, { backgroundColor: colors.raised, borderColor: colors.line, borderLeftColor: tokens.accent }]}>
        <Text style={[styles.code, { color: tokens.accent }]}>{code}</Text><Text style={[styles.title, { color: colors.ink }]}>{label(paper)}</Text>
        <Text style={{ color: colors.quiet }}>{calculator} · {fullMarks} marks · {fullMinutes} min</Text>
        <View style={styles.actions}><Button onPress={() => choose({ kind: 'paper', paper: id, type: 'full', title: `${code} full paper` })}>Prepare full exam</Button><Button variant="secondary" onPress={() => choose({ kind: 'paper', paper: id, type: 'short', title: `${code} quick paper` })}>Prepare quick paper</Button></View>
        {selected?.kind==='paper'&&selected.paper===id&&<PreparationPanel key={`${id}-${selected.type}`} selection={selected} busy={busy} online={online} error={error} onStart={()=>void start()} onCancel={()=>choose(null)} colors={colors} accent={tokens.accent}/>}
      </View>;
    })}
    <View style={[styles.mixed,{backgroundColor:colors.muted,borderColor:colors.line}]}><SectionHeader title="Mixed quick round" /><Text style={{ color: colors.quiet }}>A server-built mix of {subject === 'english' ? 'listing, true/false and analysis' : 'questions from all three papers'}.</Text><Button variant="secondary" onPress={() => choose({ kind: 'adhoc', count: subject === 'english' ? 10 : 15, sources: subject === 'english' ? ['listing', 'truefalse', 'analysis'] : ([1, 2, 3] as unknown as string[]), title: 'Mixed quick round' })}>Prepare mixed round</Button>{selected?.kind==='adhoc'&&<PreparationPanel selection={selected} busy={busy} online={online} error={error} onStart={()=>void start()} onCancel={()=>choose(null)} colors={colors} accent={tokens.accent}/>}</View>
    <SectionHeader title="Target a topic" meta={`${topicList.length} TOPICS`} />
    {topics.isError && <><Notice kind="error" title="TOPICS UNAVAILABLE">The topic list could not be loaded.</Notice><Button variant="secondary" disabled={topics.isFetching} onPress={() => void topics.refetch()}>Retry topics</Button></>}
    <View style={styles.chips}>{topicList.map((topic) => { const id = text(topic.id); if (!id) return null; const name = label(topic); return <View key={id} style={styles.topicGroup}><Pressable accessibilityRole="button" accessibilityState={{ selected: selected?.topicId === id }} onPress={() => choose({ kind: 'practice', topicId: id, count: subject === 'english' ? 3 : 8, title: name })} style={({pressed})=>[styles.chip,{borderColor:selected?.topicId===id?tokens.accent:colors.strong,backgroundColor:selected?.topicId===id?colors.muted:colors.raised,opacity:pressed?.72:1}]}><Text style={{ color: colors.ink, fontWeight: '700' }}>{name}</Text>{finite(topic.accuracy) != null && <Text style={{ color: colors.quiet }}>{finite(topic.accuracy)}% accuracy</Text>}</Pressable>{selected?.kind==='practice'&&selected.topicId===id&&<PreparationPanel selection={selected} busy={busy} online={online} error={error} onStart={()=>void start()} onCancel={()=>choose(null)} colors={colors} accent={tokens.accent}/>}</View>; })}</View>
  </ScrollScreen>;
}

const styles = StyleSheet.create({ content:{padding:20,paddingBottom:108,gap:18},intro: { fontSize: 16, lineHeight: 23 }, docket: { borderWidth: 1, borderLeftWidth: 6, padding: 18, gap: 9,borderRadius:20,shadowColor:'#000',shadowOpacity:.07,shadowRadius:12,shadowOffset:{width:0,height:5},elevation:2 }, code: { fontFamily: 'monospace', fontSize: 11, fontWeight: '800', letterSpacing: 1 }, title: { fontSize: 23, fontWeight: '800',letterSpacing:-.4 }, actions: { gap: 8, marginTop: 6 }, mixed:{borderWidth:1,borderRadius:20,padding:16,gap:13},chips: { gap: 8 },topicGroup:{gap:8}, chip: { minHeight: 58, padding: 14, borderWidth: 1, gap: 3,borderRadius:15 }, prep: { borderWidth: 2, padding: 18, gap: 12,borderRadius:20,marginTop:8 } });
