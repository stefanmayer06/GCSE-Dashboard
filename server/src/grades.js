/**
 * AQA GCSE Maths Foundation tier — predicted grade boundaries.
 * AQA Foundation papers are marked out of 80 (three papers, 240 total).
 * These are rounded averages of the published AQA 8300F boundaries from the
 * 2018–2024 exam series for a single 80-mark paper (grades 5 down to 1).
 * Foundation tier is capped at grade 5 (a "strong pass" is grade 4).
 */
export const BOUNDARIES = [
  { grade: 5, boundary: 55 },
  { grade: 4, boundary: 42 },
  { grade: 3, boundary: 28 },
  { grade: 2, boundary: 18 },
  { grade: 1, boundary: 10 },
];

export function predictGrade(marks, total = 80) {
  const scaled = (marks / total) * 80;
  for (const b of BOUNDARIES) {
    if (scaled >= b.boundary) return b.grade;
  }
  return null; // below grade 1 (U)
}

export function gradeLabel(grade) {
  if (grade === null) return 'U';
  return `${grade}`;
}

export function nextBoundaryGap(marks, total = 80) {
  const scaled = (marks / total) * 80;
  const above = BOUNDARIES.find((b) => b.boundary > scaled);
  if (!above) return null;
  const gap = Math.ceil((above.boundary - scaled) / (80 / total));
  return { grade: above.grade, marksToGo: Math.max(1, gap) };
}