import { ApiClient } from '@/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, DeskHeader, Notice, OfflineBanner, ScrollScreen } from '@/components';
import { asRecord, asText, parseNotes, safeText, type NoteBlock } from '@/learn';
import { useAuth, useNetwork, usePreferences } from '@/providers';
import { persistNewSession, sessionFromResponse } from '@/practice/core';
import { useTheme } from '@/theme';
import { queryKeys } from '@/query-cache';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

function Note({ block, index }: { block: NoteBlock; index: number }) {
  const { colors, subject } = useTheme();
  if (block.kind === 'paragraph') return <Text style={[styles.paragraph, { color: colors.ink }]}>{block.text}</Text>;
  if (block.kind === 'list') return <View style={styles.list}>{block.items.map((item, i) => <View key={`${index}-${i}`} style={styles.listRow}><Text style={[styles.bullet, { color: subject.accent }]}>0{i + 1}</Text><Text style={[styles.listText, { color: colors.ink }]}>{item}</Text></View>)}</View>;
  if (block.kind === 'method') return <View style={[styles.method, { backgroundColor: colors.raised, borderColor: subject.accent }]}><Text style={[styles.meta, { color: subject.accent }]}>{block.title || 'METHOD'}</Text><Text style={[styles.methodText, { color: colors.ink }]}>{block.text}</Text></View>;
  return <View style={[styles.example, { borderColor: colors.strong }]}><Text style={[styles.meta, { color: subject.accent }]}>WORKED EXAMPLE</Text>{!!block.question && <Text style={[styles.exampleQ, { color: colors.ink }]}>{block.question}</Text>}{!!block.answer && <Text style={[styles.paragraph, { color: colors.ink }]}>{block.answer}</Text>}</View>;
}

