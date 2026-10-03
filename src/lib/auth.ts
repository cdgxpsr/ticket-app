import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { ensureSession, supabase, USE_LOCAL } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export type Provider = 'kakao' | 'google' | 'apple';

export const redirectTo = AuthSession.makeRedirectUri({ scheme: 'nyangsucheop', path: 'auth-callback' });

export async function isAnonymous(): Promise<boolean> {
  if (USE_LOCAL) return false;
  const s = await ensureSession();
  return !!s.user.is_anonymous;
}

// The login sheet resolves this when it closes (true = signed in, false = dismissed).
let waiter: ((ok: boolean) => void) | undefined;
export function resolveLogin(ok: boolean) {
  const w = waiter;
  waiter = undefined;
  w?.(ok);
}

/**
 * Deferred login gate for social actions. Returns true when the user has a real account
 * (possibly after showing the login sheet), so callers can resume the action:
 *   if (!(await requireAccount())) return;
 */
export async function requireAccount(): Promise<boolean> {
  try {
    if (!(await isAnonymous())) return true;
  } catch {
    return false;
  }
  resolveLogin(false); // drop any stale waiter
  const p = new Promise<boolean>((res) => (waiter = res));
  router.push('/login');
  return p;
}

/** Runs the OAuth web flow; prefers linkIdentity so the anonymous user's data stays put. */
async function oauth(provider: 'kakao' | 'google') {
  const { data: s } = await supabase.auth.getSession();
  const anon = !!s.session?.user.is_anonymous;
  const opts = { redirectTo, skipBrowserRedirect: true };
  const { data, error } = anon
    ? await supabase.auth.linkIdentity({ provider, options: opts })
    : await supabase.auth.signInWithOAuth({ provider, options: opts });
  if (error || !data?.url) throw error ?? new Error('로그인을 시작하지 못했어요');
  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== 'success') return false;
  const url = new URL(res.url);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  const err = url.searchParams.get('error_description') ?? hash.get('error_description');
  if (err) {
    // Identity already belongs to another account: sign into it and move anon data over.
    if (anon && /already/i.test(err)) return signInExisting(provider, s.session!.user.id);
    throw new Error(err);
  }
  const code = url.searchParams.get('code');
  if (code) {
    const { error: e } = await supabase.auth.exchangeCodeForSession(code);
    if (e) throw e;
  } else {
    const access_token = hash.get('access_token');
    const refresh_token = hash.get('refresh_token');
    if (!access_token || !refresh_token) throw new Error('로그인 응답이 올바르지 않아요');
    const { error: e } = await supabase.auth.setSession({ access_token, refresh_token });
    if (e) throw e;
  }
  return true;
}

async function signInExisting(provider: 'kakao' | 'google', oldUid: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
  if (error || !data?.url) throw error ?? new Error('로그인을 시작하지 못했어요');
  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== 'success') return false;
  const url = new URL(res.url);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  const code = url.searchParams.get('code');
  if (code) await supabase.auth.exchangeCodeForSession(code);
  else await supabase.auth.setSession({ access_token: hash.get('access_token')!, refresh_token: hash.get('refresh_token')! });
  await supabase.rpc('merge_anonymous', { old_uid: oldUid });
  return true;
}

/**
 * Apple (iOS native). signInWithIdToken cannot be linked to an anonymous user, so it creates/
 * signs into a separate user; we then move the anonymous user's rows with merge_anonymous().
 */
async function apple() {
  const { data: s } = await supabase.auth.getSession();
  const oldUid = s.session?.user.is_anonymous ? s.session.user.id : undefined;
  const raw = Crypto.randomUUID();
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
  let cred: AppleAuthentication.AppleAuthenticationCredential;
  try {
    cred = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hashed,
    });
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return false;
    throw e;
  }
  if (!cred.identityToken) throw new Error('Apple 로그인 정보를 받지 못했어요');
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken, nonce: raw });
  if (error) throw error;
  if (oldUid) {
    const { error: e } = await supabase.rpc('merge_anonymous', { old_uid: oldUid });
    if (e) console.warn('merge_anonymous failed', e.message);
  }
  return true;
}

export async function signInWith(provider: Provider): Promise<boolean> {
  if (provider === 'apple') return apple();
  return oauth(provider);
}

export const appleAvailable = () =>
  Platform.OS === 'ios' ? AppleAuthentication.isAvailableAsync() : Promise.resolve(false);

export async function signOut() {
  await supabase.auth.signOut();
}
