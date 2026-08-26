import {
  hasQuestionAnswer,
  mergeEssayAnswer,
  normalizeSources,
} from "../app/practice/[id]";

test("normalizes single and paired English sources", () => {
  expect(
    normalizeSources({
      title: "A story",
      author: "A Writer",
      year: 1910,
      text: "Body",
    })[0],
  ).toMatchObject({
    label: "Source",
    title: "A story",
    year: "1910",
    body: "Body",
  });
  expect(
    normalizeSources({
      sourceA: { title: "Old", text: "A" },
      sourceB: { title: "New", text: "B" },
    }),
  ).toEqual([
    expect.objectContaining({ label: "Source A", title: "Old", body: "A" }),
    expect.objectContaining({ label: "Source B", title: "New", body: "B" }),
  ]);
});

test("merges essay choice and writing while requiring actual writing", () => {
  const selected = mergeEssayAnswer(
    { text: "Draft response" },
    { option: "b", optionText: "Describe a market" },
  );
  expect(selected).toEqual({
    text: "Draft response",
    option: "b",
    optionText: "Describe a market",
  });
  expect(
    hasQuestionAnswer(
      { type: "essay", options: [{ id: "b" }] },
      { option: "b", optionText: "Describe a market" },
    ),
  ).toBe(false);
  expect(
    hasQuestionAnswer({ type: "essay", options: [{ id: "b" }] }, selected),
  ).toBe(true);
  expect(hasQuestionAnswer({ type: "mcq", options: ["A"] }, "A")).toBe(true);
});
