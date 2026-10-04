import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatPeriod, getCultureEvent, type CultureEvent } from '../../src/data/culture';
import { colors, fonts } from '../../src/theme';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ev, setEv] = useState<CultureEvent | null>();
  useEffect(() => void getCultureEvent(String(id)).then((e) => setEv(e ?? null)), [id]);

  const rows: [string, string | null][] = ev
    ? [['분류', `${ev.category} · ${ev.region}`], ['기간', formatPeriod(ev)], ['장소', ev.venue], ['주소', ev.address], ['소개', ev.summary]]
    : [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/explore'))}><Text style={styles.link}>닫기</Text></Pressable>
        <Text style={styles.title}>문화 소식</Text>
        <View style={{ width: 32 }} />
      </View>
      {ev === undefined ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : !ev ? (
        <Text style={[styles.desc, { padding: 20 }]}>정보를 찾을 수 없어요.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {!!ev.image_url && <Image source={{ uri: ev.image_url }} style={styles.hero} resizeMode="cover" />}
          <Text style={styles.name}>{ev.title}</Text>
          <View style={styles.info}>
            {rows.filter(([, v]) => !!v).map(([k, v]) => (
              <View key={k} style={styles.row}>
                <Text style={styles.key}>{k}</Text>
                <Text style={styles.val}>{v}</Text>
              </View>
            ))}
          </View>
          {!!ev.link_url && (
            <Pressable style={[styles.btn, styles.primary]} onPress={() => Linking.openURL(ev.link_url!).catch(() => {})}>
              <Text style={[styles.btnText, { color: colors.bg }]}>예매/자세히 보기</Text>
            </Pressable>
          )}
          <Pressable style={styles.btn} onPress={() => router.push('/capture')}>
            <Text style={styles.btnText}>티켓 등록하기</Text>
          </Pressable>
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
  btnText: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
});
