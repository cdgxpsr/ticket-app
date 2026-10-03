import { File, Paths } from 'expo-file-system';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { background } from './cloud';
import { supabase, uid } from './supabase';
import { AvatarOptions, BACKS, BGS, BODIES, COATS, DEFAULT_AVATAR, EXPRS, FACES } from '../avatar/cat';

const store = () => new File(Paths.document, 'avatar.json');

export function getAvatar(): AvatarOptions {
  try {
    const f = store();
    if (!f.exists) return DEFAULT_AVATAR;
    const d = JSON.parse(f.textSync());
    const pick = <T extends string>(list: readonly T[], v: unknown, fb: T): T => (list.includes(v as T) ? (v as T) : fb);
    return {
      coat: pick(COATS, d.coat, DEFAULT_AVATAR.coat),
      expr: pick(EXPRS, d.expr, DEFAULT_AVATAR.expr),
      face: pick(FACES, d.face, DEFAULT_AVATAR.face),
      body: pick(BODIES, d.body, DEFAULT_AVATAR.body),
      back: pick(BACKS, d.back, DEFAULT_AVATAR.back),
      bg: pick(BGS, d.bg, DEFAULT_AVATAR.bg),
    };
  } catch {
    return DEFAULT_AVATAR;
  }
}

export function saveAvatar(a: AvatarOptions) {
  const f = store();
  if (!f.exists) f.create();
  f.write(JSON.stringify(a));
  background(async () => {
    const id = await uid();
    const { error } = await supabase.from('profiles').update({ avatar: a }).eq('id', id);
    if (error) throw error;
  });
}

/** Avatar items unlocked server-side (e.g. invite rewards), as "slot:value" strings. */
export async function getUnlockedItems(): Promise<string[]> {
  const id = await uid();
  const { data } = await supabase.from('profiles').select('items').eq('id', id).single();
  return (data?.items as string[] | undefined) ?? [];
}

/** Saved avatar, refreshed whenever the screen regains focus. */
export function useSavedAvatar(): AvatarOptions {
  const [a, setA] = useState<AvatarOptions>(getAvatar);
  useFocusEffect(useCallback(() => setA(getAvatar()), []));
  return a;
}
