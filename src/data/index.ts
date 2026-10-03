import { localRepo } from './localRepo';
import type { Repo } from './repo';

export const repo: Repo = localRepo;
export * from './types';
