import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Image, LayoutChangeEvent, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveOriginal } from '../src/lib/originals';
import { colors, fonts } from '../src/theme';

type Pt = { x: number; y: number };
type Step = { kind: 'pick' } | { kind: 'crop'; uri: string } | { kind: 'done'; uri: string; auto: boolean };

/**
 * 자동 테두리 인식 + 원근 보정은 react-native-document-scanner-plugin(네이티브 모듈)을 쓴다.
 * Expo Go에는 이 모듈이 없으므로 개발 빌드에서만 동작하며, 없으면 null을 돌려준다.
 */
function loadScanner(): null | { scanDocument: (o: object) => Promise<{ scannedImages?: string[]; status?: string }> } {
  try {
    return require('react-native-document-scanner-plugin').default;
  } catch {
    return null;
  }
}

export default function Capture() {
  const [step, setStep] = useState<Step>({ kind: 'pick' });

  async function fromPicker(camera: boolean) {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('권한이 필요해요', camera ? '카메라 접근을 허용해 주세요.' : '사진 접근을 허용해 주세요.');
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, exif: false };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets[0]) return;
    const saved = saveOriginal(res.assets[0].uri);
    setStep({ kind: 'crop', uri: saved.uri });
  }

  async function autoScan() {
    const scanner = loadScanner();
    if (!scanner) return Alert.alert('자동 스캔 사용 불가', '자동 인식은 개발 빌드에서만 지원돼요. 촬영 후 직접 모서리를 맞춰 주세요.');
    try {
      const r = await scanner.scanDocument({ maxNumDocuments: 1, croppedImageQuality: 100 });
      const uri = r.scannedImages?.[0];
      if (r.status === 'cancel' || !uri) return;
      setStep({ kind: 'done', uri, auto: true });
    } catch {
      Alert.alert('스캔 실패', '다시 시도해 주세요.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()}><Text style={styles.link}>닫기</Text></Pressable>
        <Text style={styles.title}>티켓 추가</Text>
        <View style={{ width: 32 }} />
      </View>

      {step.kind === 'pick' && (
        <View style={styles.body}>
          <Text style={styles.desc}>티켓을 촬영하면 원본은 원본 앨범에 그대로 보관되고, 잘라낸 이미지로 카드를 만들 수 있어요.</Text>
          <Btn label="자동 스캔" onPress={autoScan} primary />
          <Btn label="카메라로 촬영" onPress={() => fromPicker(true)} />
          <Btn label="앨범에서 선택" onPress={() => fromPicker(false)} />
        </View>
      )}

      {step.kind === 'crop' && <CornerCrop uri={step.uri} onDone={() => setStep({ kind: 'done', uri: step.uri, auto: false })} />}

      {step.kind === 'done' && (
        <View style={styles.body}>
          <Image source={{ uri: step.uri }} style={styles.preview} resizeMode="contain" />
          <Text style={styles.desc}>{step.auto ? '자동으로 잘라내고 기울기를 보정했어요.' : '원본을 원본 앨범에 보관했어요.'}</Text>
          <Btn label="카드로 만들기" primary onPress={() => Alert.alert('준비 중', '카드 만들기는 곧 지원될 예정이에요.')} />
          <Btn label="완료" onPress={() => router.back()} />
        </View>
      )}
    </SafeAreaView>
  );
}

/** 수동 4꼭짓점 자르기 UI. 현재는 꼭짓점 위치만 조정하며 실제 원근 보정은 적용하지 않는다(자리표시). */
function CornerCrop({ uri, onDone }: { uri: string; onDone: (pts: Pt[]) => void }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [pts, setPts] = useState<Pt[]>([]);
  const ptsRef = useRef<Pt[]>([]);
  ptsRef.current = pts;

  function onLayout(e: LayoutChangeEvent) {
    const { width: w, height: h } = e.nativeEvent.layout;
    setBox({ w, h });
    const m = 0.12;
    setPts([{ x: w * m, y: h * m }, { x: w * (1 - m), y: h * m }, { x: w * (1 - m), y: h * (1 - m) }, { x: w * m, y: h * (1 - m) }]);
  }

  return (
    <View style={styles.body}>
      <Text style={styles.desc}>모서리 네 곳을 티켓 끝에 맞춰 주세요.</Text>
      <View style={styles.cropArea} onLayout={onLayout}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
        {pts.map((p, i) => (
          <Handle key={i} p={p} bounds={box} onMove={(np) => setPts((cur) => cur.map((c, j) => (j === i ? np : c)))} />
        ))}
      </View>
      <Btn label="자르기" primary onPress={() => onDone(ptsRef.current)} />
    </View>
  );
}

function Handle({ p, bounds, onMove }: { p: Pt; bounds: { w: number; h: number }; onMove: (p: Pt) => void }) {
  const start = useRef(p);
  const latest = useRef({ p, bounds, onMove });
  latest.current = { p, bounds, onMove };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { start.current = latest.current.p; },
      onPanResponderMove: (_, g) => {
        const { bounds: b, onMove: mv } = latest.current;
        mv({ x: Math.max(0, Math.min(b.w, start.current.x + g.dx)), y: Math.max(0, Math.min(b.h, start.current.y + g.dy)) });
      },
    }),
  ).current;
  return <View {...pan.panHandlers} style={[styles.handle, { left: p.x - 14, top: p.y - 14 }]} />;
}

function Btn({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, primary && styles.btnPrimary]}>
      <Text style={[styles.btnText, primary && styles.btnTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 18 },
  link: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 15 },
  body: { flex: 1, padding: 20, gap: 12 },
  desc: { color: colors.muted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  preview: { flex: 1, borderRadius: 12, backgroundColor: colors.surface },
  cropArea: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surface },
  handle: { position: 'absolute', width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: colors.accent, backgroundColor: 'rgba(242,181,68,0.25)' },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  btnPrimary: { backgroundColor: colors.accent, borderColor: colors.accent },
  btnText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  btnTextPrimary: { color: colors.bg },
});
