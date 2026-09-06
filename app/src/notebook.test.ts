import { advanceMistake, classifyMistake, dueMistakes, gradeMistake, masteredSince, memriDue, mergeMistakes, mistakesFromResult, parseMistakeRows, saveCorrection, touchMistakes } from './notebook';

test('captures only incorrect authoritative result rows with spaced review dates',()=>{const rows=mistakesFromResult({perQuestion:[{qid:'q1',correct:false,topicId:'ratio',text:'Find x'},{qid:'q2',correct:true}]},{q1:'4'},'s1','maths','2026-09-01T12:00:00.000Z');expect(rows).toHaveLength(1);expect(rows[0]).toMatchObject({topicId:'ratio',answer:'4',mastered:false});expect(rows[0].dueDates).toHaveLength(4);expect(dueMistakes(rows,new Date('2026-09-02T12:00:00.000Z'))).toHaveLength(1)});
test('merges notebook rows by stable identity and never resets review progress',()=>{const row=mistakesFromResult({perQ:[{id:'a',got:0,marks:1,answerText:'3/4',solution:['Simplify']}]},{},'s','english')[0];expect(mergeMistakes([row],[row])).toHaveLength(1);const advanced=advanceMistake([row],row.id)[0];const again=mergeMistakes([advanced],[row]);expect(again[0].reviewIndex).toBe(1);expect(again[0].mastered).toBe(false);expect(again[0].correctAnswer).toBe('3/4')});
test('classification, warm-ups and weekly mastery evidence stay sticky',()=>{const row=mistakesFromResult({perQ:[{id:'a',got:0,marks:1}]},{},'s','maths','2026-09-01T12:00:00.000Z')[0];const tagged=classifyMistake([row],row.id,'misread');expect(tagged[0].errorType).toBe('misread');expect(classifyMistake(tagged,row.id,'nonsense')[0].errorType).toBe('misread');const warm=[0,1,2,3].reduce(rows=>advanceMistake(rows,row.id,new Date('2026-09-21T12:00:00.000Z')),tagged);expect(warm[0].mastered).toBe(true);expect(masteredSince(warm,7*86_400_000,new Date('2026-09-24T12:00:00.000Z'))).toHaveLength(1);expect(masteredSince(warm,7*86_400_000,new Date('2026-10-01T12:00:00.000Z'))).toHaveLength(0)});
test('advances one review at a time until the mistake is mastered',()=>{const row=mistakesFromResult({perQ:[{id:'a',got:0,marks:1}]},{},'s','maths','2026-09-01T12:00:00.000Z')[0];const once=advanceMistake([row],row.id);expect(once[0].reviewIndex).toBe(1);expect(dueMistakes(once,new Date('2026-09-02T12:00:00.000Z'))).toHaveLength(0);const mastered=[0,1,2].reduce(rows=>advanceMistake(rows,row.id),once);expect(mastered[0].reviewIndex).toBe(4);expect(mastered[0].mastered).toBe(true);expect(dueMistakes(mastered,new Date('2030-01-01T00:00:00.000Z'))).toHaveLength(0)});
test('parses hydrated account rows defensively with per-subject scoping',()=>{const rows=parseMistakeRows(JSON.stringify([{id:'m1',qid:'q1',topicName:'Ratio',dueDates:['2026-09-02T00:00:00.000Z'],reviewIndex:0},{id:'bad'}]),'maths');expect(rows).toHaveLength(1);expect(rows[0].subject).toBe('maths');expect(parseMistakeRows('{bad','maths')).toEqual([])});
test('recall grades reschedule adaptively and memory checks refresh faded mastery', () => {
  const row = mistakesFromResult({ perQ: [{ id: 'a', got: 0, marks: 1 }] }, {}, 's', 'maths', '2026-09-01T12:00:00.000Z')[0];
  const again = gradeMistake([row], row.id, 'again', new Date('2026-09-05T12:00:00.000Z'))[0];
  expect(again.reviewIndex).toBe(0);
  expect(again.lastGrade).toBe('again');
  expect(Date.parse(again.dueDates[0]) - Date.parse('2026-09-05T12:00:00.000Z')).toBe(86_400_000);
  const easy = gradeMistake([row], row.id, 'easy', new Date('2026-09-05T12:00:00.000Z'))[0];
  expect(easy.reviewIndex).toBe(1);
  expect(Date.parse(easy.dueDates[1]) - Date.parse('2026-09-05T12:00:00.000Z')).toBeGreaterThan(4 * 86_400_000);
  const corrected = saveCorrection([row], row.id, '  Cross-multiply first.  ');
  expect(corrected[0].correction).toBe('Cross-multiply first.');
  const old = { ...row, mastered: true, reviewIndex: 4, lastReviewedAt: '2026-01-01T12:00:00.000Z' };
  expect(memriDue([old, row], new Date('2026-09-05T12:00:00.000Z'))).toHaveLength(1);
  const touched = touchMistakes([old], [old.id], new Date('2026-09-05T12:00:00.000Z'))[0];
  expect(touched.resurrectedCount).toBe(1);
  expect(touched.mastered).toBe(true);
  expect(memriDue([touched], new Date('2026-09-05T12:00:00.000Z'))).toHaveLength(0);
});
