import {
  buildPlan,
  completeMission,
  dateKey,
  daysToExam,
  missionForToday,
  missionResultFromServer,
  parsePlanState,
  parsePlanningPreferences,
  planStateKey,
  planningKey,
  readinessEvidence,
  stablePlan,
} from "./planning";
const focus = [
  { id: "fractions", name: "Fractions" },
  { id: "ratio", name: "Ratio" },
];
const monday = new Date(2026, 7, 31, 12);
const tuesday = new Date(2026, 8, 1, 12);
const result = (date: Date) =>
  missionResultFromServer(
    { correctMarks: 3, totalMarks: 4 },
    date.toISOString(),
  );
test("parses supported preferences and scopes account domains", () => {
  expect(
    parsePlanningPreferences(
      JSON.stringify({
        examDate: "2027-06-01",
        targetGrade: "5",
        passMode: "foundation-pass",
      }),
    ),
  ).toEqual({
    examDate: "2027-06-01",
    targetGrade: "5",
    passMode: "foundation-pass",
  });
  expect(parsePlanningPreferences("{bad").passMode).toBe("balanced");
  expect(planningKey("u1", "english")).toBe("planning:u1:english");
  expect(planStateKey("u1", "maths")).toBe("planning:u1:maths:plan");
});
test("counts calendar days without negative countdowns", () => {
  expect(daysToExam("2026-09-04", tuesday)).toBe(3);
  expect(daysToExam("2020-01-01", tuesday)).toBe(0);
});
test("requires breadth and enough marked answers for readiness", () => {
  expect(readinessEvidence({}).ready).toBe(false);
  expect(
    readinessEvidence({ topicStats: { a: { correct: 20, total: 20 } } }).ready,
  ).toBe(false);
  expect(
    readinessEvidence({
      topicStats: {
        a: { correct: 4, total: 5 },
        b: { correct: 3, total: 5 },
        c: { correct: 7, total: 10 },
      },
    }),
  ).toEqual({ ready: true, score: 70, answered: 20, topics: 3 });
});
test("anchors Monday to Sunday and preserves a saved web or native plan throughout the week", () => {
  const first = stablePlan(null, "maths", "balanced", focus, tuesday);
  expect(first.plan.from).toBe("2026-08-31");
  expect(first.plan.days[1].label).toBe("Today");
  expect(
    stablePlan(first.plan, "maths", "balanced", focus, new Date(2026, 8, 2))
      .plan,
  ).toBe(first.plan);
  expect(
    stablePlan(first.plan, "maths", "balanced", focus, new Date(2026, 8, 7))
      .changed,
  ).toBe(true);
});
test("retains scheduled review slots and subject duration", () => {
  const plan = buildPlan("maths", "foundation-pass", focus, tuesday);
  expect(plan.days).toHaveLength(7);
  expect(plan.days[0]).toMatchObject({
    date: "2026-08-31",
    task: "Fractions",
    minutes: 15,
  });
  expect(plan.days[3].task).toBe("Mistake retry");
  expect(plan.days[6].task).toBe("Weekly review");
  expect(buildPlan("english", "balanced", focus, monday).days[0].minutes).toBe(
    20,
  );
});
test("completes only the submitted day and matching topic, never a future or past intent", () => {
  const plan = buildPlan("maths", "balanced", focus, monday);
  const done = completeMission(plan, "ratio", result(tuesday));
  expect(done.days[0].status).toBe("todo");
  expect(done.days[1].status).toBe("done");
  expect(completeMission(done, "ratio", result(tuesday))).toBe(done);
  expect(completeMission(plan, "fractions", result(tuesday))).toBe(plan);
});
test("today remains completed without promoting the next day", () => {
  const plan = buildPlan("maths", "balanced", focus, monday);
  const done = completeMission(plan, "fractions", result(monday));
  expect(missionForToday(done, monday).mission).toBeNull();
  expect(missionForToday(done, monday).done?.task).toBe("Fractions");
  expect(missionForToday(done, tuesday).mission?.task).toBe("Ratio");
  expect(missionForToday(null, monday).mission).toBeNull();
});
test("round trips confirmed completion and rejects malformed plans", () => {
  const done = completeMission(
    buildPlan("maths", "balanced", focus, monday),
    "fractions",
    result(monday),
  );
  expect(parsePlanState(JSON.stringify(done))).toEqual(done);
  expect(parsePlanState("{bad")).toBeNull();
  expect(
    parsePlanState(JSON.stringify({ from: dateKey(monday), days: [] })),
  ).toBeNull();
});
