import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appleAvailable, resolveLogin, signInWith, type Provider } from '../src/lib/auth';
import { colors, fonts } from '../src/theme';

export default function Login() {
  const [busy, setBusy] = useState<Provider>();
  const [error, setError] = useState('');
  const [apple, setApple] = useState(false);
  useEffect(() => {
    appleAvailable().then(setApple).catch(() => setApple(false));
    return () => resolveLogin(false); // dismissed by swipe / back
  }, []);

  const go = async (p: Provider) => {
    if (busy) return;
    setBusy(p);
    setError('');
    try {
      if (await signInWith(p)) {
        resolveLogin(true);
        router.back();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인하지 못했어요');
    } finally {
      setBusy(undefined);
    }
  };

  const Btn = ({ p, label, style, text }: { p: Provider; label: string; style: object; text: object }) => (
    <Pressable onPress={() => go(p)} style={[styles.btn, style]} accessibilityRole="button" accessibilityLabel={label}>
      {busy === p ? <ActivityIndicator color={(text as { color: string }).color} /> : <Text style={[styles.btnText, text]}>{label}</Text>}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.grab} />
      <Text style={styles.title}>로그인하면 내 티켓이 안전하게 보관돼요</Text>
      <Text style={styles.sub}>지금까지 만든 티켓과 기록은 그대로 이어져요.</Text>
      <View style={{ gap: 10, marginTop: 24 }}>
        <Btn p="kakao" label="카카오로 시작하기" style={styles.kakao} text={{ color: 'rgba(0,0,0,0.85)' }} />
        {apple && <Btn p="apple" label="Apple로 계속하기" style={styles.apple} text={{ color: '#000000' }} />}
        <Btn p="google" label="Google로 계속하기" style={styles.google} text={{ color: '#1F1F1F' }} />
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable onPress={() => router.back()} style={styles.later}><Text style={styles.laterText}>나중에 할게요</Text></Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 12 },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#3A3344', marginBottom: 20 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 20, lineHeight: 28 },
  sub: { color: colors.muted, fontFamily: fonts.regular, fontSize: 14, marginTop: 8 },
  btn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: fonts.semibold, fontSize: 16 },
  kakao: { backgroundColor: '#FEE500' },
  // Dark app background: Apple HIG white style.
  apple: { backgroundColor: '#FFFFFF' },
  google: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#747775' },
  error: { color: '#FF8A80', fontFamily: fonts.regular, fontSize: 13, marginTop: 12 },
  later: { alignSelf: 'center', padding: 16, marginTop: 8 },
  laterText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 14 },
});
