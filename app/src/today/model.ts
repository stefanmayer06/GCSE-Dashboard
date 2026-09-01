import type { Progress } from '../api';
import type { Subject } from '../theme';

export type TodayTopic = {
  id: string;
  name: string;
  accuracy: number | null;
  answered: number;
  completed: boolean;
  area: string;
};

export type TodayPaper = {
  id: number;
  code: string;
  name: string;
  minutes: number | null;
  calculator?: boolean;
};

export type TodayProgress = {
  xp: number;
  level: number;
  xpInto: number;
  xpNeeded: number;
  streak: number;
  accuracy: number | null;
  lessons: number;
  tests: number;
  practiceAnswered: number;
  history: Record<string, unknown>[];
};

const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
const finite = (value: unknown, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const text = (value: unknown, fallback: string) => typeof value === 'string' && value.trim() ? value : fallback;

export function parseTopics(payload: unknown): TodayTopic[] {
  const root = record(payload);
  const groups = record(root?.strands) ?? record(root?.sections);
  if (!groups) return [];
  return Object.values(groups).flatMap((rawGroup) => {
    const group = record(rawGroup);
    const area = text(group?.name, 'Course topic');
    return (Array.isArray(group?.topics) ? group.topics : []).flatMap((rawTopic) => {
      const topic = record(rawTopic);
      if (!topic || typeof topic.id !== 'string') return [];
      const rawAccuracy = topic.accuracy;
      return [{
        id: topic.id,
        name: text(topic.name ?? topic.title, topic.id),
        accuracy: typeof rawAccuracy === 'number' && Number.isFinite(rawAccuracy) ? rawAccuracy : null,
        answered: finite(topic.answered),
        completed: topic.completed === true,
        area,
      }];
    });
  });
}

export function parsePapers(payload: unknown): TodayPaper[] {
  const root = record(payload);
  return (Array.isArray(root?.papers) ? root.papers : []).flatMap((rawPaper, index) => {
    const paper = record(rawPaper);
    if (!paper) return [];
    const id = finite(paper.id, index + 1);
    const minutes = typeof paper.minutes === 'number' ? paper.minutes : finite(record(paper.minutes)?.short, NaN);
    return [{
      id,
      code: text(paper.code, `Paper ${id}`),
      name: text(paper.title ?? paper.name, `Paper ${id}`),
      minutes: Number.isFinite(minutes) ? minutes : null,
      ...(typeof paper.calculator === 'boolean' ? { calculator: paper.calculator } : {}),
    }];
  });
}

export function parseProgress(value: Progress): TodayProgress {
  return {
    xp: finite(value.xp),
    level: Math.max(1, finite(value.level, 1)),
    xpInto: finite(value.xpInto),
    xpNeeded: finite(value.xpNeeded),
    streak: finite(value.streak),
    accuracy: typeof value.overallPercent === 'number' ? value.overallPercent : null,
    lessons: finite(value.lessonsCompleted),
    tests: finite(value.testsTaken),
    practiceAnswered: finite(value.practiceAnswered),
    history: Array.isArray(value.history)
      ? value.history.reduce<Record<string, unknown>[]>((items, item) => {
        const entry = record(item);
        if (entry) items.push(entry);
        return items;
      }, [])
      : [],
  };
}

export function rankedTopics(topics: TodayTopic[], foundationPass = false): TodayTopic[] {
  return [...topics].sort((a, b) => {
    const passCore = (topic: TodayTopic) => /number|ratio|proportion|algebra|geometry/i.test(`${topic.area} ${topic.name}`) ? 0 : 1;
    const coreOrder = foundationPass ? passCore(a) - passCore(b) : 0;
    const neverA = a.answered === 0 ? 0 : 1;
    const neverB = b.answered === 0 ? 0 : 1;
    return coreOrder || neverA - neverB
      || Number(a.completed) - Number(b.completed)
      || (a.accuracy ?? 101) - (b.accuracy ?? 101)
      || a.answered - b.answered
      || a.id.localeCompare(b.id);
  });
}

export function recommendSession(subject: Subject, topics: TodayTopic[]) {
  const topic = rankedTopics(topics)[0] ?? null;
  if (!topic) return null;
  const unseen = topic.answered === 0;
  const unfinished = !topic.completed;
  return {
    topic,
    minutes: subject === 'english' ? 15 : 12,
    reason: unseen
      ? `You have not practised ${topic.name} yet.`
      : `${topic.name} is currently your lowest recorded accuracy at ${topic.accuracy ?? 0}%.`,
    outcome: unfinished
      ? `Complete the lesson, then answer a short set on ${topic.name}.`
      : `Revisit the method and improve your recorded accuracy on ${topic.name}.`,
  };
}

export function nextPaper(papers: TodayPaper[], history: Record<string, unknown>[]) {
  if (!papers.length) return null;
  const recent = history[0];
  const recentId = finite(recent?.paperId ?? recent?.paper, NaN);
  const recentIndex = papers.findIndex((paper) => paper.id === recentId);
  return {
    paper: recentIndex >= 0 ? papers[(recentIndex + 1) % papers.length] : papers[0],
    hasRecordedHistory: recentIndex >= 0,
  };
}

export const isNewProgress = (progress: TodayProgress) =>
  progress.xp === 0 && progress.tests === 0 && progress.practiceAnswered === 0 && progress.lessons === 0;
