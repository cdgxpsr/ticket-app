import type { Board, BoardPost, Comment, Explore, FeedPost, NewBoardPost, NewReview, User } from './types';

/** Backend-agnostic data access. localRepo implements it today; a Supabase repo can drop in later. */
export interface Repo {
  me(): Promise<User>;
  getFeed(): Promise<FeedPost[]>;
  createReview(input: NewReview): Promise<FeedPost>;
  getPosts(board: Board): Promise<BoardPost[]>;
  getPost(id: string): Promise<BoardPost | undefined>;
  createPost(input: NewBoardPost): Promise<BoardPost>;
  /** Toggles like on a feed or board post; returns the updated post. */
  like(postId: string): Promise<FeedPost | BoardPost | undefined>;
  comment(postId: string, text: string): Promise<Comment>;
  getFriends(): Promise<User[]>;
  /** Adds a friend by invite code; throws Error with a Korean message on failure. */
  addFriend(code: string): Promise<User>;
  getExplore(): Promise<Explore>;
  /** Activity reward counter (paw stamps). No money involved. */
  getStamps(): Promise<number>;
  addStamp(n?: number): Promise<number>;
}
