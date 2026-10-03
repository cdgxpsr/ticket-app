import { File } from 'expo-file-system';

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

/** 잘라낸 티켓 이미지를 백엔드로 보내 항목을 읽어 온다. API 키는 앱에 두지 않는다(서버에서만 사용). */
export async function recognizeTicket(imageUri: string): Promise<Recognized> {
  const url = process.env.EXPO_PUBLIC_RECOGNIZE_URL;
  if (!url) {
    await new Promise((r) => setTimeout(r, 1200));
    return { category: '뮤지컬', title: '고양이 뮤지컬', date: '2026.11.14', time: '19:30', venue: '냥냥아트홀', seat: 'R석 7열 12번' };
  }
  const file = new File(imageUri);
  const image = await file.base64();
  const mediaType = /\.png$/i.test(imageUri) ? 'image/png' : 'image/jpeg';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image, mediaType }),
  });
  if (!res.ok) throw new Error(`recognize failed: ${res.status}`);
  return normalize(await res.json());
}
