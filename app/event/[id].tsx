import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Share, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KOBIS_CREDIT, KMDB_CREDIT, httpsUrl, formatPeriod, getNearbyStays, getCultureEvent, getEventImages, getEventReviews, saveEventReview, type CultureEvent, type EventReview } from '../../src/data/culture';
import { requireAccount } from '../../src/lib/auth';
import { isSaved, toggleSaved } from '../../src/lib/saved';
import Svg, { Path } from 'react-native-svg';
import { addChur } from '../../src/lib/shop';
import { openVendor, vendorsFor } from '../../src/lib/booking';
import { colors, fonts } from '../../src/theme';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ev, setEv] = useState<CultureEvent | null>();
  const [stays, setStays] = useState<CultureEvent[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [reviews, setReviews] = useState<EventReview[]>();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => void isSaved(String(id)).then(setSaved), [id]);
  const onSave = async () => { if (ev) setSaved(await toggleSaved(ev)); };
  const onShare = () => {
    if (!ev) return;
    const lines = [`[냥냥수첩] ${ev.title}`, `${ev.category} · ${formatPeriod(ev)}`, ev.venue || ev.address, ev.link_url].filter(Boolean);
    Share.share({ message: lines.join('\n') }).catch(() => {});
  };
  const { width } = useWindowDimensions();
  const heroW = width - 40;
  const heroH = Math.round((heroW * 4) / 3);
  const loadReviews = () => getEventReviews(String(id)).then((r) => {
    setReviews(r);
    const m = r.find((x) => x.mine);
    if (m) { setRating(m.rating); setText(m.text); }
  });
  useEffect(() => void loadReviews(), [id]);
  const submit = async () => {
    if (!rating || saving) return;
    if (!(await requireAccount())) return;
    setSaving(true);
    const first = !reviews?.some((r) => r.mine);
    const ok = await saveEventReview(String(id), rating, text);
    setSaving(false);
    if (!ok) return Alert.alert('저장하지 못했어요', '잠시 후 다시 시도해 주세요.');
    if (first) { addChur(50, `review:${id}`); Alert.alert('후기 고마워요!', '츄르 50개를 받았어요. 냥냥상점에서 써보세요.'); }
    loadReviews();
  };
  const avg = reviews?.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  useEffect(() => void getCultureEvent(String(id)).then((e) => setEv(e ?? null)), [id]);
  useEffect(() => {
    setStays([]);
    setImages([]);
    setPage(0);
    if (ev) {
      getNearbyStays(ev).then(setStays);
      setImages(ev.image_url ? [httpsUrl(ev.image_url)!] : []);
      getEventImages(ev).then((imgs) => imgs.length && setImages(imgs));
    }
  }, [ev]);

  const rows: [string, string | null][] = ev
    ? [['분류', `${ev.category} · ${ev.region}`], ['기간', formatPeriod(ev)], ['장소', ev.venue], ['주소', ev.address], ['소개', ev.summary]]
    : [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}><Text style={styles.link}>닫기</Text></Pressable>
        <Text style={styles.title}>문화 소식</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Pressable onPress={onSave} hitSlop={8} accessibilityLabel={saved ? '저장 취소' : '저장'}>
            <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" fill={saved ? '#FF6B8B' : 'none'} stroke={saved ? '#FF6B8B' : colors.text} strokeWidth={1.8} strokeLinejoin="round" /></Svg>
          </Pressable>
          <Pressable onPress={onShare} hitSlop={8} accessibilityLabel="공유">
            <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M12 3v12M7 8l5-5 5 5M5 13v6h14v-6" fill="none" stroke={colors.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>
          </Pressable>
        </View>
      </View>
      {ev === undefined ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : !ev ? (
        <Text style={[styles.desc, { padding: 20 }]}>정보를 찾을 수 없어요.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {images.length > 0 && (
            <View>
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={[styles.hero, { width: heroW, height: heroH }]}
                onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / heroW))}>
                {images.map((u) => (
                  <Image key={u} source={{ uri: u }} style={{ width: heroW, height: heroH }} resizeMode="cover"
                    onError={() => setImages((l) => (l.length > 1 ? l.filter((x) => x !== u) : l))} />
                ))}
              </ScrollView>
              {images.length > 1 && <View style={styles.pageTag}><Text style={styles.pageText}>{page + 1} / {images.length}</Text></View>}
            </View>
          )}
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
            <Text style={styles.section}>예매/예약하기</Text>
            <View style={styles.tiles}>
              {vendorsFor(ev).map((v, i) => (
                <Pressable key={v.name + i} style={({ pressed }) => [styles.tile, i === 0 && styles.tileFirst, pressed && { opacity: 0.8 }]} onPress={() => openVendor(v)}>
                  <Text style={[styles.tileText, i === 0 && { color: colors.bg }]} numberOfLines={1}>{v.name}</Text>
                </Pressable>
              ))}
            </View>
            {ev.category === '영화' && <Text style={styles.credit}>{KOBIS_CREDIT}</Text>}
            {ev.poster_source === 'kmdb' && <Text style={styles.credit}>{KMDB_CREDIT}</Text>}
          </View>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text style={styles.section}>평점 · 후기</Text>
              {!!reviews?.length && <Text style={styles.avg}>★ {avg.toFixed(1)} <Text style={styles.desc}>({reviews.length})</Text></Text>}
            </View>
            <View style={styles.info}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => setRating(n)} hitSlop={6} accessibilityLabel={`별 ${n}개`}>
                    <Text style={[styles.star, n <= rating && styles.starOn]}>★</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput value={text} onChangeText={setText} placeholder="어땠는지 한 줄 남겨 주세요" placeholderTextColor="#7D748A" multiline maxLength={1000} style={styles.reviewInput} />
              <Pressable style={[styles.submit, (!rating || saving) && { opacity: 0.5 }]} onPress={submit} disabled={!rating || saving}>
                <Text style={styles.submitText}>{reviews?.some((r) => r.mine) ? '후기 수정' : '후기 남기기 · 츄르 50'}</Text>
              </Pressable>
            </View>
            {reviews === undefined ? <ActivityIndicator color={colors.accent} /> : reviews.length === 0 ? (
              <Text style={styles.desc}>아직 후기가 없어요. 첫 후기를 남겨 주세요!</Text>
            ) : reviews.map((r) => (
              <View key={r.id} style={styles.review}>
                <Text style={styles.reviewHead}>{r.nickname}{r.mine ? ' (나)' : ''} · <Text style={styles.starSmall}>{'★'.repeat(r.rating)}</Text></Text>
                {!!r.text && <Text style={styles.val}>{r.text}</Text>}
              </View>
            ))}
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
  hero: { borderRadius: 16, backgroundColor: colors.surface, flexGrow: 0 },
  pageTag: { position: 'absolute', right: 12, bottom: 12, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pageText: { color: '#fff', fontFamily: fonts.semibold, fontSize: 12 },
  avg: { color: colors.accent, fontFamily: fonts.bold, fontSize: 16 },
  star: { fontSize: 30, color: '#3A3448' },
  starOn: { color: '#FFC94D' },
  starSmall: { color: '#FFC94D' },
  reviewInput: { minHeight: 64, color: colors.text, fontFamily: fonts.regular, fontSize: 14, textAlignVertical: 'top' },
  submit: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  submitText: { color: colors.bg, fontFamily: fonts.bold, fontSize: 14 },
  review: { gap: 6, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewHead: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 13 },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: 24, lineHeight: 31, letterSpacing: -0.6 },
  info: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  key: { width: 40, color: colors.muted, fontFamily: fonts.semibold, fontSize: 14 },
  val: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tileFirst: { backgroundColor: colors.accent, borderColor: colors.accent },
  tileText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  section: { color: colors.text, fontFamily: fonts.bold, fontSize: 18, marginTop: 8 },
  stayName: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  credit: { color: '#6F6680', fontFamily: fonts.regular, fontSize: 11 },
  recordBtn: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 18, borderWidth: 1, borderColor: colors.border },
  recordText: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 13 },
});
