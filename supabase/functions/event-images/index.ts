// Supabase Edge Function (Deno): extra images for one culture event, fetched on first view and cached
// in culture_events.images. TourAPI detailImage2 (관광공사) / KOPIS styurls (공연 소개 이미지).
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const env = (k: string) => Deno.env.get(k) ?? '';
const https = (u: string) => u.replace(/^http:\/\//i, 'https://');

async function tourImages(contentId: string): Promise<string[]> {
  // Same handling as sync-culture: the decoding key has + / = and must be URL-encoded.
  const raw = env('TOUR_API_KEY');
  const key = raw.includes('%') ? raw : encodeURIComponent(raw);
  const url = `https://apis.data.go.kr/B551011/KorService2/detailImage2?serviceKey=${key}&MobileOS=ETC&MobileApp=nyangnyang&_type=json&numOfRows=20&pageNo=1&imageYN=Y&contentId=${contentId}`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const d = await r.json().catch(() => null);
  const it = d?.response?.body?.items?.item;
  const items: Record<string, string>[] = Array.isArray(it) ? it : it ? [it] : [];
  return items.map((i) => i.originimgurl).filter(Boolean).map(https);
}

async function kopisImages(id: string): Promise<string[]> {
  const r = await fetch(`https://www.kopis.or.kr/openApi/restful/pblprfr/${id}?service=${env('KOPIS_KEY')}`);
  if (!r.ok) return [];
  const xml = await r.text();
  return [...xml.matchAll(/<styurl>([^<]+)<\/styurl>/g)].map((m) => https(m[1].trim()));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const { id } = await req.json().catch(() => ({}));
  if (typeof id !== 'string' || !/^(tour|kopis):[A-Za-z0-9]+$/.test(id)) return json({ images: [] });
  const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
  const { data: row } = await db.from('culture_events').select('image_url, images').eq('id', id).maybeSingle();
  if (!row) return json({ images: [] });
  // Only a list with extras counts as cached; earlier failed lookups stored just the main image.
  if (row.images && row.images.length > 1) return json({ images: row.images });
  const [src, key] = id.split(':');
  let images: string[] = [];
  try {
    images = src === 'tour' ? await tourImages(key) : await kopisImages(key);
  } catch (e) {
    console.error('event-images', id, e);
    return json({ images: [] });
  }
  const main = row.image_url ? https(row.image_url) : null;
  const found = images.length;
  images = [...new Set([...(main ? [main] : []), ...images])].slice(0, 15);
  console.log('event-images', id, 'found', found);
  if (found > 0) await db.from('culture_events').update({ images }).eq('id', id);
  return json({ images });
});
