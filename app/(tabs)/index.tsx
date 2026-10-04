import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CULTURE_CATEGORIES, KOBIS_CREDIT, REGIONS, KMDB_CREDIT, httpsUrl, formatPeriod, getCultureEvents, districtOf, type CultureEvent } from '../../src/data/culture';
import { colors, fonts } from '../../src/theme';

const REGION_KEY = 'explore.region';
const CAT_COLOR: Record<string, string> = { 영화: '#5B4B8A', 공연: '#8A3B5B', 전시: '#2F6B6B', 축제: '#A0522D', 액티비티: '#3E6B3A', 숙박: '#4A5A80' };

const st = { strokeWidth: 1.7, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const ICONS: Record<string, (c: string) => React.ReactNode> = {
  전체: (c) => (<><Rect x={4} y={4} width={6.5} height={6.5} rx={1.6} stroke={c} {...st} /><Rect x={13.5} y={4} width={6.5} height={6.5} rx={1.6} stroke={c} {...st} /><Rect x={4} y={13.5} width={6.5} height={6.5} rx={1.6} stroke={c} {...st} /><Rect x={13.5} y={13.5} width={6.5} height={6.5} rx={1.6} stroke={c} {...st} /></>),
  영화: (c) => (<><Rect x={3.5} y={6} width={17} height={13} rx={2} stroke={c} {...st} /><Path d="M3.5 10h17M8 6l2 4M13 6l2 4" stroke={c} {...st} /></>),
  공연: (c) => (<><Path d="M4 5h16v5a8 8 0 01-16 0z" stroke={c} {...st} /><Path d="M9 10h.01M15 10h.01M9.5 14c1.5 1.2 3.5 1.2 5 0" stroke={c} {...st} /></>),
  전시: (c) => (<><Rect x={4} y={4} width={16} height={16} rx={2} stroke={c} {...st} /><Path d="M4 16l5-5 4 4 2-2 5 5" stroke={c} {...st} /><Circle cx={15.5} cy={8.5} r={1.5} stroke={c} {...st} /></>),
  축제: (c) => (<><Path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke={c} {...st} /><Circle cx={12} cy={12} r={2.5} stroke={c} {...st} /></>),
  액티비티: (c) => (<Path d="M3 19l6-10 4 6 3-4 5 8z" stroke={c} {...st} />),
  숙박: (c) => (<><Path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 00-3-3h-7v5" stroke={c} {...st} /><Circle cx={7} cy={11} r={1.8} stroke={c} {...st} /></>),
};


export default function Explore() {
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('전국');
  const [ccat, setCcat] = useState('전체');
  const [events, setEvents] = useState<CultureEvent[]>();
  const [sample, setSample] = useState(false);
  const [district, setDistrict] = useState('전체');
  const [panel, setPanel] = useState<'region' | 'cat' | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(REGION_KEY).then((r) => r && (REGIONS as readonly string[]).includes(r) && setRegion(r)).catch(() => {});
  }, []);
  useEffect(() => {
    let alive = true;
    setEvents(undefined);
    getCultureEvents(region, ccat).then((r) => {
      if (!alive) return;
      setEvents(r.events);
      setSample(r.sample);
    });
    return () => { alive = false; };
  }, [region, ccat]);
  const pickRegion = (r: string) => {
    setRegion(r);
    setDistrict('전체');
    AsyncStorage.setItem(REGION_KEY, r).catch(() => {});
  };
  const districts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of events ?? []) { const d = districtOf(e); if (d) m.set(d, (m.get(d) ?? 0) + 1); }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ko'));
  }, [events]);
  const shown = (events ?? []).filter((e) =>
    (district === '전체' || districtOf(e) === district) && (!q.trim() || e.title.includes(q.trim()) || (e.venue ?? '').includes(q.trim())));


  const total = shown.length;
  const catLabel = ccat === '전체' ? '전체' : ccat;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.head}>
        <Text style={styles.title}>둘러보기</Text>
        <View style={styles.search}>
          <Svg width={18} height={18} viewBox="0 0 24 24"><Circle cx={11} cy={11} r={6.5} stroke="#8E859A" strokeWidth={1.8} fill="none" /><Path d="M16 16l4 4" stroke="#8E859A" strokeWidth={1.8} strokeLinecap="round" /></Svg>
          <TextInput value={q} onChangeText={setQ} placeholder="전시, 공연, 영화, 장소 검색" placeholderTextColor="#8E859A" style={styles.input} />
        </View>
        <View style={styles.filterBar}>
          {(['region', 'cat'] as const).map((k, i) => {
            const on = panel === k;
            const label = k === 'region' ? (district === '전체' ? region : `${region} ${district}`) : ccat === '전체' ? '종류 전체' : ccat;
            return (
              <Pressable key={k} onPress={() => setPanel(on ? null : k)} style={[styles.filterBtn, i === 0 && styles.filterFirst, on && styles.filterOn]} accessibilityRole="button" accessibilityState={{ expanded: on }}>
                <Text style={[styles.filterLabel, on && styles.filterLabelOn]} numberOfLines={1}>{label}</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24"><Path d={on ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} stroke={on ? '#fff' : '#8E859A'} strokeWidth={2} fill="none" strokeLinecap="round" /></Svg>
              </Pressable>
            );
          })}
        </View>
        {panel === 'region' && (
          <View style={styles.panel}>
            <ScrollView style={styles.sidoCol} contentContainerStyle={{ paddingVertical: 6 }}>
              {REGIONS.map((r) => {
                const on = r === region;
                return (
                  <Pressable key={r} onPress={() => pickRegion(r)} style={[styles.sido, on && styles.sidoOn]}>
                    <Text style={[styles.sidoText, on && styles.sidoTextOn]}>{r}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.guWrap}>
              {region === '전국' ? (
                <Text style={styles.muted}>← 지역을 선택해 주세요</Text>
              ) : !events ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                [['전체', events.length] as [string, number], ...districts].map(([d, n]) => {
                  const on = d === district;
                  return (
                    <Pressable key={d} onPress={() => { setDistrict(d); setPanel(null); }} style={[styles.gu, on && styles.guOn]}>
                      <Text style={[styles.guText, on && styles.sidoTextOn]}>{d === '전체' ? `${region} 전체` : d}</Text>
                      <Text style={styles.guCount}>{n}</Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}
        {panel === 'cat' && (
          <View style={[styles.panel, styles.catPanel]}>
            {CULTURE_CATEGORIES.map((c) => {
              const on = c === ccat;
              const color = on ? colors.accent : '#9A90A8';
              return (
                <Pressable key={c} onPress={() => { setCcat(c); setPanel(null); }} style={[styles.catCell, on && styles.catCellOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
                  <Svg width={24} height={24} viewBox="0 0 24 24">{ICONS[c]?.(color)}</Svg>
                  <Text style={[styles.catText, on && styles.sidoTextOn]}>{c}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.main}>
        <View style={styles.listHead}>
          <Text style={styles.listTitle}>{region}{district !== '전체' ? ` ${district}` : ''} · {catLabel}</Text>
          {!!events && <Text style={styles.count}>{total}</Text>}
        </View>
        {sample && <Text style={styles.note}>예시 정보를 보여주고 있어요 · 매일 새벽 최신 정보로 갱신돼요</Text>}
        {!events ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />
        ) : total === 0 ? (
          <View style={styles.empty}><Text style={styles.muted}>조건에 맞는 {ccat === '전체' ? '문화 소식' : ccat}이 아직 없어요</Text></View>
        ) : (
          <View style={{ gap: 10 }}>
            {shown.slice(0, 80).map((e) => (
              <Pressable key={e.id} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}>
                {e.image_url ? (
                  <Image source={{ uri: httpsUrl(e.image_url)! }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: CAT_COLOR[e.category] ?? colors.border, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={styles.thumbText}>{e.category}</Text>
                  </View>
                )}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.badge}>{e.category} · {e.region}{districtOf(e) ? ` ${districtOf(e)}` : ''}</Text>
                  <Text style={styles.cardTitle} numberOfLines={2}>{e.title}</Text>
                  {!!(e.venue || e.address) && <Text style={styles.muted} numberOfLines={1}>{e.venue || e.address}</Text>}
                  <Text style={styles.muted}>{formatPeriod(e)}</Text>
                </View>
              </Pressable>
            ))}
            {shown.some((e) => e.category === '영화') && <Text style={styles.credit}>{KOBIS_CREDIT}</Text>}
            {shown.some((e) => e.poster_source === 'kmdb') && <Text style={styles.credit}>{KMDB_CREDIT}</Text>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  head: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, gap: 10 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 28, paddingHorizontal: 4 },
  search: { height: 46, borderRadius: 14, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15 },
  filterBar: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  filterBtn: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, backgroundColor: colors.surface },
  filterFirst: { borderRightWidth: 1, borderRightColor: colors.border },
  filterOn: { backgroundColor: '#3A3550' },
  filterLabel: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  filterLabelOn: { color: '#fff' },
  panel: { flexDirection: 'row', height: 300, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' },
  sidoCol: { width: 96, flexGrow: 0, borderRightWidth: 1, borderRightColor: colors.border },
  sido: { paddingVertical: 10, paddingHorizontal: 16 },
  sidoOn: { backgroundColor: colors.bg },
  sidoText: { color: '#9A90A8', fontFamily: fonts.regular, fontSize: 14 },
  sidoTextOn: { color: colors.accent, fontFamily: fonts.bold },
  guWrap: { padding: 10, gap: 2 },
  gu: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 10, borderRadius: 10 },
  guOn: { backgroundColor: colors.bg },
  guText: { color: colors.text, fontFamily: fonts.regular, fontSize: 14 },
  guCount: { color: '#7D748A', fontFamily: fonts.regular, fontSize: 12 },
  catPanel: { height: undefined, flexWrap: 'wrap', padding: 10, gap: 8 },
  catCell: { width: '30.5%', alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.bg, borderWidth: 1, borderColor: 'transparent' },
  catCellOn: { borderColor: colors.accent },
  catText: { color: colors.text, fontFamily: fonts.regular, fontSize: 13 },
  main: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40, gap: 12 },
  listHead: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  listTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 17, letterSpacing: -0.4 },
  count: { color: colors.accent, fontFamily: fonts.bold, fontSize: 15 },
  note: { color: '#8E859A', fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  empty: { paddingVertical: 32, alignItems: 'center' },
  muted: { color: '#8E859A', fontFamily: fonts.regular, fontSize: 13 },
  credit: { color: '#6F6680', fontFamily: fonts.regular, fontSize: 11 },
  card: { flexDirection: 'row', gap: 12, padding: 10, borderRadius: 16, backgroundColor: colors.surface },
  thumb: { width: 72, height: 96, borderRadius: 10, overflow: 'hidden' },
  thumbText: { color: '#fff', fontFamily: fonts.bold, fontSize: 14 },
  badge: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 12 },
  cardTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, letterSpacing: -0.3 },
});
