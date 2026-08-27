import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import {
  Button,
  DeskHeader,
  Notice,
  ProgressMeter,
  ScrollScreen,
  SectionHeader,
} from "@/components";
import { useAuth, usePreferences } from "@/providers";
import {
  asArray,
  finite,
  parseResult,
  readCachedResult,
  resultId,
  text,
  type UnknownRecord,
} from "@/practice/core";
import { useTheme } from "@/theme";

const rec = (value: unknown): UnknownRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
const show = (value: unknown) =>
  typeof value === "string" || typeof value === "number"
    ? String(value)
    : undefined;

export default function Results() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { subject } = usePreferences();
  const { session } = useAuth();
  const { colors, subject: tokens } = useTheme();
  const [raw, setRaw] = useState<unknown>();
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  useEffect(() => {
    AsyncStorage.getItem(resultId(session?.user.id, subject, id)).then(
      (value) => {
        if (value) {
          try {
            setRaw(JSON.parse(value));
          } catch {}
        }
        setLoaded(true);
      },
    );
  }, [id, session?.user.id, subject]);
  if (!loaded)
    return (
      <ScrollScreen>
        <Notice kind="loading" title="OPENING MARK RECORD">
          Reading the locally cached server result.
        </Notice>
      </ScrollScreen>
    );
  if (!raw)
    return (
      <ScrollScreen>
        <DeskHeader title="No result found" eyebrow="MARK RECORD" />
        <Notice title="RESULT UNAVAILABLE">
          Results are shown only from a cached server submission. No values have
          been estimated.
        </Notice>
        <Button onPress={() => router.replace("/practice")}>
          Start practice
        </Button>
      </ScrollScreen>
    );
  const cached = readCachedResult(raw);
  const result = parseResult(cached.serverResult);
  const nextMarks = finite(result.nextBoundary.marksToGo);
  const nextGrade = show(result.nextBoundary.grade);
  const rewardXp =
    finite(result.reward.xpEarned) ??
    finite(result.reward.xp) ??
    finite(result.raw.xpEarned);
  const title =
    text(result.raw.paperName) ?? text(result.raw.title) ?? "Session result";
  return (
    <ScrollScreen>
      <DeskHeader title={title} eyebrow="SERVER MARK RECORD" />
      {result.incomplete && (
        <Notice kind="offline" title="SELF-MARKING NEEDED">
          Some English responses could not be AI-marked. Use the server-provided
          rubrics and model answers below; no grade is shown unless the server
          returned one.
        </Notice>
      )}
      <View
        style={[
          styles.hero,
          { borderColor: tokens.accent, backgroundColor: colors.raised },
        ]}
      >
        <View>
          <Text style={[styles.meta, { color: colors.quiet }]}>MARKS</Text>
          <Text style={[styles.score, { color: colors.ink }]}>
            {result.correctMarks ?? "—"}
            {result.totalMarks != null ? ` / ${result.totalMarks}` : ""}
          </Text>
          {result.percent != null && (
            <Text style={[styles.percent, { color: tokens.accent }]}>
              {result.percent}%
            </Text>
          )}
        </View>
        <View style={[styles.grade, { borderColor: tokens.accent }]}>
          <Text style={[styles.meta, { color: colors.quiet }]}>
            {result.incomplete
              ? "PENDING"
              : result.grade != null || result.gradeLabel
                ? "PREDICTED GRADE"
                : "GRADE"}
          </Text>
          <Text style={[styles.gradeText, { color: tokens.accent }]}>
            {result.incomplete
              ? "—"
              : (result.gradeLabel ?? show(result.grade) ?? "—")}
          </Text>
        </View>
      </View>
      {result.percent != null && (
        <ProgressMeter
          value={result.percent / 100}
          label="Marks confirmed by server"
        />
      )}
      {nextMarks != null && (
        <Notice title="NEXT BOUNDARY">
          {nextMarks} more mark{nextMarks === 1 ? "" : "s"}
          {nextGrade ? ` to reach grade ${nextGrade}` : ""}.
        </Notice>
      )}
      {rewardXp != null && (
        <Notice kind="success" title="REWARD CONFIRMED">
          {rewardXp} XP returned by the server.
        </Notice>
      )}
      {result.weakTopics.length > 0 && (
        <>
          <SectionHeader title="Weak topics" />
          <View style={styles.list}>
            {result.weakTopics.map((topic, index) => {
              const topicId = text(topic.id);
              const resources = asArray(topic.resources).map(rec);
              return (
                <View
                  key={topicId ?? index}
                  style={[
                    styles.card,
                    {
                      borderColor: colors.strong,
                      backgroundColor: colors.raised,
                    },
                  ]}
                >
                  <Text style={[styles.cardTitle, { color: colors.ink }]}>
                    {text(topic.name) ?? topicId ?? "Topic"}
                  </Text>
                  {finite(topic.percent) != null && (
                    <Text style={{ color: colors.warning }}>
                      {finite(topic.percent)}%
                    </Text>
                  )}
                  {topicId && (
                    <Button
                      variant="secondary"
                      onPress={() => router.push(`/lesson/${topicId}` as never)}
                    >
                      Revise this topic
                    </Button>
                  )}
                  {resources.map(
                    (resource, i) =>
                      text(resource.url) && (
                        <Pressable
                          key={i}
                          accessibilityRole="link"
                          onPress={() =>
                            void Linking.openURL(text(resource.url)!)
                          }
                        >
                          <Text
                            style={{ color: colors.info, fontWeight: "700" }}
                          >
                            {text(resource.label) ?? "Open resource"}
                            {text(resource.why)
                              ? ` · ${text(resource.why)}`
                              : ""}
                          </Text>
                        </Pressable>
                      ),
                  )}
                </View>
              );
            })}
          </View>
        </>
      )}
      <SectionHeader
        title="Question review"
        meta={`${result.review.length} ITEMS`}
      />
      {result.review.length === 0 && (
        <Notice title="NO REVIEW RETURNED">
          The server did not include question-level review for this session.
        </Notice>
      )}
      {result.review.map((question, index) => {
        const qid = text(question.qid) ?? text(question.id) ?? String(index);
        const answer = question.value === undefined ? cached.submittedAnswers[qid] : question.value;
        const marking = rec(question.marking);
        const expanded = open[qid];
        const got = finite(question.got) ?? finite(question.correctMarks);
        const marks = finite(question.marks) ?? finite(question.totalMarks);
        const solution = asArray(question.solution);
        const model = text(marking.modelAnswer) ?? text(question.modelAnswer);
        const rubric = rec(marking.rubric ?? question.rubric);
        return (
          <View
            key={qid}
            style={[
              styles.review,
              { borderColor: colors.strong, backgroundColor: colors.raised },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() =>
                setOpen((value) => ({ ...value, [qid]: !expanded }))
              }
              style={styles.reviewHead}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.ink }]}>
                  Question {show(question.qn) ?? index + 1}
                  {text(question.title) ? ` · ${text(question.title)}` : ""}
                </Text>
                <Text style={{ color: colors.quiet }}>
                  {got != null
                    ? got
                    : question.correct === true
                      ? (marks ?? "Correct")
                      : "—"}
                  {marks != null ? ` / ${marks}` : ""} marks
                </Text>
              </View>
              <Text style={{ color: colors.quiet, fontSize: 20 }}>
                {expanded ? "−" : "+"}
              </Text>
            </Pressable>
            {expanded && (
              <View style={styles.detail}>
                {text(question.text) && (
                  <Text
                    selectable
                    style={{ color: colors.ink, lineHeight: 22 }}
                  >
                    {text(question.text)}
                  </Text>
                )}
                <Text style={{ color: colors.quiet }}>
                  Your submitted answer:{" "}
                  {show(answer) ??
                    (answer == null
                      ? "(blank)"
                      : JSON.stringify(answer))}
                </Text>
                {text(question.answerText) && (
                  <Text style={{ color: colors.positive }}>
                    Answer: {text(question.answerText)}
                  </Text>
                )}
                {solution.length > 0 && (
                  <View>
                    <Text style={[styles.meta, { color: tokens.accent }]}>
                      WORKED SOLUTION
                    </Text>
                    {solution.map((step, i) => (
                      <Text
                        key={i}
                        style={{ color: colors.ink, lineHeight: 21 }}
                      >
                        {i + 1}. {show(step) ?? JSON.stringify(step)}
                      </Text>
                    ))}
                  </View>
                )}
                {text(marking.strengths) && (
                  <Text style={{ color: colors.ink }}>
                    Strengths: {text(marking.strengths)}
                  </Text>
                )}
                {text(marking.improvements) && (
                  <Text style={{ color: colors.ink }}>
                    Target: {text(marking.improvements)}
                  </Text>
                )}
                {model && (
                  <Text
                    selectable
                    style={{ color: colors.ink, lineHeight: 21 }}
                  >
                    Model answer: {model}
                  </Text>
                )}
                {Object.keys(rubric).length > 0 && (
                  <Text selectable style={{ color: colors.quiet }}>
                    Rubric: {JSON.stringify(rubric, null, 2)}
                  </Text>
                )}
                {question.listResult != null && (
                  <Text selectable style={{ color: colors.ink }}>
                    {JSON.stringify(question.listResult, null, 2)}
                  </Text>
                )}
                {question.tfResult != null && (
                  <Text selectable style={{ color: colors.ink }}>
                    {JSON.stringify(question.tfResult, null, 2)}
                  </Text>
                )}
              </View>
            )}
          </View>
        );
      })}
      <SectionHeader title="Next step" />
      <Button onPress={() => router.replace("/practice")}>
        Choose another session
      </Button>
      <Button variant="secondary" onPress={() => router.push("/learn")}>
        Study topics
      </Button>
    </ScrollScreen>
  );
}
const styles = StyleSheet.create({
  hero: {
    borderWidth: 2,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  meta: {
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  score: { fontFamily: "serif", fontSize: 36, fontWeight: "700" },
  percent: { fontSize: 18, fontWeight: "800" },
  grade: {
    width: 112,
    height: 112,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  gradeText: { fontFamily: "serif", fontSize: 38, fontWeight: "800" },
  list: { gap: 10 },
  card: { borderWidth: 1, padding: 14, gap: 9 },
  cardTitle: { fontSize: 17, fontWeight: "800" },
  review: { borderWidth: 1 },
  reviewHead: {
    minHeight: 62,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  detail: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12 },
});
