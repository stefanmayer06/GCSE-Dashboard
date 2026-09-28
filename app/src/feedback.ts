import { normalizeBaseUrl, errorFromResponse } from './api';

export type FeedbackRole = 'student' | 'parent' | 'teacher' | 'other';
export type FeedbackSubject = 'maths' | 'maths-higher' | 'english' | 'multiple';
export type FeedbackPayload = {
  role: FeedbackRole;
  subject: FeedbackSubject;
  rating: number;
  message: string;
  email?: string;
  heard?: string;
  source?: string;
};

export async function submitFeedback(payload: FeedbackPayload, request: typeof fetch = fetch): Promise<void> {
  const base = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL);
  const body = {
    role: payload.role,
    subject: payload.subject,
    rating: payload.rating,
    message: payload.message.trim().slice(0, 2000),
    ...(payload.email?.trim() ? { email: payload.email.trim().slice(0, 200) } : {}),
    ...(payload.heard?.trim() ? { heard: payload.heard.trim().slice(0, 120) } : {}),
    source: payload.source ?? 'mobile-app',
    website: '',
  };
  const response = await request(`${base}/api/feedback`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await errorFromResponse(response);
}

export function validateFeedback(payload: Partial<FeedbackPayload>): string | null {
  if (!payload.role) return 'Tell us whether you are a student, parent, teacher or other.';
  if (!payload.subject) return 'Choose the subject you looked at.';
  if (!payload.rating || payload.rating < 1 || payload.rating > 5) return 'Pick a rating from 1 to 5.';
  if (!payload.message?.trim()) return 'Tell us what we should improve first.';
  if (payload.message.trim().length < 4) return 'Give a little more detail so we can act on it.';
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) return 'That email does not look complete.';
  return null;
}
