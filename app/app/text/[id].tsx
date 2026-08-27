import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiClient } from '@/api';
import { Button, DeskHeader, Notice, OfflineBanner, ScrollScreen } from '@/components';
import { asRecord, asText } from '@/learn';
import { useNetwork, usePreferences } from '@/providers';
import { useTheme } from '@/theme';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const SIZE_KEY = 'learn:text-size';
const sizes = [17, 20, 23];

export default function TextReader() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const textId = Array.isArray(id) ? id[0] : id;
  const { subject } = usePreferences();
  const { colors, subject: tokens } = useTheme();
  const { online } = useNetwork();
  const { width } = useWindowDimensions();
  const [sizeIndex, setSizeIndex] = useState(1);
  const [source, setSource] = useState<'A' | 'B'>('A');
  useEffect(() => { void AsyncStorage.getItem(SIZE_KEY).then((value) => { const parsed = Number(value); if (parsed >= 0 && parsed < sizes.length) setSizeIndex(parsed); }); }, []);
  const setSize = (next: number) => { const safe = Math.max(0, Math.min(sizes.length - 1, next)); setSizeIndex(safe); void AsyncStorage.setItem(SIZE_KEY, String(safe)); };
  const query = useQuery({ queryKey: ['learn', 'english', 'text', textId], queryFn: () => new ApiClient('english').text(textId) as Promise<unknown>, enabled: !!textId && subject === 'english' });
  const item = asRecord(query.data);
  const pair = !!asText(item.textB);
  const meta = asRecord(source === 'A' ? item.textMetaA : item.textMetaB);
  const body = pair ? asText(source === 'A' ? item.textA : item.textB) : asText(item.text ?? item.body);
  const paragraphs = body.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const title = pair ? asText(meta.title) || asText(item.title) : asText(item.title);
  const practiceSupported = item.practiceSupported === true && !!asText(item.practiceTopicId);

  if (subject !== 'english') return <ScrollScreen><DeskHeader title="English source reader" eyebrow="SOURCE SHEET"/><Notice title="ENGLISH COURSE ONLY">Switch the active subject to English Language to open this source.</Notice><Button variant="secondary" onPress={() => router.back()}>Go back</Button></ScrollScreen>;
  if (query.isPending && !query.data) return <ScrollScreen><DeskHeader title="Opening source sheet" eyebrow="ENGLISH READING"/><Notice kind="loading" title="FETCHING THE SOURCE">Preparing the text for close reading.</Notice></ScrollScreen>;
  if (query.isError && !query.data) return <ScrollScreen><DeskHeader title="Source unavailable" eyebrow="ENGLISH READING"/><OfflineBanner/><Notice kind={online ? 'error' : 'offline'} title={online ? 'SOURCE NOT FOUND' : 'SOURCE NEEDS A CONNECTION'}>{online ? 'The English API did not return this source.' : 'This source is not held in the current session cache.'}</Notice><Button variant="secondary" onPress={() => router.back()}>Back to the library</Button></ScrollScreen>;

  return <ScrollScreen contentContainerStyle={[styles.content, width >= 760 && styles.tablet]}>
    <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={[styles.back, { color: tokens.accent }]}>‹ SOURCE LIBRARY</Text></Pressable>
    <DeskHeader title={asText(item.title) || 'English source'} eyebrow={asText(item.paper) || 'SOURCE SHEET'} />
    <OfflineBanner />
    {!online && Boolean(query.data) && <Text style={[styles.cache, { color: colors.quiet }]}>Last source held in this session. It has not been downloaded.</Text>}
    <View style={styles.metadata}><Text style={[styles.meta, { color: tokens.accent }]}>{asText(item.kind) || 'READING SOURCE'}</Text><Text style={[styles.metaCopy, { color: colors.ink }]}>{pair ? `${asText(meta.author)}, ${asText(meta.year)}` : [asText(item.author), asText(item.year), asText(item.century)].filter(Boolean).join(' · ')}</Text>{!!asText(item.source) && <Text style={[styles.sourceRole, { color: colors.quiet }]}>Source role: {asText(item.source)}</Text>}{!!asText(item.theme) && <Text style={[styles.sourceRole, { color: colors.quiet }]}>Comparison focus: {asText(item.theme)}</Text>}</View>
    {pair && <View accessibilityRole="tablist" style={[styles.tabs, { borderColor: colors.strong }]}>{(['A', 'B'] as const).map((value) => { const tabMeta = asRecord(value === 'A' ? item.textMetaA : item.textMetaB); const selected = source === value; return <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setSource(value)} style={[styles.tab, { backgroundColor: selected ? tokens.accent : colors.raised }]}><Text style={[styles.tabText, { color: selected ? '#fff' : colors.ink }]}>SOURCE {value}</Text><Text numberOfLines={1} style={[styles.tabTitle, { color: selected ? '#fff' : colors.quiet }]}>{asText(tabMeta.title)}</Text></Pressable>; })}</View>}
    <View style={styles.readerTools}><Text style={[styles.meta, { color: colors.quiet }]}>READING SIZE</Text><View style={styles.sizeButtons}><Button variant="secondary" disabled={sizeIndex === 0} onPress={() => setSize(sizeIndex - 1)}>A−</Button><Text accessibilityLiveRegion="polite" style={[styles.sizeLabel, { color: colors.ink }]}>{['Small', 'Standard', 'Large'][sizeIndex]}</Text><Button variant="secondary" disabled={sizeIndex === sizes.length - 1} onPress={() => setSize(sizeIndex + 1)}>A+</Button></View></View>
    <View accessibilityLabel={`${source === 'A' ? 'Source A' : 'Source B'}: ${title}`} style={[styles.sheet, { backgroundColor: colors.raised, borderColor: colors.strong }]}><Text accessibilityRole="header" style={[styles.sourceTitle, { color: colors.ink }]}>{title}</Text><Text style={[styles.byline, { color: colors.quiet }]}>{pair ? [asText(meta.author), asText(meta.year), asText(meta.century)].filter(Boolean).join(' · ') : [asText(item.author), asText(item.year)].filter(Boolean).join(' · ')}</Text>{paragraphs.length ? paragraphs.map((paragraph, index) => <Text key={index} selectable style={[styles.body, { color: colors.ink, fontSize: sizes[sizeIndex], lineHeight: Math.round(sizes[sizeIndex] * 1.62) }]}>{paragraph}</Text>) : <Notice title="SOURCE BODY EMPTY">The server returned metadata but no readable body.</Notice>}</View>
    {practiceSupported && <Button onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: asText(item.practiceTopicId) } })}>Practise with this text</Button>}
  </ScrollScreen>;
}

