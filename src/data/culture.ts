import { ensureSession, supabase } from '../lib/supabase';

export const KOBIS_CREDIT = '출처: 영화관입장권통합전산망(KOBIS)';

export const REGIONS = ['전국', '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'] as const;
export const CULTURE_CATEGORIES = ['전체', '영화', '공연', '전시', '축제', '액티비티', '숙박'] as const;

export type CultureEvent = {
  id: string; source: string; category: string; title: string; summary: string | null; image_url: string | null;
  venue: string | null; region: string; address: string | null; start_date: string | null; end_date: string | null;
  link_url: string | null; lat: number | null; lng: number | null;
};

const COLS = 'id, source, category, title, summary, image_url, venue, region, address, start_date, end_date, link_url, lat, lng';
const ev = (e: Partial<CultureEvent> & Pick<CultureEvent, 'id' | 'category' | 'title' | 'region'>): CultureEvent => ({
  source: 'sample', summary: null, image_url: null, venue: null, address: null, start_date: null, end_date: null, link_url: null, lat: null, lng: null, ...e,
});

export const SAMPLE_EVENTS: CultureEvent[] = [
  ev({ id: 'sample:1', category: '영화', title: '박스오피스 상영작', region: '전국', venue: '전국 극장', summary: '오늘의 박스오피스 순위는 동기화 후 표시돼요', start_date: '2026-09-24', end_date: '2026-10-31', link_url: 'https://www.kobis.or.kr' }),
  ev({ id: 'sample:2', category: '공연', title: '뮤지컬 〈오페라의 유령〉', region: '서울', venue: '샤롯데씨어터', address: '서울 송파구 올림픽로 240', start_date: '2026-09-01', end_date: '2026-11-30', link_url: 'https://www.kopis.or.kr' }),
  ev({ id: 'sample:3', category: '공연', title: '연극 〈햄릿〉', region: '서울', venue: '국립극장 달오름극장', address: '서울 중구 장충단로 59', start_date: '2026-10-01', end_date: '2026-10-26', link_url: 'https://www.ntok.go.kr' }),
  ev({ id: 'sample:4', category: '전시', title: '국립현대미술관 상설전', region: '서울', venue: '국립현대미술관 서울', address: '서울 종로구 삼청로 30', start_date: '2026-01-01', end_date: '2026-12-31', link_url: 'https://www.mmca.go.kr' }),
  ev({ id: 'sample:5', category: '축제', title: '부산불꽃축제', region: '부산', venue: '광안리해수욕장', address: '부산 수영구 광안해변로 219', start_date: '2026-11-07', end_date: '2026-11-07', link_url: 'https://korean.visitkorea.or.kr' }),
  ev({ id: 'sample:6', category: '전시', title: '부산현대미술관 기획전', region: '부산', venue: '부산현대미술관', address: '부산 사하구 낙동남로 1191', start_date: '2026-08-15', end_date: '2026-12-14', link_url: 'https://www.busan.go.kr/moca' }),
  ev({ id: 'sample:7', category: '축제', title: '진주남강유등축제', region: '경남', venue: '진주성 일원', address: '경남 진주시 남강로 626', start_date: '2026-10-01', end_date: '2026-10-15', link_url: 'https://korean.visitkorea.or.kr' }),
  ev({ id: 'sample:8', category: '축제', title: '안동국제탈춤페스티벌', region: '경북', venue: '탈춤공원 일원', address: '경북 안동시 육사로 239', start_date: '2026-09-25', end_date: '2026-10-04', link_url: 'https://korean.visitkorea.or.kr' }),
  ev({ id: 'sample:9', category: '액티비티', title: '단양 패러글라이딩', region: '충북', venue: '단양 양방산 활공장', address: '충북 단양군 단양읍', start_date: null, end_date: '2027-10-04', link_url: 'https://korean.visitkorea.or.kr' }),
  ev({ id: 'sample:10', category: '액티비티', title: '제주 카약 체험', region: '제주', venue: '쇠소깍', address: '제주 서귀포시 하효동', end_date: '2027-10-04', link_url: 'https://korean.visitkorea.or.kr' }),
  ev({ id: 'sample:11', category: '공연', title: '대구국제오페라축제', region: '대구', venue: '대구오페라하우스', address: '대구 북구 호암로 15', start_date: '2026-10-02', end_date: '2026-11-08', link_url: 'https://www.kopis.or.kr' }),
  ev({ id: 'sample:12', category: '전시', title: '광주비엔날레', region: '광주', venue: '광주비엔날레 전시관', address: '광주 북구 비엔날레로 111', start_date: '2026-09-05', end_date: '2026-12-01', link_url: 'https://www.gwangjubiennale.org' }),
  ev({ id: 'sample:13', category: '액티비티', title: '가평 수상레저', region: '경기', venue: '북한강 일원', address: '경기 가평군 가평읍', end_date: '2027-10-04', link_url: 'https://korean.visitkorea.or.kr' }),
  ev({ id: 'sample:14', category: '숙박', title: '해운대 오션뷰 호텔', region: '부산', venue: '해운대 오션뷰 호텔', summary: '호텔 · 051-000-0000', address: '부산 해운대구 해운대해변로 264', end_date: '2027-10-04', lat: 35.1587, lng: 129.1604, link_url: 'https://korean.visitkorea.or.kr' }),
  ev({ id: 'sample:15', category: '숙박', title: '북촌 한옥스테이', region: '서울', venue: '북촌 한옥스테이', summary: '한옥 · 02-000-0000', address: '서울 종로구 계동길 37', end_date: '2027-10-04', lat: 37.5826, lng: 126.9857, link_url: 'https://korean.visitkorea.or.kr' }),
  ev({ id: 'sample:16', category: '숙박', title: '제주 서귀포 게스트하우스', region: '제주', venue: '서귀포 게스트하우스', summary: '게스트하우스 · 064-000-0000', address: '제주 서귀포시 중정로 22', end_date: '2027-10-04', lat: 33.2489, lng: 126.5641, link_url: 'https://korean.visitkorea.or.kr' }),
];

