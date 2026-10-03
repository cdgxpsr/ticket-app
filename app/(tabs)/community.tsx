import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CatAvatar } from '../../src/components/CatAvatar';
import { Placeholder } from '../../src/components/Screen';
import { Chip, timeAgo } from '../../src/components/Social';
import { BOARDS, repo, type Board, type BoardPost } from '../../src/data';
import { colors, fonts } from '../../src/theme';

export default function Community() {
  const [board, setBoard] = useState<Board>('라운지');
  const [posts, setPosts] = useState<BoardPost[]>([]);
  useFocusEffect(useCallback(() => void repo.getPosts(board).then(setPosts), [board]));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>커뮤니티</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {BOARDS.map((b) => <Chip key={b} label={b} on={b === board} onPress={() => setBoard(b)} />)}
        </ScrollView>
        {posts.length === 0 && <Placeholder text="첫 글을 기다리고 있어요" />}
        {posts.map((p, i) => {
          const hero = board === '라운지' && i === 0 && p.tag === '회차 라운지';
          return (
            <Pressable key={p.id} onPress={() => router.push(`/post/${p.id}`)} style={[styles.card, hero && styles.hero]}>
              <View style={styles.metaRow}>
                {!!p.tag && <Text style={[styles.tag, hero && styles.heroTag]}>{hero ? `${p.tag} · 티켓 인증한 관객만` : p.tag}</Text>}
                <Text style={styles.muted}>{timeAgo(p.createdAt)}</Text>
              </View>
              <Text style={[styles.postTitle, hero && { fontSize: 20, fontFamily: fonts.bold }]}>{p.title}</Text>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <CatAvatar size={30} avatar={p.author.avatar} />
                <Text style={[styles.body, hero && { color: '#F1D9DC' }]} numberOfLines={2}>
                  {p.verified && <Text style={styles.verified}>관람 인증 </Text>}
                  {p.body}
                </Text>
              </View>
              <Text style={[styles.muted, hero && { color: '#F1D9DC' }]}>{board === '질문' ? '답변' : '댓글'} {p.comments.length} · 좋아요 {p.likes}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable style={styles.fab} onPress={() => router.push({ pathname: '/post/new', params: { board } })}>
        <Text style={styles.fabText}>글쓰기</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 12, paddingBottom: 100 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 28, marginBottom: 4 },
  card: { padding: 16, borderRadius: 20, backgroundColor: colors.surface, gap: 8 },
  hero: { backgroundColor: '#5A1624' },
  metaRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  tag: { color: colors.text, fontFamily: fonts.bold, fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: colors.border, overflow: 'hidden' },
  heroTag: { backgroundColor: 'rgba(255,255,255,0.15)' },
  postTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16 },
  body: { flex: 1, color: '#D9D1E3', fontFamily: fonts.regular, fontSize: 14, lineHeight: 21 },
  verified: { color: colors.accent, fontFamily: fonts.semibold },
  muted: { color: '#8E859A', fontFamily: fonts.regular, fontSize: 13 },
  fab: { position: 'absolute', right: 20, bottom: 20, height: 52, paddingHorizontal: 22, borderRadius: 26, backgroundColor: colors.accent, justifyContent: 'center' },
  fabText: { color: colors.bg, fontFamily: fonts.bold, fontSize: 16 },
});
