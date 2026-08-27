import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiClient } from '@/api';
import { Button, DeskHeader, Notice, PaperPattern } from '@/components';
import { useAuth, useNetwork, usePreferences } from '@/providers';
import { subjectTokens, useTheme, type Subject } from '@/theme';
import { boundTutorHistory, legacyTutorNotebookKey, parseTutorHistory, parseTutorNotebook, parseTutorResponse, sendTutorChat, tutorNotebookKey, type TutorMessage } from '@/tutor';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Alert, AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STARTERS: Record<Subject, string[]> = {
  maths: ['Show me a Foundation method for adding fractions.', 'Help me start a non-calculator percentage question.', 'Quiz me on solving a linear equation, one step at a time.', 'How should I check a 5-mark ratio answer?'],
  'maths-higher': ['Guide me through completing the square without finishing it for me.', 'Help me choose a method for a Higher trigonometry question.', 'Quiz me on algebraic fractions, one step at a time.', 'How do I check a proof question for enough reasoning?'],
  english: ['Help me plan AQA Paper 1 Question 5 before I write.', 'Coach me through one language-analysis paragraph for Paper 1 Question 2.', 'Give me a framework for comparing viewpoints in Paper 2 Question 4.', 'Check whether my opening answers the purpose, audience and form.'],
};

