import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PawStamp } from '../../src/components/PawStamp';
import { addCard } from '../../src/lib/cards';
import { CATEGORIES, EMPTY, Recognized, recognizeTicket } from '../../src/services/recognizeTicket';
import { colors, fonts } from '../../src/theme';

const FIELDS: { key: Exclude<keyof Recognized, 'category'>; label: string; placeholder: string }[] = [
  { key: 'title', label: '제목', placeholder: '공연·전시 이름' },
  { key: 'date', label: '날짜', placeholder: '2026.11.14' },
  { key: 'time', label: '시간', placeholder: '19:30' },
  { key: 'venue', label: '장소', placeholder: '공연장·관람 장소' },
  { key: 'seat', label: '좌석', placeholder: 'R석 7열 12번' },
];

export default function NewCard() {
  const { imageUri, originalUri } = useLocalSearchParams<{ imageUri: string; originalUri?: string }>();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Recognized>(EMPTY);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    recognizeTicket(imageUri)
      .then((r) => alive && setForm(r))
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [imageUri]);

  function save() {
    if (!form.title.trim()) return Alert.alert('제목을 입력해 주세요');
    const card = addCard({ ...form, imageUri, originalUri: originalUri || undefined });
    router.replace({ pathname: '/card/[id]', params: { id: card.id } });
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <PawStamp size={72} />
        <Text style={styles.reading}>읽는 중</Text>
        <Text style={styles.desc}>티켓의 내용을 살펴보고 있어요.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()}><Text style={styles.link}>취소</Text></Pressable>
        <Text style={styles.title}>카드 확인</Text>
        <Pressable onPress={save}><Text style={[styles.link, { color: colors.accent }]}>저장</Text></Pressable>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.desc}>{failed ? '티켓을 읽지 못했어요. 직접 입력해 주세요.' : '읽어 온 내용이 맞는지 확인하고, 틀린 곳은 고쳐 주세요.'}</Text>
          <Text style={styles.label}>분류</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => (
              <Pressable key={c} onPress={() => setForm({ ...form, category: c })} style={[styles.chip, form.category === c && styles.chipOn]}>
                <Text style={[styles.chipText, form.category === c && styles.chipTextOn]}>{c}</Text>
              </Pressable>
            ))}
          </View>
          {FIELDS.map((f) => (
            <View key={f.key} style={{ gap: 6 }}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                value={form[f.key]}
                onChangeText={(v) => setForm({ ...form, [f.key]: v })}
                placeholder={f.placeholder}
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            </View>
          ))}
          <Pressable onPress={save} style={styles.btn}><Text style={styles.btnText}>저장</Text></Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  reading: { color: colors.text, fontFamily: fonts.bold, fontSize: 20, marginTop: 8 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 18 },
  link: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 15 },
  body: { padding: 20, gap: 14, paddingBottom: 40 },
  desc: { color: colors.muted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  label: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 13 },
  chipTextOn: { color: colors.bg },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontFamily: fonts.regular, fontSize: 15 },
  btn: { marginTop: 8, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.accent },
  btnText: { color: colors.bg, fontFamily: fonts.semibold, fontSize: 15 },
});
