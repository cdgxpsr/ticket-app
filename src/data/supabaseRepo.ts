import { uploadPostImage } from '../lib/cloud';
import { DEFAULT_AVATAR } from '../avatar/cat';
import { supabase, uid } from '../lib/supabase';
import { localRepo } from './localRepo';
import type { Repo } from './repo';
import type { BoardPost, Comment, FeedPost, Show, User } from './types';

type ProfileRow = { id: string; nickname: string; avatar: Record<string, unknown> | null; invite_code: string };
type CommentRow = { id: string; text: string; created_at: string; author: ProfileRow };
type LikeRow = { user_id: string };

const PROFILE = 'id, nickname, avatar, invite_code';
const SOCIAL = `likes(user_id), comments(id, text, created_at, author:profiles!comments_author_fkey(${PROFILE}))`;

const toUser = (p: ProfileRow): User => ({ id: p.id, name: p.nickname, avatar: { ...DEFAULT_AVATAR, ...(p.avatar ?? {}) }, code: p.invite_code });
const ts = (s: string) => new Date(s).getTime();
const toComment = (c: CommentRow): Comment => ({ id: c.id, author: toUser(c.author), text: c.text, createdAt: ts(c.created_at) });
const social = (likes: LikeRow[], comments: CommentRow[], me: string) => ({
  likes: likes.length,
  liked: likes.some((l) => l.user_id === me),
  comments: comments.map(toComment).sort((a, b) => a.createdAt - b.createdAt),
});

function must<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const toFeed = (r: any, me: string): FeedPost => ({
  id: r.id, author: toUser(r.author), show: r.show as Show, rating: Number(r.rating), text: r.text,
  createdAt: ts(r.created_at), cardId: r.card_id ?? undefined, ...social(r.likes, r.comments, me),
});
const toPost = (r: any, me: string): BoardPost => ({
  id: r.id, board: r.board, author: toUser(r.author), title: r.title, body: r.body, tag: r.tag ?? undefined,
  verified: r.verified, createdAt: ts(r.created_at), images: r.images ?? [], ...social(r.likes, r.comments, me),
});

const REVIEW_SEL = `id, show, rating, text, created_at, card_id, author:profiles!reviews_author_fkey(${PROFILE}), ${SOCIAL}`;
const POST_SEL = `id, board, title, body, tag, verified, images, created_at, author:profiles!board_posts_author_fkey(${PROFILE}), ${SOCIAL}`;

async function findTarget(id: string): Promise<'review' | 'post' | undefined> {
  const r = await supabase.from('reviews').select('id').eq('id', id).maybeSingle();
  if (r.data) return 'review';
  const p = await supabase.from('board_posts').select('id').eq('id', id).maybeSingle();
  return p.data ? 'post' : undefined;
}

export const supabaseRepo: Repo = {
  async me() {
    const id = await uid();
    return toUser(must(await supabase.from('profiles').select(PROFILE).eq('id', id).single()));
  },
  async getFeed() {
    const me = await uid();
    const rows = must(await supabase.from('reviews').select(REVIEW_SEL).order('created_at', { ascending: false }).limit(50));
    return (rows as any[]).map((r) => toFeed(r, me));
  },
  async createReview({ show, rating, text, cardId }) {
    const me = await uid();
    const isUuid = cardId && /^[0-9a-f-]{36}$/i.test(cardId);
    const row = must(await supabase.from('reviews').insert({ show, rating, text, card_id: isUuid ? cardId : null }).select(REVIEW_SEL).single());
    return toFeed(row, me);
  },
  async getPosts(board) {
    const me = await uid();
    const rows = must(await supabase.from('board_posts').select(POST_SEL).eq('board', board).order('created_at', { ascending: false }).limit(50));
    return (rows as any[]).map((r) => toPost(r, me));
  },
  async getPost(id) {
    const me = await uid();
    const row = must(await supabase.from('board_posts').select(POST_SEL).eq('id', id).maybeSingle());
    return row ? toPost(row, me) : undefined;
  },
  async createPost({ board, title, body, tag, images = [] }) {
    const me = await uid();
    const urls = await Promise.all(images.map((u) => uploadPostImage(u)));
    return toPost(must(await supabase.from('board_posts').insert({ board, title, body, tag, images: urls }).select(POST_SEL).single()), me);
  },
  async like(postId) {
    const me = await uid();
    const kind = await findTarget(postId);
    if (!kind) return undefined;
    const col = kind === 'review' ? 'review_id' : 'post_id';
    const existing = await supabase.from('likes').select('id').eq(col, postId).eq('user_id', me).maybeSingle();
    if (existing.data) must(await supabase.from('likes').delete().eq('id', existing.data.id));
    else must(await supabase.from('likes').insert(kind === 'review' ? { review_id: postId } : { post_id: postId }));
    if (kind === 'review') return toFeed(must(await supabase.from('reviews').select(REVIEW_SEL).eq('id', postId).single()), me);
    return toPost(must(await supabase.from('board_posts').select(POST_SEL).eq('id', postId).single()), me);
  },
  async comment(postId, text) {
    const kind = await findTarget(postId);
    if (!kind) throw new Error('글을 찾을 수 없어요');
    const row = must(await supabase.from('comments').insert(kind === 'review' ? { review_id: postId, text } : { post_id: postId, text })
      .select(`id, text, created_at, author:profiles!comments_author_fkey(${PROFILE})`).single());
    return toComment(row as unknown as CommentRow);
  },
  async getFriends() {
    const me = await uid();
    const rows = must(await supabase.from('friendships')
      .select(`requester:profiles!friendships_requester_fkey(${PROFILE}), addressee:profiles!friendships_addressee_fkey(${PROFILE})`)
      .eq('status', 'accepted')) as any[];
    return rows.map((r) => toUser(r.requester.id === me ? r.addressee : r.requester));
  },
  async addFriend(code) {
    await uid();
    const { data, error } = await supabase.rpc('add_friend_by_code', { code });
    if (error) {
      if (error.message.includes('self')) throw new Error('내 초대 코드예요');
      if (error.message.includes('already')) throw new Error('이미 친구예요');
      throw new Error('코드를 찾을 수 없어요');
    }
    return toUser(must(await supabase.from('profiles').select(PROFILE).eq('id', data as string).single()));
  },
  // Explore is curated content; no backend table yet.
  getExplore: () => localRepo.getExplore(),
  async getStamps() {
    const id = await uid();
    const row = must(await supabase.from('profiles').select('stamps').eq('id', id).single()) as { stamps: number };
    return row.stamps;
  },
  async addStamp(n = 1) {
    await uid();
    return must(await supabase.rpc('add_stamps', { n })) as number;
  },
};
