// Supabase Edge Function (Deno): pulls KOPIS / 한국관광공사 data into public.culture_events.
// Auth: header `x-sync-secret: $SYNC_SECRET` or `Authorization: Bearer <service role key>`.
type Row = {
  id: string; source: string; category: string; title: string; summary: string | null; image_url: string | null;
  venue: string | null; region: string; address: string | null; start_date: string | null; end_date: string | null;
  link_url: string | null; lat: number | null; lng: number | null; updated_at: string;
};

const env = (k: string) => Deno.env.get(k) ?? '';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// KST dates
const kst = (offsetDays = 0) => new Date(Date.now() + 9 * 3600_000 + offsetDays * 86400_000);
const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
const iso = (s?: string | null) => {
  const m = (s ?? '').replace(/[.\-]/g, '').match(/^(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};
// Movies (KOBIS) are NOT stored here: KOBIS terms require real-time use. See movies-live.
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n !== 0 ? n : null; };

// KOPIS signgucode (시도) → region
const KOPIS_SIDO: Record<string, string> = {
  '11': '서울', '26': '부산', '27': '대구', '28': '인천', '29': '광주', '30': '대전', '31': '울산', '36': '세종',
  '41': '경기', '51': '강원', '42': '강원', '43': '충북', '44': '충남', '52': '전북', '45': '전북', '46': '전남', '47': '경북', '48': '경남', '50': '제주',
};
// TourAPI areacode → region
const TOUR_AREA: Record<string, string> = {
  '1': '서울', '2': '인천', '3': '대전', '4': '대구', '5': '광주', '6': '부산', '7': '울산', '8': '세종', '31': '경기', '32': '강원',
  '33': '충북', '34': '충남', '35': '경북', '36': '경남', '37': '전북', '38': '전남', '39': '제주',
};
const SHORT: Record<string, string> = {
  서울특별시: '서울', 부산광역시: '부산', 대구광역시: '대구', 인천광역시: '인천', 광주광역시: '광주', 대전광역시: '대전', 울산광역시: '울산',
  세종특별자치시: '세종', 경기도: '경기', 강원도: '강원', 강원특별자치도: '강원', 충청북도: '충북', 충청남도: '충남', 전라북도: '전북',
  전북특별자치도: '전북', 전라남도: '전남', 경상북도: '경북', 경상남도: '경남', 제주특별자치도: '제주', 제주도: '제주',
};
const regionFromText = (s: string | null) => {
  if (!s) return null;
  const first = s.trim().split(/\s+/)[0];
  if (SHORT[first]) return SHORT[first];
  return Object.values(SHORT).find((r) => first.startsWith(r)) ?? null;
};

async function getJson(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url.split('?')[0]}`);
  const text = await r.text();
  try { return JSON.parse(text); } catch { throw new Error(`non-json response: ${text.slice(0, 200)}`); }
}

/* ---------- KOPIS (XML) ---------- */
const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() || null : null;
};
async function kopis(key: string): Promise<Row[]> {
  const st = ymd(kst()), ed = ymd(kst(30));
  const now = new Date().toISOString();
  const out: Row[] = [];
  const codes = ['11', '26', '27', '28', '29', '30', '31', '36', '41', '51', '43', '44', '45', '46', '47', '48', '50'];
  for (const code of codes) {
    try {
      const url = `https://www.kopis.or.kr/openApi/restful/pblprfr?service=${key}&stdate=${st}&eddate=${ed}&cpage=1&rows=30&prfstate=02&signgucode=${code}`;
      const r = await fetch(url);
      if (!r.ok) continue;
      const xml = await r.text();
      for (const db of xml.match(/<db>[\s\S]*?<\/db>/g) ?? []) {
        const id = tag(db, 'mt20id');
        const title = tag(db, 'prfnm');
        if (!id || !title) continue;
        const area = tag(db, 'area');
        out.push({
          id: `kopis:${id}`, source: 'kopis', category: '공연', title,
          summary: tag(db, 'genrenm'), image_url: tag(db, 'poster'), venue: tag(db, 'fcltynm'),
          region: KOPIS_SIDO[code] ?? regionFromText(area) ?? '서울', address: area,
          start_date: iso(tag(db, 'prfpdfrom')), end_date: iso(tag(db, 'prfpdto')),
          link_url: `https://www.kopis.or.kr/por/db/pblprfr/pblprfrView.do?menuId=MNU_00020&mt20Id=${id}`,
          lat: null, lng: null, updated_at: now,
        });
      }
    } catch (e) {
      console.error('kopis', code, e);
    }
  }
  return out;
}