/** Lodging in the same region, nearest first (simple equirectangular distance), top 5. */
export async function getNearbyStays(e: CultureEvent): Promise<CultureEvent[]> {
  if (e.lat == null || e.lng == null) return [];
  let rows: CultureEvent[] = [];
  try {
    const { data } = await supabase.from('culture_events').select(COLS).eq('category', '숙박').eq('region', e.region)
      .not('lat', 'is', null).not('lng', 'is', null).limit(300);
    rows = (data as CultureEvent[] | null) ?? [];
  } catch {
    // offline
  }
  if (!rows.length) rows = SAMPLE_EVENTS.filter((s) => s.category === '숙박' && s.region === e.region);
  const cos = Math.cos((e.lat * Math.PI) / 180);
  const d = (s: CultureEvent) => ((s.lat ?? 0) - e.lat!) ** 2 + (((s.lng ?? 0) - e.lng!) * cos) ** 2;
  return rows.filter((s) => s.id !== e.id && s.lat != null && s.lng != null).sort((a, b) => d(a) - d(b)).slice(0, 5);
}

const filterLocal = (region: string, category: string) =>
  SAMPLE_EVENTS.filter((e) => (region === '전국' || e.region === region || e.region === '전국') && (category === '전체' || e.category === category));

const liveMovies = new Map<string, CultureEvent>();

/** Live KOBIS box office via the movies-live function (KOBIS data must not be stored). */
async function getLiveMovies(): Promise<CultureEvent[]> {
  try {
    await ensureSession();
    const { data, error } = await supabase.functions.invoke<{ items: CultureEvent[] }>('movies-live', { method: 'POST', body: {} });
    if (error || !data?.items?.length) throw error ?? new Error('empty');
    data.items.forEach((m) => liveMovies.set(m.id, m));
    return data.items;
  } catch {
    return SAMPLE_EVENTS.filter((e) => e.category === '영화');
  }
}

/** Fetches events for a region (전국 = all). Movies come live from KOBIS; other categories fall back to samples. */
export async function getCultureEvents(region: string, category: string): Promise<{ events: CultureEvent[]; sample: boolean }> {
  const wantMovies = category === '전체' || category === '영화';
  const moviesP = wantMovies ? getLiveMovies() : Promise.resolve([]);
  let others: CultureEvent[] | undefined;
  if (category !== '영화') {
    try {
      let q = supabase.from('culture_events').select(COLS).neq('category', '영화').order('start_date', { ascending: false, nullsFirst: false }).limit(200);
      if (region !== '전국') q = q.eq('region', region);
      if (category !== '전체') q = q.eq('category', category);
      const { data, error } = await q;
      if (error) throw error;
      if (data && data.length) others = data as CultureEvent[];
    } catch {
      // offline or table missing
    }
  }
  const sample = category !== '영화' && !others;
  if (!others) others = filterLocal(region, category).filter((e) => e.category !== '영화');
  const movies = await moviesP;
  return { events: [...movies, ...others], sample };
}

export async function getCultureEvent(id: string): Promise<CultureEvent | undefined> {
  const s = SAMPLE_EVENTS.find((e) => e.id === id) ?? liveMovies.get(id);
  if (s) return s;
  try {
    const { data } = await supabase.from('culture_events').select(COLS).eq('id', id).maybeSingle();
    return (data as CultureEvent | null) ?? undefined;
  } catch {
    return undefined;
  }
}

export const formatPeriod = (e: CultureEvent) => {
  const f = (s: string | null) => (s ? s.replace(/-/g, '.') : '');
  if ((e.category === '액티비티' || e.category === '숙박') && !e.start_date) return '상시';
  if (e.start_date && e.end_date && e.start_date !== e.end_date) return `${f(e.start_date)} ~ ${f(e.end_date)}`;
  return f(e.start_date ?? e.end_date) || '상시';
};
