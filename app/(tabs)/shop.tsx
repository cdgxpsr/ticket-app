import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { AvatarOptions, BACKS, BGS, BODIES, COATS, EXPRS, FACES } from '../../src/avatar/cat';
import { CatAvatar } from '../../src/components/CatAvatar';
import { getAvatar, getUnlockedItems, saveAvatar } from '../../src/lib/avatar';
import { balance, buy, CATALOG, CHURU_PACKS, claimDaily, isOwned, itemLabel, PER_TICKET, SHOP_SLOTS, type ShopItem, type Slot } from '../../src/lib/shop';
import { colors, fonts } from '../../src/theme';

const TAG_COLOR: Record<string, string> = { NEW: '#4DC3FF', HOT: '#FF6B8B', 한정: '#FFC94D' };
const ALL: Record<Slot, readonly string[]> = { face: FACES, body: BODIES, back: BACKS, bg: BGS, coat: COATS, expr: EXPRS };
const OFF: Record<Slot, string> = { face: 'none', body: 'none', back: 'none', bg: 'none', coat: 'cheese', expr: 'happy' };

function Churu({ size = 14 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 19L17 5l3 3L8 22z" fill="#FF9F43" stroke="#7A3E10" strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M17 5l2-2 3 3-2 2z" fill="#FFE0B8" stroke="#7A3E10" strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

type Mode = 'shop' | 'inv';

export default function Shop() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [mode, setMode] = useState<Mode>('shop');
  const [saved, setSaved] = useState<AvatarOptions>(getAvatar);
  const [draft, setDraft] = useState<AvatarOptions>(getAvatar);
  const [slot, setSlot] = useState<Slot>('face');
  const [coins, setCoins] = useState(balance);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [, bump] = useState(0);
  const [charge, setCharge] = useState(false);

  useEffect(() => { if (params.tab === 'inv') setMode('inv'); }, [params.tab]);
  useFocusEffect(useCallback(() => {
    const a = getAvatar();
    setSaved(a);
    setDraft(a);
    if (claimDaily()) setTimeout(() => Alert.alert('출석 보상', '오늘 냥냥상점 방문으로 츄르 10개를 받았어요!'), 300);
    setCoins(balance());
    getUnlockedItems().then(setUnlocked).catch(() => {});
  }, []));

  const owned = (s: Slot, v: string) => isOwned(s, v, unlocked);
  const free = ALL[slot].filter((v) => v !== 'none' && !CATALOG.some((i) => i.slot === slot && i.value === v));
  const shopItems = CATALOG.filter((i) => i.slot === slot);
  const invItems = ALL[slot].filter((v) => owned(slot, v));
  const tried = CATALOG.filter((i) => draft[i.slot] === i.value && !owned(i.slot, i.value));
  const cost = tried.reduce((a, i) => a + i.price, 0);
  const changed = (Object.keys(draft) as Slot[]).some((k) => draft[k] !== saved[k]);
  const ownedCount = CATALOG.filter((i) => owned(i.slot, i.value)).length;

  const toggle = (s: Slot, v: string) => setDraft((d) => ({ ...d, [s]: d[s] === v && v !== OFF[s] ? OFF[s] : v }));
  const switchMode = (m: Mode) => {
    setMode(m);
    // Inventory only shows owned items, so drop unbought try-ons.
    if (m === 'inv') setDraft((d) => { const n = { ...d }; for (const i of tried) n[i.slot] = saved[i.slot] as never; return n; });
  };

  const purchase = () => {
    if (cost > coins) return Alert.alert('츄르가 부족해요', `${cost - coins}개가 더 필요해요.\n티켓을 기록하면 +${PER_TICKET}, 후기를 남기면 +50개를 받아요.`);
    Alert.alert('구매할까요?', `${tried.map((i) => i.label).join(', ')}\n츄르 ${cost}개`, [
      { text: '취소', style: 'cancel' },
      { text: '구매하고 착용', onPress: () => { tried.forEach(buy); saveAvatar(draft); setSaved(draft); setCoins(balance()); bump((n) => n + 1); } },
    ]);
  };
  const wear = () => { saveAvatar(draft); setSaved(draft); };

  const cell = (s: Slot, v: string, item?: ShopItem) => {
    const has = owned(s, v);
    const on = draft[s] === v;
    return (
      <Pressable key={v} style={[styles.cell, on && styles.cellOn]} onPress={() => toggle(s, v)}
        accessibilityLabel={`${itemLabel(s, v)}${has ? ', 보유 중' : item ? `, 츄르 ${item.price}` : ''}`}>
        {mode === 'shop' && !!item?.tag && !has && <View style={[styles.tag, { backgroundColor: TAG_COLOR[item.tag] }]}><Text style={styles.tagText}>{item.tag}</Text></View>}
        {mode === 'inv' && saved[s] === v && <View style={[styles.tag, { backgroundColor: colors.accent }]}><Text style={styles.tagText}>착용 중</Text></View>}
        <CatAvatar size={76} avatar={{ ...draft, [s]: v }} />
        <Text style={styles.cellLabel} numberOfLines={1}>{itemLabel(s, v)}</Text>
        {mode === 'shop' && (has ? <Text style={styles.owned}>보유 중</Text> : (
          <View style={styles.price}><Churu size={12} /><Text style={styles.priceText}>{item?.price}</Text></View>
        ))}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.head}>
        <View style={styles.modes}>
          {([['shop', '상점'], ['inv', '인벤토리']] as const).map(([m, label]) => (
            <Pressable key={m} onPress={() => switchMode(m)} hitSlop={6} accessibilityRole="tab" accessibilityState={{ selected: mode === m }}>
              <Text style={[styles.mode, mode === m && styles.modeOn]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.wallet} onPress={() => setCharge(true)} accessibilityLabel={`츄르 ${coins}개, 충전하기`}>
          <Churu /><Text style={styles.walletText}>{coins.toLocaleString()}</Text><Text style={styles.plus}>＋</Text>
        </Pressable>
      </View>
      <View style={styles.stage}>
        <CatAvatar size={170} avatar={draft} />
        <Text style={styles.fitting}>{mode === 'shop' ? '피팅룸 · 눌러서 미리 입어 보세요' : `보유 아이템 ${ownedCount}개 · 눌러서 착용해요`}</Text>
        {changed && <Pressable style={styles.reset} onPress={() => setDraft(saved)}><Text style={styles.resetText}>원래대로</Text></Pressable>}
      </View>
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {SHOP_SLOTS.map((s) => (
            <Pressable key={s.key} onPress={() => setSlot(s.key)} style={[styles.tab, slot === s.key && styles.tabOn]}>
              <Text style={[styles.tabText, slot === s.key && styles.tabTextOn]}>{s.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {mode === 'shop' ? [...free.map((v) => cell(slot, v)), ...shopItems.map((i) => cell(i.slot, i.value, i))] : invItems.map((v) => cell(slot, v))}
        <Text style={styles.how}>츄르 모으는 법 · 티켓 기록 +{PER_TICKET} · 후기 작성 +50 · 매일 상점 방문 +10</Text>
      </ScrollView>
      {changed && (
        <View style={styles.bar}>
          {cost > 0 ? (
            <Pressable style={styles.buy} onPress={purchase}><Churu size={16} /><Text style={styles.buyText}>{cost.toLocaleString()} · 구매하고 착용</Text></Pressable>
          ) : (
            <Pressable style={styles.buy} onPress={wear}><Text style={styles.buyText}>이대로 착용하기</Text></Pressable>
          )}
        </View>
      )}
      <Modal visible={charge} transparent animationType="slide" onRequestClose={() => setCharge(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCharge(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>츄르 충전</Text>
              <View style={styles.wallet}><Churu /><Text style={styles.walletText}>{coins.toLocaleString()}</Text></View>
            </View>
            {CHURU_PACKS.map((p) => (
              <Pressable key={p.amount} style={styles.pack}
                onPress={() => Alert.alert('결제는 정식 출시 때 열려요', '지금은 테스트 기간이라 결제를 받지 않아요.\n티켓 기록, 후기, 매일 방문으로 츄르를 모아 보세요!')}>
                <Churu size={22} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.packAmount}>츄르 {p.amount.toLocaleString()}개{p.bonus ? <Text style={styles.bonus}>  +{p.bonus} 보너스</Text> : null}</Text>
                  {!!p.tag && <Text style={styles.best}>{p.tag}</Text>}
                </View>
                <View style={styles.priceBtn}><Text style={styles.priceBtnText}>{p.price}</Text></View>
              </Pressable>
            ))}
            <Text style={styles.how}>무료로 모으기 · 티켓 기록 +{PER_TICKET} · 후기 작성 +50 · 매일 상점 방문 +10</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  modes: { flexDirection: 'row', alignItems: 'baseline', gap: 16 },
  mode: { color: '#6F6680', fontFamily: fonts.bold, fontSize: 22, lineHeight: 30 },
  modeOn: { color: colors.text, fontSize: 28, lineHeight: 36 },
  wallet: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: colors.border },
  plus: { color: colors.accent, fontFamily: fonts.bold, fontSize: 15, marginLeft: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, gap: 10 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sheetTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 22, lineHeight: 30 },
  pack: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  packAmount: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
  bonus: { color: '#FFC27A', fontFamily: fonts.semibold, fontSize: 13 },
  best: { color: '#FF6B8B', fontFamily: fonts.bold, fontSize: 11, lineHeight: 15 },
  priceBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  priceBtnText: { color: colors.bg, fontFamily: fonts.bold, fontSize: 14, lineHeight: 19 },
  walletText: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  stage: { marginHorizontal: 16, alignItems: 'center', paddingVertical: 10, borderRadius: 24, backgroundColor: '#2A2440', borderWidth: 1, borderColor: '#3A3352' },
  fitting: { color: '#A99FC0', fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  reset: { position: 'absolute', right: 12, top: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)' },
  resetText: { color: '#fff', fontFamily: fonts.semibold, fontSize: 12 },
  tabsWrap: { height: 60 },
  tabs: { gap: 8, paddingHorizontal: 16, alignItems: 'center' },
  tab: { height: 36, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  tabOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  tabTextOn: { color: colors.bg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, paddingBottom: 100 },
  cell: { width: '31%', alignItems: 'center', paddingVertical: 10, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border },
  cellOn: { borderColor: colors.accent },
  tag: { position: 'absolute', left: 6, top: 6, zIndex: 1, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  tagText: { color: '#1A1A1A', fontFamily: fonts.bold, fontSize: 10, lineHeight: 14 },
  cellLabel: { color: colors.text, fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, marginTop: 4 },
  owned: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 12, lineHeight: 17, marginTop: 2 },
  price: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  priceText: { color: '#FFC27A', fontFamily: fonts.bold, fontSize: 12, lineHeight: 17 },
  how: { width: '100%', color: '#7D748A', fontFamily: fonts.regular, fontSize: 12, textAlign: 'center', marginTop: 8 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  buy: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 15 },
  buyText: { color: colors.bg, fontFamily: fonts.bold, fontSize: 16 },
});
