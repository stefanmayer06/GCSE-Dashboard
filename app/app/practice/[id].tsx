import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  BackHandler,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ApiClient, ApiError } from "@/api";
import { Button, Notice, ProgressMeter, Screen } from "@/components";
import { useAuth, useNetwork, usePreferences } from "@/providers";
import {
  activeId,
  asArray,
  cacheResult,
  draftId,
  durationSeconds,
  finite,
  hasAnswer,
  normalizeAnswer,
  parseDraft,
  progressiveSolutionHints,
  questionId,
  resultId,
  secondsRemaining,
  text,
  type AnswerValue,
  type Draft,
  type UnknownRecord,
} from "@/practice/core";
import { useTheme } from "@/theme";
import { mergeMistakes, mistakesFromResult, notebookKey } from "@/notebook";
import { completeMission, missionResultFromServer, parsePlanState, planStateKey } from "@/planning";

const rec = (value: unknown): UnknownRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
const display = (value: unknown) =>
  typeof value === "string"
    ? value
    : typeof value === "number"
      ? String(value)
      : "";
const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
type Source = {
  label: string;
  title?: string;
  author?: string;
  year?: string;
  century?: string;
  body: string;
};
export function normalizeSources(value: unknown): Source[] {
  const source = rec(value);
  const make = (
    item: unknown,
    label: string,
    fallback?: unknown,
  ): Source | null => {
    const row = rec(item);
    const body = text(row.text) ?? text(item);
    return body
      ? {
          label,
          title: text(row.title) ?? text(fallback),
          author: text(row.author),
          year: display(row.year) || undefined,
          century: text(row.century),
          body,
        }
      : null;
  };
  const a = make(
    source.sourceA ??
      (source.textA ? { text: source.textA, title: source.titleA } : null),
    "Source A",
    source.titleA,
  );
  const b = make(
    source.sourceB ??
      (source.textB ? { text: source.textB, title: source.titleB } : null),
    "Source B",
    source.titleB,
  );
  if (a || b) return [a, b].filter((item): item is Source => Boolean(item));
  const single = make(value, "Source");
  return single ? [single] : [];
}
export function mergeEssayAnswer(
  value: unknown,
  change: UnknownRecord,
): AnswerValue {
  return { ...rec(value), ...change };
}
export function hasQuestionAnswer(question: UnknownRecord, value: unknown) {
  const type = text(question.type) ?? text(rec(question.input).type);
  return type === "essay" ||
    (asArray(question.options).length > 0 && type !== "mcq")
    ? Boolean(text(rec(normalizeAnswer(value)).text))
    : hasAnswer(value);
}

