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
async function kmdbInfo(title: string, openDt: string | undefined): Promise<{ poster: string | null; plot: string | null } | null> {
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
  const items: { title?: string; posters?: string; repRlsDate?: string; plots?: { plot?: { plotLang?: string; plotText?: string }[] } }[] = d?.Data?.[0]?.Result ?? [];
  const want = norm(title);
  let best: { url: string | null; plot: string | null; score: number } | null = null;
  for (const it of items) {
    const url = (it.posters ?? '').split('|').map((u) => u.trim()).find(Boolean) ?? null;
    const plots = it.plots?.plot ?? [];
    const plot = (plots.find((p) => p.plotLang === '한국어') ?? plots[0])?.plotText?.trim() || null;
    if (!url && !plot) continue;
    const t = norm(it.title ?? '');
    const titleScore = t === want ? 0 : t.includes(want) || want.includes(t) ? 1 : 3;
    const gap = Math.abs(dayNum(it.repRlsDate) - open);
    const score = titleScore * 1000 + (Number.isFinite(gap) ? Math.min(gap, 999) : 999);
    if (!best || score < best.score) best = { url, plot, score };
  }
  if (!best || best.score >= 3000) return null;
  // file.koreafilm.or.kr serves the same path over https (iOS ATS blocks http).
  return { poster: best.url?.replace(/^http:\/\//i, 'https://') ?? null, plot: best.plot };
}

/** KOBIS movie detail: genre, running time, rating, director, cast. Cached per movie for the process lifetime. */
const infoCache = new Map<string, string | null>();
async function kobisInfo(key: string, movieCd: string): Promise<string | null> {
  if (infoCache.has(movieCd)) return infoCache.get(movieCd)!;
  let out: string | null = null;
  try {
    const r = await fetch(`https://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json?key=${key}&movieCd=${movieCd}`);
    const m = r.ok ? (await r.json())?.movieInfoResult?.movieInfo : null;
    if (m) {
      const parts = [
        (m.genres ?? []).map((g: { genreNm: string }) => g.genreNm).join('/'),
        m.showTm ? `${m.showTm}분` : '',
        m.audits?.[0]?.watchGradeNm ?? '',
        m.directors?.[0]?.peopleNm ? `감독 ${m.directors[0].peopleNm}` : '',
        (m.actors ?? []).slice(0, 3).map((a: { peopleNm: string }) => a.peopleNm).join(', ') ? `출연 ${(m.actors ?? []).slice(0, 3).map((a: { peopleNm: string }) => a.peopleNm).join(', ')}` : '',
      ].filter(Boolean);
      out = parts.join(' · ') || null;
    }
  } catch {
    // leave null
  }
  infoCache.set(movieCd, out);
  return out;
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
    const [kmdb, infos] = await Promise.all([
      Promise.all(list.map((m) => kmdbInfo(m.movieNm, m.openDt))),
      Promise.all(list.map((m) => kobisInfo(key, m.movieCd))),
    ]);
    const items = list.map((m, i) => ({
      id: `kobis:${m.movieCd}`, source: 'kobis', category: '영화', title: m.movieNm,
      // 소개: KMDb 줄거리가 있으면 그것, 없으면 장르·러닝타임·등급·감독·출연.
      summary: [kmdb[i]?.plot, infos[i]].filter(Boolean).join('\n\n') || null,
      image_url: kmdb[i]?.poster ?? null, poster_source: kmdb[i]?.poster ? 'kmdb' : null, venue: '전국 극장', region: '전국', address: null,
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
