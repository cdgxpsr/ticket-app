import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Screen } from '../../src/components/Screen';
import { Chip } from '../../src/components/Social';
import { repo, type Explore as ExploreData } from '../../src/data';
import { CULTURE_CATEGORIES, REGIONS, formatPeriod, getCultureEvents, type CultureEvent } from '../../src/data/culture';
import { colors, fonts } from '../../src/theme';

const REGION_KEY = 'explore.region';
const CAT_COLOR: Record<string, string> = { 영화: '#5B4B8A', 공연: '#8A3B5B', 전시: '#2F6B6B', 축제: '#A0522D', 액티비티: '#3E6B3A' };

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

  return (
    <Screen title="둘러보기">
      <View style={styles.search}>
        <Svg width={18} height={18} viewBox="0 0 24 24"><Circle cx={11} cy={11} r={6.5} stroke="#8E859A" strokeWidth={1.8} fill="none" /><Path d="M16 16l4 4" stroke="#8E859A" strokeWidth={1.8} strokeLinecap="round" /></Svg>
        <TextInput value={q} onChangeText={setQ} placeholder="전시, 공연, 영화, 장소 검색" placeholderTextColor="#8E859A" style={styles.input} />
      </View>
      <Text style={styles.section}>지역별 문화거리</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -20 }}>
        <View style={{ width: 12 }} />
        {REGIONS.map((r) => <Chip key={r} label={r} on={r === region} onPress={() => pickRegion(r)} />)}
        <View style={{ width: 12 }} />
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -20 }}>
        <View style={{ width: 12 }} />
        {CULTURE_CATEGORIES.map((c) => <Chip key={c} label={c} on={c === ccat} onPress={() => setCcat(c)} />)}
        <View style={{ width: 12 }} />
      </ScrollView>
      {sample && <Text style={styles.muted}>예시 정보를 보여주고 있어요 · 매일 새벽 최신 정보로 갱신돼요</Text>}
      {!events ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />
      ) : shown.length === 0 ? (
        <Text style={styles.muted}>{region}에 해당하는 {ccat === '전체' ? '문화 소식' : ccat}이 아직 없어요</Text>
      ) : (
        <View style={{ gap: 12 }}>
          {shown.slice(0, 60).map((e) => (
            <Pressable key={e.id} style={styles.card} onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}>
              {e.image_url ? (
                <Image source={{ uri: e.image_url }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, { backgroundColor: CAT_COLOR[e.category] ?? colors.border, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={styles.thumbText}>{e.category}</Text>
                </View>
              )}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.badge}>{e.category} · {e.region}</Text>
                <Text style={styles.cardTitle} numberOfLines={2}>{e.title}</Text>
                {!!(e.venue || e.address) && <Text style={styles.muted} numberOfLines={1}>{e.venue || e.address}</Text>}
                <Text style={styles.muted}>{formatPeriod(e)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      <Text style={[styles.section, { marginTop: 10 }]}>냥냥 기록 둘러보기</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -20 }}>
        <View style={{ width: 12 }} />
        {(data?.categories ?? []).map((c) => <Chip key={c} label={c} on={c === cat} onPress={() => setCat(c)} />)}
        <View style={{ width: 12 }} />
      </ScrollView>
      <View style={styles.sectionRow}>
        <Text style={styles.section}>이번 주 많이 다녀온 곳</Text>
        <Text style={styles.muted}>전체보기</Text>
      </View>
      {popular.length === 0 ? (
        <Text style={styles.muted}>조건에 맞는 곳이 없어요</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
          {popular.map((p) => (
            <View key={p.id} style={{ width: 148, gap: 8 }}>
              <View style={[styles.poster, { backgroundColor: p.color }]}>
                <Text style={styles.posterCat}>{p.category}</Text>
                <View style={styles.circle} />
                <Text style={styles.posterTitle}>{p.title}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.rating}>★ {p.rating.toFixed(1)}</Text>
                <Text style={styles.muted}>인증 후기 {p.reviews}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      <Text style={[styles.section, { marginTop: 6 }]}>내 근처</Text>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { height: 46, borderRadius: 14, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 },
  section: { color: colors.text, fontFamily: fonts.bold, fontSize: 18, letterSpacing: -0.4 },
  muted: { color: '#8E859A', fontFamily: fonts.regular, fontSize: 13 },
  poster: { height: 196, borderRadius: 16, padding: 14, justifyContent: 'space-between', overflow: 'hidden' },
  posterCat: { color: 'rgba(255,255,255,0.8)', fontFamily: fonts.semibold, fontSize: 12 },
  circle: { position: 'absolute', right: -20, top: 40, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.12)' },
  posterTitle: { color: '#fff', fontFamily: fonts.bold, fontSize: 18, lineHeight: 23, letterSpacing: -0.5 },
  rating: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13 },
  near: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#262030' },
  card: { flexDirection: 'row', gap: 12, padding: 10, borderRadius: 16, backgroundColor: colors.surface },
  thumb: { width: 76, height: 100, borderRadius: 10, overflow: 'hidden' },
  thumbText: { color: '#fff', fontFamily: fonts.bold, fontSize: 14 },
  badge: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 12 },
  cardTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, lineHeight: 21, letterSpacing: -0.3 },
  nearName: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
});
