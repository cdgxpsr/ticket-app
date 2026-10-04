// Supabase Edge Function (Deno): live KOBIS daily box office, returned as culture_events-shaped rows.
// KOBIS terms require real-time use, so nothing is stored; only a <=10 minute in-memory cache.
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const TTL = 10 * 60_000;
let cache: { at: number; items: unknown[] } | undefined;

const kst = (offsetDays = 0) => new Date(Date.now() + 9 * 3600_000 + offsetDays * 86400_000);
const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
const iso = (s?: string | null) => {
  const m = (s ?? '').replace(/[.\-]/g, '').match(/^(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const key = Deno.env.get('KOBIS_KEY');
  if (!key) return json({ error: 'server_not_configured' }, 500);
  if (cache && Date.now() - cache.at < TTL) return json({ items: cache.items, source: 'KOBIS' });
  try {
    const r = await fetch(
      `https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${key}&targetDt=${ymd(kst(-1))}`,
    );
    if (!r.ok) return json({ error: `kobis_${r.status}` }, 502);
    const d = await r.json();
    const list: Record<string, string>[] = d?.boxOfficeResult?.dailyBoxOfficeList ?? [];
    const today = iso(ymd(kst()));
    const items = list.map((m) => ({
      id: `kobis:${m.movieCd}`, source: 'kobis', category: '영화', title: m.movieNm,
      summary: `일별 박스오피스 ${m.rank}위 · 누적 관객 ${Number(m.audiAcc).toLocaleString('ko-KR')}명`,
      image_url: null, venue: '전국 극장', region: '전국', address: null,
      start_date: iso(m.openDt) ?? today, end_date: null,
      link_url: `https://www.kobis.or.kr/kobis/business/mast/mvie/searchMovieList.do?sMovName=${encodeURIComponent(m.movieNm)}`,
      lat: null, lng: null,
    }));
    cache = { at: Date.now(), items };
    return json({ items, source: 'KOBIS' });
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }
});
