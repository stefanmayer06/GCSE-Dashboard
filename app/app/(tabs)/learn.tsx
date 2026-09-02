import { ApiClient } from '@/api';
import { DeskHeader, Notice, OfflineBanner, ScrollScreen } from '@/components';
import { useNetwork, usePreferences } from '@/providers';
import { useTheme } from '@/theme';
import { filterTopicGroups, mergeTopicProgress, parseTopicGroups, asRecord, asText } from '@/learn';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { queryKeys } from '@/query-cache';

function RetryAction({ label, onPress, color }: { label: string; onPress: () => void; color: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.retry, { borderColor: color }]}>
    <Text style={[styles.retryText, { color }]}>{label.toUpperCase()}</Text>
  </Pressable>;
}

export default function Learn() {
  const { subject } = usePreferences();
  const { colors, subject: tokens } = useTheme();
  const { online } = useNetwork();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const api = new ApiClient(subject);
  const topics = useQuery({ queryKey: queryKeys.topics(subject), queryFn: () => api.topics() as Promise<unknown>, staleTime: 10 * 60_000 });
  const progress = useQuery({ queryKey: queryKeys.progress(subject), queryFn: () => api.progress() as Promise<unknown> });
  const texts = useQuery({ queryKey: queryKeys.texts(subject), queryFn: () => api.texts() as Promise<unknown>, enabled: subject === 'english', staleTime: 30 * 60_000 });
  const groups = filterTopicGroups(mergeTopicProgress(parseTopicGroups(topics.data), progress.data), search);
  const library = Array.isArray(asRecord(texts.data).texts) ? asRecord(texts.data).texts as unknown[] : [];
  const hasTopics = topics.data !== undefined;
  const hasProgress = progress.data !== undefined;
  const hasTexts = texts.data !== undefined;
  const refreshing = topics.isRefetching || progress.isRefetching || (subject === 'english' && texts.isRefetching);
  const refresh = () => void Promise.all([topics.refetch(), progress.refetch(), ...(subject === 'english' ? [texts.refetch()] : [])]);

  return <ScrollScreen contentContainerStyle={[styles.content, width >= 760 && styles.tablet]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={tokens.accent} />}>
    <DeskHeader title={subject === 'english' ? 'Skills and source library' : 'Learn by topic'} eyebrow={subject === 'english' ? 'AQA 8700 SOURCE DESK' : 'COURSE NOTES'} />
    <OfflineBanner />
    {!online && hasTopics && <Text accessibilityRole="alert" style={[styles.cacheNote, { color: colors.quiet }]}>Showing a session copy of the course index. This copy is only available until the app session ends.</Text>}
    {topics.isError && hasTopics && <Text accessibilityRole="alert" style={[styles.cacheNote, { color: colors.quiet }]}>The course index could not be refreshed. The session copy remains available until the app session ends.</Text>}
    {progress.isError && hasProgress && <Text accessibilityRole="alert" style={[styles.cacheNote, { color: colors.quiet }]}>Progress could not be refreshed. The session copy remains available until the app session ends.</Text>}
    <TextInput accessibilityLabel="Search lessons" value={search} onChangeText={setSearch} placeholder="Search the course index" placeholderTextColor={colors.quiet} style={[styles.search, { color: colors.ink, borderColor: colors.strong, backgroundColor: colors.raised }]} />
    {topics.isPending && !hasTopics && <Notice kind="loading" title="OPENING THE COURSE INDEX">Fetching your topics and progress.</Notice>}
    {topics.isError && !hasTopics && <View style={styles.recovery}><Notice kind={online ? 'error' : 'offline'} title={online ? 'COURSE INDEX UNAVAILABLE' : 'COURSE INDEX NEEDS A CONNECTION'}>{online ? 'The server did not return the topic list.' : 'Connect to load this course index.'}</Notice><RetryAction label="Retry course index" onPress={() => void topics.refetch()} color={tokens.accent} /></View>}
    {progress.isError && !hasProgress && <View style={styles.recovery}><Notice kind={online ? 'error' : 'offline'} title="PROGRESS UNAVAILABLE">Your lessons are still available, but their latest completion and accuracy could not be loaded.</Notice><RetryAction label="Retry progress" onPress={() => void progress.refetch()} color={tokens.accent} /></View>}
    {!topics.isPending && hasTopics && groups.length === 0 && <Notice title={search ? 'NO MATCHING LESSONS' : 'NO LESSONS PUBLISHED'}>{search ? 'Try a topic name, skill, or course section.' : 'The server returned an empty course index.'}</Notice>}
    {groups.map((group) => <View key={group.id} style={[styles.section, { borderColor: colors.strong }]}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: !closed[group.id] }} onPress={() => setClosed((value) => ({ ...value, [group.id]: !value[group.id] }))} style={styles.sectionHead}>
        <View style={styles.grow}><Text style={[styles.sectionTitle, { color: colors.ink }]}>{group.name}</Text>{!!group.description && <Text style={[styles.copy, { color: colors.quiet }]}>{group.description}</Text>}</View>
        <Text style={[styles.count, { color: tokens.accent }]}>{group.topics.length} {closed[group.id] ? 'SHOW' : 'HIDE'}</Text>
      </Pressable>
      {!closed[group.id] && group.topics.map((topic, index) => <Pressable key={topic.id} accessibilityRole="link" accessibilityLabel={`${topic.title}. ${topic.completed ? 'Lesson completed.' : 'Lesson not completed.'}${topic.recommended ? ' Recommended next.' : ''}`} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: topic.id } })} style={[styles.topic, { borderTopColor: colors.line }]}>
        <Text style={[styles.index, { color: colors.quiet }]}>{String(index + 1).padStart(2, '0')}</Text>
        <View style={styles.grow}><Text style={[styles.topicTitle, { color: colors.ink }]}>{topic.title}</Text>{!!topic.description && <Text style={[styles.copy, { color: colors.quiet }]}>{topic.description}</Text>}<View style={styles.markers}>
          <Text style={[styles.marker, { color: topic.completed ? colors.positive : colors.quiet }]}>{topic.completed ? 'COMPLETED' : 'NOT COMPLETED'}</Text>
          <Text style={[styles.marker, { color: colors.quiet }]}>{topic.accuracy === null ? 'NO ACCURACY YET' : `${topic.accuracy}% ACCURACY`}</Text>
          {topic.recommended && <Text style={[styles.marker, { color: tokens.accent }]}>RECOMMENDED NEXT</Text>}
        </View></View><Text style={[styles.arrow, { color: colors.quiet }]}>›</Text>
      </Pressable>)}
    </View>)}
    {subject === 'english' && <View style={styles.library}>
      <Text accessibilityRole="header" style={[styles.libraryTitle, { color: colors.ink }]}>The source library</Text>
      <Text style={[styles.copy, { color: colors.quiet }]}>Paper 1 fiction extracts and Paper 2 source pairs used by the real practice bank.</Text>
      {texts.isPending && !hasTexts && <Notice kind="loading" title="COLLECTING SOURCE SHEETS">Fetching the English text library.</Notice>}
      {texts.isError && !hasTexts && <View style={styles.recovery}><Notice kind={online ? 'error' : 'offline'} title="SOURCE LIBRARY UNAVAILABLE">{online ? 'The source library could not be loaded.' : 'Connect to load the source library.'}</Notice><RetryAction label="Retry source library" onPress={() => void texts.refetch()} color={tokens.accent} /></View>}
      {texts.isError && hasTexts && <Text accessibilityRole="alert" style={[styles.cacheNote, { color: colors.quiet }]}>The source library could not be refreshed. The session copy remains available until the app session ends.</Text>}
      {!texts.isPending && hasTexts && library.length === 0 && <Notice title="NO SOURCE SHEETS">The server has not published any English texts.</Notice>}
      {library.map((value) => { const item = asRecord(value); const id = asText(item.id); if (!id) return null; return <Pressable key={id} accessibilityRole="link" onPress={() => router.push({ pathname: '/text/[id]', params: { id } })} style={[styles.source, { borderBottomColor: colors.line }]}><Text style={[styles.marker, { color: tokens.accent }]}>{asText(item.paper) || 'SOURCE SHEET'}</Text><Text style={[styles.topicTitle, { color: colors.ink }]}>{asText(item.title) || 'Untitled source'}</Text><Text style={[styles.copy, { color: colors.quiet }]}>{asText(item.author)}</Text><Text numberOfLines={2} style={[styles.excerpt, { color: colors.quiet }]}>{asText(item.excerpt)}</Text></Pressable>; })}
    </View>}
  </ScrollScreen>;
}

