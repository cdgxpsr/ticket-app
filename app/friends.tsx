import { requireAccount } from '../src/lib/auth';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CatAvatar } from '../src/components/CatAvatar';
import { Header } from '../src/components/Header';
import { showToast } from '../src/components/Social';
import { repo, type User } from '../src/data';
import { colors, fonts } from '../src/theme';
import { t } from '../src/i18n';

export default function Friends() {
  const [friends, setFriends] = useState<User[]>([]);
  const [me, setMe] = useState<User>();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    repo.getFriends().then(setFriends);
    repo.me().then(setMe);
  }, []);

  const add = async () => {
    if (!code.trim()) return;
    if (!(await requireAccount())) return;
    try {
      const u = await repo.addFriend(code);
      setCode('');
      setError('');
      setFriends(await repo.getFriends());
      showToast(t('{name}님과 친구가 되었어요', { name: u.name }));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('추가하지 못했어요'));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title={t('친구')} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.box}>
          <Text style={styles.label}>{t('초대 코드로 친구 추가')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput value={code} onChangeText={(v) => { setCode(v); setError(''); }} placeholder={t('코드 입력')} placeholderTextColor="#8E859A" autoCapitalize="characters" autoCorrect={false} style={styles.input} onSubmitEditing={add} />
            <Pressable onPress={add} style={[styles.btn, !code.trim() && { opacity: 0.4 }]}><Text style={styles.btnText}>{t('추가')}</Text></Pressable>
          </View>
          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!me && <Text style={styles.muted}>{t('내 초대 코드 {code}', { code: me.code })}</Text>}
        </View>
        <Text style={styles.section}>{t('친구 {n}', { n: friends.length })}</Text>
        <View style={styles.box}>
          {friends.length === 0 && <Text style={styles.muted}>{t('아직 친구가 없어요')}</Text>}
          {friends.map((u, i) => (
            <View key={u.id} style={[styles.row, i > 0 && styles.divider]}>
              <CatAvatar size={40} avatar={u.avatar} />
              <Text style={styles.name}>{u.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 14 },
  box: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 },
  label: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  input: { flex: 1, height: 44, borderRadius: 12, backgroundColor: colors.bg, paddingHorizontal: 14, color: colors.text, fontFamily: fonts.semibold, fontSize: 15, letterSpacing: 1 },
  btn: { height: 44, paddingHorizontal: 18, borderRadius: 12, backgroundColor: colors.accent, justifyContent: 'center' },
  btnText: { color: colors.bg, fontFamily: fonts.bold, fontSize: 15 },
  error: { color: '#F08A8A', fontFamily: fonts.regular, fontSize: 13 },
  muted: { color: '#8E859A', fontFamily: fonts.regular, fontSize: 13 },
  section: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  name: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16 },
});
