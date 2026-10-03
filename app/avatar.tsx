import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvatarOptions, BACKS, BGS, BODIES, COATS, EXPRS, FACES } from '../src/avatar/cat';
import { CatAvatar } from '../src/components/CatAvatar';
import { getAvatar, saveAvatar } from '../src/lib/avatar';
import { listCards } from '../src/lib/cards';
import { colors, fonts } from '../src/theme';

type Key = keyof AvatarOptions;
type Item = { value: string; label: string; need?: number };

// Items unlock by registered ticket count: a reward for activity.
const CATEGORIES: { key: Key; label: string; items: Item[] }[] = [
  { key: 'coat', label: '털색', items: [
    { value: 'cheese', label: '치즈' }, { value: 'white', label: '흰냥' }, { value: 'black', label: '까망' },
    { value: 'gray', label: '회색' }, { value: 'calico', label: '삼색', need: 3 },
  ] },
  { key: 'expr', label: '표정', items: [
    { value: 'happy', label: '해맑음' }, { value: 'derp', label: '메롱' }, { value: 'deadpan', label: '무념무상' },
    { value: 'smug', label: '흐뭇' }, { value: 'sparkle', label: '초롱초롱', need: 3 },
  ] },
  { key: 'face', label: '얼굴', items: [
    { value: 'none', label: '없음' }, { value: 'beret', label: '베레모' }, { value: 'glasses', label: '안경' },
    { value: 'flower', label: '꽃', need: 1 }, { value: 'shades', label: '선글라스', need: 3 }, { value: 'crown', label: '왕관', need: 10 },
  ] },
  { key: 'body', label: '몸', items: [
    { value: 'none', label: '없음' }, { value: 'scarf', label: '목도리' }, { value: 'bowtie', label: '나비넥타이' },
    { value: 'ticketbag', label: '티켓 가방', need: 5 },
  ] },
  { key: 'back', label: '등', items: [
    { value: 'none', label: '없음' }, { value: 'balloon', label: '풍선', need: 1 }, { value: 'cape', label: '망토', need: 5 },
    { value: 'wings', label: '날개', need: 10 },
  ] },
  { key: 'bg', label: '배경', items: [
    { value: 'none', label: '없음' }, { value: 'stage', label: '무대', need: 1 }, { value: 'museum', label: '미술관', need: 3 },
    { value: 'paris', label: '파리', need: 5 }, { value: 'night', label: '밤하늘', need: 10 },
  ] },
];

// Option lists from cat.ts; items not in these lists are hidden.
const ALL: Record<Key, readonly string[]> = { coat: COATS, expr: EXPRS, face: FACES, body: BODIES, back: BACKS, bg: BGS };

export default function AvatarScreen() {
  const [draft, setDraft] = useState<AvatarOptions>(getAvatar);
  const [tab, setTab] = useState<Key>('coat');
  const [hint, setHint] = useState<string | null>(null);
  const count = useMemo(() => listCards().length, []);
  const cat = CATEGORIES.find((c) => c.key === tab)!;
  const items = cat.items.filter((i) => ALL[tab].includes(i.value));

  const save = () => {
    saveAvatar(draft);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><Text style={styles.close}>닫기</Text></Pressable>
        <Text style={styles.title}>내 고양이 꾸미기</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.preview}><CatAvatar size={220} avatar={draft} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {CATEGORIES.map((c) => (
          <Pressable key={c.key} onPress={() => { setTab(c.key); setHint(null); }} style={[styles.tab, tab === c.key && styles.tabOn]}>
            <Text style={[styles.tabText, tab === c.key && styles.tabTextOn]}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.hint}>{hint ?? `등록한 티켓 ${count}장`}</Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {items.map((it) => {
          const locked = (it.need ?? 0) > count;
          const on = draft[tab] === it.value;
          return (
            <Pressable
              key={it.value}
              style={[styles.cell, on && styles.cellOn]}
              onPress={() => (locked ? setHint(`티켓 ${it.need}장 등록하면 열려요`) : (setHint(null), setDraft({ ...draft, [tab]: it.value })))}
              accessibilityLabel={locked ? `${it.label}, 잠김` : it.label}
            >
              <View style={locked && styles.dim}><CatAvatar size={76} avatar={{ ...draft, [tab]: it.value }} /></View>
              <Text style={styles.cellLabel} numberOfLines={1}>{it.label}</Text>
              {locked ? <Text style={styles.lock}>잠김 · 티켓 {it.need}장</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable style={styles.save} onPress={save}><Text style={styles.saveText}>저장</Text></Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  close: { color: colors.muted, fontFamily: fonts.regular, fontSize: 15 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 18 },
  preview: { alignItems: 'center', marginHorizontal: 20, paddingVertical: 12, backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border },
  tabs: { gap: 8, paddingHorizontal: 20, paddingVertical: 14 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  tabOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 14 },
  tabTextOn: { color: colors.bg },
  hint: { color: colors.accent, fontFamily: fonts.regular, fontSize: 13, paddingHorizontal: 20, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, paddingBottom: 16 },
  cell: { width: '31%', alignItems: 'center', paddingVertical: 10, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border },
  cellOn: { borderColor: colors.accent },
  dim: { opacity: 0.35 },
  cellLabel: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  lock: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, marginTop: 2 },
  save: { marginHorizontal: 20, marginBottom: 8, backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  saveText: { color: colors.bg, fontFamily: fonts.bold, fontSize: 16 },
});
