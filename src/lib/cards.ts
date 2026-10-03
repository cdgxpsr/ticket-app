import { File, Paths } from 'expo-file-system';
import type { Recognized } from '../services/recognizeTicket';

export type SavedCard = Recognized & { id: string; createdAt: number; imageUri: string; originalUri?: string };

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

export function getCard(id: string): SavedCard | undefined {
  return listCards().find((c) => c.id === id);
}

export function addCard(card: Omit<SavedCard, 'id' | 'createdAt'>): SavedCard {
  const saved: SavedCard = { ...card, id: `${Date.now()}`, createdAt: Date.now() };
  const f = store();
  if (!f.exists) f.create();
  f.write(JSON.stringify([saved, ...listCards()]));
  return saved;
}
