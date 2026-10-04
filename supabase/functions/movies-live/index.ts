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

/** Optional KMDb (한국영상자료원) poster lookup, only when KMDB_KEY is set. Never throws. */
const clean = (t: string) => t.replace(/!H[SE]/g, '').replace(/\s+/g, ' ').trim();
const norm = (t: string) => clean(t).replace(/[^0-9a-zA-Z가-힣]/g, '').toLowerCase();
const dayNum = (s?: string) => {
  const m = (s ?? '').replace(/\D/g, '').match(/^(\d{4})(\d{2})(\d{2})/);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400_000 : NaN;
};
async function kmdbPoster(title: string, openDt: string | undefined): Promise<string | null> {
  const key = Deno.env.get('KMDB_KEY');
  if (!key) return null;
  const open = dayNum(openDt);
  const since = Number.isFinite(open) ? new Date((open - 365) * 86400_000).toISOString().slice(0, 10).replace(/-/g, '') : '';
  const q = `collection=kmdb_new2&ServiceKey=${encodeURIComponent(key)}&detail=Y&title=${encodeURIComponent(title)}${since ? `&releaseDts=${since}` : ''}`;
  const path = '://api.koreafilm.or.kr/openapi-data2/wisenut/search_api/search_json2.jsp?' + q;
  // deno-lint-ignore no-explicit-any
  let d: any;
  for (const scheme of ['https', 'http']) {
    try {
      const r = await fetch(scheme + path);
      if (!r.ok) continue;
      d = JSON.parse(await r.text());
      break;
    } catch {
      // try next scheme
    }
  }
  const items: { title?: string; posters?: string; repRlsDate?: string }[] = d?.Data?.[0]?.Result ?? [];
  const want = norm(title);
  let best: { url: string; score: number } | null = null;
  for (const it of items) {
    const url = (it.posters ?? '').split('|').map((u) => u.trim()).find(Boolean);
    if (!url) continue;
    const t = norm(it.title ?? '');
    const titleScore = t === want ? 0 : t.includes(want) || want.includes(t) ? 1 : 3;
    const gap = Math.abs(dayNum(it.repRlsDate) - open);
    const score = titleScore * 1000 + (Number.isFinite(gap) ? Math.min(gap, 999) : 999);
    if (!best || score < best.score) best = { url, score };
  }
  if (!best || best.score >= 3000) return null;
  // file.koreafilm.or.kr serves the same path over https (iOS ATS blocks http).
  return best.url.replace(/^http:\/\//i, 'https://');
}

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
    const posters = await Promise.all(list.map((m) => kmdbPoster(m.movieNm, m.openDt)));
    const items = list.map((m, i) => ({
      id: `kobis:${m.movieCd}`, source: 'kobis', category: '영화', title: m.movieNm,
      summary: `일별 박스오피스 ${m.rank}위 · 누적 관객 ${Number(m.audiAcc).toLocaleString('ko-KR')}명`,
      image_url: posters[i], poster_source: posters[i] ? 'kmdb' : null, venue: '전국 극장', region: '전국', address: null,
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
