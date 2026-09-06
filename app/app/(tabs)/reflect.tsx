import { DeskHeader, ScrollScreen, PressableRow, Notice } from "@/components";
import { useTheme } from "@/theme";
import { Text, View } from "react-native";
export default function Reflect() {
  const { colors } = useTheme();
  return (
    <ScrollScreen>
      <DeskHeader title="See what’s taking shape." />
      <Text style={{ color: colors.quiet, fontSize: 17, lineHeight: 26 }}>
        Use your answers to decide what deserves another look.
      </Text>
      <View
        style={{
          backgroundColor: colors.muted,
          borderRadius: 14,
          padding: 22,
          gap: 12,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{ fontFamily: "Fraunces", fontSize: 30, color: colors.ink }}
        >
          Make your mistakes useful.
        </Text>
        <Text style={{ color: colors.quiet, lineHeight: 24 }}>
          Find the reason, revisit the method, and try again when it’s due.
        </Text>
        <PressableRow
          title="Open mistake notebook"
          detail="Scheduled reviews and worked methods"
          href="/notebook"
        />
      </View>
      <PressableRow
        title="Weekly reflection"
        detail="Completed sessions, recurring difficulties and progress"
        href="/weekly-summary"
      />
      <PressableRow
        title="Marked papers"
        detail="Your saved attempts and question-by-question feedback"
        href="/history"
      />
      <PressableRow
        title="Topic evidence map"
        detail="See what is strong and what needs practice"
        href="/learn"
      />
      <Notice title="Understanding takes evidence">
        A completed lesson and a correct answer tell you different things. Look
        for consistent answers across several attempts.
      </Notice>
    </ScrollScreen>
  );
}
