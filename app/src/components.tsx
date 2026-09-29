import { Link, router } from 'expo-router';
import { forwardRef, type PropsWithChildren, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type PressableProps, type ScrollViewProps, type TextInputProps, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useNetwork, usePreferences } from './providers';
import { recommendation, stageFor, subjectTheme, subjectTokens, useTheme, type Subject } from './theme';

// Trailhead primitives — pebbles not boxes, one hue per surface, wash + word.
// Headlines use serif (Fraunces fallback Georgia), labels use mono (Plex Mono
// fallback Menlo). Light and dark are first-class moods from theme.ts.

export function Screen({ children, style, ...props }: ViewProps) {
  const { colors } = useTheme();
  return <SafeAreaView style={[styles.screen, { backgroundColor: colors.paper }, style]} {...props}><PaperPattern />{children}</SafeAreaView>;
}
export function ScrollScreen({ children, contentContainerStyle, ...props }: ScrollViewProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.paper }]}>
      <PaperPattern />
      <ScrollView contentContainerStyle={[styles.content, contentContainerStyle]} keyboardShouldPersistTaps="handled" {...props}>{children}</ScrollView>
    </SafeAreaView>
  );
}
export function PaperPattern() {
  const { colors } = useTheme();
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>{Array.from({ length: 14 }, (_, i) => <View key={i} style={{ position: 'absolute', top: i * 48, left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.line, opacity: .22 }} />)}</View>;
}
export function DeskHeader({ title, eyebrow }: { title: string; eyebrow?: string }) {
  const { colors, subject, isDark } = useTheme();
  return <View style={styles.header}><View style={[styles.eyebrow, { backgroundColor: isDark ? colors.muted : subject.tint, borderColor: subject.accent }]}><Text style={[styles.meta, { color: subject.accent }]}>{eyebrow ?? subject.label}</Text></View><Text accessibilityRole="header" style={[styles.h1, { color: colors.ink }]}>{title}</Text></View>;
}
export function Button({ children, variant = 'primary', ...props }: PressableProps & PropsWithChildren & { variant?: 'primary' | 'secondary' | 'danger' }) {
  const { colors, subject } = useTheme();
  const bg = variant === 'primary' ? subject.accent : variant === 'danger' ? colors.negative : colors.raised;
  const fg = variant === 'secondary' ? colors.ink : variant === 'danger' ? '#fff' : (colors.onAccent ?? '#fff');
  const border = variant === 'secondary' ? colors.strong : bg;
  return <Pressable accessibilityRole="button" hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }} style={({ pressed }) => [styles.button, { backgroundColor: bg, borderColor: border, opacity: props.disabled ? .5 : 1, transform: [{ scale: pressed ? .98 : 1 }] }]} {...props}><Text style={[styles.buttonText, { color: fg }]}>{children}</Text></Pressable>;
}
export const Field = forwardRef<TextInput, TextInputProps & { label: string }>(({ label, ...props }, ref) => {
  const { colors } = useTheme();
  return <View style={styles.field}><Text style={[styles.meta, { color: colors.quiet }]}>{label}</Text><TextInput ref={ref} accessibilityLabel={label} placeholderTextColor={colors.quiet} style={[styles.input, { color: colors.ink, backgroundColor: (colors as Record<string, string>).input ?? colors.raised, borderColor: colors.strong }]} {...props} /></View>;
}); Field.displayName = 'Field';
export function Notice({ kind = 'empty', title, children }: PropsWithChildren & { kind?: 'loading' | 'error' | 'offline' | 'empty' | 'success'; title: string }) {
  const { colors } = useTheme();
  const color = kind === 'error' ? colors.negative : kind === 'success' ? colors.positive : kind === 'offline' ? colors.warning : colors.info;
  const wash = kind === 'error' ? colors.negativeWash : kind === 'success' ? colors.positiveWash : kind === 'offline' ? colors.warningWash : colors.infoWash;
  return <View accessibilityRole={kind === 'error' ? 'alert' : undefined} style={[styles.notice, { borderColor: color, backgroundColor: wash }]}>{kind === 'loading' && <ActivityIndicator color={color} />}<Text style={[styles.meta, { color }]}>{title}</Text>{children && <Text style={{ color: colors.ink, lineHeight: 21 }}>{children}</Text>}</View>;
}
export function SectionHeader({ title, meta }: { title: string; meta?: string }) {
  const { colors } = useTheme();
  return <View style={[styles.sectionHead, { borderBottomColor: colors.ink }]}><Text accessibilityRole="header" style={[styles.h2, { color: colors.ink }]}>{title}</Text>{meta && <Text style={[styles.meta, { color: colors.quiet }]}>{meta}</Text>}</View>;
}
export function SectionLabel({ index, label }: { index: string; label: string }) {
  const { colors } = useTheme();
  return <View style={styles.sectionLabel}><Text style={[styles.meta, { color: colors.quiet }]}>{index}</Text><Text style={[styles.meta, { color: colors.quiet }]}>{label.toUpperCase()}</Text></View>;
}
export function PaperDocket({ paper, title, detail }: { paper: string; title: string; detail: string }) {
  const { colors, subject } = useTheme();
  return <View style={[styles.docket, styles.shadow, { backgroundColor: colors.raised, borderColor: colors.line, borderLeftColor: subject.accent }]}><Text style={[styles.meta, { color: subject.accent }]}>{paper}</Text><Text style={[styles.h2, { color: colors.ink }]}>{title}</Text><Text style={{ color: colors.quiet }}>{detail}</Text></View>;
}
export function NextSessionCard() { const { subject } = usePreferences(); return <PaperDocket paper="NEXT SESSION" title={subjectTokens[subject].label} detail={recommendation(subject)} />; }
export function ProgressMeter({ value, label }: { value: number; label: string }) {
  const { colors, subject } = useTheme();
  const safe = Math.max(0, Math.min(1, value));
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(safe * 100) }}><Text style={[styles.meta, { color: colors.quiet }]}>{label}</Text><View style={[styles.track, { backgroundColor: colors.muted }]}><View style={{ width: `${safe * 100}%`, height: 8, backgroundColor: subject.accent, borderRadius: 4 }} /></View></View>;
}
export function ExpertiseSeal({ grade }: { grade: string }) {
  const { colors, subject } = useTheme();
  return <View accessibilityLabel={`Working grade ${grade}`} style={[styles.seal, { borderColor: subject.accent, backgroundColor: colors.raised }]}><Text style={[styles.meta, { color: colors.quiet }]}>WORKING GRADE</Text><Text style={[styles.h2, { color: subject.accent }]}>{grade}</Text></View>;
}
export function PressableRow({ title, detail, href }: { title: string; detail?: string; href: string }) {
  const { colors } = useTheme();
  return <Link href={href as never} asChild><Pressable accessibilityRole="link" style={StyleSheet.flatten([styles.pressRow, { borderBottomColor: colors.line }])}><View style={{ flex: 1 }}><Text style={{ color: colors.ink, fontSize: 17, fontWeight: '700' }}>{title}</Text>{detail && <Text style={{ color: colors.quiet, marginTop: 3 }}>{detail}</Text>}</View><Text style={{ color: colors.quiet, fontSize: 20 }}>›</Text></Pressable></Link>;
}
/** Consistent escape path for root-stack screens: back when possible, else a safe landing. */
export function BackLink({ label, href = '/' }: { label: string; href?: string }) {
  const { subject } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Go back: ${label}`} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => { if (router.canGoBack()) router.back(); else router.replace(href as never); }} style={styles.back}><Text style={[styles.meta, { color: subject.accent }]}>‹ {label}</Text></Pressable>;
}
/** Persistent course banner so Foundation / Higher / English work is never ambiguous. */
export function SubjectStrip({ spec }: { spec: string }) {
  const { colors, subject } = useTheme();
  return <View accessibilityLabel={`Working in ${subject.label}, ${spec}`} style={[styles.strip, { borderColor: colors.strong, backgroundColor: colors.raised }]}><View style={[styles.stripMark, { backgroundColor: subject.accent }]} /><View style={{ flex: 1 }}><Text style={[styles.meta, { color: subject.accent }]}>WORKING IN · {subject.label.toUpperCase()}</Text><Text style={[styles.stripSpec, { color: colors.quiet }]}>{spec}</Text></View></View>;
}
export function Skeleton({ width = '100%', height = 18 }: { width?: number | `${number}%`; height?: number }) {
  const { colors } = useTheme();
  return <View accessibilityLabel="Loading" style={{ width, height, backgroundColor: colors.muted, marginVertical: 5, borderRadius: Math.min(16, height / 2) }} />;
}
export function OfflineBanner() {
  const { online } = useNetwork();
  return online ? null : <Notice kind="offline" title="OFFLINE">Data already held in this app session may remain available. Reconnect before starting new work.</Notice>;
}
export function Placeholder({ title, eyebrow, children }: PropsWithChildren & { title: string; eyebrow: string }) {
  return <ScrollScreen><DeskHeader title={title} eyebrow={eyebrow} /><OfflineBanner />{children ?? <Notice title="HANDOFF READY">This route and its shared foundation are ready for the feature implementation.</Notice>}</ScrollScreen>;
}

// ---- Trailhead V4 additions ----

export function StagePill({ percent, answered }: { percent: number | null; answered: number }) {
  const { colors } = useTheme();
  const stage = stageFor(percent, answered);
  const wash = stage.id === 'mastered' || stage.id === 'secure' ? colors.positiveWash : stage.id === 'developing' ? colors.warningWash : stage.id === 'learning' || stage.id === 'needs-revision' ? colors.negativeWash : colors.muted;
  const ink = stage.id === 'mastered' || stage.id === 'secure' ? colors.positive : stage.id === 'developing' ? colors.warning : stage.id === 'learning' || stage.id === 'needs-revision' ? colors.negative : colors.quiet;
  return <View accessibilityLabel={`Stage ${stage.text}`} style={[styles.pill, { backgroundColor: wash, borderColor: ink }]}><Text style={[styles.pillText, { color: ink }]}>{stage.text.toUpperCase()}</Text></View>;
}

export function StatCard({ value, label, caption, tone = 'paper' }: { value: string; label: string; caption: string; tone?: 'paper' | 'score' | 'answered' | 'streak' }) {
  const { colors } = useTheme();
  const hues: Record<string, string> = { paper: colors.info, score: '#c2255c', answered: colors.positive, streak: colors.warning };
  void tone;
  const hue = hues[tone] ?? colors.info;
  return (
    <View style={[styles.statCard, styles.shadowSm, { backgroundColor: colors.raised, borderColor: colors.line }]}>
      <View style={[styles.statHue, { backgroundColor: hue }]} />
      <Text accessibilityRole="header" style={[styles.statNum, { color: colors.ink }]}>{value}</Text>
      <Text style={[styles.meta, { color: colors.quiet }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.statCap, { color: colors.quiet }]}>{caption}</Text>
    </View>
  );
}

export function ReadinessRing({ score, ready, size = 84 }: { score: number | null; ready: boolean; size?: number }) {
  const { colors, subject } = useTheme();
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = ready && score != null ? Math.max(0, Math.min(1, score / 100)) : 0;
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={ready ? `Readiness ${score} percent` : 'Readiness building'} accessibilityValue={{ min: 0, max: 100, now: ready && score != null ? score : 0 }} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.line} strokeWidth={7} fill="none" strokeDasharray="2 5" strokeLinecap="round" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={subject.accent} strokeWidth={7} fill="none" strokeDasharray={`${circumference * progress} ${circumference}`} strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      <Text style={{ fontFamily: 'Georgia', fontSize: ready ? 20 : 13, fontWeight: '900', color: colors.ink, textAlign: 'center' }}>{ready && score != null ? `${score}%` : '···'}</Text>
    </View>
  );
}

export function HeroCard({ eyebrow, title, body, ring, actions, note }: { eyebrow: string; title: string; body: string; ring?: ReactNode; actions?: ReactNode; note?: string }) {
  const { colors, subject } = useTheme();
  return (
    <View style={[styles.hero, { backgroundColor: colors.raised, borderColor: colors.ink, borderLeftColor: subject.accent }]}>
      <View style={[styles.heroRule, { backgroundColor: subject.accent }]} />
      <View style={styles.heroTop}>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={[styles.meta, { color: subject.accent }]}>{eyebrow}</Text>
          <Text accessibilityRole="header" style={[styles.heroTitle, { color: colors.ink }]}>{title}</Text>
          <Text style={[styles.reason, { color: colors.ink }]}>{body}</Text>
        </View>
        {ring}
      </View>
      {actions && <View style={styles.heroActions}>{actions}</View>}
      {note && <Text style={[styles.marginNote, { color: colors.quiet }]}>✎ {note}</Text>}
    </View>
  );
}

export function SubjectAreaCard({ subjectId, headline, stats, metrics, onOpen, onLearn, onPractice }: { subjectId: Subject; headline: string; stats: string; metrics?: { tests: number; answered: number; streak: number; accuracy: number | null; level: number; due: number; xp: number; xpInto: number; xpNeeded: number }; onOpen: () => void; onLearn: () => void; onPractice: () => void }) {
  const { colors, isDark } = useTheme();
  const tokens = subjectTheme(subjectId, isDark);
  const xp = metrics && metrics.xpNeeded > 0 ? Math.min(1, metrics.xpInto / metrics.xpNeeded) : 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${tokens.label} study area. ${metrics ? `${metrics.tests} papers, ${metrics.answered} questions, ${metrics.streak} day streak${metrics.due ? `, ${metrics.due} retries due` : ''}` : ''}`}
      onPress={onOpen}
      style={({ pressed }) => [styles.subjectCard, styles.shadow, { backgroundColor: colors.raised, borderColor: colors.line, opacity: pressed ? .97 : 1, transform: [{ scale: pressed ? .985 : 1 }] }]}
    >
      <View style={[styles.subjectBand, { backgroundColor: tokens.accent }]} />
      <View style={styles.subjectTop}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.meta, { color: tokens.accent }]}>{tokens.code} · {tokens.short.toUpperCase()}</Text>
          <Text accessibilityRole="header" style={[styles.subjectTitle, { color: colors.ink }]}>{tokens.label}</Text>
          <Text style={{ color: colors.quiet, lineHeight: 20 }}>{headline}</Text>
        </View>
        <View style={[styles.letterBadge, { backgroundColor: tokens.tint, borderColor: tokens.accent }]}><Text style={[styles.letter, { color: tokens.accent }]}>{tokens.short.slice(0, 1)}</Text></View>
      </View>
      {metrics ? (
        <View style={styles.metricRow}>
          <View style={styles.metric}><Text style={[styles.metricNum, { color: colors.ink }]}>{metrics.tests}</Text><Text style={[styles.metricLabel, { color: colors.quiet }]}>PAPERS</Text></View>
          <View style={[styles.metricDiv, { backgroundColor: colors.line }]} />
          <View style={styles.metric}><Text style={[styles.metricNum, { color: colors.ink }]}>{metrics.answered}</Text><Text style={[styles.metricLabel, { color: colors.quiet }]}>ANSWERED</Text></View>
          <View style={[styles.metricDiv, { backgroundColor: colors.line }]} />
          <View style={styles.metric}><Text style={[styles.metricNum, { color: metrics.streak > 0 ? tokens.accent : colors.quiet }]}>{metrics.streak > 0 ? `${metrics.streak}🔥` : '—'}</Text><Text style={[styles.metricLabel, { color: colors.quiet }]}>STREAK</Text></View>
          <View style={[styles.metricDiv, { backgroundColor: colors.line }]} />
          <View style={styles.metric}><Text style={[styles.metricNum, { color: metrics.accuracy == null ? colors.quiet : metrics.accuracy >= 70 ? colors.positive : metrics.accuracy >= 50 ? colors.warning : colors.negative }]}>{metrics.accuracy == null ? '—' : `${metrics.accuracy}%`}</Text><Text style={[styles.metricLabel, { color: colors.quiet }]}>ACCURACY</Text></View>
        </View>
      ) : (
        <Text style={[styles.monoSmall, styles.subjectStats, { color: colors.quiet }]}>{stats}</Text>
      )}
      {metrics && (
        <View style={styles.xpTrackWrap}>
          <View style={[styles.xpTrack, { backgroundColor: colors.muted }]} accessibilityRole="progressbar" accessibilityLabel={`Level ${metrics.level}, ${metrics.xp} XP`} accessibilityValue={{ min: 0, max: 100, now: Math.round(xp * 100) }}>
            <View style={{ width: `${xp * 100}%`, height: '100%', backgroundColor: tokens.accent, borderRadius: 4 }} />
          </View>
          <Text style={[styles.meta, { color: colors.quiet }]}>LVL {metrics.level}{metrics.due > 0 ? ` · ${metrics.due} RETRIES DUE` : ' · UP TO DATE'}</Text>
        </View>
      )}
      <View style={styles.subjectActions}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open ${tokens.label} study area`} onPress={onOpen} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }} style={({ pressed }) => [styles.primaryChip, { backgroundColor: tokens.accent, opacity: pressed ? .82 : 1, transform: [{ scale: pressed ? .98 : 1 }] }]}><Text style={[styles.chipText, { color: '#fff' }]}>START {tokens.short.toUpperCase()}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Learn ${tokens.label}`} onPress={onLearn} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }} style={({ pressed }) => [styles.ghostChip, { borderColor: colors.strong, opacity: pressed ? .7 : 1, transform: [{ scale: pressed ? .98 : 1 }] }]}><Text style={[styles.chipText, { color: colors.ink }]}>LEARN</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Practise ${tokens.label}`} onPress={onPractice} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }} style={({ pressed }) => [styles.ghostChip, { borderColor: colors.strong, opacity: pressed ? .7 : 1, transform: [{ scale: pressed ? .98 : 1 }] }]}><Text style={[styles.chipText, { color: colors.ink }]}>PRACTISE</Text></Pressable>
      </View>
    </Pressable>
  );
}

export function MasteryLegend() {
  const { colors } = useTheme();
  const items = [['New', colors.quiet], ['Learning', colors.negative], ['Developing', colors.warning], ['Secure', colors.positive], ['Mastered', colors.positive]];
  return (
    <View accessibilityLabel="What the stage labels mean" style={[styles.legend, { borderColor: colors.line, backgroundColor: colors.raised }]}>
      {items.map(([text, color]) => <View key={text} style={styles.legendItem}><View style={[styles.dot, { backgroundColor: String(color) }]} /><Text style={[styles.legendText, { color: colors.quiet }]}>{text}</Text></View>)}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 48, gap: 18 },
  header: { paddingVertical: 16, gap: 10 },
  eyebrow: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  h1: { fontFamily: 'Georgia', fontSize: 38, lineHeight: 43, fontWeight: '900', letterSpacing: -1.2 },
  h2: { fontFamily: 'Georgia', fontSize: 24, fontWeight: '800', letterSpacing: -.4 },
  meta: { fontFamily: 'Menlo', fontSize: 10, fontWeight: '800', letterSpacing: .8, textTransform: 'uppercase' },
  monoSmall: { fontFamily: 'Menlo', fontSize: 11, fontWeight: '700', letterSpacing: .4 },
  button: { minHeight: 50, paddingHorizontal: 18, paddingVertical: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: 14 },
  buttonText: { fontSize: 15, fontWeight: '800', textAlign: 'center', flexShrink: 1 },
  field: { gap: 7 },
  input: { minHeight: 50, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, borderRadius: 13 },
  notice: { borderWidth: 1, padding: 15, gap: 8, borderRadius: 16 },
  sectionHead: { minHeight: 52, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottomWidth: 1 },
  row: { minHeight: 52, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottomWidth: 1 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  docket: { borderWidth: 1, borderLeftWidth: 6, padding: 18, gap: 8, borderRadius: 18 },
  seal: { minWidth: 112, minHeight: 112, padding: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 56 },
  pressRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1, paddingVertical: 11 },
  back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingRight: 16 },
  strip: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, padding: 12, borderRadius: 14 },
  stripMark: { width: 5, alignSelf: 'stretch', borderRadius: 3 },
  stripSpec: { fontSize: 12, marginTop: 2 },
  shadow: { shadowColor: '#000', shadowOpacity: .08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  shadowSm: { shadowColor: '#000', shadowOpacity: .07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  track: { height: 8, backgroundColor: '#eee', marginTop: 8, borderRadius: 4, overflow: 'hidden' },
  pill: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontFamily: 'Menlo', fontSize: 10, fontWeight: '800', letterSpacing: .6 },
  statCard: { flex: 1, minWidth: 150, borderWidth: 1, borderRadius: 18, padding: 16, gap: 6, overflow: 'hidden' },
  statHue: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  statNum: { fontFamily: 'Georgia', fontSize: 34, fontWeight: '800' },
  statCap: { fontSize: 12, lineHeight: 17 },
  hero: { borderWidth: 1, borderLeftWidth: 7, padding: 19, gap: 15, borderRadius: 20, shadowColor: '#000', shadowOpacity: .08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3, overflow: 'hidden' },
  heroRule: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroTitle: { fontFamily: 'Georgia', fontSize: 31, lineHeight: 37, fontWeight: '900', letterSpacing: -.7 },
  reason: { fontSize: 16, lineHeight: 23 },
  heroActions: { gap: 10 },
  marginNote: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13, lineHeight: 18 },
  subjectCard: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  subjectBand: { height: 6 },
  subjectTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 18, paddingBottom: 10 },
  subjectStats: { paddingHorizontal: 18, lineHeight: 18 },
  subjectTitle: { fontFamily: 'Georgia', fontSize: 26, fontWeight: '900', letterSpacing: -.4 },
  letterBadge: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: 'Georgia', fontSize: 26, fontWeight: '900' },
  subjectActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 18, paddingTop: 10 },
  metricRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, paddingVertical: 10, gap: 8 },
  metric: { flex: 1, alignItems: 'center', gap: 2 },
  metricNum: { fontFamily: 'Georgia', fontSize: 20, fontWeight: '800' },
  metricLabel: { fontSize: 9, fontWeight: '700', letterSpacing: .6 },
  metricDiv: { width: 1, height: 28 },
  xpTrackWrap: { paddingHorizontal: 18, gap: 6 },
  xpTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
  primaryChip: { minHeight: 48, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12 },
  ghostChip: { minHeight: 48, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1, borderRadius: 12 },
  chipText: { fontFamily: 'Menlo', fontSize: 11, fontWeight: '800', letterSpacing: .5 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, borderWidth: 1, borderRadius: 14, padding: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 12, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
