import {
  formatAnswerValue,
  joinNumbers,
  listResultLines,
  prettifyKey,
  rubricLines,
  trueFalseLines,
} from "./review-format";

test("formats scalar and blank answers", () => {
  expect(formatAnswerValue("  x = 4  ")).toBe("x = 4");
  expect(formatAnswerValue(42)).toBe("42");
  expect(formatAnswerValue(true)).toBe("True");
  expect(formatAnswerValue("")).toBe("(blank)");
  expect(formatAnswerValue(null)).toBe("(blank)");
  expect(formatAnswerValue(undefined)).toBe("(blank)");
});

test("formats wrapped and composite answers without JSON", () => {
  expect(formatAnswerValue({ text: "  My paragraph.  " })).toBe("My paragraph.");
  expect(formatAnswerValue(["red", "blue"])).toBe("red; blue");
  const rendered = formatAnswerValue({ 0: true, 2: false });
  expect(rendered).toContain("0: true");
  expect(rendered).not.toContain("{");
});

test("prettifies rubric keys and renders rubric lines", () => {
  expect(prettifyKey("band1_description")).toBe("Band1 description");
  expect(prettifyKey("markDelta")).toBe("Mark Delta");
  const lines = rubricLines({ level2: "Clear comparison", marks: 3 });
  expect(lines).toEqual(["Level2: Clear comparison", "Marks: 3"]);
  expect(rubricLines(null)).toEqual([]);
});

test("renders list-four-things results as matched/missed lines", () => {
  const lines = listResultLines({
    matched: [{ point: "it was old", line: "the house was old" }],
    missed: ["it was quiet"],
    points: ["it was old", "it was quiet"],
  });
  expect(lines).toHaveLength(2);
  expect(lines[0]).toMatchObject({ kind: "matched" });
  expect(lines[0].text).toContain("the house was old");
  expect(lines[1]).toMatchObject({ kind: "missed", text: "Missed: it was quiet" });
  expect(listResultLines(undefined)).toEqual([]);
});

test("renders true/false rows with the learner answer and the key", () => {
  const lines = trueFalseLines([
    { text: "The narrator is angry", answer: true, yours: false, right: false },
    { text: "It is set at night", answer: false, yours: false, right: true },
  ]);
  expect(lines).toHaveLength(2);
  expect(lines[0].text).toContain("you said False, correct answer True");
  expect(lines[0].correct).toBe(false);
  expect(lines[1].correct).toBe(true);
});

test("joins question numbers for review summaries", () => {
  expect(joinNumbers([])).toBe("");
  expect(joinNumbers([2])).toBe("2");
  expect(joinNumbers([2, 5])).toBe("2 and 5");
  expect(joinNumbers([1, 2, 5])).toBe("1, 2 and 5");
});
