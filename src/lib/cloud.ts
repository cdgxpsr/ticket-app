import { File } from 'expo-file-system';
import { supabase, uid, USE_LOCAL } from './supabase';

export const cloudEnabled = !USE_LOCAL;

/** Fire-and-forget background sync; failures stay local (the on-device cache is the source of truth offline). */
export function background(task: () => Promise<unknown>) {
  if (!cloudEnabled) return;
  task().catch((e) => console.warn('[cloud]', e?.message ?? e));
}

/** Uploads a local image to the private `tickets` bucket under <uid>/<name>; returns the storage path. */
export async function uploadImage(localUri: string, name: string): Promise<string> {
  const me = await uid();
  const f = new File(localUri);
  const ext = (f.extension || '.jpg').toLowerCase();
  const type = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.heic' ? 'image/heic' : 'image/jpeg';
  const path = `${me}/${name}${ext}`;
  const { error } = await supabase.storage.from('tickets').upload(path, await f.bytes(), { contentType: type, upsert: true });
  if (error) throw error;
  return path;
}

export async function signedUrl(path: string): Promise<string | undefined> {
  const { data } = await supabase.storage.from('tickets').createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl;
}