const greeting = (subject: Subject): TutorMessage => ({ id: `welcome-${subject}`, role: 'assistant', content: subject === 'english' ? 'Bring me an AQA English Language question, paragraph or plan. I will coach the next useful step rather than claim there is only one perfect answer.' : `Bring me an AQA ${subject === 'maths-higher' ? 'Higher' : 'Foundation'} Maths question or your working. I will help with the method one step at a time.` });
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default function Tutor() {
  const { subject } = usePreferences();
  const { session } = useAuth();
  const { online } = useNetwork();
  const { colors, subject: subjectTheme } = useTheme();
  const params = useLocalSearchParams<{ context?: string | string[]; topic?: string | string[]; lesson?: string | string[]; result?: string | string[]; question?: string | string[]; prompt?: string | string[] }>();
  const context = one(params.context) || one(params.question) || one(params.topic) || one(params.lesson) || one(params.result) || '';
  const lessonId = one(params.lesson) || one(params.topic) || 'sample';
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [historyNote, setHistoryNote] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const scroll = useRef<ScrollView>(null);
  const userId = session?.user.id;
  const key = userId ? tutorNotebookKey(userId, subject) : null;
  const notebook = useRef({ key: null as string | null, messages: [] as TutorMessage[], draft: '' });

  const flushNotebook = () => {
    const current = notebook.current;
    if (current.key) return AsyncStorage.setItem(current.key, JSON.stringify({ messages: current.messages, draft: current.draft }));
    return Promise.resolve();
  };

  useEffect(() => { notebook.current = { key: loadedKey, messages, draft }; }, [draft, loadedKey, messages]);

  useEffect(() => {
    let live = true;
    if (notebook.current.key && notebook.current.key !== key) void flushNotebook();
    request.current?.abort();
    void Promise.resolve().then(async () => {
      if (!live) return;
      setLoadedKey(null);
      setMessages([]);
      setDraft('');
      setHistoryNote('');
      setActiveId(null);
      if (!key || !userId) return;
      const [saved] = await Promise.all([AsyncStorage.getItem(key), AsyncStorage.removeItem(legacyTutorNotebookKey(subject))]);
      if (!live) return;
      const { messages: localMessages, draft: localDraft } = parseTutorNotebook(saved);
      setMessages(localMessages.length ? localMessages : [greeting(subject)]);
      setHistoryNote('');
      setDraft(one(params.prompt) || localDraft || (context ? `Help me with this: ${context}` : ''));
      if (online) try {
        const history = parseTutorHistory(await new ApiClient(subject).chatHistory());
        if (live && history.length) setMessages([...history.map((message, index) => ({ ...message, id: `history-${index}` })), ...localMessages.filter(message => message.status === 'failed')]);
        else if (live) setHistoryNote('Server history is unavailable for this account; this device notebook is kept instead.');
      } catch {
        if (live) setHistoryNote('Could not refresh server history; showing this device notebook.');
      }
      if (live) setLoadedKey(key);
    });
    return () => { live = false; request.current?.abort(); };
    // Context is consumed when the subject notebook opens, not whenever query or network state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, subject, userId]);

  const loaded = loadedKey === key && Boolean(key);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => void flushNotebook(), 250);
    return () => clearTimeout(timer);
  }, [draft, loaded, messages]);

  useEffect(() => {
    const appState = AppState.addEventListener('change', state => {
      if (state === 'background' || state === 'inactive') void flushNotebook();
    });
    return () => { appState.remove(); void flushNotebook(); };
  }, []);

  useEffect(() => { if (loaded) scroll.current?.scrollToEnd({ animated: false }); }, [activeId, loaded, messages]);

  async function send(contentOverride?: string, retryId?: string) {
    const content = (contentOverride ?? draft).trim();
    if (!content || activeId || !online) return;
    const id = retryId || makeId();
    const userMessage: TutorMessage = { id, role: 'user', content, status: 'sending' };
    const next = retryId ? messages.map(message => message.id === id ? userMessage : message) : [...messages, userMessage];
    setMessages(next);
    if (!retryId) setDraft('');
    setActiveId(id);
    const controller = new AbortController();
    request.current = controller;
    try {
      const payloadMessages = [...next.filter(message => message.id !== id), { ...userMessage, status: 'sent' as const }];
      const parsed = parseTutorResponse(await sendTutorChat(new ApiClient(subject), boundTutorHistory(payloadMessages), controller.signal));
      if (!parsed.content) throw new Error('The tutor returned no readable response.');
      setMessages(current => [...current.map(message => message.id === id ? { ...message, status: 'sent' as const } : message), { id: makeId(), role: 'assistant', content: parsed.content, model: parsed.model }]);
      AccessibilityInfo.announceForAccessibility('Tutor reply received');
    } catch {
      setMessages(current => current.map(message => message.id === id ? { ...message, status: 'failed' as const } : message));
      AccessibilityInfo.announceForAccessibility(controller.signal.aborted ? 'Tutor request cancelled. Message kept for retry.' : 'Tutor request failed. Message kept for retry.');
    } finally {
      if (request.current === controller) request.current = null;
      setActiveId(null);
    }
  }

  function clearConversation() {
    Alert.alert('Clear tutor notebook?', 'This removes the current subject transcript and draft from this device.', [{ text: 'Keep it', style: 'cancel' }, { text: 'Clear', style: 'destructive', onPress: () => void (async () => {
      request.current?.abort();
      if (online) await new ApiClient(subject).clearChat().catch(() => undefined);
      setMessages([greeting(subject)]);
      setDraft('');
       if (key) await AsyncStorage.removeItem(key);
      AccessibilityInfo.announceForAccessibility('Tutor notebook cleared');
    })() }]);
  }

  const lastLearner = [...messages].reverse().find(message => message.role === 'user')?.content;
  const actions = lastLearner ? [
    ['Another hint', `Give me another hint for this, without revealing the final answer: ${lastLearner}`],
    ['Check my step', `Check my latest step and identify the first specific issue, if any: ${lastLearner}`],
    ['Explain differently', `Explain this using a different representation or simpler example: ${lastLearner}`],
  ] : [];

  return <SafeAreaView style={[styles.screen, { backgroundColor: colors.paper }]}><PaperPattern/><KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={66}>
    <View style={styles.top}><DeskHeader title="Tutor notebook" eyebrow="GUIDED METHOD"/><View style={styles.subjectRow}><View style={[styles.subjectMark, { backgroundColor: subjectTheme.accent }]}/><View style={styles.flex}><Text style={[styles.subject, { color: colors.ink }]}>{subjectTokens[subject].label}</Text><Text style={[styles.caption, { color: colors.quiet }]}>{subject === 'english' ? 'AQA 8700 · no tier' : `AQA 8300 · ${subject === 'maths-higher' ? 'Higher, grades 4–9' : 'Foundation, grades 1–5'}`}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Clear tutor conversation" onPress={clearConversation} hitSlop={10}><Text style={[styles.clear, { color: colors.negative }]}>CLEAR</Text></Pressable></View></View>
    <ScrollView ref={scroll} contentContainerStyle={styles.transcript} keyboardShouldPersistTaps="handled">
      {!online && <Notice kind="offline" title="TUTOR OFFLINE">Your notebook and draft are saved on this device. The tutor will not be contacted until you reconnect.</Notice>}
      {!online && <View style={[styles.offlineRoutes, { borderColor: colors.strong, backgroundColor: colors.raised }]}><Text style={[styles.routeTitle, { color: colors.ink }]}>Keep working without a tutor response</Text><Link href={`/lesson/${encodeURIComponent(lessonId)}` as never} asChild><Pressable accessibilityRole="link" style={styles.routeLink}><Text style={{ color: subjectTheme.accent, fontWeight: '800' }}>Open cached lesson framework</Text></Pressable></Link><Link href="/(tabs)/learn" asChild><Pressable accessibilityRole="link" style={styles.routeLink}><Text style={{ color: subjectTheme.accent, fontWeight: '800' }}>Browse saved course notes</Text></Pressable></Link></View>}
      {context ? <View style={[styles.context, { borderColor: subjectTheme.accent, backgroundColor: colors.raised }]}><Text style={[styles.label, { color: subjectTheme.accent }]}>BROUGHT FROM YOUR WORK</Text><Text selectable style={{ color: colors.ink, lineHeight: 21 }}>{context}</Text></View> : null}
      {historyNote ? <Text accessibilityLiveRegion="polite" style={[styles.note, { color: colors.quiet }]}>{historyNote}</Text> : null}
      {!loaded ? <ActivityIndicator accessibilityLabel="Loading tutor notebook" color={subjectTheme.accent}/> : messages.map(message => <View key={message.id} accessibilityLabel={`${message.role === 'user' ? 'Learner' : 'Tutor'} message`} style={[styles.message, message.role === 'user' ? styles.learner : styles.tutor, { backgroundColor: message.role === 'user' ? subjectTheme.accent : colors.raised, borderColor: message.role === 'user' ? subjectTheme.accent : colors.strong }]}><Text style={[styles.label, { color: message.role === 'user' ? '#fff' : subjectTheme.accent }]}>{message.role === 'user' ? 'YOU · LEARNER' : 'TUTOR · GUIDANCE'}</Text><Text selectable style={[styles.messageText, { color: message.role === 'user' ? '#fff' : colors.ink }]}>{message.content}</Text>{message.model ? <Text style={[styles.model, { color: colors.quiet }]}>Model: {message.model}</Text> : null}{message.status === 'sending' ? <Text style={styles.pending}>Sending…</Text> : null}{message.status === 'failed' ? <Pressable accessibilityRole="button" accessibilityLabel={`Retry message: ${message.content}`} disabled={!online || Boolean(activeId)} onPress={() => void send(message.content, message.id)}><Text style={[styles.retry, { color: online ? colors.negative : colors.quiet }]}>NOT SENT · RETRY</Text></Pressable> : null}</View>)}
      {activeId ? <View accessibilityLiveRegion="polite" style={styles.thinking}><ActivityIndicator color={subjectTheme.accent}/><Text style={{ color: colors.quiet }}>Waiting for tutor response…</Text><Pressable accessibilityRole="button" accessibilityLabel="Cancel tutor request" onPress={() => request.current?.abort()}><Text style={{ color: colors.negative, fontWeight: '800' }}>Cancel</Text></Pressable></View> : null}
      {actions.length ? <View><Text style={[styles.label, { color: colors.quiet }]}>NEXT COACHING MOVE</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{actions.map(([label, prompt]) => <Pressable key={label} accessibilityRole="button" accessibilityLabel={`${label}; sends a prompt to the tutor`} disabled={!online || Boolean(activeId)} onPress={() => void send(prompt)} style={[styles.chip, { borderColor: colors.strong, backgroundColor: colors.raised, opacity: !online || activeId ? .5 : 1 }]}><Text style={{ color: colors.ink, fontWeight: '700' }}>{label}</Text></Pressable>)}</ScrollView></View> : <View><Text style={[styles.label, { color: colors.quiet }]}>EXAM-SPECIFIC STARTERS</Text><View style={styles.starters}>{STARTERS[subject].map(prompt => <Pressable key={prompt} accessibilityRole="button" disabled={!online || Boolean(activeId)} onPress={() => void send(prompt)} style={[styles.starter, { borderColor: colors.strong, backgroundColor: colors.raised, opacity: !online ? .5 : 1 }]}><Text style={{ color: colors.ink, lineHeight: 20 }}>{prompt}</Text></Pressable>)}</View></View>}
      <Text style={[styles.disclaimer, { color: colors.quiet }]}>Tutor responses can be incomplete or mistaken. Check methods against your course materials and teacher guidance.</Text>
    </ScrollView>
    <View style={[styles.composer, { borderTopColor: colors.ink, backgroundColor: colors.paper }]}><TextInput accessibilityLabel="Message the tutor" multiline maxLength={3000} placeholder={online ? 'Show your working or ask for the next step…' : 'Draft saved; reconnect to send…'} placeholderTextColor={colors.quiet} value={draft} onChangeText={setDraft} style={[styles.input, { color: colors.ink, backgroundColor: colors.raised, borderColor: colors.strong }]} /><View style={styles.send}><Text style={[styles.count, { color: colors.quiet }]}>{draft.length}/3000</Text><Button accessibilityLabel="Send message to tutor" disabled={!loaded || !online || Boolean(activeId) || !draft.trim()} onPress={() => void send()}>Send</Button></View></View>
  </KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, top: { paddingHorizontal: 18 }, subjectRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10 }, subjectMark: { width: 5, height: 34 }, flex: { flex: 1 }, subject: { fontFamily: 'serif', fontSize: 18, fontWeight: '700' }, caption: { fontSize: 12, marginTop: 2 }, clear: { fontFamily: 'monospace', fontWeight: '800', fontSize: 12 }, transcript: { padding: 18, paddingBottom: 28, gap: 14 }, context: { borderWidth: 1, borderLeftWidth: 5, padding: 13, gap: 6 }, label: { fontFamily: 'monospace', fontWeight: '800', fontSize: 10, letterSpacing: .8 }, note: { fontSize: 12, fontStyle: 'italic' }, message: { maxWidth: '88%', borderWidth: 1, padding: 14, gap: 7 }, learner: { alignSelf: 'flex-end', borderTopRightRadius: 2, borderRadius: 14 }, tutor: { alignSelf: 'flex-start', borderTopLeftRadius: 2, borderRadius: 14 }, messageText: { fontSize: 16, lineHeight: 23 }, model: { fontFamily: 'monospace', fontSize: 10 }, pending: { color: '#fff', fontSize: 11, fontWeight: '700' }, retry: { fontFamily: 'monospace', fontSize: 11, fontWeight: '900' }, thinking: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }, chips: { gap: 8, paddingTop: 8 }, chip: { minHeight: 44, borderWidth: 1, paddingHorizontal: 14, justifyContent: 'center' }, starters: { gap: 8, paddingTop: 8 }, starter: { minHeight: 48, borderWidth: 1, padding: 12, justifyContent: 'center' }, disclaimer: { fontSize: 11, lineHeight: 16 }, composer: { borderTopWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 10 }, input: { flex: 1, minHeight: 48, maxHeight: 120, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16 }, send: { gap: 4, alignItems: 'flex-end' }, count: { fontSize: 9 }, offlineRoutes: { borderWidth: 1, padding: 13, gap: 4 }, routeTitle: { fontWeight: '700', marginBottom: 3 }, routeLink: { minHeight: 44, justifyContent: 'center' } });
