import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BackLink, Button, DeskHeader, Notice, ScrollScreen } from '@/components';
import { useTheme } from '@/theme';
import { submitFeedback, validateFeedback, type FeedbackRole, type FeedbackSubject } from '@/feedback';

const ROLES: { id: FeedbackRole; label: string }[] = [
  { id: 'student', label: 'STUDENT' },
  { id: 'parent', label: 'PARENT' },
  { id: 'teacher', label: 'TEACHER' },
  { id: 'other', label: 'OTHER' },
];
const SUBJECTS: { id: FeedbackSubject; label: string }[] = [
  { id: 'maths', label: 'FOUNDATION' },
  { id: 'maths-higher', label: 'HIGHER' },
  { id: 'english', label: 'ENGLISH' },
  { id: 'multiple', label: 'MULTIPLE' },
];

export default function Feedback() {
  const { colors } = useTheme();
  const [role, setRole] = useState<FeedbackRole | null>(null);
  const [subject, setSubject] = useState<FeedbackSubject | null>(null);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function send() {
    if (busy) return;
    const problem = validateFeedback({ role: role ?? undefined, subject: subject ?? undefined, rating, message, email: email || undefined });
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await submitFeedback({ role: role!, subject: subject!, rating, message, email: email || undefined, source: 'mobile-app' });
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Feedback could not be sent. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollScreen>
      <BackLink label="BACK" />
      <DeskHeader title="Shape the desk" eyebrow="BETA FEEDBACK" />
      <Notice title="WHAT HAPPENS NEXT">Feedback is anonymous unless you add an email for a reply. Never include names, school details, passwords or sensitive information.</Notice>
      {done ? (
        <Notice kind="success" title="THANK YOU">Your feedback is with the team. One honest note beats ten vague ones — this helps decide what ships next.</Notice>
      ) : (
        <>
          <Text style={[styles.label, { color: colors.quiet }]}>I AM A…</Text>
          <View style={styles.chips}>{ROLES.map((r) => <Pressable key={r.id} accessibilityRole="radio" accessibilityState={{ selected: role === r.id }} onPress={() => setRole(r.id)} style={[styles.chip, { borderColor: role === r.id ? colors.info : colors.strong, backgroundColor: role === r.id ? colors.infoWash : 'transparent' }]}><Text style={[styles.chipText, { color: colors.ink }]}>{r.label}</Text></Pressable>)}</View>
          <Text style={[styles.label, { color: colors.quiet }]}>SUBJECT</Text>
          <View style={styles.chips}>{SUBJECTS.map((s) => <Pressable key={s.id} accessibilityRole="radio" accessibilityState={{ selected: subject === s.id }} onPress={() => setSubject(s.id)} style={[styles.chip, { borderColor: subject === s.id ? colors.info : colors.strong, backgroundColor: subject === s.id ? colors.infoWash : 'transparent' }]}><Text style={[styles.chipText, { color: colors.ink }]}>{s.label}</Text></Pressable>)}</View>
          <Text style={[styles.label, { color: colors.quiet }]}>RATING · {rating > 0 ? `${rating}/5` : 'PICK 1–5'}</Text>
          <View style={styles.chips}>{[1, 2, 3, 4, 5].map((n) => <Pressable key={n} accessibilityRole="radio" accessibilityState={{ selected: rating === n }} accessibilityLabel={`Rate ${n} out of 5`} onPress={() => setRating(n)} style={[styles.star, { borderColor: rating === n ? colors.info : colors.strong, backgroundColor: rating === n ? colors.infoWash : 'transparent' }]}><Text style={[styles.starText, { color: colors.ink }]}>{n}</Text></Pressable>)}</View>
          <Text style={[styles.label, { color: colors.quiet }]}>WHAT SHOULD WE IMPROVE FIRST?</Text>
          <TextInput accessibilityLabel="Feedback message" value={message} onChangeText={setMessage} placeholder="Be specific — which screen, what happened, what would help?" placeholderTextColor={colors.quiet} multiline maxLength={2000} style={[styles.area, { color: colors.ink, borderColor: colors.strong, backgroundColor: colors.raised }]} />
          <Text style={[styles.label, { color: colors.quiet }]}>EMAIL FOR A REPLY (OPTIONAL)</Text>
          <TextInput accessibilityLabel="Email for a reply, optional" value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.quiet} keyboardType="email-address" autoCapitalize="none" style={[styles.input, { color: colors.ink, borderColor: colors.strong, backgroundColor: colors.raised }]} />
          {error ? <Notice kind="error" title="NOT SENT">{error}</Notice> : null}
          <Button disabled={busy} onPress={() => void send()}>{busy ? 'SENDING…' : 'SEND FEEDBACK'}</Button>
        </>
      )}
      <Text style={[styles.footnote, { color: colors.quiet }]}>GCSE Study Desk is independent — not affiliated with, approved by, or endorsed by AQA.</Text>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: 'Menlo', fontSize: 11, fontWeight: '800', letterSpacing: .7 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 48, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1, borderRadius: 12 },
  chipText: { fontFamily: 'Menlo', fontSize: 11, fontWeight: '800' },
  star: { minWidth: 52, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 14 },
  starText: { fontSize: 18, fontWeight: '800' },
  area: { minHeight: 120, borderWidth: 1, borderRadius: 14, padding: 12, fontSize: 16, textAlignVertical: 'top' },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, fontSize: 16 },
  footnote: { fontSize: 12, lineHeight: 18 },
});
