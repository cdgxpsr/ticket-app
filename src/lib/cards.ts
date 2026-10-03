import { File, Paths } from 'expo-file-system';
import type { Recognized } from '../services/recognizeTicket';
import { background, cloudEnabled, signedUrl, uploadImage } from './cloud';
import { supabase } from './supabase';

export type SavedCard = Recognized & { id: string; createdAt: number; imageUri: string; originalUri?: string; remoteId?: string };

// Local cache (sync reads for screens) + write-through to Supabase `cards` / storage `tickets`.
const store = () => new File(Paths.document, 'cards.json');

export function listCards(): SavedCard[] {
  try {
    const f = store();
    if (!f.exists) return [];
    const data = JSON.parse(f.textSync());
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeAll(cards: SavedCard[]) {
  const f = store();
  if (!f.exists) f.create();
  f.write(JSON.stringify(cards));
}

export function getCard(id: string): SavedCard | undefined {
  return listCards().find((c) => c.id === id || c.remoteId === id);
}

export function addCard(card: Omit<SavedCard, 'id' | 'createdAt'>): SavedCard {
  const saved: SavedCard = { ...card, id: `${Date.now()}`, createdAt: Date.now() };
  writeAll([saved, ...listCards()]);
  background(() => pushCard(saved));
  return saved;
}

async function pushCard(c: SavedCard) {
  const image_path = c.imageUri.startsWith('file:') ? await uploadImage(c.imageUri, `${c.id}-card`) : null;
  const original_path = c.originalUri?.startsWith('file:') ? await uploadImage(c.originalUri, `${c.id}-original`) : null;
  const { data, error } = await supabase.from('cards').insert({
    category: c.category, title: c.title, date: c.date, time: c.time, venue: c.venue, seat: c.seat,
    image_path, original_path, created_at: new Date(c.createdAt).toISOString(),
  }).select('id').single();
  if (error) throw error;
  writeAll(listCards().map((x) => (x.id === c.id ? { ...x, remoteId: data.id } : x)));
}

/** Pulls my cards from Supabase (e.g. after reinstall) and pushes any never-uploaded local ones. */
export async function syncCards(): Promise<SavedCard[]> {
  if (!cloudEnabled) return listCards();
  const local = listCards();
  for (const c of local.filter((x) => !x.remoteId)) await pushCard(c).catch(() => {});
  const { data, error } = await supabase.from('cards').select('*').order('created_at', { ascending: false });
  if (error || !data) return listCards();
  const known = new Set(listCards().map((c) => c.remoteId));
  const pulled: SavedCard[] = [];
  for (const r of data.filter((r) => !known.has(r.id))) {
    pulled.push({
      id: r.id, remoteId: r.id, createdAt: new Date(r.created_at).getTime(),
      category: r.category, title: r.title, date: r.date, time: r.time, venue: r.venue, seat: r.seat,
      imageUri: (r.image_path && (await signedUrl(r.image_path))) || '',
      originalUri: (r.original_path && (await signedUrl(r.original_path))) || undefined,
    });
  }
  const merged = [...listCards(), ...pulled].sort((a, b) => b.createdAt - a.createdAt);
  writeAll(merged);
  return merged;
}
