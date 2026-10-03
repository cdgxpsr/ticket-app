import { useMemo } from 'react';
import { SvgXml } from 'react-native-svg';
import { AvatarOptions, catSvg } from '../avatar/cat';
import { useSavedAvatar } from '../lib/avatar';

/** Renders the given avatar options; without `avatar`, renders the user's saved avatar. */
export function CatAvatar({ size = 64, avatar }: { size?: number; avatar?: Partial<AvatarOptions> }) {
  if (avatar) return <CatSvg size={size} avatar={avatar} />;
  return <SavedCat size={size} />;
}

function SavedCat({ size }: { size: number }) {
  const saved = useSavedAvatar();
  return <CatSvg size={size} avatar={saved} />;
}

function CatSvg({ size, avatar }: { size: number; avatar: Partial<AvatarOptions> }) {
  const xml = useMemo(() => catSvg(avatar), [avatar.coat, avatar.expr, avatar.face, avatar.body, avatar.back, avatar.bg]);
  return <SvgXml xml={xml} width={size} height={size} />;
}
