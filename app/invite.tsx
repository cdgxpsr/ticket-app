import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CatAvatar } from '../src/components/CatAvatar';
import { getMyInviteCode, inviteLink } from '../src/lib/invite';
import { colors, fonts } from '../src/theme';

export default function Invite() {
  const code = useMemo(() => getMyInviteCode(), []);
  const link = inviteLink(code);
  const [copied, setCopied] = useState(false);

  const share = () =>
    Share.share({ message: `냥냥수첩에서 같이 관람 기록 모아요. 초대 링크로 가입하면 우리 둘 다 아바타 아이템 선물을 받아요.\n${link}`, url: link });
  const copy = async () => {
    await Clipboard.setStringAsync(link);
    setCopied(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/more'))}><Text style={styles.link}>닫기</Text></Pressable>
        <Text style={styles.title}>친구 초대</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.body}>
        <CatAvatar size={96} />
        <Text style={styles.headline}>초대한 친구와 나 모두 아바타 아이템 선물</Text>
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>내 초대 코드</Text>
          <Text style={styles.code}>{code}</Text>
          <Text style={styles.url}>{link}</Text>
        </View>
        <Pressable style={[styles.btn, styles.primary]} onPress={share}><Text style={[styles.btnText, { color: colors.bg }]}>초대 링크 공유하기</Text></Pressable>
        <Pressable style={styles.btn} onPress={copy}><Text style={styles.btnText}>{copied ? '복사했어요' : '링크 복사'}</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 18 },
  link: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 15 },
  body: { padding: 20, gap: 16, alignItems: 'center' },
  headline: { color: colors.text, fontFamily: fonts.bold, fontSize: 18, textAlign: 'center' },
  codeBox: { alignSelf: 'stretch', alignItems: 'center', gap: 6, padding: 20, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  codeLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13 },
  code: { color: colors.accent, fontFamily: fonts.bold, fontSize: 32, letterSpacing: 4 },
  url: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13 },
  btn: { alignSelf: 'stretch', borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  btnText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
});
