import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Comment, Show } from '../data/types';
import { colors, fonts } from '../theme';
import { CatAvatar } from './CatAvatar';
import { t } from '../i18n';

export function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return t('방금');
  if (m < 60) return t('{n}분 전', { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t('{n}시간 전', { n: h });
  const d = Math.floor(h / 24);
  return d === 1 ? t('어제') : t('{n}일 전', { n: d });
}

export const CATEGORY_COLORS: Record<string, string> = {
  영화: '#1E3A5F', 뮤지컬: '#7F1D2D', 연극: '#5A3446', 콘서트: '#4C1D95', 공연: '#4C1D95', 전시: '#2D4A3E', 박물관: '#8A6D3B', 스포츠: '#14532D', 액티비티: '#7C4A1E', 기타: '#3A2E4A',
};

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: !!on }}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const STAR = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z';
function Star({ fill, size }: { fill: 0 | 0.5 | 1; size: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d={STAR} fill={colors.border} /></Svg>
      {fill > 0 && (
        <View style={{ position: 'absolute', left: 0, top: 0, width: size * fill, height: size, overflow: 'hidden' }}>
          <Svg width={size} height={size} viewBox="0 0 24 24"><Path d={STAR} fill={colors.accent} /></Svg>
        </View>
      )}
    </View>
  );
}

/** 5-star rating with half steps. Tap the left half of a star for .5. */
export function Stars({ value, size = 16, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: size / 6 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = value >= i ? 1 : value >= i - 0.5 ? 0.5 : 0;
        if (!onChange) return <Star key={i} fill={fill} size={size} />;
        return (
          <View key={i} style={{ width: size, height: size }}>
            <Star fill={fill} size={size} />
            <View style={StyleSheet.absoluteFill}>
              <View style={{ flexDirection: 'row', flex: 1 }}>
                <Pressable style={{ flex: 1 }} onPress={() => onChange(i - 0.5)} accessibilityLabel={t('{n}점', { n: i - 0.5 })} />
                <Pressable style={{ flex: 1 }} onPress={() => onChange(i)} accessibilityLabel={t('{n}점', { n: i })} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function MiniTicket({ show }: { show: Show }) {
  return (
    <View style={[styles.mini, { backgroundColor: show.color }]}>
      <Text style={styles.miniCat}>{show.category}</Text>
      <View style={styles.miniPerf} />
    </View>
  );
}

export function CommentList({ comments }: { comments: Comment[] }) {
  if (!comments.length) return <Text style={styles.muted}>{t('아직 댓글이 없어요')}</Text>;
  return (
    <View style={{ gap: 14 }}>
      {comments.map((c) => (
        <View key={c.id} style={{ flexDirection: 'row', gap: 10 }}>
          <CatAvatar size={30} avatar={c.author.avatar} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.small}><Text style={styles.bold}>{c.author.name}</Text>  <Text style={styles.muted}>{timeAgo(c.createdAt)}</Text></Text>
            <Text style={styles.body}>{c.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ---- Toast ----
type Listener = (msg: string) => void;
const listeners = new Set<Listener>();
export function showToast(msg: string) {
  listeners.forEach((l) => l(msg));
}
export function ToastHost() {
  const [msg, setMsg] = useState('');
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l: Listener = (m) => {
      setMsg(m);
      op.stopAnimation();
      Animated.sequence([
        Animated.timing(op, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(op, { toValue: 0, duration: 240, useNativeDriver: true }),
      ]).start();
    };
    listeners.add(l);
    return () => void listeners.delete(l);
  }, [op]);
  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { opacity: op }]}>
      <Text style={styles.toastText}>{msg}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: { height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: '#231E2B', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.text },
  chipText: { color: '#CFC7D9', fontFamily: fonts.semibold, fontSize: 14 },
  chipTextOn: { color: colors.bg },
  mini: { width: 54, height: 74, borderRadius: 8, padding: 6, overflow: 'hidden' },
  miniCat: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.semibold, fontSize: 10 },
  miniPerf: { position: 'absolute', left: 0, right: 0, bottom: 18, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.35)' },
  muted: { color: '#8E859A', fontFamily: fonts.regular, fontSize: 13 },
  small: { fontSize: 13 },
  bold: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  body: { color: '#D9D1E3', fontFamily: fonts.regular, fontSize: 14, lineHeight: 21 },
  toast: { position: 'absolute', bottom: 110, alignSelf: 'center', backgroundColor: colors.text, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22 },
  toastText: { color: colors.bg, fontFamily: fonts.semibold, fontSize: 14 },
});
