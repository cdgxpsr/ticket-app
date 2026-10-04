import { File, Paths } from 'expo-file-system';
import { AvatarOptions } from '../avatar/cat';
import { listCards } from './cards';

/** 냥냥상점 currency: 츄르. Earned by activity (growth-first: no real-money purchases yet). */
export type Slot = Exclude<keyof AvatarOptions, 'coat' | 'expr'> | 'coat' | 'expr';
export type ShopItem = { slot: Slot; value: string; label: string; price: number; need?: number; tag?: 'NEW' | 'HOT' | '한정' };

export const WELCOME = 300;
export const PER_TICKET = 100;

export const SHOP_SLOTS: { key: Slot; label: string }[] = [
  { key: 'face', label: '모자·얼굴' }, { key: 'body', label: '옷·소품' }, { key: 'back', label: '등' },
  { key: 'bg', label: '배경' }, { key: 'coat', label: '털색' }, { key: 'expr', label: '표정' },
];

// `need`: old ticket-count unlocks still count as owned, so earlier testers keep their items.
export const CATALOG: ShopItem[] = [
  { slot: 'face', value: 'flower', label: '꽃핀', price: 100, need: 1 },
  { slot: 'face', value: 'ribbon', label: '리본', price: 150, tag: 'NEW' },
  { slot: 'face', value: 'mustache', label: '신사 콧수염', price: 150, tag: 'NEW' },
  { slot: 'face', value: 'partyhat', label: '파티 모자', price: 200, tag: 'NEW' },
  { slot: 'face', value: 'shades', label: '선글라스', price: 250, need: 3 },
  { slot: 'face', value: 'heartglasses', label: '하트 안경', price: 300, tag: 'HOT' },
  { slot: 'face', value: 'headphones', label: '헤드폰', price: 400, tag: 'NEW' },
  { slot: 'face', value: 'tophat', label: '실크햇', price: 500, tag: 'NEW' },
  { slot: 'face', value: 'halo', label: '천사 링', price: 700, tag: '한정' },
  { slot: 'face', value: 'crown', label: '왕관', price: 1000, need: 10 },
  { slot: 'body', value: 'necklace', label: '진주 목걸이', price: 200, tag: 'NEW' },
  { slot: 'body', value: 'popcorn', label: '팝콘', price: 200, tag: 'HOT' },
  { slot: 'body', value: 'hanbok', label: '한복 저고리', price: 400, tag: 'NEW' },
  { slot: 'body', value: 'camera', label: '필름 카메라', price: 400, tag: 'NEW' },
  { slot: 'body', value: 'ticketbag', label: '티켓 가방', price: 500, need: 5 },
  { slot: 'back', value: 'balloon', label: '풍선', price: 150, need: 1 },
  { slot: 'back', value: 'backpack', label: '여행 가방', price: 300, tag: 'NEW' },
  { slot: 'back', value: 'guitar', label: '기타', price: 500, tag: 'NEW' },
  { slot: 'back', value: 'cape', label: '망토', price: 500, need: 5 },
  { slot: 'back', value: 'devilwings', label: '악마 날개', price: 800, tag: '한정' },
  { slot: 'back', value: 'wings', label: '천사 날개', price: 1000, need: 10 },
  { slot: 'bg', value: 'stage', label: '무대', price: 150, need: 1 },
  { slot: 'bg', value: 'cinema', label: '영화관', price: 250, tag: 'NEW' },
  { slot: 'bg', value: 'sea', label: '바다', price: 250, tag: 'NEW' },
  { slot: 'bg', value: 'museum', label: '미술관', price: 300, need: 3 },
  { slot: 'bg', value: 'festival', label: '축제', price: 350, tag: 'HOT' },
  { slot: 'bg', value: 'hanok', label: '한옥', price: 400, tag: 'NEW' },
  { slot: 'bg', value: 'paris', label: '파리', price: 500, need: 5 },
  { slot: 'bg', value: 'night', label: '밤하늘', price: 800, need: 10 },
  { slot: 'coat', value: 'calico', label: '삼색 털', price: 300, need: 3 },
  { slot: 'expr', value: 'sparkle', label: '초롱초롱', price: 200, need: 3 },
];

type State = { owned: string[]; spent: number; bonus: number; lastDaily?: string; rewarded: string[] };
const file = () => new File(Paths.document, 'shop.json');
function load(): State {
  try {
    const f = file();
    if (f.exists) return { owned: [], spent: 0, bonus: 0, rewarded: [], ...JSON.parse(f.textSync()) };
  } catch {
    // corrupt: start fresh
  }
  return { owned: [], spent: 0, bonus: 0, rewarded: [] };
}
function save(s: State) {
  const f = file();
  if (!f.exists) f.create();
  f.write(JSON.stringify(s));
}

const key = (i: Pick<ShopItem, 'slot' | 'value'>) => `${i.slot}:${i.value}`;
const ticketCount = () => { try { return listCards().length; } catch { return 0; } };

export function balance(): number {
  const s = load();
  return WELCOME + PER_TICKET * ticketCount() + s.bonus - s.spent;
}

/** One-off rewards; `once` keys (e.g. a review per event) are paid only the first time. */
export function addChur(n: number, once?: string) {
  const s = load();
  if (once && s.rewarded.includes(once)) return;
  s.bonus += n;
  if (once) s.rewarded.push(once);
  save(s);
}

/** +10 츄르 once per day for opening the shop. Returns true when paid now. */
export function claimDaily(): boolean {
  const s = load();
  const today = new Date().toISOString().slice(0, 10);
  if (s.lastDaily === today) return false;
  s.lastDaily = today;
  s.bonus += 10;
  save(s);
  return true;
}

/** Free = not in the catalog. Owned = bought, invite-unlocked, or old ticket-count unlock. */
export function isOwned(slot: Slot, value: string, unlocked: string[] = []): boolean {
  const item = CATALOG.find((i) => i.slot === slot && i.value === value);
  if (!item) return true;
  const k = key(item);
  return load().owned.includes(k) || unlocked.includes(k) || (item.need != null && ticketCount() >= item.need);
}

export function buy(item: ShopItem): 'ok' | 'owned' | 'poor' {
  if (isOwned(item.slot, item.value)) return 'owned';
  if (balance() < item.price) return 'poor';
  const s = load();
  s.owned.push(key(item));
  s.spent += item.price;
  save(s);
  return 'ok';
}
