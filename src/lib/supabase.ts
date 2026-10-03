import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type Session } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// Public values (publishable key is meant to ship in the app). Override via .env.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dvrznqbtjwksthzqxnpq.supabase.co';
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'sb_publishable_xC6WB8EdpLjxIQgVRRvicQ_zPUK2PEG';
export const USE_LOCAL = process.env.EXPO_PUBLIC_USE_LOCAL === '1';

const isServer = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: isServer ? undefined : AsyncStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});

if (!isServer) {
  AppState.addEventListener('change', (s) => {
    if (s === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

let pending: Promise<Session> | undefined;

/**
 * Growth-first: sign in anonymously on first launch so the user can start instantly.
 * TODO(auth): offer account linking later via supabase.auth.linkIdentity / updateUser({ email })
 * and Sign in with Apple (required on iOS once any social login is offered).
 */
export function ensureSession(): Promise<Session> {
  if (!pending) {
    pending = (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) return data.session;
      const { data: d, error } = await supabase.auth.signInAnonymously();
      if (error || !d.session) throw error ?? new Error('anonymous sign-in failed');
      return d.session;
    })();
    pending.catch(() => (pending = undefined));
  }
  return pending;
}

export async function uid(): Promise<string> {
  return (await ensureSession()).user.id;
}
