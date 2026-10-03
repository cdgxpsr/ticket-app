import { File, Paths } from 'expo-file-system';
import { getAvatar } from '../lib/avatar';
import type { Repo } from './repo';
import type { BoardPost, Comment, Explore, FeedPost, Show, User } from './types';

const H = 3600_000;
const now = Date.now();

const FRIENDS_POOL: User[] = [
  { id: 'minji', name: '민지', code: 'MINJI7', avatar: { coat: 'calico', expr: 'sparkle', face: 'flower', body: 'none', back: 'none', bg: 'none' } },
  { id: 'hyunwoo', name: '현우', code: 'HYUN22', avatar: { coat: 'black', expr: 'smug', face: 'shades', body: 'bowtie', back: 'none', bg: 'none' } },
  { id: 'jisu', name: '지수', code: 'JISU03', avatar: { coat: 'gray', expr: 'happy', face: 'glasses', body: 'scarf', back: 'none', bg: 'none' } },
  { id: 'seoyeon', name: '서연', code: 'SEOY88', avatar: { coat: 'white', expr: 'derp', face: 'crown', body: 'none', back: 'cape', bg: 'none' } },
  { id: 'dohyun', name: '도현', code: 'DOHY41', avatar: { coat: 'cheese', expr: 'deadpan', face: 'beret', body: 'ticketbag', back: 'none', bg: 'none' } },
];

const SHOWS: Record<string, Show> = {
  phantom: { id: 'phantom', title: '오페라의 유령', category: '뮤지컬', venue: '샤롯데씨어터', color: '#7F1D2D' },
  dune: { id: 'dune', title: '듄: 파트 3', category: '영화', venue: '용산 아이맥스', color: '#1E3A5F' },
  garden: { id: 'garden', title: '빛의 정원 특별전', category: '전시', venue: '국립현대미술관 서울', color: '#2D4A3E' },
  jazz: { id: 'jazz', title: '가을 재즈 위크', category: '공연', venue: '올림픽공원', color: '#4C1D95' },
  museum: { id: 'museum', title: '국립중앙박물관 특별전', category: '전시', venue: '국립중앙박물관', color: '#8A6D3B' },
  baseball: { id: 'baseball', title: 'LG 대 두산, 잠실', category: '스포츠', venue: '잠실야구장', color: '#14532D' },
};

const f = (id: string) => FRIENDS_POOL.find((u) => u.id === id)!;
const c = (id: string, who: string, text: string, ago: number): Comment => ({ id, author: f(who), text, createdAt: now - ago });

type State = { friends: string[]; feed: FeedPost[]; posts: BoardPost[]; stamps: number; myCode: string };

function seed(): State {
  return {
    friends: ['minji', 'hyunwoo', 'jisu'],
    stamps: 0,
    myCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
    feed: [
      { id: 'f1', author: f('minji'), show: SHOWS.phantom, rating: 4.5, text: '2막 샹들리에 장면에서 소름. 7열 중앙은 무대 전체가 한눈에 들어와요.', createdAt: now - 2 * H, likes: 24, liked: false, comments: [c('fc1', 'jisu', '저도 같은 날 봤어요!', H), c('fc2', 'hyunwoo', '샹들리에 진짜 최고', H / 2)] },
      { id: 'f2', author: f('hyunwoo'), show: SHOWS.dune, rating: 4.0, text: '아이맥스로 꼭. 사운드만으로도 충분히 만족스러웠어요.', createdAt: now - 26 * H, likes: 11, liked: false, comments: [c('fc3', 'minji', '이번 주말에 보러 가요', 20 * H)] },
      { id: 'f3', author: f('jisu'), show: SHOWS.garden, rating: 5, text: '마지막 방의 빛 설치 작품 앞에서 한참 서 있었어요. 평일 오전 추천.', createdAt: now - 50 * H, likes: 18, liked: false, comments: [] },
    ],
    posts: [
      { id: 'p1', board: '라운지', author: f('minji'), title: '오페라의 유령 · 9월 27일 저녁', body: '오늘 커튼콜 앵콜 있었던 거 맞죠? 2층 사이드도 생각보다 잘 보였어요.', tag: '회차 라운지', verified: true, createdAt: now - 3 * H, likes: 32, liked: false, comments: [c('pc1', 'jisu', '맞아요, 앵콜 두 곡이었어요', 2 * H)] },
      { id: 'p2', board: '라운지', author: f('jisu'), title: '빛의 정원 특별전 같이 갈 분', body: '이번 주 토요일 오전에 가려고 해요. 관람 후 후기 나눠요.', createdAt: now - 9 * H, likes: 6, liked: false, comments: [] },
      { id: 'p3', board: '챌린지', author: f('jisu'), title: '10월 챌린지: 가을 전시 3곳 가기', body: '완주하면 단풍 목도리를 받아요. 1,284명 참여 중. 다녀온 전시를 댓글로 인증해 주세요.', tag: '10월 챌린지', createdAt: now - 30 * H, likes: 120, liked: false, comments: [c('pc2', 'minji', '첫 번째 완료!', 10 * H)] },
      { id: 'p4', board: '질문', author: f('dohyun'), title: '2층 B구역 시야 어때요? 첫 관람이에요', body: '샤롯데씨어터 2층 B구역 예매했는데 시야가 궁금해요.', tag: '샤롯데씨어터', createdAt: now - 6 * H, likes: 4, liked: false, comments: [c('pc3', 'hyunwoo', '3번 봤는데 B구역 5열 안쪽이면 샹들리에까지 다 보여요.', 5 * H)] },
      { id: 'p5', board: '인생 공연', author: f('seoyeon'), title: '제 인생 공연은 오페라의 유령', body: '처음 본 뮤지컬이라 그런지 아직도 첫 장면이 기억나요. 여러분의 인생 공연은요?', createdAt: now - 72 * H, likes: 45, liked: false, comments: [] },
    ],
  };
}

