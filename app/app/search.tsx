import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "@/api";
import {
  DeskHeader,
  ScrollScreen,
  Field,
  PressableRow,
  Notice,
  Button,
} from "@/components";
import { useAuth, usePreferences } from "@/providers";
import { parseTopics } from "@/today/model";
import { queryKeys } from "@/query-cache";
import { asRecord, asText } from "@/learn";
import { useTheme } from "@/theme";
import { Text } from "react-native";
import { router } from "expo-router";
const destinations = [
  ["Today’s plan", "/"],
  ["Exam practice and diagnostic", "/practice"],
  ["Topic evidence map", "/learn"],
  ["Mistake notebook", "/notebook"],
  ["Weekly reflection", "/weekly-summary"],
  ["Tutor explanations", "/tutor"],
  ["Profile, exam goals and appearance", "/settings"],
];
export default function Search() {
  const [search, setSearch] = useState("");
  const { subject } = usePreferences();
  const { session } = useAuth();
  const { colors } = useTheme();
  const client = new ApiClient(subject);
  const topics = useQuery({
    queryKey: queryKeys.topics(subject),
    queryFn: () => client.topics(),
  });
  const texts = useQuery({
    queryKey: ["search-texts", subject, session?.user.id],
    queryFn: () => client.texts(),
    enabled: subject === "english",
  });
  const personal = useQuery({
    queryKey: ["search-personal", subject, session?.user.id],
    queryFn: () => client.personal(),
  });
  const raw = asRecord(texts.data);
  const entries = [
    ...(personal.data?.mistakes || []).map((row: unknown) => {
      const item = asRecord(row);
      return {
        title: asText(item.topicName),
        href: "/notebook",
        detail: asText(item.prompt),
      };
    }),
    ...destinations.map(([title, href]) => ({
      title,
      href,
      detail: "Study tool",
    })),
    ...parseTopics(topics.data).map((t) => ({
      title: t.name,
      href: `/lesson/${encodeURIComponent(t.id)}`,
      detail: t.area,
    })),
    ...(Array.isArray(raw.texts) ? raw.texts : []).map((t) => {
      const r = asRecord(t);
      return {
        title: asText(r.title),
        href: `/text/${encodeURIComponent(asText(r.id))}`,
        detail: asText(r.author),
      };
    }),
  ];
  const matches = entries.filter((e) =>
    `${e.title} ${e.detail}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  return (
    <ScrollScreen>
      <Button variant="secondary" onPress={() => router.back()}>
        Back to learning
      </Button>
      <DeskHeader title="Follow your curiosity." />
      <Field
        label="Find a topic, source or study tool"
        value={search}
        onChangeText={setSearch}
        placeholder="Try fractions or exam date"
        autoFocus
      />
      {topics.isError && (
        <Notice kind="error" title="Topics could not load">
          Return to Today and pull to refresh your course.
        </Notice>
      )}
      <Text accessibilityLiveRegion="polite" style={{ color: colors.quiet }}>
        {matches.length} results
      </Text>
      {matches.slice(0, 100).map((e, i) => (
        <PressableRow key={`${e.href}:${i}`} {...e} />
      ))}
      {!matches.length && (
        <Notice title="No match yet">
          Try a shorter phrase, or browse the topic map in Learn.
        </Notice>
      )}
    </ScrollScreen>
  );
}
