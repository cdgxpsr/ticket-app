import { File, Paths } from 'expo-file-system';
import { background, cloudEnabled } from './cloud';
import { supabase, uid } from './supabase';

// Invite/referral state. Local file caches the code; Supabase (profiles.invite_code + claim_invite RPC) is authoritative.
type InviteState = { myCode?: string; referrerCode?: string; rewardClaimed?: boolean };

const store = () => new File(Paths.document, 'invite.json');
export const INVITE_BASE = 'https://nyangsucheop.app/i/';

function read(): InviteState {
  try {
    const f = store();
    return f.exists ? JSON.parse(f.textSync()) : {};
  } catch {
    return {};
  }
}

function write(s: InviteState) {
  const f = store();
  if (!f.exists) f.create();
  f.write(JSON.stringify(s));
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Sync accessor (cached). Call refreshMyInviteCode() to fetch the server-issued code. */
export function getMyInviteCode(): string {
  const s = read();
  if (s.myCode) return s.myCode;
  let code = '';
  for (let i = 0; i < 6; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  write({ ...s, myCode: code });
  background(refreshMyInviteCode);
  return code;
}

export async function refreshMyInviteCode(): Promise<string> {
  if (!cloudEnabled) return getMyInviteCode();
  const id = await uid();
  const { data, error } = await supabase.from('profiles').select('invite_code').eq('id', id).single();
  if (error) throw error;
  write({ ...read(), myCode: data.invite_code });
  return data.invite_code;
}

export const inviteLink = (code: string) => `${INVITE_BASE}${code}`;

export function saveReferrer(code: string) {
  const s = read();
  if (!s.referrerCode && code !== s.myCode) write({ ...s, referrerCode: code.toUpperCase() });
}

export function getInviteState(): InviteState {
  return read();
}

/** Calls claim_invite(code): sets referred_by once and grants an avatar item to both users. */
export async function claimInviteReward(): Promise<boolean> {
  const s = read();
  if (!s.referrerCode || s.rewardClaimed) return false;
  if (cloudEnabled) {
    await uid();
    const { data, error } = await supabase.rpc('claim_invite', { code: s.referrerCode });
    if (error) throw error;
    write({ ...read(), rewardClaimed: true });
    return data === true;
  }
  write({ ...s, rewardClaimed: true });
  return true;
}
