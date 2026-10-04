import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CatAvatar } from '../../src/components/CatAvatar';
import { Placeholder, Screen } from '../../src/components/Screen';
import { MiniTicket, Stars, timeAgo } from '../../src/components/Social';
import { repo, type FeedPost, type User } from '../../src/data';
import { colors, fonts } from '../../src/theme';

export default function Feed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  useFocusEffect(useCallback(() => {
    repo.getFeed().then(setPosts);
    repo.getFriends().then(setFriends);
  }, []));

  const toggle = async (id: string) => {
    await repo.like(id);
    setPosts(await repo.getFeed());
  };

  return (
    <Screen
      title="피드"
      header={<Pressable style={styles.addBtn} onPress={() => router.push('/friends')}><Text style={styles.addText}>친구 추가</Text></Pressable>}
    >
      {friends.length > 0 && (
        <View style={styles.banner}>
          <View style={{ flexDirection: 'row', paddingLeft: 8 }}>
            {friends.slice(0, 3).map((u) => (
              <View key={u.id} style={styles.stackItem}><CatAvatar size={30} avatar={u.avatar} /></View>
            ))}
          </View>
          <Text style={styles.bannerText}>
            <Text style={{ fontFamily: fonts.semibold }}>{friends[0].name}님{friends.length > 1 ? ` 외 ${friends.length - 1}명` : ''}</Text>이 같은 날 〈오페라의 유령〉을 봤어요
          </Text>
          <Pressable onPress={() => router.push('/community')}><Text style={styles.lounge}>라운지</Text></Pressable>
        </View>
      )}
      {posts.length === 0 && <Placeholder text="아직 새 소식이 없어요" />}
      <View>
        {posts.map((p) => (
          <View key={p.id} style={styles.post}>
            <CatAvatar size={42} avatar={p.author.avatar} />
            <View style={{ flex: 1, gap: 10 }}>
              <Text style={styles.who}>
                <Text style={{ fontFamily: fonts.semibold, color: colors.text }}>{p.author.name}</Text>
                <Text style={styles.muted}>님이 관람했어요 · {timeAgo(p.createdAt)}</Text>
              </Text>
              <View style={styles.card}>
                <MiniTicket show={p.show} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.showTitle}>{p.show.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Stars value={p.rating} size={13} />
                    <Text style={styles.rating}>{p.rating.toFixed(1)}</Text>
                  </View>
                  {!!p.text && <Text style={styles.review}>{p.text}</Text>}
                </View>
              </View>
              <View style={styles.actions}>
                <Pressable onPress={() => toggle(p.id)} hitSlop={8} accessibilityRole="button">
                  <Text style={[styles.action, p.liked && { color: colors.accent }]}>좋아요 {p.likes}</Text>
                </Pressable>
                <Text style={styles.action}>댓글 {p.comments.length}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addBtn: { height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: '#231E2B', justifyContent: 'center' },
  addText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  banner: { padding: 14, borderRadius: 18, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
  stackItem: { marginLeft: -8, borderWidth: 2, borderColor: colors.surface, borderRadius: 17 },
  bannerText: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  lounge: { color: colors.accent, fontFamily: fonts.bold, fontSize: 13 },
  post: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#262030', flexDirection: 'row', gap: 12 },
  who: { fontSize: 14, fontFamily: fonts.regular },
  muted: { color: '#8E859A', fontFamily: fonts.regular, fontSize: 14 },
  card: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.surface },
  showTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 16 },
  rating: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13 },
  review: { color: '#D9D1E3', fontFamily: fonts.regular, fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: 16 },
  action: { color: '#8E859A', fontFamily: fonts.regular, fontSize: 13 },
});
