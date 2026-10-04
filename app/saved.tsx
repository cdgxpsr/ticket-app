import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatPeriod, httpsUrl, type CultureEvent } from '../src/data/culture';
import { listSaved } from '../src/lib/saved';
import { colors, fonts } from '../src/theme';

export default function Saved() {
  const [items, setItems] = useState<CultureEvent[]>([]);
  useFocusEffect(useCallback(() => void listSaved().then(setItems), []));
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12}><Text style={styles.link}>닫기</Text></Pressable>
        <Text style={styles.title}>저장한 문화 소식</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {items.length === 0 ? (
          <Text style={styles.muted}>아직 저장한 게 없어요. 둘러보기에서 마음에 드는 걸 ♡ 눌러 저장해 보세요.</Text>
        ) : items.map((e) => (
          <Pressable key={e.id} style={styles.card} onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}>
            {e.image_url ? <Image source={{ uri: httpsUrl(e.image_url)! }} style={styles.thumb} /> : <View style={[styles.thumb, { backgroundColor: colors.border }]} />}
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.badge}>{e.category} · {e.region}</Text>
              <Text style={styles.name} numberOfLines={2}>{e.title}</Text>
              <Text style={styles.muted}>{formatPeriod(e)}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 18 },
  link: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 15 },
  body: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', gap: 12, padding: 10, borderRadius: 16, backgroundColor: colors.surface },
  thumb: { width: 64, height: 86, borderRadius: 10 },
  badge: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 12 },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  muted: { color: '#8E859A', fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
});
