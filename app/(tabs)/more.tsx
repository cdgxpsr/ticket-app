import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { repo } from '../../src/data';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CatAvatar } from '../../src/components/CatAvatar';
import { Screen } from '../../src/components/Screen';
import { colors, fonts } from '../../src/theme';
import { isAnonymous, signOut } from '../../src/lib/auth';
import { LANGS, t, useI18n } from '../../src/i18n';


export default function More() {
  const [stamps, setStamps] = useState(0);
  const [anon, setAnon] = useState(true);
  const [picker, setPicker] = useState(false);
  const { lang, setLang } = useI18n();
  useFocusEffect(useCallback(() => {
    repo.getStamps().then(setStamps);
    isAnonymous().then(setAnon).catch(() => {});
  }, []));
  return (
    <Screen title={t('더보기')} header={<Pressable onPress={() => router.push({ pathname: '/shop', params: { tab: 'inv' } })} accessibilityLabel={t('아바타 꾸미기')}><CatAvatar size={56} /></Pressable>}>
      <Text style={styles.section}>{t('계정')}</Text>
      <View style={styles.group}>
        {anon ? (
          <Pressable style={styles.row} onPress={() => router.push('/login')}>
            <Text style={styles.label}>{t('로그인')}</Text>
            <Text style={styles.value}>{t('티켓 안전하게 보관')}</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.row} onPress={async () => { await signOut(); setAnon(true); }}>
            <Text style={styles.label}>{t('로그아웃')}</Text>
            <Text style={styles.value}>{t('로그인됨')}</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.group}>
        <Pressable style={styles.row} onPress={() => router.push('/saved')}>
          <Text style={styles.label}>{t('저장한 문화 소식')}</Text>
          <Text style={styles.value}>{t('♡ 모아보기')}</Text>
        </Pressable>
        <View style={[styles.row, styles.divider]}>
          <Text style={styles.label}>{t('모은 발도장')}</Text>
          <Text style={styles.value}>{t('{n}개', { n: stamps })}</Text>
        </View>
        <Pressable style={[styles.row, styles.divider]} onPress={() => router.push('/friends')}>
          <Text style={styles.label}>{t('친구')}</Text>
          <Text style={styles.value}>{t('목록 · 코드로 추가')}</Text>
        </Pressable>
        <Pressable style={[styles.row, styles.divider]} onPress={() => router.push('/invite')}>
          <Text style={styles.label}>{t('친구 초대')}</Text>
          <Text style={styles.value}>{t('아이템 선물')}</Text>
        </Pressable>
      </View>
      <Text style={styles.section}>{t('설정')}</Text>
      <View style={styles.group}>
        <Pressable style={styles.row}>
          <Text style={styles.label}>{t('알림')}</Text>
          <Text style={styles.value}>{t('켜짐')}</Text>
        </Pressable>
        <Pressable style={[styles.row, styles.divider]} onPress={() => setPicker(true)} accessibilityRole="button">
          <Text style={styles.label}>{t('언어')}</Text>
          <Text style={styles.value}>{LANGS.find((l) => l.key === lang)?.label}</Text>
        </Pressable>
      </View>
      <Modal visible={picker} transparent animationType="fade" onRequestClose={() => setPicker(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPicker(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('언어')}</Text>
            {LANGS.map((l, i) => (
              <Pressable key={l.key} style={[styles.row, i > 0 && styles.divider]} accessibilityRole="radio" accessibilityState={{ selected: l.key === lang }}
                onPress={() => { setPicker(false); if (l.key !== lang) setLang(l.key); }}>
                <Text style={[styles.label, l.key === lang && { color: colors.accent }]}>{l.label}</Text>
                {l.key === lang && <Text style={[styles.value, { color: colors.accent }]}>✓</Text>}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13 },
  group: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  label: { color: colors.text, fontFamily: fonts.regular, fontSize: 16 },
  value: { color: colors.muted, fontFamily: fonts.regular, fontSize: 15 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingTop: 16 },
  sheetTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 17, paddingHorizontal: 16, paddingBottom: 8 },
});
