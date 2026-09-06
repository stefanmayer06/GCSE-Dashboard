import { Link } from "expo-router";
import { forwardRef, type PropsWithChildren } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type PressableProps,
  type ScrollViewProps,
  type TextInputProps,
  type ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNetwork, usePreferences } from "./providers";
import { recommendation, subjectTokens, useTheme } from "./theme";

export function Screen({ children, style, ...props }: ViewProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.paper }, style]}
      {...props}
    >
      <PaperPattern />
      {children}
    </SafeAreaView>
  );
}
export function ScrollScreen({ children, ...props }: ScrollViewProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.paper }]}>
      <PaperPattern />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        {...props}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function PaperPattern() {
  return null;
}
export function DeskHeader({ title }: { title: string; eyebrow?: string }) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  return (
    <View style={styles.header}>
      <Text
        accessibilityRole="header"
        maxFontSizeMultiplier={1.5}
        style={[
          styles.h1,
          { color: colors.ink },
          fontScale > 1.4 && { fontSize: 30, lineHeight: 38 },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}
export function Button({
  children,
  variant = "primary",
  ...props
}: PressableProps &
  PropsWithChildren & { variant?: "primary" | "secondary" | "danger" }) {
  const { colors, subject } = useTheme();
  const bg =
    variant === "primary"
      ? subject.accent
      : variant === "danger"
        ? colors.negative
        : colors.raised;
  const fg =
    variant === "secondary"
      ? colors.ink
      : variant === "danger"
        ? colors.paper
        : colors.paper;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: Boolean(props.disabled),
        ...props.accessibilityState,
      }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: variant === "secondary" ? colors.strong : bg,
          opacity: props.disabled ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
      {...props}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{children}</Text>
    </Pressable>
  );
}
export const Field = forwardRef<TextInput, TextInputProps & { label: string }>(
  ({ label, ...props }, ref) => {
    const { colors } = useTheme();
    return (
      <View style={styles.field}>
        <Text style={[styles.meta, { color: colors.quiet }]}>{label}</Text>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={colors.quiet}
          style={[
            styles.input,
            {
              color: colors.ink,
              backgroundColor: colors.raised,
              borderColor: colors.strong,
            },
          ]}
          {...props}
        />
      </View>
    );
  },
);
Field.displayName = "Field";
export function Notice({
  kind = "empty",
  title,
  children,
}: PropsWithChildren & {
  kind?: "loading" | "error" | "offline" | "empty" | "success";
  title: string;
}) {
  const { colors } = useTheme();
  const color =
    kind === "error"
      ? colors.negative
      : kind === "success"
        ? colors.positive
        : kind === "offline"
          ? colors.warning
          : colors.info;
  const wash =
    kind === "error"
      ? colors.negativeWash
      : kind === "success"
        ? colors.positiveWash
        : kind === "offline"
          ? colors.warningWash
          : colors.infoWash;
  return (
    <View
      accessibilityRole={kind === "error" ? "alert" : undefined}
      style={[styles.notice, { borderColor: color, backgroundColor: wash }]}
    >
      {kind === "loading" && <ActivityIndicator color={color} />}
      <Text style={[styles.meta, { color }]}>{title}</Text>
      {children && (
        <Text style={{ color: colors.ink, lineHeight: 21 }}>{children}</Text>
      )}
    </View>
  );
}
export function SectionHeader({
  title,
  meta,
}: {
  title: string;
  meta?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.ink }]}>
      <Text
        accessibilityRole="header"
        style={[styles.h2, { color: colors.ink }]}
      >
        {title}
      </Text>
      {meta && (
        <Text style={[styles.meta, { color: colors.quiet }]}>{meta}</Text>
      )}
    </View>
  );
}
export function PaperDocket({
  paper,
  title,
  detail,
}: {
  paper: string;
  title: string;
  detail: string;
}) {
  const { colors, subject } = useTheme();
  return (
    <View
      style={[
        styles.docket,
        styles.shadow,
        {
          backgroundColor: colors.raised,
          borderColor: colors.line,
          borderLeftColor: subject.accent,
        },
      ]}
    >
      <Text style={[styles.meta, { color: subject.accent }]}>{paper}</Text>
      <Text style={[styles.h2, { color: colors.ink }]}>{title}</Text>
      <Text style={{ color: colors.quiet }}>{detail}</Text>
    </View>
  );
}
export function NextSessionCard() {
  const { subject } = usePreferences();
  return (
    <PaperDocket
      paper="NEXT SESSION"
      title={subjectTokens[subject].label}
      detail={recommendation(subject)}
    />
  );
}
export function ProgressMeter({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const { colors, subject } = useTheme();
  const safe = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(safe * 100) }}
    >
      <Text style={[styles.meta, { color: colors.quiet }]}>{label}</Text>
      <View style={{ height: 8, backgroundColor: colors.muted, marginTop: 8 }}>
        <View
          style={{
            width: `${safe * 100}%`,
            height: 8,
            backgroundColor: subject.accent,
          }}
        />
      </View>
    </View>
  );
}
export function ExpertiseSeal({ grade }: { grade: string }) {
  const { colors, subject } = useTheme();
  return (
    <View
      accessibilityLabel={`Working grade ${grade}`}
      style={[styles.seal, { borderColor: subject.accent }]}
    >
      <Text style={[styles.meta, { color: colors.quiet }]}>WORKING GRADE</Text>
      <Text style={[styles.h2, { color: subject.accent }]}>{grade}</Text>
    </View>
  );
}
export function PressableRow({
  title,
  detail,
  href,
}: {
  title: string;
  detail?: string;
  href: string;
}) {
  const { colors } = useTheme();
  return (
    <Link href={href as never} asChild>
      <Pressable
        accessibilityRole="link"
        style={StyleSheet.flatten([
          styles.pressRow,
          { borderBottomColor: colors.line },
        ])}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.ink, fontSize: 17, fontWeight: "700" }}>
            {title}
          </Text>
          {detail && (
            <Text style={{ color: colors.quiet, marginTop: 3 }}>{detail}</Text>
          )}
        </View>
        <Text style={{ color: colors.quiet, fontSize: 20 }}>›</Text>
      </Pressable>
    </Link>
  );
}
export function Skeleton({
  width = "100%",
  height = 18,
}: {
  width?: number | `${number}%`;
  height?: number;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityLabel="Loading"
      style={{
        width,
        height,
        backgroundColor: colors.muted,
        marginVertical: 5,
        borderRadius: Math.min(16, height / 2),
      }}
    />
  );
}
export function OfflineBanner() {
  const { online } = useNetwork();
  return online ? null : (
    <Notice kind="offline" title="OFFLINE">
      Data already held in this app session may remain available. Reconnect
      before starting new work.
    </Notice>
  );
}
export function Placeholder({
  title,
  eyebrow,
  children,
}: PropsWithChildren & { title: string; eyebrow: string }) {
  return (
    <ScrollScreen>
      <DeskHeader title={title} eyebrow={eyebrow} />
      <OfflineBanner />
      {children ?? (
        <Notice title="HANDOFF READY">
          This route and its shared foundation are ready for the feature
          implementation.
        </Notice>
      )}
    </ScrollScreen>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 48, gap: 18 },
  header: { paddingVertical: 16, gap: 10 },
  eyebrow: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  h1: {
    fontSize: 36,
    lineHeight: 43,
    fontWeight: "400",
    fontFamily: "Fraunces",
    letterSpacing: -0.7,
  },
  h2: { fontSize: 24, fontWeight: "800", letterSpacing: -0.4 },
  meta: { fontFamily: "DMSans", fontSize: 13, fontWeight: "500" },
  button: {
    minHeight: 50,
    paddingHorizontal: 18,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    flexShrink: 1,
  },
  field: { gap: 7 },
  input: {
    minHeight: 50,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderRadius: 13,
  },
  notice: { borderWidth: 1, padding: 15, gap: 8, borderRadius: 16 },
  row: {
    minHeight: 52,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderBottomWidth: 1,
  },
  docket: {
    borderWidth: 1,
    borderLeftWidth: 1,
    padding: 18,
    gap: 8,
    borderRadius: 14,
  },
  seal: {
    minWidth: 112,
    minHeight: 112,
    padding: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 56,
  },
  pressRow: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 1,
    paddingVertical: 11,
  },
  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 0,
  },
});
