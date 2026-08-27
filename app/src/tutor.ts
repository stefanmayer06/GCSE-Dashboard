import { ApiClient, type Json } from './api';

export type TutorRole = 'user' | 'assistant';
export type TutorStatus = 'sent' | 'sending' | 'failed';

export interface TutorMessage {
  id: string;
  role: TutorRole;
  content: string;
  model?: string;
  status?: TutorStatus;
}

export interface TutorNotebook {
  messages: TutorMessage[];
  draft: string;
}

type ApiMessage = { role: TutorRole; content: string };

const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export function tutorNotebookKey(userId: string, subject: string): string {
  return `tutor-notebook:${encodeURIComponent(userId)}:${encodeURIComponent(subject)}:v1`;
}

export function legacyTutorNotebookKey(subject: string): string {
  return `tutor-notebook:${subject}:v1`;
}

export function parseTutorNotebook(value: string | null): TutorNotebook {
  if (!value) return { messages: [], draft: '' };
  try {
    const parsed = JSON.parse(value) as { messages?: unknown; draft?: unknown };
    const messages = Array.isArray(parsed.messages) ? parsed.messages.flatMap((item): TutorMessage[] => {
      if (!item || typeof item !== 'object') return [];
      const message = item as Partial<TutorMessage>;
      if ((message.role !== 'user' && message.role !== 'assistant') || typeof message.content !== 'string' || typeof message.id !== 'string') return [];
      return [{ ...message, id: message.id, role: message.role, content: message.content, status: message.status === 'sending' ? 'failed' : message.status }];
    }) : [];
    return { messages, draft: typeof parsed.draft === 'string' ? parsed.draft : '' };
  } catch {
    return { messages: [], draft: '' };
  }
}

export function parseTutorResponse(value: unknown): { content: string; model?: string; error: boolean } {
  const body = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const nested = body.message && typeof body.message === 'object' ? body.message as Record<string, unknown> : {};
  const content = text(body.reply) || text(body.text) || text(body.content) || text(nested.content) || text(nested.text);
  const model = text(body.model) || text(nested.model) || undefined;
  return { content, model, error: body.error === true || !content };
}

export function parseTutorHistory(value: unknown): ApiMessage[] {
  const body = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const messages = Array.isArray(body.messages) ? body.messages : [];
  return messages.flatMap((item): ApiMessage[] => {
    if (!item || typeof item !== 'object') return [];
    const message = item as Record<string, unknown>;
    const role = message.role === 'user' ? 'user' : message.role === 'assistant' ? 'assistant' : null;
    const content = text(message.content) || text(message.text);
    return role && content ? [{ role, content }] : [];
  });
}

export function boundTutorHistory(messages: TutorMessage[], limit = 12, maxCharacters = 12000): ApiMessage[] {
  const eligible = messages
    .filter(message => message.status !== 'failed' && message.status !== 'sending')
    .map(({ role, content }) => ({ role, content: content.trim() }))
    .filter(message => message.content);
  const selected: ApiMessage[] = [];
  let characters = 0;
  for (let index = eligible.length - 1; index >= 0 && selected.length < Math.max(1, limit); index -= 1) {
    const message = eligible[index];
    const remaining = Math.max(0, maxCharacters - characters);
    if (!remaining) break;
    const content = message.content.slice(-remaining);
    selected.unshift({ ...message, content });
    characters += content.length;
  }
  return selected;
}

export function sendTutorChat(client: ApiClient, messages: ApiMessage[], signal: AbortSignal): Promise<Json> {
  // ApiClient already owns auth, refresh, URL validation and errors; its public chat shorthand does not expose request options.
  const request = client as unknown as { request<T>(path: string, method: 'POST', body: unknown, options: { signal: AbortSignal }): Promise<T> };
  return request.request<Json>('/chat', 'POST', { messages }, { signal });
}
