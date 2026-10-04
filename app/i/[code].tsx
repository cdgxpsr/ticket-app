import { requireAccount } from '../../src/lib/auth';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CatAvatar } from '../../src/components/CatAvatar';
import { PawStamp } from '../../src/components/PawStamp';
import { claimInviteReward, getInviteState, saveReferrer } from '../../src/lib/invite';
import { colors, fonts } from '../../src/theme';
import { t } from '../../src/i18n';

// Handles nyangsucheop://i/<code> and https://nyangsucheop.app/i/<code>.
export default function InviteWelcome() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (code) saveReferrer(String(code));
    setClaimed(!!getInviteState().rewardClaimed);
  }, [code]);

  const claim = async () => {
    if (!(await requireAccount())) return;
    try {
      await claimInviteReward();
    } catch {
      return; // network/server error: allow retry
    }
    setClaimed(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <PawStamp size={64} color={colors.accent} rotate={-18} />
        <CatAvatar size={120} />
        <Text style={styles.title}>{t('냥냥수첩에 오신 걸 환영해요')}</Text>
        <Text style={styles.desc}>{t('친구의 초대로 아바타 아이템 선물이 도착했어요.')}</Text>
        <Pressable style={[styles.btn, claimed && styles.btnDone]} disabled={claimed} onPress={claim}>
          <Text style={[styles.btnText, claimed && { color: colors.muted }]}>{claimed ? t('받았어요') : t('받기')}</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/')}><Text style={styles.link}>{t('시작하기')}</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: 24, gap: 16, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 22 },
  desc: { color: colors.muted, fontFamily: fonts.regular, fontSize: 15, textAlign: 'center' },
  btn: { alignSelf: 'stretch', borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.accent },
  btnDone: { backgroundColor: colors.surface },
  btnText: { color: colors.bg, fontFamily: fonts.semibold, fontSize: 15 },
  link: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 15, padding: 8 },
});