const styles = StyleSheet.create({ content:{padding:20,paddingBottom:108,gap:18},tablet:{width:'100%',maxWidth:900,alignSelf:'center',paddingHorizontal:36},search:{minHeight:52,borderWidth:1,paddingHorizontal:16,fontSize:16,borderRadius:16},cacheNote:{fontSize:13,lineHeight:19},recovery:{gap:10,alignItems:'flex-start'},retry:{minHeight:44,borderWidth:1,paddingHorizontal:14,justifyContent:'center',borderRadius:12},retryText:{fontFamily:'monospace',fontSize:11,fontWeight:'800',letterSpacing:.5},section:{borderWidth:1,backgroundColor:'transparent',borderRadius:20,overflow:'hidden'},sectionHead:{minHeight:76,padding:16,flexDirection:'row',alignItems:'center',gap:12},grow:{flex:1,gap:4},sectionTitle:{fontSize:24,fontWeight:'800',letterSpacing:-.4},copy:{fontSize:14,lineHeight:20},count:{fontFamily:'monospace',fontSize:11,fontWeight:'800'},topic:{minHeight:94,borderTopWidth:1,padding:15,flexDirection:'row',alignItems:'flex-start',gap:12},index:{fontFamily:'monospace',fontSize:11,paddingTop:4},topicTitle:{fontSize:17,fontWeight:'700',lineHeight:22},markers:{flexDirection:'row',flexWrap:'wrap',gap:9,marginTop:7},marker:{fontFamily:'monospace',fontSize:10,fontWeight:'800',letterSpacing:.5},arrow:{fontSize:24},library:{gap:13,marginTop:12},libraryTitle:{fontSize:29,fontWeight:'900'},source:{paddingVertical:15,borderBottomWidth:1,gap:5},excerpt:{fontFamily:'serif',fontSize:15,lineHeight:22,marginTop:4}});