/* ---------- 한국관광공사 KorService2 ---------- */
const TOUR = 'https://apis.data.go.kr/B551011/KorService2';
const EXHIBIT = /전시|미술|갤러리|비엔날레|아트페어|박람회|사진전/;
// deno-lint-ignore no-explicit-any
const tourItems = (d: any): Record<string, string>[] => {
  const it = d?.response?.body?.items?.item;
  return Array.isArray(it) ? it : it ? [it] : [];
};
async function tourList(key: string, op: string, params: string) {
  const all: Record<string, string>[] = [];
  for (let page = 1; page <= 5; page++) {
    const d = await getJson(`${TOUR}/${op}?serviceKey=${key}&MobileOS=ETC&MobileApp=nyangnyang&_type=json&numOfRows=100&pageNo=${page}&${params}`);
    const items = tourItems(d);
    all.push(...items);
    const total = Number(d?.response?.body?.totalCount ?? 0);
    if (items.length < 100 || all.length >= total) break;
  }
  return all;
}
function tourRow(i: Record<string, string>, category: string, start: string | null, end: string | null): Row {
  const addr = [str(i.addr1), str(i.addr2)].filter(Boolean).join(' ') || null;
  return {
    id: `tour:${i.contentid}`, source: 'tour', category, title: i.title,
    summary: null, image_url: str(i.firstimage) ?? str(i.firstimage2), venue: null,
    region: TOUR_AREA[String(i.areacode ?? '')] ?? regionFromText(addr) ?? '서울', address: addr,
    start_date: start, end_date: end,
    link_url: `https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=${i.contentid}`,
    lat: num(i.mapy), lng: num(i.mapx), updated_at: new Date().toISOString(),
  };
}
async function tour(key: string): Promise<{ festivals: Row[]; leisure: Row[]; culture: Row[] }> {
  const k = key.includes('%') ? key : encodeURIComponent(key);
  const today = ymd(kst());
  const farEnd = iso(ymd(kst(365)));
  const fest = await tourList(k, 'searchFestival2', `eventStartDate=${today}&arrange=A`).catch((e) => { console.error('festival', e); return []; });
  const festivals = fest.map((i) =>
    tourRow(i, EXHIBIT.test(i.title ?? '') ? '전시' : '축제', iso(i.eventstartdate), iso(i.eventenddate)));
  const lei = await tourList(k, 'areaBasedList2', 'contentTypeId=28&arrange=Q').catch((e) => { console.error('leisure', e); return []; });
  const leisure = lei.map((i) => tourRow(i, '액티비티', null, farEnd));
  const cul = await tourList(k, 'areaBasedList2', 'contentTypeId=14&arrange=Q').catch((e) => { console.error('culture', e); return []; });
  const culture = cul.filter((i) => EXHIBIT.test(i.title ?? '') || /미술관|박물관|갤러리|전시/.test(i.title ?? ''))
    .map((i) => tourRow(i, '전시', null, farEnd));
  return { festivals, leisure, culture };
}

/* ---------- PostgREST ---------- */
async function upsert(rows: Row[]) {
  const uniq = [...new Map(rows.filter((r) => r.title && r.id).map((r) => [r.id, r])).values()];
  for (let i = 0; i < uniq.length; i += 500) {
    const r = await fetch(`${env('SUPABASE_URL')}/rest/v1/culture_events?on_conflict=id`, {
      method: 'POST',
      headers: {
        apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: `Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(uniq.slice(i, i + 500)),
    });
    if (!r.ok) throw new Error(`upsert ${r.status}: ${(await r.text()).slice(0, 300)}`);
  }
  return uniq.length;
}
async function purge() {
  const today = iso(ymd(kst()));
  const r = await fetch(`${env('SUPABASE_URL')}/rest/v1/culture_events?end_date=lt.${today}`, {
    method: 'DELETE',
    headers: { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: `Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`, Prefer: 'return=minimal' },
  });
  if (!r.ok) throw new Error(`purge ${r.status}`);
}

Deno.serve(async (req) => {
  const secret = env('SYNC_SECRET');
  const role = env('SUPABASE_SERVICE_ROLE_KEY');
  const okSecret = secret && req.headers.get('x-sync-secret') === secret;
  const okRole = role && req.headers.get('authorization') === `Bearer ${role}`;
  if (!okSecret && !okRole) return json({ error: 'unauthorized' }, 401);

  const counts: Record<string, number | string> = {};
  const run = async (name: string, keyName: string, fn: (key: string) => Promise<Row[]>) => {
    const key = env(keyName);
    if (!key) { counts[name] = 'skipped (no key)'; return; }
    try { counts[name] = await upsert(await fn(key)); } catch (e) { counts[name] = `error: ${(e as Error).message}`; }
  };
  await run('kopis', 'KOPIS_KEY', kopis);
  if (env('TOUR_API_KEY')) {
    try {
      const t = await tour(env('TOUR_API_KEY'));
      counts.festival = await upsert(t.festivals);
      counts.leisure = await upsert(t.leisure);
      counts.exhibition = await upsert(t.culture);
    } catch (e) { counts.tour = `error: ${(e as Error).message}`; }
  } else counts.tour = 'skipped (no key)';
  try { await purge(); counts.purged = 'ok'; } catch (e) { counts.purged = `error: ${(e as Error).message}`; }
  return json({ ok: true, counts });
});
