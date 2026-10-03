import { requireAccount } from '../../src/lib/auth';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CatAvatar } from '../../src/components/CatAvatar';
import { Header } from '../../src/components/Header';
import { CommentList, timeAgo } from '../../src/components/Social';
import { repo, type BoardPost } from '../../src/data';
import { colors, fonts } from '../../src/theme';

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<BoardPost>();
  const [text, setText] = useState('');
  const reload = () => repo.getPost(id).then((p) => setPost(p ? { ...p, comments: [...p.comments] } : undefined));
  useEffect(() => void reload(), [id]);

  const send = async () => {
    if (!text.trim()) return;
    if (!(await requireAccount())) return;
    await repo.comment(id, text.trim());
    setText('');
    reload();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title={post?.board ?? '게시글'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {!post ? (
          <Text style={[styles.muted, { padding: 20 }]}>글을 찾을 수 없어요.</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.body}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <CatAvatar size={40} avatar={post.author.avatar} />
              <View>
                <Text style={styles.name}>{post.author.name}</Text>
                <Text style={styles.muted}>{post.tag ? `${post.tag} · ` : ''}{timeAgo(post.createdAt)}</Text>
              </View>
            </View>
            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.text}>{post.body}</Text>
            <Pressable onPress={async () => { await repo.like(post.id); reload(); }} style={[styles.like, post.liked && { borderColor: colors.accent }]}>
              <Text style={[styles.likeText, post.liked && { color: colors.accent }]}>좋아요 {post.likes}</Text>
            </Pressable>
            <Text style={styles.section}>댓글 {post.comments.length}</Text>
            <CommentList comments={post.comments} />
          </ScrollView>
        )}
        {!!post && (
          <View style={styles.inputRow}>
            <TextInput value={text} onChangeText={setText} placeholder="댓글을 남겨 주세요" placeholderTextColor="#8E859A" style={styles.input} onSubmitEditing={send} returnKeyType="send" />
            <Pressable onPress={send}><Text style={[styles.send, !text.trim() && { opacity: 0.4 }]}>등록</Text></Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 14 },
  name: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  muted: { color: '#8E859A', fontFamily: fonts.regular, fontSize: 13 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 20 },
  text: { color: '#D9D1E3', fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
  like: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  likeText: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 13 },
  section: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, marginTop: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, height: 42, borderRadius: 21, backgroundColor: colors.surface, paddingHorizontal: 16, color: colors.text, fontFamily: fonts.regular, fontSize: 15 },
  send: { color: colors.accent, fontFamily: fonts.bold, fontSize: 15 },
});