const file = () => new File(Paths.document, 'social.json');
let cache: State | undefined;

function load(): State {
  if (cache) return cache;
  try {
    const fl = file();
    if (fl.exists) cache = JSON.parse(fl.textSync()) as State;
  } catch {}
  if (!cache) {
    cache = seed();
    save();
  }
  return cache;
}

function save() {
  try {
    const fl = file();
    if (!fl.exists) fl.create();
    fl.write(JSON.stringify(cache));
  } catch {}
}

const uid = () => `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

function meUser(): User {
  return { id: 'me', name: '나', avatar: getAvatar(), code: load().myCode };
}

export const localRepo: Repo = {
  async me() {
    return meUser();
  },
  async getFeed() {
    const s = load();
    return s.feed.filter((p) => p.author.id === 'me' || s.friends.includes(p.author.id)).sort((a, b) => b.createdAt - a.createdAt);
  },
  async createReview({ show, rating, text, cardId }) {
    const s = load();
    const post: FeedPost = { id: uid(), author: meUser(), show, rating, text, cardId, createdAt: Date.now(), likes: 0, liked: false, comments: [] };
    s.feed.unshift(post);
    save();
    return post;
  },
  async getPosts(board) {
    return load().posts.filter((p) => p.board === board).sort((a, b) => b.createdAt - a.createdAt);
  },
  async getPost(id) {
    return load().posts.find((p) => p.id === id);
  },
  async createPost({ board, title, body, tag }) {
    const post: BoardPost = { id: uid(), board, title, body, tag, author: meUser(), createdAt: Date.now(), likes: 0, liked: false, comments: [] };
    load().posts.unshift(post);
    save();
    return post;
  },
  async like(postId) {
    const s = load();
    const p = s.feed.find((x) => x.id === postId) ?? s.posts.find((x) => x.id === postId);
    if (!p) return undefined;
    p.liked = !p.liked;
    p.likes += p.liked ? 1 : -1;
    save();
    return p;
  },
  async comment(postId, text) {
    const s = load();
    const p = s.feed.find((x) => x.id === postId) ?? s.posts.find((x) => x.id === postId);
    const cm: Comment = { id: uid(), author: meUser(), text, createdAt: Date.now() };
    if (p) {
      p.comments.push(cm);
      save();
    }
    return cm;
  },
  async getFriends() {
    return load().friends.map(f);
  },
  async addFriend(code) {
    const s = load();
    const norm = code.trim().toUpperCase();
    if (norm === s.myCode) throw new Error('내 초대 코드예요');
    const u = FRIENDS_POOL.find((x) => x.code === norm);
    if (!u) throw new Error('코드를 찾을 수 없어요');
    if (s.friends.includes(u.id)) throw new Error('이미 친구예요');
    s.friends.push(u.id);
    save();
    return u;
  },
  async getExplore(): Promise<Explore> {
    return {
      categories: ['전체', '전시', '공연', '영화', '액티비티'],
      popular: [
        { ...SHOWS.garden, rating: 4.6, reviews: 128 },
        { ...SHOWS.phantom, rating: 4.7, reviews: 312 },
        { ...SHOWS.jazz, rating: 4.4, reviews: 57 },
        { ...SHOWS.dune, rating: 4.3, reviews: 204 },
        { ...SHOWS.museum, rating: 4.5, reviews: 96 },
      ],
      nearby: [
        { id: 'n1', name: '국립현대미술관 서울', info: '전시 3개 진행 중 · 1.2km' },
        { id: 'n2', name: '샤롯데씨어터', info: '오늘 공연 2회 · 3.4km' },
        { id: 'n3', name: '잠실야구장', info: '오늘 18:30 경기 · 5.1km' },
      ],
    };
  },
  async getStamps() {
    return load().stamps;
  },
  async addStamp(n = 1) {
    const s = load();
    s.stamps += n;
    save();
    return s.stamps;
  },
};
