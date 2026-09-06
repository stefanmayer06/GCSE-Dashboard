import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "@/api";
import {
  DeskHeader,
  ScrollScreen,
  Notice,
  PressableRow,
  Button,
} from "@/components";
import { useAuth, usePreferences } from "@/providers";
import { asRecord, asText } from "@/learn";
export default function History() {
  const { subject } = usePreferences();
  const { session } = useAuth();
  const query = useQuery({
    queryKey: ["attempts", subject, session?.user.id],
    queryFn: () => new ApiClient(subject).attempts(),
  });
  return (
    <ScrollScreen>
      <PressableRow title="Back to reflection" href="/reflect" />
      <DeskHeader title="Follow the feedback." />
      {query.isPending && (
        <Notice kind="loading" title="Opening marked papers">
          Finding the saved attempts in your account.
        </Notice>
      )}
      {query.isError && (
        <>
          <Notice kind="error" title="Marked papers could not load">
            Check your connection and try again.
          </Notice>
          <Button onPress={() => void query.refetch()}>Try again</Button>
        </>
      )}
      {query.data?.attempts.map((attempt) => {
        const result = asRecord(attempt.result);
        return (
          <PressableRow
            key={asText(attempt.sessionId)}
            href={`/results/${encodeURIComponent(asText(attempt.sessionId))}`}
            title={
              asText(attempt.paperName) ||
              asText(result.paperName) ||
              asText(asRecord(result.test).paperName) ||
              "Marked practice paper"
            }
            detail={`${asText(attempt.completedAt).slice(0, 10)} · ${asText(attempt.percent) || asText(result.percent) || "—"}% · Review answers and methods`}
          />
        );
      })}
      {query.data && !query.data.attempts.length && (
        <>
          <Notice title="Your first paper belongs here">
            Complete a practice paper to keep its marking and feedback in your
            account.
          </Notice>
          <PressableRow title="Choose a practice paper" href="/practice" />
        </>
      )}
    </ScrollScreen>
  );
}
