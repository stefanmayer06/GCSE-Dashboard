import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiClient } from './api';
import { notebookKey, parseMistakeRows, type MistakeRow } from './notebook';
import { parsePlanState, parsePlanningPreferences, planningKey, planStateKey, type PlanState, type PlanningPreferences } from './planning';
import type { Subject } from './theme';

export type PersonalState = {
  preferences: PlanningPreferences | null;
  plan: PlanState | null;
  mistakes: MistakeRow[];
};

const importFlag = (userId: string | undefined, subject: Subject) => `personal-imported:v1:${userId || 'anonymous'}:${subject}`;

function normalizePersonal(payload: unknown, subject: Subject): PersonalState {
  const root = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload as Record<string, unknown> : {};
  const preferences = parsePlanningPreferences(root.preferences == null ? null : JSON.stringify(root.preferences));
  const plan = root.plan == null ? null : parsePlanState(JSON.stringify(root.plan));
  const mistakes = parseMistakeRows(root.mistakes == null ? null : JSON.stringify(root.mistakes), subject);
  const hasPrefs = Boolean(root.preferences);
  return { preferences: hasPrefs ? preferences : null, plan, mistakes };
}

// One-time, idempotent upload of legacy device data. Only empty domains are
// uploaded; every upload is followed by a completion flag and key cleanup.
export async function importLegacyPersonal(client: ApiClient, userId: string | undefined, subject: Subject, remote: PersonalState): Promise<boolean> {
  const flag = importFlag(userId, subject);
  if (await AsyncStorage.getItem(flag)) return false;
  const [[, prefsRaw], [, planRaw], [, notebookRaw]] = await AsyncStorage.multiGet([planningKey(userId, subject), planStateKey(userId, subject), notebookKey(userId)]);
  const legacyPrefs = parsePlanningPreferences(prefsRaw);
  const legacyPlan = parsePlanState(planRaw);
  const legacyMistakes = parseMistakeRows(notebookRaw, subject);
  const hasPrefs = legacyPrefs.examDate || legacyPrefs.targetGrade || legacyPrefs.passMode !== 'balanced';
  const hasLegacy = Boolean(legacyPlan) || hasPrefs || legacyMistakes.length > 0;
  if (!hasLegacy) {
    await AsyncStorage.setItem(flag, 'v1');
    return false;
  }
  if (!remote.preferences && hasPrefs) await client.savePreferences(legacyPrefs);
  if (!remote.plan && legacyPlan) await client.savePlan(legacyPlan);
  if (!remote.mistakes.length && legacyMistakes.length) await client.saveMistakes(legacyMistakes);
  await AsyncStorage.setItem(flag, 'v1');
  await AsyncStorage.multiRemove([planningKey(userId, subject), planStateKey(userId, subject)]);
  let leftovers: Record<string, unknown>[] = [];
  try {
    const all = JSON.parse(notebookRaw ?? '[]');
    if (Array.isArray(all)) leftovers = all.filter((row: Record<string, unknown>) => row?.subject !== subject);
  } catch {
    leftovers = [];
  }
  if (leftovers.length) await AsyncStorage.setItem(notebookKey(userId), JSON.stringify(leftovers));
  else await AsyncStorage.removeItem(notebookKey(userId));
  return true;
}

export async function hydratePersonal(client: ApiClient, userId: string | undefined, subject: Subject): Promise<PersonalState> {
  const remote = normalizePersonal(await client.personal(), subject);
  const imported = await importLegacyPersonal(client, userId, subject, remote);
  return imported ? normalizePersonal(await client.personal(), subject) : remote;
}