export default function Lesson() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topicId = Array.isArray(id) ? id[0] : id;
  const { subject } = usePreferences();
  const { colors, subject: tokens } = useTheme();
  const { online } = useNetwork();
  const { session: auth } = useAuth();
  const { width } = useWindowDimensions();
  const api = new ApiClient(subject);
  const query = useQuery({ queryKey: queryKeys.topic(subject, topicId), queryFn: () => api.topic(topicId) as Promise<unknown>, enabled: !!topicId, staleTime: 10 * 60_000 });
  const topic = asRecord(query.data);
  const title = asText(topic.name) || asText(topic.title) || 'Topic lesson';
  const group = asText(topic.strandName) || asText(topic.sectionName) || asText(topic.strand) || asText(topic.section);
  const notes = parseNotes(topic.notes);
  const extraBlocks = [
    ...parseNotes(topic.method), ...parseNotes(topic.methods), ...parseNotes(topic.framework), ...parseNotes(topic.frameworks),
  ];
  const mistakes = parseNotes(topic.commonMistakes ?? topic.common_mistakes ?? topic.mistakes);
  const resources = Array.isArray(topic.resources) ? topic.resources.map(asRecord).filter((item) => /^https?:\/\//i.test(asText(item.url))) : [];
  const practice = useMutation({ mutationFn: async () => {
    const response = await api.practice(topicId, subject === 'english' ? 3 : 5);
    const local = sessionFromResponse(subject, 'practice', response, title, topicId);
    await persistNewSession(AsyncStorage, auth?.user.id, local);
    return local;
  }, onSuccess: (local) => router.push({ pathname: '/practice/[id]', params: { id: local.id } }) });

  if (query.isPending && !query.data) return <ScrollScreen><DeskHeader title="Opening lesson" eyebrow="COURSE NOTES"/><Notice kind="loading" title="FETCHING THE LESSON">Collecting the current notes and completion state.</Notice></ScrollScreen>;
  if (query.isError && !query.data) return <ScrollScreen><DeskHeader title="Lesson unavailable" eyebrow="COURSE NOTES"/><OfflineBanner/><Notice kind={online ? 'error' : 'offline'} title={online ? 'LESSON NOT FOUND' : 'LESSON NEEDS A CONNECTION'}>{online ? 'The topic could not be fetched. Return to Learn and choose another lesson.' : 'This lesson is not in the current session cache.'}</Notice><Button variant="secondary" onPress={() => router.back()}>Back to Learn</Button></ScrollScreen>;

  return <ScrollScreen contentContainerStyle={[styles.content, width >= 760 && styles.tablet]}>
    <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={[styles.back, { color: tokens.accent }]}>‹ COURSE INDEX</Text></Pressable>
    <DeskHeader title={title} eyebrow={group || 'TOPIC LESSON'} />
    <OfflineBanner />
    {!online && Boolean(query.data) && <Text style={[styles.cache, { color: colors.quiet }]}>Last lesson content held in this session. Not a downloaded lesson.</Text>}
    <View style={styles.statusLine}><Text style={[styles.meta, { color: topic.completed ? colors.positive : colors.quiet }]}>{topic.completed ? 'LESSON COMPLETED' : 'LESSON NOT COMPLETED'}</Text>{typeof topic.accuracy === 'number' && <Text style={[styles.meta, { color: colors.quiet }]}>{topic.accuracy}% ACCURACY</Text>}{typeof topic.examWeight === 'number' && <Text style={[styles.meta, { color: colors.quiet }]}>{subject === 'english' ? `ABOUT ${topic.examWeight} MARKS` : `ABOUT ${topic.examWeight}% OF COURSE CONTENT`}</Text>}</View>
    {!!(asText(topic.blurb) || asText(topic.description)) && <View style={[styles.purpose, { borderColor: colors.ink }]}><Text style={[styles.meta, { color: tokens.accent }]}>LESSON PURPOSE</Text><Text style={[styles.purposeText, { color: colors.ink }]}>{asText(topic.blurb) || asText(topic.description)}</Text></View>}
    {notes.length + extraBlocks.length > 0 ? <View style={styles.notes}><Text accessibilityRole="header" style={[styles.h2, { color: colors.ink }]}>Notes and method</Text>{[...notes, ...extraBlocks].map((block, index) => <Note key={index} block={block} index={index}/>)}</View> : <Notice title="NOTES NOT PUBLISHED">This topic exists in the course index, but the server returned no structured lesson notes.</Notice>}
    {mistakes.length > 0 && <View style={[styles.mistakes, { borderColor: colors.warning }]}><Text accessibilityRole="header" style={[styles.h2, { color: colors.ink }]}>Common mistakes</Text>{mistakes.map((block, index) => <Note key={index} block={block} index={index}/>)}</View>}
    <View style={[styles.practice, { borderColor: colors.strong }]}><Text style={[styles.meta, { color: tokens.accent }]}>SHORT PRACTICE</Text><Text style={[styles.h2, { color: colors.ink }]}>{subject === 'english' ? 'Try 3 bank questions' : 'Try 5 bank questions'}</Text><Text style={[styles.paragraph, { color: colors.quiet }]}>The server creates the session and remains authoritative for marking, completion and rewards.</Text><Button disabled={!online || practice.isPending} onPress={() => practice.mutate()}>{practice.isPending ? 'Preparing questions…' : online ? 'Start short practice' : 'Reconnect to start'}</Button>{practice.isError && <Notice kind="error" title="PRACTICE DID NOT START">{practice.error.message}</Notice>}</View>
    {resources.length > 0 && <View style={styles.resources}><Text accessibilityRole="header" style={[styles.h2, { color: colors.ink }]}>Further source material</Text><Text style={[styles.paragraph, { color: colors.quiet }]}>These links open outside the app.</Text>{resources.map((resource, index) => <Pressable accessibilityRole="link" key={`${asText(resource.url)}-${index}`} onPress={() => void Linking.openURL(asText(resource.url))} style={[styles.resource, { borderBottomColor: colors.line }]}><Text style={[styles.resourceTitle, { color: colors.ink }]}>{asText(resource.label) || 'External resource'} ↗</Text>{!!safeText(resource.why) && <Text style={[styles.paragraph, { color: colors.quiet }]}>{safeText(resource.why)}</Text>}</Pressable>)}</View>}
    <View style={[styles.tutor, { backgroundColor: colors.raised, borderColor: colors.strong }]}><Text style={[styles.h2, { color: colors.ink }]}>Ask Tutor about this lesson</Text><Text style={[styles.paragraph, { color: colors.quiet }]}>Open the tutor with this topic attached as context.</Text><Button variant="secondary" onPress={() => router.push({ pathname: '/tutor', params: { topicId, topic: title } } as never)}>Ask Tutor: {title}</Button></View>
  </ScrollScreen>;
}

const styles = StyleSheet.create({content:{padding:20,paddingBottom:56,gap:20},tablet:{width:'100%',maxWidth:820,alignSelf:'center',paddingHorizontal:36},back:{fontFamily:'monospace',fontWeight:'800',fontSize:11,letterSpacing:1},cache:{fontSize:13},statusLine:{flexDirection:'row',flexWrap:'wrap',gap:12},meta:{fontFamily:'monospace',fontSize:11,fontWeight:'800',letterSpacing:.8},purpose:{borderTopWidth:2,borderBottomWidth:1,paddingVertical:18,gap:9},purposeText:{fontFamily:'serif',fontSize:22,lineHeight:31},notes:{gap:16},h2:{fontFamily:'serif',fontSize:27},paragraph:{fontSize:16,lineHeight:25},list:{gap:10},listRow:{flexDirection:'row',gap:12},bullet:{fontFamily:'monospace',fontSize:11,fontWeight:'800',paddingTop:4},listText:{flex:1,fontSize:16,lineHeight:24},method:{borderWidth:1,borderLeftWidth:5,padding:16,gap:10},methodText:{fontFamily:'monospace',fontSize:15,lineHeight:24},example:{borderWidth:1,padding:16,gap:10},exampleQ:{fontFamily:'serif',fontSize:20,lineHeight:27,fontWeight:'700'},mistakes:{borderWidth:1,borderTopWidth:5,padding:16,gap:14},practice:{borderWidth:1,padding:18,gap:12},resources:{gap:8},resource:{paddingVertical:13,borderBottomWidth:1,gap:4},resourceTitle:{fontSize:16,fontWeight:'700'},tutor:{borderWidth:1,padding:18,gap:12}});
