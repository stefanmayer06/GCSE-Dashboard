import { buildPlan, completeMission, dateKey, daysToExam, missionForToday, missionResultFromServer, nextMission, parsePlanState, parsePlanningPreferences, planStateKey, planningKey, readinessEvidence, stablePlan, startMission } from './planning';

test('parses only supported local planning preferences',()=>{expect(parsePlanningPreferences(JSON.stringify({examDate:'2027-06-01',targetGrade:'5',passMode:'foundation-pass'}))).toEqual({examDate:'2027-06-01',targetGrade:'5',passMode:'foundation-pass'});expect(parsePlanningPreferences('{bad').passMode).toBe('balanced')});
test('counts calendar days to an exam without going negative',()=>{expect(daysToExam('2026-09-04',new Date(2026,8,1))).toBe(3);expect(daysToExam('2020-01-01',new Date(2026,8,1))).toBe(0)});
test('scopes plans and waits for enough readiness evidence',()=>{expect(planningKey('u1','english')).toBe('planning:u1:english');expect(planStateKey('u1','maths')).toBe('planning:u1:maths:plan');expect(readinessEvidence({tests:1,practiceAnswered:50,accuracy:70}).ready).toBe(false);expect(readinessEvidence({tests:2,practiceAnswered:20,accuracy:70})).toMatchObject({ready:true,score:70})});

const focus = [{ id: 'fractions', name: 'Fractions' }, { id: 'ratio', name: 'Ratio' }];

test('anchors the plan to its first day and keeps it stable through the same day',()=>{
  const morning = new Date(2026, 8, 1, 9, 30);
  const first = stablePlan(null, 'maths', 'balanced', focus, morning);
  expect(first.changed).toBe(true);
  expect(first.plan.from).toBe('2026-09-01');
  const evening = stablePlan(first.plan, 'maths', 'balanced', focus, new Date(2026, 8, 1, 22, 30));
  expect(evening.changed).toBe(false);
  expect(evening.plan).toBe(first.plan);
  const nextDay = stablePlan(first.plan, 'maths', 'balanced', focus, new Date(2026, 8, 2, 8, 0));
  expect(nextDay.changed).toBe(true);
  expect(nextDay.plan.from).toBe('2026-09-02');
});

test('builds seven days with focused missions, mistake retry and weekly review',()=>{
  const plan = buildPlan('maths', 'foundation-pass', focus, new Date(2026, 8, 1, 10, 0));
  expect(plan.days).toHaveLength(7);
  expect(plan.days[0]).toMatchObject({ label: 'Today', task: 'Fractions', topicId: 'fractions', minutes: 15 });
  expect(plan.days[3].task).toBe('Mistake retry');
  expect(plan.days[3].topicId).toBeUndefined();
  expect(plan.days[6].task).toBe('Weekly review');
  expect(plan.days[6].topicId).toBeUndefined();
});

test('completes the started mission once and stores score with feedback',()=>{
  const plan = buildPlan('maths', 'balanced', focus, new Date(2026, 8, 1, 10, 0));
  const result = missionResultFromServer({ correctMarks: 4, totalMarks: 5, weakTopics: [{ name: 'fractions' }], reward: { scoreXp: 12 } }, '2026-09-01T10:00:00.000Z');
  expect(result).toMatchObject({ percent: 80, correctMarks: 4, totalMarks: 5, xpEarned: 12 });
  const started = startMission(plan, '2026-09-01', 'fractions');
  const updated = completeMission(started, 'fractions', result);
  expect(updated.days[0]).toMatchObject({ status: 'done', task: 'Fractions' });
  expect(updated.days[0].result).toMatchObject({ percent: 80, weakTopics: ['fractions'] });
  expect(updated.intent).toBeUndefined();
  const again = completeMission(started, 'fractions', result);
  expect(again.days.filter(day => day.status === 'done')).toHaveLength(1);
  expect(completeMission(plan, 'algebra', result)).toBe(plan);
});

test('a completed topic that was never started still fills today when it matches today\u2019s row',()=>{
  const plan = buildPlan('maths', 'balanced', focus, new Date(2026, 8, 1, 10, 0));
  const updated = completeMission(plan, 'fractions', missionResultFromServer({ correctMarks: 3, totalMarks: 4 }));
  expect(updated.days[0].status).toBe('done');
  const other = completeMission(plan, 'algebra', missionResultFromServer({ correctMarks: 3, totalMarks: 4 }));
  expect(other).toBe(plan);
});

test('the mission for today only prompts today: done today never returns tomorrow',()=>{
  const plan = buildPlan('maths', 'balanced', focus, new Date(2026, 8, 1, 10, 0));
  const now = new Date(2026, 8, 1, 15, 0);
  expect(missionForToday(plan, now).mission?.task).toBe('Fractions');
  expect(missionForToday(plan, now).done).toBeNull();
  const done = completeMission(startMission(plan, '2026-09-01', 'fractions'), 'fractions', missionResultFromServer({ correctMarks: 5, totalMarks: 5 }));
  const after = missionForToday(done, now);
  expect(after.mission).toBeNull();
  expect(after.done?.task).toBe('Fractions');
  expect(missionForToday(null, now).mission).toBeNull();
  expect(missionForToday(done, new Date(2026, 8, 2, 8, 0)).mission?.date).toBe('2026-09-02');
});

test('next mission is the first unfinished day and plan survives storage round-trips',()=>{
  const plan = buildPlan('english', 'balanced', focus, new Date(2026, 8, 1, 10, 0));
  const done = completeMission(startMission(plan, '2026-09-01', 'fractions'), 'fractions', missionResultFromServer({ correctMarks: 2, totalMarks: 2 }));
  expect(nextMission(done)?.topicId).toBe('ratio');
  expect(parsePlanState(JSON.stringify(startMission(done, '2026-09-02', 'ratio')))).toEqual(startMission(done, '2026-09-02', 'ratio'));
  expect(parsePlanState(JSON.stringify(done))).toEqual(done);
  expect(parsePlanState('{bad')).toBeNull();
  expect(parsePlanState(JSON.stringify({ from: dateKey(new Date(2026, 8, 1)), days: [] }))).toBeNull();
});
