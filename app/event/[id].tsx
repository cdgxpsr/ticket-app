import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KOBIS_CREDIT, KMDB_CREDIT, httpsUrl, formatPeriod, getNearbyStays, getCultureEvent, type CultureEvent } from '../../src/data/culture';
import { colors, fonts } from '../../src/theme';

const naver = (q: string) => `https://m.search.naver.com/search.naver?query=${encodeURIComponent(q.trim())}`;
// Chain mobile booking homes; title-search URL formats are not stable/documented, so we open booking home.
const CINEMAS = [
  { name: 'CGV', url: 'https://m.cgv.co.kr/' },
  { name: '메가박스', url: 'https://m.megabox.co.kr/booking' },
  { name: '롯데시네마', url: 'https://www.lottecinema.co.kr/NLCMW/' },
];

function bookingButtons(e: CultureEvent): { name: string; url: string }[] {
  if (e.category === '영화') return CINEMAS;
  if (e.category === '숙박') return [{ name: '네이버 예약 보기', url: naver(`${e.title} 숙소`) }];
  const links = (e.booking_links ?? []).filter((l) => l?.name && /^https?:\/\//.test(l.url));
  if (links.length) return links.map((l) => ({ name: l.name, url: httpsUrl(l.url)! }));
  return [{ name: '네이버에서 예약 찾기', url: naver(`${e.title} ${e.venue || e.region}`) }];
}
// 예매는 외부 앱/사파리로 연다. https 링크는 CGV·인터파크 등 앱이 설치돼 있으면 그 앱으로 바로 열린다(유니버설 링크).
const open = (url: string) => Linking.openURL(url).catch(() => {});

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ev, setEv] = useState<CultureEvent | null>();
  const [stays, setStays] = useState<CultureEvent[]>([]);
  useEffect(() => void getCultureEvent(String(id)).then((e) => setEv(e ?? null)), [id]);
  useEffect(() => {
    setStays([]);
    if (ev) getNearbyStays(ev).then(setStays);
  }, [ev]);

  const rows: [string, string | null][] = ev
    ? [['분류', `${ev.category} · ${ev.region}`], ['기간', formatPeriod(ev)], ['장소', ev.venue], ['주소', ev.address], ['소개', ev.summary]]
    : [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}><Text style={styles.link}>닫기</Text></Pressable>
        <Text style={styles.title}>문화 소식</Text>
        <View style={{ width: 32 }} />
      </View>
      {ev === undefined ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : !ev ? (
        <Text style={[styles.desc, { padding: 20 }]}>정보를 찾을 수 없어요.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {!!ev.image_url && <Image source={{ uri: httpsUrl(ev.image_url)! }} style={styles.hero} resizeMode="cover" />}
          <Text style={styles.name}>{ev.title}</Text>
          <View style={styles.info}>
            {rows.filter(([, v]) => !!v).map(([k, v]) => (
              <View key={k} style={styles.row}>
                <Text style={styles.key}>{k}</Text>
                <Text style={styles.val}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={{ gap: 10 }}>
            <Text style={styles.section}>{ev.category === '영화' ? '영화관에서 예매하기' : '예매·예약'}</Text>
            {bookingButtons(ev).map((b, i) => (
              <Pressable key={b.name + i} style={[styles.btn, i === 0 && styles.primary]} onPress={() => open(b.url)}>
                <Text style={[styles.btnText, i === 0 && { color: colors.bg }]}>{b.name}</Text>
              </Pressable>
            ))}
            {ev.category === '영화' && <Text style={styles.credit}>{KOBIS_CREDIT}</Text>}
            {ev.poster_source === 'kmdb' && <Text style={styles.credit}>{KMDB_CREDIT}</Text>}
          </View>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Pressable style={styles.recordBtn} onPress={() => router.push('/capture')}>
              <Text style={styles.recordText}>다녀왔다면 · 티켓 기록하기</Text>
            </Pressable>
            <Text style={styles.credit}>관람 후 티켓을 찍어 기록해요</Text>
          </View>
          {stays.length > 0 && (
            <View style={{ gap: 10 }}>
              <Text style={styles.section}>근처 숙소</Text>
              {stays.map((s) => (
                <Pressable key={s.id} style={styles.info} onPress={() => router.push({ pathname: '/event/[id]', params: { id: s.id } })}>
                  <Text style={styles.stayName} numberOfLines={1}>{s.title}</Text>
                  {!!(s.address || s.summary) && <Text style={styles.desc} numberOfLines={1}>{s.address || s.summary}</Text>}
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 18 },
  link: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 15 },
  desc: { color: colors.muted, fontFamily: fonts.regular, fontSize: 14 },
  body: { padding: 20, gap: 18 },
  hero: { width: '100%', aspectRatio: 3 / 4, borderRadius: 16, backgroundColor: colors.surface },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: 24, lineHeight: 31, letterSpacing: -0.6 },
  info: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  key: { width: 40, color: colors.muted, fontFamily: fonts.semibold, fontSize: 14 },
  val: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  section: { color: colors.text, fontFamily: fonts.bold, fontSize: 18, marginTop: 8 },
  stayName: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  credit: { color: '#6F6680', fontFamily: fonts.regular, fontSize: 11 },
  recordBtn: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 18, borderWidth: 1, borderColor: colors.border },
  recordText: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 13 },
  btnText: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
});
