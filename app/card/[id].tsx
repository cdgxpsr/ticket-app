import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PawStamp } from '../../src/components/PawStamp';
import { TicketCard } from '../../src/components/TicketCard';
import { getCard } from '../../src/lib/cards';
import { colors, fonts } from '../../src/theme';

export default function CardDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const card = useMemo(() => getCard(id), [id]);
  const [showOriginal, setShowOriginal] = useState(false);
  const photo = card?.originalUri || card?.imageUri;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/tickets'))}><Text style={styles.link}>닫기</Text></Pressable>
        <Text style={styles.title}>티켓 카드</Text>
        <View style={{ width: 32 }} />
      </View>
      {!card ? (
        <Text style={[styles.desc, { padding: 20 }]}>카드를 찾을 수 없어요.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.stampWrap}>
            <PawStamp size={96} color={colors.accent} rotate={-18} />
          </View>
          <TicketCard ticket={card} large />
          {!!photo && (
            <Pressable onPress={() => setShowOriginal(true)} style={styles.btn}>
              <Text style={styles.btnText}>원본 사진 보기</Text>
            </Pressable>
          )}
        </ScrollView>
      )}
      <Modal visible={showOriginal} animationType="fade" onRequestClose={() => setShowOriginal(false)}>
        <SafeAreaView style={[styles.safe, { backgroundColor: '#000' }]}>
          <Pressable onPress={() => setShowOriginal(false)} style={{ padding: 16 }}><Text style={styles.link}>닫기</Text></Pressable>
          {!!photo && <Image source={{ uri: photo }} style={{ flex: 1 }} resizeMode="contain" />}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 18 },
  link: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 15 },
  desc: { color: colors.muted, fontFamily: fonts.regular, fontSize: 14 },
  body: { padding: 20, gap: 20 },
  stampWrap: { alignItems: 'center', paddingVertical: 12 },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  btnText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
});