const styles = StyleSheet.create({content:{padding:20,paddingBottom:60,gap:18},tablet:{width:'100%',maxWidth:860,alignSelf:'center',paddingHorizontal:40},back:{fontFamily:'monospace',fontWeight:'800',fontSize:11,letterSpacing:1},cache:{fontSize:13},metadata:{gap:5},meta:{fontFamily:'monospace',fontSize:11,fontWeight:'800',letterSpacing:.9},metaCopy:{fontSize:16,fontWeight:'700'},sourceRole:{fontSize:14,lineHeight:20},tabs:{flexDirection:'row',borderWidth:1,padding:4,gap:4},tab:{flex:1,minHeight:58,padding:9,justifyContent:'center',gap:3},tabText:{fontFamily:'monospace',fontSize:10,fontWeight:'800'},tabTitle:{fontSize:12},readerTools:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'},sizeButtons:{flexDirection:'row',alignItems:'center',gap:8},sizeLabel:{minWidth:64,textAlign:'center',fontSize:13},sheet:{borderWidth:1,padding:widthPadding(),gap:15},sourceTitle:{fontFamily:'serif',fontSize:28,lineHeight:35},byline:{fontFamily:'serif',fontStyle:'italic',fontSize:15,borderBottomWidth:StyleSheet.hairlineWidth,paddingBottom:14},body:{fontFamily:'serif'},});
function widthPadding() { return 20; }
