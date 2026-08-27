/**
 * AQA GCSE English Language 8700 — predicted grade boundaries.
 * 8700 has NO tiers (unlike maths): grades run 9 to 1 across two papers,
 * 160 marks total. These are rounded averages of published AQA 8700
 * boundaries (2018–2024) converted to a single 80-mark paper for
 * convenience in this app.
 */
export const BOUNDARIES = [
  { grade: 9, boundary: 64 },
  { grade: 8, boundary: 58 },
  { grade: 7, boundary: 52 },
  { grade: 6, boundary: 45 },
  { grade: 5, boundary: 39 },
  { grade: 4, boundary: 33 },
  { grade: 3, boundary: 26 },
  { grade: 2, boundary: 18 },
  { grade: 1, boundary: 11 },
];

export function predictGrade(marks, total = 80) {
  if (total <= 0) return null;
  const scaled = (marks / total) * 80;
  for (const b of BOUNDARIES) {
    if (scaled >= b.boundary) return b.grade;
  }
  return null;
}

export function gradeLabel(grade) {
  return grade === null ? 'U' : `${grade}`;
}

export function nextBoundaryGap(marks, total = 80) {
  const scaled = (marks / total) * 80;
  const above = BOUNDARIES.find((b) => b.boundary > scaled);
  if (!above) return null;
  const gap = Math.ceil((above.boundary - scaled) / (80 / total));
  return { grade: above.grade, marksToGo: Math.max(1, gap) };
}