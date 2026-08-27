export type UnknownRecord = Record<string, unknown>;

export type LearnTopic = {
  id: string;
  title: string;
  description: string;
  groupId: string;
  groupName: string;
  accuracy: number | null;
  answered: number;
  completed: boolean;
  recommended: boolean;
  examWeight: number | null;
  raw: UnknownRecord;
};

export type TopicGroup = { id: string; name: string; description: string; topics: LearnTopic[] };
export type NoteBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'method'; title: string; text: string }
  | { kind: 'example'; question: string; answer: string };

const record = (value: unknown): UnknownRecord | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;
const text = (value: unknown): string => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
const number = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;
const bool = (value: unknown): boolean => value === true;

function topicFrom(value: unknown, groupId: string, groupName: string): LearnTopic | null {
  const item = record(value);
  if (!item) return null;
  const id = text(item.id);
  const title = text(item.name) || text(item.title);
  if (!id || !title) return null;
  return {
    id, title,
    description: text(item.blurb) || text(item.description),
    groupId: text(item.strand) || text(item.section) || groupId,
    groupName,
    accuracy: number(item.accuracy),
    answered: number(item.answered) ?? 0,
    completed: bool(item.completed),
    recommended: bool(item.recommended),
    examWeight: number(item.examWeight),
    raw: item,
  };
}

export function parseTopicGroups(payload: unknown): TopicGroup[] {
  const root = record(payload);
  const grouped = record(root?.strands) || record(root?.sections) || record(root?.groups);
  if (grouped) {
    return Object.entries(grouped).map(([key, value]) => {
      const group = record(value) || {};
      const id = text(group.id) || key;
      const name = text(group.name) || text(group.title) || key;
      const topics = Array.isArray(group.topics) ? group.topics.map((item) => topicFrom(item, id, name)).filter((item): item is LearnTopic => !!item) : [];
      return { id, name, description: text(group.blurb) || text(group.description), topics };
    }).filter((group) => group.topics.length > 0);
  }
  const list = Array.isArray(payload) ? payload : Array.isArray(root?.topics) ? root.topics : [];
  const topics = list.map((item) => topicFrom(item, 'course', 'Course topics')).filter((item): item is LearnTopic => !!item);
  const byGroup = new Map<string, TopicGroup>();
  for (const topic of topics) {
    const current = byGroup.get(topic.groupId) || { id: topic.groupId, name: topic.groupName, description: '', topics: [] };
    current.topics.push(topic);
    byGroup.set(topic.groupId, current);
  }
  return [...byGroup.values()];
}

export function mergeTopicProgress(groups: TopicGroup[], progress: unknown): TopicGroup[] {
  const root = record(progress);
  const topicStats = record(root?.topics) || record(root?.topicStats) || {};
  const completed = new Set(Array.isArray(root?.completedLessonIds) ? root.completedLessonIds.map(text) : []);
  let recommendationAssigned = groups.some((group) => group.topics.some((topic) => topic.recommended));
  return groups.map((group) => ({ ...group, topics: group.topics.map((topic) => {
    const stats = record(topicStats[topic.id]);
    const correct = number(stats?.correct);
    const total = number(stats?.total);
    const accuracy = number(stats?.accuracy) ?? (correct !== null && total ? Math.round(100 * correct / total) : topic.accuracy);
    const answered = total ?? number(stats?.answered) ?? topic.answered;
    const completedValue = topic.completed || completed.has(topic.id) || bool(stats?.completed);
    const recommended = topic.recommended || (!recommendationAssigned && !completedValue && (answered === 0 || (accuracy !== null && accuracy < 70)));
    if (recommended) recommendationAssigned = true;
    return { ...topic, accuracy, answered, completed: completedValue, recommended };
  }) }));
}

export function filterTopicGroups(groups: TopicGroup[], query: string): TopicGroup[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return groups;
  return groups.map((group) => ({ ...group, topics: group.topics.filter((topic) => `${topic.title} ${topic.description} ${group.name}`.toLocaleLowerCase().includes(needle)) })).filter((group) => group.topics.length > 0);
}

export function parseNotes(value: unknown): NoteBlock[] {
  const input = Array.isArray(value) ? value : value == null ? [] : [value];
  return input.flatMap((entry): NoteBlock[] => {
    if (typeof entry === 'string' || typeof entry === 'number') return text(entry) ? [{ kind: 'paragraph', text: text(entry) }] : [];
    const item = record(entry);
    if (!item) return [];
    const type = text(item.t || item.type || item.kind).toLowerCase();
    if (type === 'b' || type === 'list' || Array.isArray(item.items)) {
      const items = (Array.isArray(item.items) ? item.items : []).map(safeText).filter(Boolean);
      return items.length ? [{ kind: 'list', items }] : [];
    }
    if (type === 'e' || type === 'example' || item.q !== undefined || item.question !== undefined) {
      const question = safeText(item.q ?? item.question ?? item.prompt);
      const answer = safeText(item.a ?? item.answer ?? item.solution);
      return question || answer ? [{ kind: 'example', question, answer }] : [];
    }
    if (type === 'f' || type === 'formula' || type === 'method' || item.title !== undefined) {
      const body = safeText(item.text ?? item.body ?? item.content);
      return body ? [{ kind: 'method', title: safeText(item.title) || 'Method', text: body }] : [];
    }
    const body = safeText(item.text ?? item.body ?? item.content);
    return body ? [{ kind: 'paragraph', text: body }] : [];
  });
}

export function safeText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (Array.isArray(value)) return value.map(safeText).filter(Boolean).join('\n');
  const item = record(value);
  if (!item) return '';
  return safeText(item.text ?? item.label ?? item.title ?? item.value ?? item.answer ?? item.solution);
}

export function asRecord(value: unknown): UnknownRecord { return record(value) || {}; }
export function asText(value: unknown): string { return text(value); }
