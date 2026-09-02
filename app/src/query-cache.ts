import type { QueryClient } from '@tanstack/react-query';
import { ApiClient } from './api';
import type { Subject } from './theme';

export const queryKeys = {
  subject: (subject: Subject) => ['subject', subject] as const,
  progress: (subject: Subject) => ['subject', subject, 'progress'] as const,
  topics: (subject: Subject) => ['subject', subject, 'topics'] as const,
  topic: (subject: Subject, id: string) => ['subject', subject, 'topic', id] as const,
  papers: (subject: Subject) => ['subject', subject, 'papers'] as const,
  texts: (subject: Subject) => ['subject', subject, 'texts'] as const,
  text: (subject: Subject, id: string) => ['subject', subject, 'text', id] as const,
  personal: (subject: Subject, userId: string | undefined) => ['subject', subject, 'personal', userId ?? 'anonymous'] as const,
  tutorHistory: (subject: Subject) => ['subject', subject, 'tutor-history'] as const,
};

export async function warmSubjectCache(queryClient: QueryClient, subject: Subject, topicIds: string[] = []) {
  const api = new ApiClient(subject);
  const tasks = [
    queryClient.prefetchQuery({ queryKey: queryKeys.tutorHistory(subject), queryFn: () => api.chatHistory(), staleTime: 5 * 60_000 }),
    ...topicIds.slice(0, 3).map(id => queryClient.prefetchQuery({ queryKey: queryKeys.topic(subject, id), queryFn: () => api.topic(id), staleTime: 10 * 60_000 })),
  ];
  if (subject === 'english') tasks.push(queryClient.prefetchQuery({ queryKey: queryKeys.texts(subject), queryFn: () => api.texts(), staleTime: 30 * 60_000 }));
  await Promise.allSettled(tasks);
}
