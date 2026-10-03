import { File } from 'expo-file-system';
import { ensureSession, supabase, USE_LOCAL } from '../lib/supabase';

export const CATEGORIES = ['영화', '뮤지컬', '연극', '콘서트', '전시', '박물관', '스포츠', '액티비티', '기타'] as const;
export type Category = (typeof CATEGORIES)[number];

export type Recognized = { category: Category; title: string; date: string; time: string; venue: string; seat: string };

export const EMPTY: Recognized = { category: '기타', title: '', date: '', time: '', venue: '', seat: '' };

function normalize(raw: unknown): Recognized {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const s = (k: string) => (typeof o[k] === 'string' ? (o[k] as string).trim() : '');
  const cat = s('category');
  return {
    category: (CATEGORIES as readonly string[]).includes(cat) ? (cat as Category) : '기타',
    title: s('title'), date: s('date'), time: s('time'), venue: s('venue'), seat: s('seat'),
  };
}

const MOCK: Recognized = { category: '뮤지컬', title: '고양이 뮤지컬', date: '2026.11.14', time: '19:30', venue: '냥냥아트홀', seat: 'R석 7열 12번' };

/** 잘라낸 티켓 이미지를 Supabase Edge Function `recognize`로 보내 항목을 읽어 온다. API 키는 서버 비밀값에만 있다. */
export async function recognizeTicket(imageUri: string): Promise<Recognized> {
  try {
    if (USE_LOCAL) throw new Error('local mode');
    await ensureSession();
    const image = await new File(imageUri).base64();
    const mediaType = /\.png$/i.test(imageUri) ? 'image/png' : 'image/jpeg';
    const { data, error } = await supabase.functions.invoke('recognize', { body: { image, mediaType } });
    if (error) throw error;
    return normalize(data);
  } catch (e) {
    console.warn('[recognize] falling back to mock:', (e as Error)?.message);
    await new Promise((r) => setTimeout(r, 800));
    return MOCK;
  }
}
