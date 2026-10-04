import { Linking } from 'react-native';
import type { CultureEvent } from '../data/culture';

const APP = 'com.nyangsucheop.app';
const enc = encodeURIComponent;

export type Vendor = { name: string; appUrl?: string; webUrl: string };

/** Opens the vendor app when installed (needs the scheme in LSApplicationQueriesSchemes), else the https/universal link. */
export async function openVendor({ appUrl, webUrl }: { appUrl?: string; webUrl: string }) {
  try {
    if (appUrl && (await Linking.canOpenURL(appUrl))) {
      await Linking.openURL(appUrl);
      return;
    }
  } catch {
    // fall through to web
  }
  await Linking.openURL(webUrl).catch(() => {});
}

/**
 * One config map of vendors. App schemes are only set where documented (nmap, kakaomap, naversearchapp);
 * everything else uses https URLs, which iOS hands to the vendor app via universal links when installed.
 */
const V = {
  naverMap: (e: CultureEvent, q: string): Vendor => ({
    name: '네이버 지도',
    appUrl: e.lat != null && e.lng != null
      ? `nmap://place?lat=${e.lat}&lng=${e.lng}&name=${enc(e.title)}&appname=${APP}`
      : `nmap://search?query=${enc(q)}&appname=${APP}`,
    webUrl: `https://map.naver.com/p/search/${enc(q)}`,
  }),
  kakaoMap: (q: string): Vendor => ({ name: '카카오맵', appUrl: `kakaomap://search?q=${enc(q)}`, webUrl: `https://m.map.kakao.com/actions/searchView?q=${enc(q)}` }),
  naverSearch: (name: string, q: string): Vendor => ({
    name,
    appUrl: `naversearchapp://search?qmenu=SearchKeyword&query=${enc(q)}&version=10`,
    webUrl: `https://m.search.naver.com/search.naver?query=${enc(q)}`,
  }),
  cgv: (): Vendor => ({ name: 'CGV', webUrl: 'https://m.cgv.co.kr/' }),
  megabox: (): Vendor => ({ name: '메가박스', webUrl: 'https://m.megabox.co.kr/booking' }),
  lotte: (): Vendor => ({ name: '롯데시네마', webUrl: 'https://www.lottecinema.co.kr/NLCMW/' }),
  interpark: (q: string): Vendor => ({ name: '인터파크 티켓', webUrl: `https://tickets.interpark.com/search?keyword=${enc(q)}` }),
  yes24: (q: string): Vendor => ({ name: '예스24 티켓', webUrl: `https://m.ticket.yes24.com/Search/Index?query=${enc(q)}` }),
  yanolja: (q: string): Vendor => ({ name: '야놀자', webUrl: `https://www.yanolja.com/search/${enc(q)}` }),
  yeogi: (q: string): Vendor => ({ name: '여기어때', webUrl: `https://www.yeogi.com/domestic-accommodations?keyword=${enc(q)}` }),
  agoda: (q: string): Vendor => ({ name: '아고다', webUrl: `https://www.agoda.com/ko-kr/search?textToSearch=${enc(q)}` }),
  airbnb: (q: string): Vendor => ({ name: '에어비앤비', webUrl: `https://www.airbnb.co.kr/s/${enc(q)}/homes` }),
};

/** LSApplicationQueriesSchemes needed by canOpenURL above (keep app.json in sync). */
export const QUERY_SCHEMES = ['nmap', 'kakaomap', 'naversearchapp'];

export function vendorsFor(e: CultureEvent): Vendor[] {
  const where = `${e.title} ${e.venue || (e.region === '전국' ? '' : e.region)}`.trim();
  switch (e.category) {
    case '영화':
      return [V.cgv(), V.megabox(), V.lotte(), V.naverSearch('네이버 영화 예매', `${e.title} 예매`)];
    case '공연': {
      const official = (e.booking_links ?? [])
        .filter((l) => l?.name && /^https?:\/\//.test(l.url))
        .map((l) => ({ name: l.name, webUrl: l.url.replace(/^http:\/\//i, 'https://') }));
      const extra = [V.interpark(e.title), V.yes24(e.title)].filter((v) => !official.some((o) => v.name.startsWith(o.name.slice(0, 3))));
      return [...official, ...extra, V.naverMap(e, where)];
    }
    case '숙박':
      return [V.naverMap(e, e.title), V.yanolja(e.title), V.yeogi(e.title), V.agoda(e.title), V.airbnb(e.title)];
    default:
      return [V.naverMap(e, where), V.kakaoMap(where)];
  }
}
