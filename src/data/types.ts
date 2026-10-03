import type { AvatarOptions } from '../avatar/cat';

export type User = { id: string; name: string; avatar: Partial<AvatarOptions>; code: string };

export type Show = { id: string; title: string; category: string; venue?: string; date?: string; color: string };

export type Comment = { id: string; author: User; text: string; createdAt: number };

export type FeedPost = {
  id: string;
  author: User;
  show: Show;
  rating: number; // 0.5 ~ 5, half steps
  text: string;
  createdAt: number;
  likes: number;
  liked: boolean;
  comments: Comment[];
  cardId?: string;
};

export const BOARDS = ['라운지', '챌린지', '질문', '인생 공연'] as const;
export type Board = (typeof BOARDS)[number];

export type BoardPost = {
  id: string;
  board: Board;
  author: User;
  title: string;
  body: string;
  tag?: string;
  verified?: boolean;
  createdAt: number;
  likes: number;
  liked: boolean;
  comments: Comment[];
};

export type ExploreItem = Show & { rating: number; reviews: number };
export type Place = { id: string; name: string; info: string };
export type Explore = { categories: string[]; popular: ExploreItem[]; nearby: Place[] };

export type NewReview = { show: Show; rating: number; text: string; cardId?: string };
export type NewBoardPost = { board: Board; title: string; body: string; tag?: string };
