import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '../../src/components/Social';
import { repo, type Explore as ExploreData } from '../../src/data';
import { CULTURE_CATEGORIES, KOBIS_CREDIT, REGIONS, KMDB_CREDIT, httpsUrl, formatPeriod, getCultureEvents, type CultureEvent } from '../../src/data/culture';
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

const GROUP: Record<string, string[]> = { 공연: ['공연', '뮤지컬', '연극', '콘서트'], 전시: ['전시', '박물관'], 영화: ['영화'], 액티비티: ['액티비티', '스포츠'] };

export default function Explore() {
  const [data, setData] = useState<ExploreData>();
  const [cat, setCat] = useState('전체');
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('전국');
  const [ccat, setCcat] = useState('전체');
  const [events, setEvents] = useState<CultureEvent[]>();
  const [sample, setSample] = useState(false);
  useEffect(() => void repo.getExplore().then(setData).catch(() => {}), []);
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
    AsyncStorage.setItem(REGION_KEY, r).catch(() => {});
  };
  const shown = (events ?? []).filter((e) => !q.trim() || e.title.includes(q.trim()) || (e.venue ?? '').includes(q.trim()));

  const popular = (data?.popular ?? []).filter(
    (p) => (cat === '전체' || (GROUP[cat] ?? [cat]).includes(p.category)) && (!q.trim() || p.title.includes(q.trim()) || (p.venue ?? '').includes(q.trim())),
  );
  const nearby = (data?.nearby ?? []).filter((n) => !q.trim() || n.name.includes(q.trim()));

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
      </View>
      <View style={styles.body}>
        <ScrollView style={styles.rail} contentContainerStyle={styles.railContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.railHead}>종류</Text>
          {CULTURE_CATEGORIES.map((c) => {
            const on = c === ccat;
            const color = on ? colors.accent : '#7D748A';
            return (
              <Pressable key={c} onPress={() => setCcat(c)} style={styles.railItem} accessibilityRole="button" accessibilityState={{ selected: on }}>
                {on && <View style={styles.bar} />}
                <Svg width={22} height={22} viewBox="0 0 24 24">{ICONS[c]?.(color)}</Svg>
                <Text style={[styles.railLabel, on && styles.railLabelOn]}>{c}</Text>
              </Pressable>
            );
          })}
          <View style={styles.divider} />
          <Text style={styles.railHead}>지역</Text>
          {REGIONS.map((r) => {
            const on = r === region;
            return (
              <Pressable key={r} onPress={() => pickRegion(r)} style={styles.regionItem} accessibilityRole="button" accessibilityState={{ selected: on }}>
                {on && <View style={styles.bar} />}
                <Text style={[styles.regionLabel, on && styles.railLabelOn]}>{r}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.main}>
          <View style={styles.listHead}>
            <Text style={styles.listTitle}>{region} · {catLabel}</Text>
            {!!events && <Text style={styles.count}>{total}</Text>}
          </View>
          {sample && <Text style={styles.note}>예시 정보를 보여주고 있어요 · 매일 새벽 최신 정보로 갱신돼요</Text>}
          {!events ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />
          ) : total === 0 ? (
            <View style={styles.empty}><Text style={styles.muted}>{region}에 해당하는 {ccat === '전체' ? '문화 소식' : ccat}이 아직 없어요</Text></View>
          ) : (
            <View style={{ gap: 10 }}>
              {shown.slice(0, 60).map((e) => (
                <Pressable key={e.id} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}>
                  {e.image_url ? (
                    <Image source={{ uri: httpsUrl(e.image_url)! }} style={styles.thumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.thumb, { backgroundColor: CAT_COLOR[e.category] ?? colors.border, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={styles.thumbText}>{e.category}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.badge}>{e.category} · {e.region}</Text>
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

          <Text style={[styles.section, { marginTop: 18 }]}>냥냥 기록 둘러보기</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {(data?.categories ?? []).map((c) => <Chip key={c} label={c} on={c === cat} onPress={() => setCat(c)} />)}
          </ScrollView>
          <Text style={styles.sub}>이번 주 많이 다녀온 곳</Text>
          {popular.length === 0 ? (
            <Text style={styles.muted}>조건에 맞는 곳이 없어요</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {popular.map((p) => (
                <View key={p.id} style={{ width: 124, gap: 6 }}>
                  <View style={[styles.poster, { backgroundColor: p.color }]}>
                    <Text style={styles.posterCat}>{p.category}</Text>
                    <View style={styles.circle} />
                    <Text style={styles.posterTitle} numberOfLines={3}>{p.title}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.rating}>★ {p.rating.toFixed(1)}</Text>
                    <Text style={styles.muted}>후기 {p.reviews}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
          <Text style={styles.sub}>내 근처</Text>
          <View>
            {nearby.map((n) => (
              <View key={n.id} style={styles.near}>
                <View style={{ gap: 3, flex: 1 }}>
                  <Text style={styles.nearName}>{n.name}</Text>
                  <Text style={styles.muted}>{n.info}</Text>
                </View>
                <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M9 5l7 7-7 7" stroke="#7D748A" strokeWidth={2} fill="none" strokeLinecap="round" /></Svg>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const RAIL = 88;
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  head: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 12 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 28 },
  body: { flex: 1, flexDirection: 'row' },
  rail: { width: RAIL, flexGrow: 0, backgroundColor: colors.surface, borderTopRightRadius: 18 },
  railContent: { paddingVertical: 14, paddingBottom: 40 },
  railHead: { color: '#6F6680', fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.4, paddingHorizontal: 14, marginBottom: 6 },
  railItem: { alignItems: 'center', gap: 4, paddingVertical: 10 },
  railLabel: { color: '#8E859A', fontFamily: fonts.regular, fontSize: 12 },
  railLabelOn: { color: colors.text, fontFamily: fonts.bold },
  bar: { position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderTopRightRadius: 3, borderBottomRightRadius: 3, backgroundColor: colors.accent },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 14, marginVertical: 12 },
  regionItem: { paddingVertical: 9, paddingHorizontal: 18 },
  regionLabel: { color: '#8E859A', fontFamily: fonts.regular, fontSize: 14 },
  main: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40, gap: 12 },
  listHead: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  listTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 17, letterSpacing: -0.4 },
  count: { color: colors.accent, fontFamily: fonts.bold, fontSize: 15 },
  note: { color: '#8E859A', fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  empty: { paddingVertical: 32, alignItems: 'center' },
  sub: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, marginTop: 4 },
  search: { height: 46, borderRadius: 14, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15 },
  section: { color: colors.text, fontFamily: fonts.bold, fontSize: 18, letterSpacing: -0.4 },
  muted: { color: '#8E859A', fontFamily: fonts.regular, fontSize: 13 },
  poster: { height: 164, borderRadius: 14, padding: 12, justifyContent: 'space-between', overflow: 'hidden' },
  posterCat: { color: 'rgba(255,255,255,0.8)', fontFamily: fonts.semibold, fontSize: 12 },
  circle: { position: 'absolute', right: -20, top: 40, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.12)' },
  posterTitle: { color: '#fff', fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, letterSpacing: -0.5 },
  rating: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13 },
  near: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#262030' },
  credit: { color: '#6F6680', fontFamily: fonts.regular, fontSize: 11 },
  card: { flexDirection: 'row', gap: 12, padding: 10, borderRadius: 16, backgroundColor: colors.surface },
  thumb: { width: 64, height: 86, borderRadius: 10, overflow: 'hidden' },
  thumbText: { color: '#fff', fontFamily: fonts.bold, fontSize: 14 },
  badge: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 12 },
  cardTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, letterSpacing: -0.3 },
  nearName: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
});
