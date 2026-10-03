import { File, Paths } from 'expo-file-system';

// Local-only invite/referral state. Reward granting is a stub:
// a backend is needed to verify codes and grant items to both inviter and invitee.
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

export function getMyInviteCode(): string {
  const s = read();
  if (s.myCode) return s.myCode;
  let code = '';
  for (let i = 0; i < 6; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  write({ ...s, myCode: code });
  return code;
}

export const inviteLink = (code: string) => `${INVITE_BASE}${code}`;

export function saveReferrer(code: string) {
  const s = read();
  if (!s.referrerCode && code !== s.myCode) write({ ...s, referrerCode: code.toUpperCase() });
}

export function getInviteState(): InviteState {
  return read();
}

// TODO(backend): POST /referrals/claim { referrerCode } to grant avatar items to both users.
export async function claimInviteReward(): Promise<boolean> {
  const s = read();
  if (!s.referrerCode || s.rewardClaimed) return false;
  write({ ...s, rewardClaimed: true });
  return true;
}
