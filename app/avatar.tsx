import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvatarOptions, BACKS, BGS, BODIES, COATS, EXPRS, FACES } from '../src/avatar/cat';
import { CatAvatar } from '../src/components/CatAvatar';
import { getAvatar, getUnlockedItems, saveAvatar } from '../src/lib/avatar';
import { CATALOG, isOwned } from '../src/lib/shop';
import { colors, fonts } from '../src/theme';

type Key = keyof AvatarOptions;
type Item = { value: string; label: string };

const LABELS: Record<string, string> = {
  cheese: '치즈', white: '흰냥', black: '까망', gray: '회색', happy: '해맑음', derp: '메롱', deadpan: '무념무상', smug: '흐뭇',
  none: '없음', beret: '베레모', glasses: '안경', scarf: '목도리', bowtie: '나비넥타이',
};
const SLOT_LABEL: Record<Key, string> = { coat: '털색', expr: '표정', face: '얼굴', body: '몸', back: '등', bg: '배경' };
const label = (k: Key, v: string) => CATALOG.find((i) => i.slot === k && i.value === v)?.label ?? LABELS[v] ?? v;

// Option lists from cat.ts; items not in these lists are hidden.
const ALL: Record<Key, readonly string[]> = { coat: COATS, expr: EXPRS, face: FACES, body: BODIES, back: BACKS, bg: BGS };
const CATEGORIES = (Object.keys(SLOT_LABEL) as Key[]).map((key) => ({ key, label: SLOT_LABEL[key] }));

export default function AvatarScreen() {
  const [draft, setDraft] = useState<AvatarOptions>(getAvatar);
  const [tab, setTab] = useState<Key>('coat');
  const [hint, setHint] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  useEffect(() => void getUnlockedItems().then(setUnlocked).catch(() => {}), []);
  const items: Item[] = ALL[tab].map((value) => ({ value, label: label(tab, value) }));

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
      <Text style={styles.hint}>{hint ?? '잠긴 아이템은 냥냥상점에서 츄르로 살 수 있어요'}</Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {items.map((it) => {
          const locked = !isOwned(tab, it.value, unlocked);
          const on = draft[tab] === it.value;
          return (
            <Pressable
              key={it.value}
              style={[styles.cell, on && styles.cellOn]}
              onPress={() => (locked ? setHint(`${it.label}은(는) 냥냥상점에서 살 수 있어요`) : (setHint(null), setDraft({ ...draft, [tab]: it.value })))}
              accessibilityLabel={locked ? `${it.label}, 잠김` : it.label}
            >
              <View style={locked && styles.dim}><CatAvatar size={76} avatar={{ ...draft, [tab]: it.value }} /></View>
              <Text style={styles.cellLabel} numberOfLines={1}>{it.label}</Text>
              {locked ? <Text style={styles.lock}>상점에서 구매</Text> : null}
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
