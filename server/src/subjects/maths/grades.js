/** Rounded per-paper predictions, based on recent AQA 8300 boundary ranges. */
export const BOUNDARIES = {
  foundation: [
    { grade: 5, boundary: 55 }, { grade: 4, boundary: 42 }, { grade: 3, boundary: 28 },
    { grade: 2, boundary: 18 }, { grade: 1, boundary: 10 },
  ],
  higher: [
    { grade: 9, boundary: 64 }, { grade: 8, boundary: 56 }, { grade: 7, boundary: 48 },
    { grade: 6, boundary: 40 }, { grade: 5, boundary: 32 }, { grade: 4, boundary: 24 },
    { grade: 3, boundary: 16 }, { grade: 2, boundary: 10 }, { grade: 1, boundary: 6 },
  ],
};

export function predictGrade(marks, total = 80, tier = 'foundation') {
  const scaled = (marks / total) * 80;
  for (const b of BOUNDARIES[tier] || BOUNDARIES.foundation) {
    if (scaled >= b.boundary) return b.grade;
  }
  return null; // below grade 1 (U)
}

export function gradeLabel(grade) {
  if (grade === null) return 'U';
  return `${grade}`;
}

export function nextBoundaryGap(marks, total = 80, tier = 'foundation') {
  const scaled = (marks / total) * 80;
  const above = (BOUNDARIES[tier] || BOUNDARIES.foundation).find((b) => b.boundary > scaled);
  if (!above) return null;
  const gap = Math.ceil((above.boundary - scaled) / (80 / total));
  return { grade: above.grade, marksToGo: Math.max(1, gap) };
}
