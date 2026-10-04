import { requireAccount } from '../../src/lib/auth';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../src/components/Header';
import { Chip } from '../../src/components/Social';
import { BOARDS, repo, type Board } from '../../src/data';
import { colors, fonts } from '../../src/theme';
import { t } from '../../src/i18n';

export default function NewPost() {
  const params = useLocalSearchParams<{ board?: string }>();
  const [board, setBoard] = useState<Board>((BOARDS as readonly string[]).includes(params.board ?? '') ? (params.board as Board) : '라운지');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const ok = title.trim().length > 0 && (body.trim().length > 0 || images.length > 0) && !busy;
  const MAX = 10;

  const addPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert(t('사진 접근을 허용해 주세요'), t('설정 > 냥냥수첩 > 사진에서 바꿀 수 있어요.'));
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: MAX - images.length, quality: 0.7, exif: false });
    if (!res.canceled) setImages((l) => [...l, ...res.assets.map((a) => a.uri)].slice(0, MAX));
  };

  const submit = async () => {
    if (!ok) return;
    if (!(await requireAccount())) return;
    setBusy(true);
    try {
      const p = await repo.createPost({ board, title: title.trim(), body: body.trim(), images });
      router.replace(`/post/${p.id}`);
    } catch {
      Alert.alert(t('올리지 못했어요'), t('사진이 너무 크거나 연결이 불안정해요. 다시 시도해 주세요.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title={t('글쓰기')} right={<Pressable onPress={submit} disabled={!ok}>{busy ? <ActivityIndicator color={colors.accent} /> : <Text style={[styles.done, !ok && { opacity: 0.4 }]}>{t('등록')}</Text>}</Pressable>} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {BOARDS.map((b) => <Chip key={b} label={t(b)} on={b === board} onPress={() => setBoard(b)} />)}
          </View>
          <TextInput value={title} onChangeText={setTitle} placeholder={t('제목')} placeholderTextColor="#8E859A" style={styles.title} maxLength={60} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {images.length < MAX && (
              <Pressable style={styles.add} onPress={addPhotos} accessibilityLabel={t('사진 추가')}>
                <Text style={styles.addIcon}>＋</Text>
                <Text style={styles.addText}>{t('사진 {n}/{max}', { n: images.length, max: MAX })}</Text>
              </Pressable>
            )}
            {images.map((u) => (
              <View key={u}>
                <Image source={{ uri: u }} style={styles.thumb} />
                <Pressable style={styles.remove} onPress={() => setImages((l) => l.filter((x) => x !== u))} hitSlop={6} accessibilityLabel={t('사진 빼기')}>
                  <Text style={styles.removeText}>×</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
          <TextInput value={body} onChangeText={setBody} placeholder={t('관람 이야기를 나눠 주세요')} placeholderTextColor="#8E859A" style={styles.input} multiline textAlignVertical="top" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 16 },
  done: { color: colors.accent, fontFamily: fonts.bold, fontSize: 15 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 20, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  add: { width: 84, height: 84, borderRadius: 14, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 2 },
  addIcon: { color: colors.muted, fontSize: 24, lineHeight: 28 },
  addText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12 },
  thumb: { width: 84, height: 84, borderRadius: 14 },
  remove: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  removeText: { color: '#fff', fontSize: 16, lineHeight: 18 },
  input: { minHeight: 220, color: colors.text, fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
});
