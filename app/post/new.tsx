import { requireAccount } from '../../src/lib/auth';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../src/components/Header';
import { Chip } from '../../src/components/Social';
import { BOARDS, repo, type Board } from '../../src/data';
import { colors, fonts } from '../../src/theme';

export default function NewPost() {
  const params = useLocalSearchParams<{ board?: string }>();
  const [board, setBoard] = useState<Board>((BOARDS as readonly string[]).includes(params.board ?? '') ? (params.board as Board) : '라운지');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const ok = title.trim().length > 0 && body.trim().length > 0;

  const submit = async () => {
    if (!ok) return;
    if (!(await requireAccount())) return;
    const p = await repo.createPost({ board, title: title.trim(), body: body.trim() });
    router.replace(`/post/${p.id}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="글쓰기" right={<Pressable onPress={submit} disabled={!ok}><Text style={[styles.done, !ok && { opacity: 0.4 }]}>등록</Text></Pressable>} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {BOARDS.map((b) => <Chip key={b} label={b} on={b === board} onPress={() => setBoard(b)} />)}
          </View>
          <TextInput value={title} onChangeText={setTitle} placeholder="제목" placeholderTextColor="#8E859A" style={styles.title} maxLength={60} />
          <TextInput value={body} onChangeText={setBody} placeholder="관람 이야기를 나눠 주세요" placeholderTextColor="#8E859A" style={styles.input} multiline textAlignVertical="top" />
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
  input: { minHeight: 220, color: colors.text, fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
});
