import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CultureEvent } from '../data/culture';

const KEY = 'explore.saved';

/** Saved 둘러보기 items, newest first. Snapshots, so they still open after the source row expires. */
export async function listSaved(): Promise<CultureEvent[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]') as CultureEvent[];
  } catch {
    return [];
  }
}

export async function isSaved(id: string) {
  return (await listSaved()).some((e) => e.id === id);
}

/** Toggles; returns the new saved state. */
export async function toggleSaved(e: CultureEvent): Promise<boolean> {
  const list = await listSaved();
  const has = list.some((x) => x.id === e.id);
  const next = has ? list.filter((x) => x.id !== e.id) : [e, ...list].slice(0, 300);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return !has;
}
