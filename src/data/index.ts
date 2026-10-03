import { USE_LOCAL } from '../lib/supabase';
import { localRepo } from './localRepo';
import type { Repo } from './repo';
import { supabaseRepo } from './supabaseRepo';

/** Supabase by default; EXPO_PUBLIC_USE_LOCAL=1 switches to the on-device repo (offline/dev). */
export const repo: Repo = USE_LOCAL ? localRepo : supabaseRepo;
export * from './types';
