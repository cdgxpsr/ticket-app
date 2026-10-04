import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ToastHost } from '../src/components/Social';
import { colors } from '../src/theme';

// Keep the native splash up at least 1s so the logo doesn't just flash.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 400, fade: true });
const SPLASH_MIN_MS = 1000;

export default function RootLayout() {
  const [minDone, setMinDone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMinDone(true), SPLASH_MIN_MS); return () => clearTimeout(t); }, []);
  const [loaded] = useFonts({
    'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
  });
  useEffect(() => { if (loaded && minDone) SplashScreen.hideAsync().catch(() => {}); }, [loaded, minDone]);
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="login" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.55], sheetGrabberVisible: false }} />
      </Stack>
      <ToastHost />
    </>
  );
}
