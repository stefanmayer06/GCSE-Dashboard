/**
 * Human-readable renderers for server-marked review data.
 *
 * Server payloads carry rubric objects, list-match rows and true/false rows
 * shaped for storage, not for learners. These pure helpers turn them into
 * plain lines a Year 10/11 learner can act on. No React dependency so the
 * website clients and tests can share the same wording.
 */

export type UnknownRecord = Record<string, unknown>;

const record = (value: unknown): UnknownRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value == null ? [] : [value];

const scalar = (value: unknown): string | undefined =>
  typeof value === "string" || typeof value === "number" ? String(value) : undefined;

/**
 * Render any submitted answer or worked-solution step as one readable line.
 * Never returns raw JSON for common shapes; falls back to a compact
 * single-line summary only for shapes with no readable content.
 */
export function formatAnswerValue(value: unknown): string {
  if (value == null) return "(blank)";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? (trimmed.length > 500 ? `${trimmed.slice(0, 500)}…` : trimmed) : "(blank)";
  }
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "(blank)";
    const parts = value.map((item) => formatAnswerValue(item));
    return parts.every((part) => !/^\d+\. /.test(part) && part.length < 80)
      ? parts.join("; ")
      : parts.map((part, index) => `${index + 1}. ${part}`).join("\n");
  }
  const row = record(value);
  // Essay-style answers arrive wrapped as { text: "..." }.
  const text = scalar(row.text);
  if (text !== undefined && Object.keys(row).length <= 3) return formatAnswerValue(text);
  const entries = Object.entries(row).filter(([, item]) => item != null && item !== "");
  if (!entries.length) return "(blank)";
  return entries
    .map(([key, item]) => {
      const label = prettifyKey(key);
      const rendered =
        typeof item === "object" ? formatAnswerValue(item) : String(item);
      return label ? `${label}: ${rendered}` : rendered;
    })
    .join("; ");
}

/** Turn storage keys ("band1_description", "markDelta") into readable labels. */
export function prettifyKey(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  if (!words) return "";
  // Keep band/level numbering tight: "band 1 description" -> "Band 1 description".
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Render a marking rubric object as one "Label: value" line per entry. */
export function rubricLines(rubric: unknown): string[] {
  const row = record(rubric);
  return Object.entries(row)
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => {
      const rendered =
        typeof value === "object" ? formatAnswerValue(value) : String(value);
      return `${prettifyKey(key) || "Rubric"}: ${rendered}`;
    });
}

export type ListResultLine = { kind: "matched" | "missed"; text: string };

/**
 * Render an English "list four things" result.
 * Server shape: { matched: [{ point, line }], missed: [point], points }.
 */
export function listResultLines(value: unknown): ListResultLine[] {
  const row = record(value);
  const lines: ListResultLine[] = [];
  for (const item of asArray(row.matched)) {
    const entry = record(item);
    const point = scalar(entry.point);
    const line = scalar(entry.line);
    if (point || line) {
      lines.push({
        kind: "matched",
        text: line && point && line !== point ? `“${line}” matched “${point}”` : `Matched: ${point ?? line}`,
      });
    }
  }
  for (const item of asArray(row.missed)) {
    const point = typeof item === "object" ? scalar(record(item).point) : scalar(item);
    if (point) lines.push({ kind: "missed", text: `Missed: ${point}` });
  }
  return lines;
}

export type TrueFalseLine = { text: string; correct: boolean };

/**
 * Render an English true/false result.
 * Server shape: [{ text, answer, yours, right }].
 */
export function trueFalseLines(value: unknown): TrueFalseLine[] {
  return asArray(value)
    .map((item) => {
      const entry = record(item);
      const statement = scalar(entry.text) ?? scalar(entry.statement);
      if (!statement) return undefined;
      const yours = entry.yours === true || entry.yours === "true";
      const answer = entry.answer === true || entry.answer === "true";
      const correct = entry.right === true || entry.right === "true" || yours === answer;
      const word = (flag: boolean) => (flag ? "True" : "False");
      return {
        text: `${statement} — you said ${word(yours)}, correct answer ${word(answer)}`,
        correct,
      };
    })
    .filter((line): line is TrueFalseLine => line !== undefined);
}

/** "1, 2 and 5" style joining for unanswered-question summaries. */
export function joinNumbers(values: number[]): string {
  if (values.length === 0) return "";
  if (values.length === 1) return String(values[0]);
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}
