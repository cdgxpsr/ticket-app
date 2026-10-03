import { requireAccount } from '../../src/lib/auth';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../src/components/Header';
import { CATEGORY_COLORS, MiniTicket, showToast, Stars } from '../../src/components/Social';
import { repo, type Show } from '../../src/data';
import { getCard } from '../../src/lib/cards';
import { colors, fonts } from '../../src/theme';

export default function WriteReview() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const card = useMemo(() => getCard(cardId), [cardId]);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = rating > 0 && !busy;

  const show: Show | undefined = card && {
    id: `card-${card.id}`, title: card.title || '제목 없는 티켓', category: card.category, venue: card.venue, date: card.date,
    color: CATEGORY_COLORS[card.category] ?? CATEGORY_COLORS['기타'],
  };

  const save = async () => {
    if (!ok || !show) return;
    if (!(await requireAccount())) return;
    setBusy(true);
    await repo.createReview({ show, rating, text: text.trim(), cardId: card!.id });
    const total = await repo.addStamp(1);
    showToast(`발도장 1개 받았어요 · 모은 발도장 ${total}개`);
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="후기 쓰기" right={<Pressable onPress={save} disabled={!ok}><Text style={[styles.done, !ok && { opacity: 0.4 }]}>등록</Text></Pressable>} />
      {!show ? (
        <Text style={[styles.muted, { padding: 20 }]}>카드를 찾을 수 없어요.</Text>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <MiniTicket show={show} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.title}>{show.title}</Text>
                <Text style={styles.muted}>{[show.venue, show.date].filter(Boolean).join(' · ')}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'center', gap: 10 }}>
              <Text style={styles.label}>별점</Text>
              <Stars value={rating} size={40} onChange={setRating} />
              <Text style={styles.score}>{rating > 0 ? rating.toFixed(1) : '별을 눌러 평가해 주세요'}</Text>
            </View>
            <TextInput value={text} onChangeText={setText} placeholder="어떤 점이 좋았나요? 친구들에게 이야기해 주세요" placeholderTextColor="#8E859A" style={styles.input} multiline textAlignVertical="top" maxLength={500} />
            <Text style={styles.muted}>후기를 남기면 발도장 1개를 받아요</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 22 },
  done: { color: colors.accent, fontFamily: fonts.bold, fontSize: 15 },
  card: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center' },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 16 },
  label: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  score: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 14 },
  muted: { color: '#8E859A', fontFamily: fonts.regular, fontSize: 13 },
  input: { minHeight: 160, padding: 14, borderRadius: 16, backgroundColor: colors.surface, color: colors.text, fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
});