export default function ActivePractice() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { subject } = usePreferences();
  const { session: auth } = useAuth();
  const { online } = useNetwork();
  const { colors, subject: tokens } = useTheme();
  const key = draftId(auth?.user.id, subject, id);
  const api = new ApiClient(subject);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [remaining, setRemaining] = useState<number>();
  const [phase, setPhase] = useState<
    "loading" | "running" | "frozen" | "submitting" | "error"
  >("loading");
  const [error, setError] = useState("");
  const [aiResults, setAiResults] = useState<Record<string, UnknownRecord>>({});
  const [hintReveals, setHintReveals] = useState<Record<string, number>>({});
  const [feedbackHistory, setFeedbackHistory] = useState<Record<string, UnknownRecord[]>>({});
  const submitting = useRef(false);
  const mounted = useRef(true);
  const latest = useRef<{ draft: Draft | null; answers: Record<string, AnswerValue>; current: number; hintReveals: Record<string, number>; feedbackHistory: Record<string, UnknownRecord[]> }>({ draft: null, answers: {}, current: 0, hintReveals: {}, feedbackHistory: {} });
  const [discardError, setDiscardError] = useState("");
  const [pane, setPane] = useState<"question" | "source">("question");
  const [sourceIndex, setSourceIndex] = useState(0);
  latest.current = { draft, answers, current, hintReveals, feedbackHistory };

  async function flush(expiredAt?: string) {
    const snapshot = latest.current;
    if (!snapshot.draft) return;
    const next = { ...snapshot.draft, answers: snapshot.answers, current: snapshot.current, hintReveals: snapshot.hintReveals, feedbackHistory: snapshot.feedbackHistory, savedAt: new Date().toISOString(), expiredAt: expiredAt ?? snapshot.draft.expiredAt };
    latest.current.draft = next;
    await AsyncStorage.setItem(key, JSON.stringify(next));
  }

  async function restore() {
    setPhase("loading");
    setError("");
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) throw new Error("This session is not saved on this device.");
      const saved = parseDraft(raw, subject, id);
      if (!saved)
        throw new Error("The saved session is damaged.");
      if (saved.session.subject !== subject)
        throw new Error(
          "Switch back to the subject used to start this session.",
        );
      if (saved.session.kind === "paper" && online) {
        const status = await api.testStatus(id);
        if (status.completed === true || status.active === false)
          throw new Error("This paper has already been completed.");
      }
      if (!mounted.current) return;
      const expiredAt = saved.expiredAt ?? (secondsRemaining(saved.session.endsAt) === 0 ? new Date().toISOString() : undefined);
      const restored = expiredAt ? { ...saved, expiredAt } : saved;
      if (expiredAt && !saved.expiredAt) await AsyncStorage.setItem(key, JSON.stringify(restored));
      if (!mounted.current) return;
      setDraft(restored);
      setAnswers(saved.answers ?? {});
      setHintReveals(saved.hintReveals ?? {});
      setFeedbackHistory(saved.feedbackHistory ?? {});
      setCurrent(
        Math.min(
          saved.current ?? 0,
          Math.max(0, saved.session.questions.length - 1),
        ),
      );
      setRemaining(secondsRemaining(saved.session.endsAt));
      setPhase(expiredAt ? "frozen" : "running");
    } catch (cause) {
      if (!mounted.current) return;
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not restore this session.",
      );
      setPhase("error");
    }
  }
  // Restore is an external storage synchronization triggered by route identity.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void restore();
    // restore intentionally reruns only when the persisted route identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, subject]);
  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener("change", state => {
      if (state === "background" || state === "inactive") void flush();
    });
    return () => {
      mounted.current = false;
      subscription.remove();
      void flush();
    };
    // The latest draft is read through a ref so lifecycle listeners remain stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  // The alert callbacks intentionally use the latest render's session state.
  useEffect(() => {
    if (phase !== "running" || remaining == null) return;
    const timer = setTimeout(() => {
      if (remaining <= 0) {
        const expiredAt = new Date().toISOString();
        setDraft(value => value ? { ...value, expiredAt } : value);
        setPhase("frozen");
        void flush(expiredAt);
      } else {
        setRemaining(secondsRemaining(draft?.session.endsAt) ?? 0);
      }
    }, remaining <= 0 ? 0 : 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phase, draft?.session.endsAt]);
  useEffect(() => {
    if (!draft || (phase !== "running" && phase !== "frozen")) return;
    const timer = setTimeout(() => {
      const next = {
        ...draft,
        answers,
        current,
        hintReveals,
        feedbackHistory,
        savedAt: new Date().toISOString(),
      };
      void AsyncStorage.setItem(key, JSON.stringify(next));
    }, 250);
    return () => clearTimeout(timer);
  }, [answers, current, draft, feedbackHistory, hintReveals, key, phase]);
  // The hardware subscription is replaced whenever the route phase changes.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (phase === "running") {
          confirmDiscard();
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "loading")
    return (
      <Screen style={styles.center}>
        <Notice kind="loading" title="RESTORING SESSION">
          Checking the saved draft and server session.
        </Notice>
      </Screen>
    );
  if (!draft || phase === "error")
    return (
      <Screen style={styles.center}>
        <Notice kind="error" title="SESSION UNAVAILABLE">
          {error}
        </Notice>
        <Button onPress={restore}>Retry recovery</Button>
        <Button variant="secondary" onPress={async () => { await AsyncStorage.multiRemove([key, activeId(auth?.user.id, subject)]); router.replace("/practice"); }}>Remove unusable draft</Button>
        <Button variant="secondary" onPress={() => router.replace("/practice")}>
          Back to practice
        </Button>
      </Screen>
    );
  const active = draft;
  const questions = active.session.questions;
  const question = questions[current] ?? {};
  const qid = questionId(question, current);
  const finalAttempt = subject === "english" && feedbackHistory[qid]?.at(-1)?.canResubmit === false;
  const answered = questions.filter((q, i) =>
    hasQuestionAnswer(q, answers[questionId(q, i)]),
  ).length;
  const paperSources =
    subject === "english" && active.session.kind === "paper"
      ? normalizeSources(active.session.raw.source)
      : [];

  function update(value: AnswerValue) {
    if (phase !== "running") return;
    setAnswers((previous) => ({
      ...previous,
      [qid]:
        asArray(question.options).length > 0 &&
        text(question.type) !== "mcq" &&
        typeof value === "object" &&
        !Array.isArray(value)
          ? mergeEssayAnswer(previous[qid], rec(value))
          : value,
    }));
  }
  async function checkCurrent() {
    if (phase !== "running" || !hasQuestionAnswer(question, answers[qid])) return;
    if (subject === "english" && feedbackHistory[qid]?.at(-1)?.canResubmit === false) return;
    setError("");
    if (question.markType === "self") {
      const marking = rec(question.marking);
      const row = { ai: false, modelAnswer: question.modelAnswer ?? question.answerText ?? marking.modelAnswer, rubric: question.rubric ?? marking.rubric, guidance: question.guidance ?? marking.guidance };
      setFeedbackHistory(previous => ({ ...previous, [qid]: [...(previous[qid] ?? []), row] }));
      return;
    }
    if (!online) return;
    try {
      const value = normalizeAnswer(answers[qid]);
      const type = text(question.type);
      const response =
        subject === "english" && type !== "list" && type !== "truefalse"
          ? await api.mark(
              active.session.id,
              qid,
              display(rec(value).text ?? value),
            )
          : await api.check(qid, value, active.session.id);
      const row = rec(response);
      if (!mounted.current) return;
      setFeedbackHistory(previous => ({ ...previous, [qid]: [...(previous[qid] ?? []), row] }));
      if (row.ai === true)
        setAiResults((previous) => ({ ...previous, [qid]: row }));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Checking is unavailable. Your answer remains saved.",
      );
    }
  }
  function confirmSubmit(auto = false) {
    if (submitting.current) return;
    const missing = questions.length - answered;
    Alert.alert(
      auto ? "Time is up" : "Submit session?",
      missing
        ? `${missing} question${missing === 1 ? "" : "s"} are incomplete. The server will mark only what you submit.`
        : "Your answers will be sent for final server marking.",
      [
        { text: auto ? "Keep frozen draft" : "Cancel", style: "cancel" },
        { text: "Submit now", onPress: () => void submit() },
      ],
    );
  }
  async function submit() {
    if (submitting.current || !online) return;
    submitting.current = true;
    setPhase("submitting");
    setError("");
    try {
      const list = questions.map((q, index) => ({
        qid: questionId(q, index),
        value: normalizeAnswer(answers[questionId(q, index)]),
      }));
      const result =
        active.session.kind === "paper"
          ? await api.submitTest(
              id,
              list,
              durationSeconds(active.session.startedAt),
            )
          : active.session.kind === "practice"
            ? await api.practiceSubmit(
                id,
                list,
                subject === "english" ? aiResults : active.session.topicId,
              )
            : await api.adhocSubmit(
                id,
                list,
                subject === "english" ? aiResults : undefined,
              );
       const cached = cacheResult(result, answers);
       const notebookStorageKey = notebookKey(auth?.user.id);
       const existingMistakes = await AsyncStorage.getItem(notebookStorageKey);
       const mistakes = mistakesFromResult(result, cached.submittedAnswers, id, subject);
       await AsyncStorage.multiSet([
          [resultId(auth?.user.id, subject, id), JSON.stringify(cached)],
         [notebookStorageKey, JSON.stringify(mergeMistakes(existingMistakes, mistakes))],
        [activeId(auth?.user.id, subject), ""],
      ]);
      if (active.session.kind === "practice") {
        const planStorageKey = planStateKey(auth?.user.id, subject);
        const currentPlan = parsePlanState(await AsyncStorage.getItem(planStorageKey));
        if (currentPlan) {
          const updated = completeMission(currentPlan, active.session.topicId, missionResultFromServer(result));
          if (updated !== currentPlan) await AsyncStorage.setItem(planStorageKey, JSON.stringify(updated));
        }
      }
      await AsyncStorage.removeItem(key);
      router.replace({ pathname: "/results/[id]", params: { id } });
    } catch (cause) {
      submitting.current = false;
      const message =
        cause instanceof Error ? cause.message : "Submission failed.";
      setError(
        cause instanceof ApiError &&
          (cause.code === "TEST_EXPIRED" || cause.status === 404)
          ? `${message} Your offline draft has been kept.`
          : `${message} Your draft is still saved; retry when ready.`,
      );
      if (mounted.current) setPhase(active.expiredAt ? "frozen" : "running");
    }
  }
  function confirmDiscard() {
    Alert.alert(
      "Discard this session?",
      "Your local answers will be removed. Paper sessions will also be discarded on the server when online.",
      [
        { text: "Keep working", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => void discard(),
        },
      ],
    );
  }
  async function discard() {
    if (active.session.kind === "paper" && !online) {
      setDiscardError("Reconnect to discard this paper on the server. Your draft is still on this device.");
      return;
    }
    if (active.session.kind === "paper") {
      try {
        await api.discardTest(id);
      } catch (cause) {
        if (mounted.current) setDiscardError(`${cause instanceof Error ? cause.message : "The server paper could not be discarded."} Your draft is still on this device.`);
        return;
      }
    }
    await AsyncStorage.multiRemove([key, activeId(auth?.user.id, subject)]);
    router.replace("/practice");
  }
  async function removeLocalOnly() {
    await AsyncStorage.multiRemove([key, activeId(auth?.user.id, subject)]);
    router.replace("/practice");
  }

  return (
    <Screen>
      <View
        style={[
          styles.top,
          { borderBottomColor: colors.strong, backgroundColor: colors.paper },
        ]}
      >
        <Text style={[styles.meta, { color: tokens.accent }]}>
          {draft.session.title}
        </Text>
        <View style={styles.topRow}>
          <Text
            accessibilityRole="header"
            style={[styles.heading, { color: colors.ink }]}
          >
            Question {current + 1} of {questions.length}
          </Text>
          {remaining != null && (
            <Text
              accessibilityLabel={`${remaining} seconds remaining on the practice timer`}
              style={[
                styles.timer,
                { color: remaining < 300 ? colors.negative : colors.ink },
              ]}
            >
              {formatTime(remaining)}
            </Text>
          )}
        </View>
        <ProgressMeter
          value={questions.length ? answered / questions.length : 0}
          label={`${answered} of ${questions.length} answered`}
        />
      </View>
      {!online && (
        <View style={styles.banner}>
          <Notice kind="offline" title="OFFLINE DRAFT">
            Answers remain on this device. Reconnect before checking or
            submitting.
          </Notice>
        </View>
      )}
      {phase === "frozen" && <View style={styles.banner}><Notice kind="offline" title="PRACTICE TIMER ENDED">This is a practice timer, not secure exam enforcement. Your answers are frozen and cannot be changed. {online ? "Submit the frozen answers when ready." : "They are saved unchanged and can be submitted after reconnecting."}</Notice>{online && <Button disabled={submitting.current} onPress={() => void submit()}>Submit frozen answers</Button>}</View>}
      {paperSources.length > 0 && (
        <View
          accessibilityRole="tablist"
          accessibilityLabel="Paper view"
          style={[styles.segment, { borderColor: colors.strong }]}
        >
          {(["question", "source"] as const).map((item) => (
            <Pressable
              key={item}
              disabled={phase !== "running"}
              accessibilityRole="tab"
              accessibilityState={{ selected: pane === item }}
              onPress={() => setPane(item)}
              style={[
                styles.segmentButton,
                {
                  backgroundColor:
                    pane === item ? tokens.accent : colors.raised,
                },
              ]}
            >
              <Text
                style={{
                  color: pane === item ? "#fff" : colors.ink,
                  fontWeight: "800",
                }}
              >
                {item === "question" ? "Question" : "Source"}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {pane === "source" && paperSources.length > 0 ? (
        <SourceReader
          sources={paperSources}
          selected={sourceIndex}
          onSelect={setSourceIndex}
          disabled={phase !== "running"}
          colors={colors}
          accent={tokens.accent}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <Question
            question={question}
            value={answers[qid]}
            onChange={update}
            disabled={phase !== "running"}
            colors={colors}
            accent={tokens.accent}
          />
           {feedbackHistory[qid]?.map((item,index)=><Feedback key={index} value={item} colors={colors} attempt={index+1} />)}
           {subject.startsWith("maths") && draft.session.kind !== "paper" && <MathsHints question={question} revealed={hintReveals[qid]??0} onReveal={()=>setHintReveals(value=>({...value,[qid]:(value[qid]??0)+1}))} colors={colors}/>}
          {error && (
            <Notice kind="error" title="ACTION NOT COMPLETED">
              {error}
            </Notice>
          )}
          {draft.session.kind !== "paper" && (
            <Button
              variant="secondary"
              disabled={
                 phase !== "running" ||
                 finalAttempt ||
                 (question.markType !== "self" && !online) ||
                 !hasQuestionAnswer(question, answers[qid])
              }
              onPress={checkCurrent}
            >
              {finalAttempt
                ? "Final attempt reached"
                : question.markType === "self"
                 ? "Reveal model answer and rubric"
                : subject === "english" && !["list", "truefalse"].includes(text(question.type) ?? "")
                   ? feedbackHistory[qid]?.length ? "Improve answer / resubmit to examiner" : "Ask examiner to mark"
                  : "Check with server"}
            </Button>
          )}
        </ScrollView>
      )}
      <View
        style={[
          styles.footer,
          { borderTopColor: colors.strong, backgroundColor: colors.paper },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.map}
        >
          {questions.map((q, index) => (
             <Pressable
              key={questionId(q, index)}
              accessibilityRole="button"
              accessibilityLabel={`Go to question ${index + 1}${hasQuestionAnswer(q, answers[questionId(q, index)]) ? ", answered" : ", unanswered"}`}
               disabled={phase !== "running"}
               onPress={() => {
                setCurrent(index);
                setPane("question");
              }}
              style={[
                styles.mapButton,
                {
                  borderColor:
                    index === current ? tokens.accent : colors.strong,
                  backgroundColor: hasQuestionAnswer(
                    q,
                    answers[questionId(q, index)],
                  )
                    ? colors.muted
                    : colors.raised,
                },
              ]}
            >
              <Text style={{ color: colors.ink, fontWeight: "800" }}>
                {index + 1}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.nav}>
          <Button
            variant="secondary"
             disabled={current === 0 || phase !== "running"}
            onPress={() => {
              setCurrent((i) => i - 1);
              setPane("question");
            }}
          >
            Previous
          </Button>
          {current < questions.length - 1 ? (
            <Button
               disabled={phase !== "running"}
              onPress={() => {
                setCurrent((i) => i + 1);
                setPane("question");
              }}
            >
              Next
            </Button>
          ) : (
            <Button
               disabled={phase !== "running" || !online}
              onPress={() => confirmSubmit(false)}
            >
              {phase === "submitting" ? "Submitting..." : "Review and submit"}
            </Button>
          )}
        </View>
        <Pressable accessibilityRole="button" onPress={confirmDiscard}>
          <Text style={[styles.discard, { color: colors.negative }]}>
            Discard session
          </Text>
        </Pressable>
        {discardError && <><Notice kind="error" title="SERVER DISCARD FAILED">{discardError}</Notice><Button variant="secondary" onPress={() => void discard()}>Retry server discard</Button><Button variant="secondary" onPress={() => Alert.alert("Remove only this device's draft?", "The paper may remain active on the server. This cannot be undone.", [{ text: "Cancel", style: "cancel" }, { text: "Remove local draft", style: "destructive", onPress: () => void removeLocalOnly() }])}>Remove local draft only</Button></>}
      </View>
    </Screen>
  );
}

function Question({
  question,
  value,
  onChange,
  colors,
  accent,
  disabled,
}: {
  question: UnknownRecord;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  colors: Record<string, string>;
  accent: string;
  disabled: boolean;
}) {
  const input = rec(question.input);
  const type = text(question.type) ?? text(input.type) ?? "";
  const options = asArray(question.options).length
    ? asArray(question.options)
    : asArray(input.choices);
  const prompt =
    text(question.text) ??
    text(question.prompt) ??
    text(question.question) ??
    "Question";
  const sources = normalizeSources(
    question.sourceRef ??
      question.sourceText ??
      question.source ??
      question.extract,
  );
  const statements = asArray(input.statements).map(rec);
  return (
    <View style={styles.question}>
      <View style={styles.qmeta}>
        <Text style={[styles.meta, { color: accent }]}>
          {finite(question.marks) != null
            ? `${finite(question.marks)} MARK${finite(question.marks) === 1 ? "" : "S"}`
            : "QUESTION"}
        </Text>
        {finite(question.targetMins) != null && (
          <Text style={{ color: colors.quiet }}>
            about {finite(question.targetMins)} min
          </Text>
        )}
      </View>
      {sources.length > 0 && (
        <SourceReader
          sources={sources}
          selected={0}
          colors={colors}
          accent={accent}
          compact
          disabled={disabled}
        />
      )}
      <PromptImage image={question.image} colors={colors} />
      <Text style={[styles.prompt, { color: colors.ink }]}>{prompt}</Text>
      {type === "truefalse" && statements.length ? (
        statements.map((statement, index) => {
          const current = rec(value)[String(index)];
          return (
            <View
              key={index}
              style={[styles.statement, { borderColor: colors.strong }]}
            >
              <Text style={{ color: colors.ink, flex: 1 }}>
                {text(statement.text) ?? `Statement ${index + 1}`}
              </Text>
              <Pressable
                disabled={disabled}
                accessibilityRole="radio"
                accessibilityState={{ checked: current === true }}
                onPress={() => onChange({ ...rec(value), [index]: true })}
                style={[
                  styles.choice,
                  { borderColor: current === true ? accent : colors.strong },
                ]}
              >
                <Text style={{ color: colors.ink }}>True</Text>
              </Pressable>
              <Pressable
                disabled={disabled}
                accessibilityRole="radio"
                accessibilityState={{ checked: current === false }}
                onPress={() => onChange({ ...rec(value), [index]: false })}
                style={[
                  styles.choice,
                  { borderColor: current === false ? accent : colors.strong },
                ]}
              >
                <Text style={{ color: colors.ink }}>False</Text>
              </Pressable>
            </View>
          );
        })
      ) : options.length ? (
        <View style={styles.options}>
          {options.map((option, index) => {
            const row = rec(option);
            const key =
              text(row.label) ??
              text(row.id) ??
              display(option) ??
              String(index);
            const optionText = text(row.text) ?? display(option) ?? key;
            const selected =
              typeof value === "object" && !Array.isArray(value)
                ? rec(value).option === (row.id ?? key)
                : value === key;
            return (
              <Pressable
                disabled={disabled}
                key={key}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() =>
                  onChange(
                    question.type && text(question.type) !== "mcq"
                      ? { option: row.id ?? key, optionText }
                      : key,
                  )
                }
                style={[
                  styles.option,
                  {
                    borderColor: selected ? accent : colors.strong,
                    backgroundColor: colors.raised,
                  },
                ]}
              >
                <Text
                  style={{
                    color: colors.ink,
                    fontWeight: selected ? "800" : "500",
                  }}
                >
                  {text(row.label) ? `${text(row.label)}. ` : ""}
                  {optionText}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <TextInput
          accessibilityLabel="Your answer"
          multiline={
            type === "essay" ||
            type === "analysis" ||
            type === "list" ||
            finite(question.marks)! > 4
          }
          keyboardType={
            type === "number" || input.type === "number"
              ? "decimal-pad"
              : "default"
          }
          placeholder={
            text(input.placeholder) ??
            (type === "list" ? "One point per line" : "Write your answer")
          }
          placeholderTextColor={colors.quiet}
          value={
            typeof value === "object" && !Array.isArray(value)
              ? display(rec(value).text)
              : display(value)
          }
          onChangeText={(next) => onChange(subjectValue(question, next))}
          editable={!disabled}
          style={[
            styles.input,
            {
              color: colors.ink,
              backgroundColor: colors.raised,
              borderColor: colors.strong,
              minHeight:
                type === "essay"
                  ? 220
                  : type === "analysis"
                    ? 150
                    : type === "list"
                      ? 130
                      : 54,
            },
          ]}
        />
      )}
      {options.length > 0 && type !== "mcq" && (
        <EssayEditor
          type={type}
          input={input}
          value={value}
          onChange={onChange}
          colors={colors}
          disabled={disabled}
        />
      )}
    </View>
  );
}
function EssayEditor({
  type,
  input,
  value,
  onChange,
  colors,
  disabled,
}: {
  type: string;
  input: UnknownRecord;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  colors: Record<string, string>;
  disabled: boolean;
}) {
  const answer = display(rec(value).text);
  return (
    <View style={styles.editor}>
      <TextInput
        accessibilityLabel="Your answer"
        multiline
        placeholder={text(input.placeholder) ?? "Write your answer"}
        placeholderTextColor={colors.quiet}
        value={answer}
        onChangeText={(next) =>
          onChange(mergeEssayAnswer(value, { text: next }))
        }
        editable={!disabled}
        style={[
          styles.input,
          {
            color: colors.ink,
            backgroundColor: colors.raised,
            borderColor: colors.strong,
            minHeight: type === "essay" ? 220 : 140,
          },
        ]}
      />
      <Text accessibilityLiveRegion="polite" style={{ color: colors.quiet }}>
        {answer.match(/\S+/g)?.length ?? 0} words
        {type === "essay" ? " · aim for 500+ for the full marks" : ""}
      </Text>
    </View>
  );
}
function SourceReader({
  sources,
  selected,
  onSelect,
  colors,
  accent,
  compact = false,
  disabled = false,
}: {
  sources: Source[];
  selected: number;
  onSelect?: (index: number) => void;
  colors: Record<string, string>;
  accent: string;
  compact?: boolean;
  disabled?: boolean;
}) {
  const [localSelected, setLocalSelected] = useState(selected);
  const safe = Math.min(
    onSelect ? selected : localSelected,
    sources.length - 1,
  );
  const source = sources[safe];
  return (
    <View
      style={[
        styles.source,
        { backgroundColor: colors.muted, borderColor: colors.strong },
        compact && styles.compactSource,
      ]}
    >
      {sources.length > 1 && (
        <View
          accessibilityRole="tablist"
          accessibilityLabel="Sources"
          style={styles.sourceTabs}
        >
          {sources.map((item, index) => (
            <Pressable
              key={item.label}
              disabled={disabled}
              accessibilityRole="tab"
              accessibilityState={{ selected: index === safe }}
              onPress={() =>
                onSelect ? onSelect(index) : setLocalSelected(index)
              }
              style={[
                styles.sourceTab,
                { borderColor: index === safe ? accent : colors.strong },
              ]}
            >
              <Text style={{ color: colors.ink, fontWeight: "800" }}>
                {item.label}
                {item.century ? ` (${item.century})` : ""}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <Text style={[styles.meta, { color: accent }]}>{source.label}</Text>
      {(source.title || source.author || source.year) && (
        <Text style={[styles.sourceTitle, { color: colors.ink }]}>
          {[source.title, source.author, source.year]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      )}
      <ScrollView
        nestedScrollEnabled
        style={compact ? styles.compactSourceScroll : styles.sourceScroll}
      >
        <Text
          selectable
          accessibilityLabel={`${source.label} text`}
          style={[styles.sourceBody, { color: colors.ink }]}
        >
          {source.body}
        </Text>
      </ScrollView>
    </View>
  );
}
function PromptImage({
  image,
  colors,
}: {
  image: unknown;
  colors: Record<string, string>;
}) {
  const [failed, setFailed] = useState(false);
  const row = rec(image);
  const uri = text(row.url) ?? text(image);
  if (!uri || failed) return null;
  return (
    <View style={styles.imageWrap}>
      <Image
        source={{ uri }}
        accessible
        accessibilityLabel={text(row.alt) ?? "Image provided with the question"}
        resizeMode="contain"
        onError={() => setFailed(true)}
        style={[styles.image, { backgroundColor: colors.muted }]}
      />
      {text(row.credit) && (
        <Text style={{ color: colors.quiet, fontSize: 12 }}>
          {text(row.credit)}
        </Text>
      )}
    </View>
  );
}
function subjectValue(question: UnknownRecord, value: string): AnswerValue {
  const type = text(question.type);
  return type && !["list", "number", "text"].includes(type)
    ? { text: value }
    : value;
}
function Feedback({
  value,
  colors,
  attempt,
}: {
  value: UnknownRecord;
  colors: Record<string, string>;
  attempt?: number;
}) {
  const model = text(value.modelAnswer) ?? text(value.answerText);
  const guidance = text(value.guidance);
  const rubric = rec(value.rubric);
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.feedback,
        { borderColor: colors.info, backgroundColor: colors.raised },
      ]}
    >
      <Text style={[styles.meta, { color: colors.info }]}>
        {value.ai === false
          ? "SELF-MARK WITH RUBRIC"
          : value.ai === true
            ? "AI EXAMINER FEEDBACK"
            : "SERVER CHECK"}
      </Text>
      {attempt != null && <Text style={{color:colors.quiet}}>Attempt {finite(value.attemptNo) ?? attempt}{finite(value.markDelta) != null ? ` / delta ${finite(value.markDelta)! >= 0 ? "+" : ""}${finite(value.markDelta)}` : ""}{value.canResubmit === false ? " / final attempt" : " / can resubmit"}</Text>}
      {finite(value.marks) != null && (
        <Text style={{ color: colors.ink, fontWeight: "800" }}>
          {finite(value.marks)} /{" "}
          {finite(value.marksTotal) ?? finite(value.max) ?? "?"} marks
        </Text>
      )}
      {text(value.strengths) && (
        <Text style={{ color: colors.ink }}>
          Strengths: {text(value.strengths)}
        </Text>
      )}
      {text(value.improvements) && (
        <Text style={{ color: colors.ink }}>
          Target: {text(value.improvements)}
        </Text>
      )}
      {model && (
        <Text selectable style={{ color: colors.ink, lineHeight: 21 }}>
          Model answer: {model}
        </Text>
      )}
      {guidance && <Text selectable style={{ color: colors.ink, lineHeight: 21 }}>Guidance: {guidance}</Text>}
      {Object.keys(rubric).length > 0 && (
        <Text selectable style={{ color: colors.quiet }}>
          Rubric: {JSON.stringify(rubric, null, 2)}
        </Text>
      )}
      {value.correct != null && (
        <Text
          style={{ color: value.correct ? colors.positive : colors.warning }}
        >
          {value.correct
            ? "Correct"
            : "Check the server feedback and try again"}
        </Text>
      )}
    </View>
  );
}

function MathsHints({question,revealed,onReveal,colors}:{question:UnknownRecord;revealed:number;onReveal:()=>void;colors:Record<string,string>}){
  const first=text(question.hint)??text(rec(question.marking).hint);
  const solution=progressiveSolutionHints(question.solution);
  const hints=[...(first?[first]:[]),...solution];
  if(!hints.length)return null;
  return <View style={[styles.feedback,{borderColor:colors.warning,backgroundColor:colors.raised}]}><Text style={[styles.meta,{color:colors.warning}]}>PROGRESSIVE HINTS / FINAL ANSWER HIDDEN</Text>{hints.slice(0,revealed).map((hint,index)=><Text key={index} style={{color:colors.ink,lineHeight:21}}>{index+1}. {hint}</Text>)}{revealed<hints.length&&<Button variant="secondary" onPress={onReveal}>{revealed===0?'Reveal hint':'Reveal next step'}</Button>}</View>
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  compactSource: { margin: 0, flex: 0 },
  sourceScroll: { flex: 1 },
  compactSourceScroll: { maxHeight: 240 },
  sourceTabs: { flexDirection: "row", gap: 8 },
  sourceTab: {
    flex: 1,
    minHeight: 44,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  sourceTitle: { fontFamily: "serif", fontSize: 20, fontWeight: "700" },
  sourceBody: { fontFamily: "serif", fontSize: 17, lineHeight: 27 },
  imageWrap: { gap: 5 },
  image: { width: "100%", height: 220 },
  editor: { gap: 8 },
  center: { padding: 20, justifyContent: "center", gap: 14 },
  top: { padding: 16, borderBottomWidth: 1, gap: 8 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  heading: { fontFamily: "serif", fontSize: 24, fontWeight: "700" },
  timer: { fontFamily: "monospace", fontSize: 19, fontWeight: "800" },
  meta: {
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  banner: { paddingHorizontal: 16, paddingTop: 10 },
  body: {
    padding: 18,
    paddingBottom: 28,
    gap: 16,
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
  },
  question: { gap: 16 },
  qmeta: { flexDirection: "row", justifyContent: "space-between" },
  prompt: { fontFamily: "serif", fontSize: 23, lineHeight: 32 },
  source: {
    borderWidth: 1,
    padding: 14,
    gap: 8,
    maxHeight: 420,
    flex: 1,
    margin: 16,
  },
  input: {
    borderWidth: 1,
    padding: 13,
    fontSize: 17,
    textAlignVertical: "top",
  },
  options: { gap: 9 },
  option: {
    minHeight: 52,
    borderWidth: 1,
    padding: 14,
    justifyContent: "center",
  },
  statement: { borderBottomWidth: 1, paddingVertical: 12, gap: 8 },
  choice: {
    borderWidth: 2,
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  feedback: { borderWidth: 1, padding: 14, gap: 9 },
  footer: { borderTopWidth: 1, padding: 12, gap: 10 },
  map: { gap: 7 },
  mapButton: {
    width: 40,
    height: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  nav: { flexDirection: "row", gap: 8 },
  discard: { textAlign: "center", fontWeight: "700", padding: 7 },
});
