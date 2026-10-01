import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CRITTERS,
  MAX_TIER,
  collectorRank,
  critterCollection,
  exploredTopics,
  newEvolutions,
  readSeen,
  remainingCopy,
  seenKey,
  threeStarTopics,
  tierFor,
  writeSeen,
} from '../../clients/shared/critters.js';

const byId = (states) => Object.fromEntries(states.map((state) => [state.id, state]));

test('a brand-new learner holds eight unhatched eggs', () => {
  const states = critterCollection({ progress: null, mistakes: [], topicCount: 29 });
  assert.equal(states.length, 8);
  assert.ok(states.every((state) => state.tier === 0 && state.rank.id === 'egg'));
  assert.ok(states.every((state) => state.next > 0));
  assert.deepEqual(collectorRank(states), { total: 0, max: 32, name: 'Egg hunter', next: { name: 'Bronze collector', at: 1 } });
});

test('every creature has four forms, distinct hues and strictly rising tiers', () => {
  const hues = new Set();
  for (const critter of CRITTERS) {
    assert.equal(critter.forms.length, MAX_TIER);
    hues.add(critter.hue);
    for (const topicCount of [0, 10, 29, 44]) {
      const tiers = critter.tiers({ topicCount });
      assert.equal(tiers.length, MAX_TIER, critter.id);
      tiers.forEach((at, index) => { if (index) assert.ok(at > tiers[index - 1], `${critter.id} ${tiers}`); });
      assert.ok(tiers[0] >= 1);
    }
  }
  assert.equal(hues.size, CRITTERS.length);
});

test('tiers come only from marked evidence and the mistake notebook', () => {
  const progress = {
    streak: 8,
    practiceAnswered: 160,
    testsTaken: 3,
    overallPercent: 58,
    completedLessonIds: ['fractions', 'ratio'],
    topicStats: {
      fractions: { correct: 10, total: 10 }, // 3 stars
      ratio: { correct: 9, total: 10 }, // 3 stars
      angles: { correct: 4, total: 4 }, // 100% but under 5 answers: 2 stars
      surds: { correct: 0, total: 0 },
    },
  };
  const mistakes = [
    { mastered: true, resurrectedCount: 2 },
    { mastered: true },
    { mastered: false, resurrectedCount: 5 }, // not mastered: memory checks do not count
  ];
  const states = byId(critterCollection({ progress, mistakes, topicCount: 10 }));
  assert.equal(states.ember.tier, 2); // 8 days: past 3 and 7
  assert.equal(states.quill.tier, 2); // 160 answers: past 25 and 150
  assert.equal(states.tock.tier, 2); // 3 papers: past 1 and 3
  assert.equal(states.rexam.tier, 2); // 58%: past 40 and 55
  assert.equal(states.tortile.value, 3); // fractions, ratio, angles
  assert.equal(states.tortile.tier, 2); // English-sized course: 1, 3, 5, 10
  assert.equal(states.prismo.value, 2);
  assert.equal(states.prismo.tier, 2); // 1, 2, 3, 5
  assert.equal(states.redo.value, 2);
  assert.equal(states.redo.tier, 1);
  assert.equal(states.memmoth.value, 2);
  assert.equal(states.memmoth.tier, 1);
  assert.equal(states.ember.form, 'Emberfox');
  assert.equal(states.quill.rank.name, 'Silver');
});

test('paper average only counts once a timed paper exists', () => {
  const states = byId(critterCollection({ progress: { testsTaken: 0, overallPercent: 90 } }));
  assert.equal(states.rexam.tier, 0);
});

test('a fully evolved creature reports no next target', () => {
  const states = byId(critterCollection({ progress: { streak: 150 } }));
  assert.equal(states.ember.tier, 4);
  assert.equal(states.ember.next, null);
  assert.equal(states.ember.toNext, 1);
  assert.equal(states.ember.form, 'Solarfox');
});

test('progress towards the next form is measured from the last threshold', () => {
  const states = byId(critterCollection({ progress: { practiceAnswered: 87 } }));
  assert.equal(states.quill.tier, 1);
  assert.equal(states.quill.next, 150);
  assert.ok(Math.abs(states.quill.toNext - (87 - 25) / (150 - 25)) < 1e-9);
});

test('helpers count explored and 3-star topics honestly', () => {
  assert.equal(exploredTopics({ completedLessonIds: ['a'], topicStats: { a: { total: 3, correct: 1 }, b: { total: 1, correct: 0 }, c: { total: 0, correct: 0 } } }), 2);
  assert.equal(threeStarTopics({ topicStats: { a: { total: 5, correct: 5 }, b: { total: 4, correct: 4 }, c: { total: 20, correct: 17 } } }), 1);
  assert.equal(tierFor(0, [1, 2, 3, 4]), 0);
  assert.equal(tierFor(3, [1, 2, 3, 4]), 3);
});

test('new evolutions are diffed against the last tiers shown on this device', () => {
  const states = critterCollection({ progress: { streak: 8, practiceAnswered: 30 } });
  assert.deepEqual(newEvolutions(null, states), []);
  assert.deepEqual(newEvolutions({ ember: 1, quill: 1 }, states), [{ id: 'ember', from: 1, to: 2 }]);
  // A tier that dipped (e.g. paper average) never replays as an evolution.
  assert.deepEqual(newEvolutions({ ember: 3, quill: 1 }, states), []);
});

test('the seen cache is scoped per subject and user and tolerates bad storage', (t) => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
  };
  t.after(() => { delete globalThis.localStorage; });
  const states = critterCollection({ progress: { streak: 3 } });
  assert.equal(readSeen('maths', 'u1'), null);
  writeSeen('maths', 'u1', states);
  assert.equal(readSeen('maths', 'u1').ember, 1);
  assert.equal(readSeen('english', 'u1'), null);
  assert.equal(seenKey('maths-higher', 'u2'), 'gcse-critters:maths-higher:u2');
  values.set(seenKey('maths', 'u1'), '{broken');
  assert.equal(readSeen('maths', 'u1'), null);
});

test('collector rank climbs with total evolutions', () => {
  const states = critterCollection({ progress: { streak: 100, practiceAnswered: 1500, testsTaken: 25, overallPercent: 90 } });
  const rank = collectorRank(states);
  assert.equal(rank.total, 16);
  assert.equal(rank.name, 'Gold collector');
  assert.deepEqual(rank.next, { name: 'Legend collector', at: 26 });
});

test('remaining copy names the next action and form', () => {
  const states = Object.fromEntries(critterCollection({ progress: { practiceAnswered: 138, testsTaken: 1, overallPercent: 69 }, mistakes: [] }).map((s) => [s.id, s]));
  assert.equal(remainingCopy(states.quill), 'Answer 12 more marked questions to evolve into Quillby.');
  assert.equal(remainingCopy(states.rexam), 'Lift your paper average by 1 point to evolve into Rexcel.');
  assert.equal(remainingCopy(states.memmoth), 'Pass 1 more memory check to hatch this egg.');
  const legend = critterCollection({ progress: { streak: 120 } })[0];
  assert.equal(remainingCopy(legend), null);
});
