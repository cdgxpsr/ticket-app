import { useState } from 'react';
import { Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OriginalPhoto } from '../lib/originals';
import { colors, fonts } from '../theme';

const SAMPLE_TONES = ['#3A2F4A', '#4A3A2F', '#2F4A44', '#4A2F3B', '#2F364A', '#44402B'];

export function OriginalAlbum({ photos }: { photos: OriginalPhoto[] }) {
  const [open, setOpen] = useState<OriginalPhoto | null>(null);
  const cells: (OriginalPhoto | { id: string; tone: string })[] = photos.length
    ? photos
    : SAMPLE_TONES.map((tone, i) => ({ id: `sample-${i}`, tone }));

  return (
    <View>
      {!photos.length && <Text style={styles.hint}>아직 보관된 원본이 없어요. 아래는 예시입니다.</Text>}
      <View style={styles.grid}>
        {cells.map((c) => (
          <Pressable key={c.id} style={styles.cell} onPress={() => ('uri' in c ? setOpen(c) : undefined)}>
            {'uri' in c ? <Image source={{ uri: c.uri }} style={styles.img} /> : <View style={[styles.img, { backgroundColor: c.tone }]} />}
          </Pressable>
        ))}
      </View>
      <Modal visible={!!open} animationType="fade" onRequestClose={() => setOpen(null)}>
        <SafeAreaView style={styles.viewer}>
          <Pressable onPress={() => setOpen(null)} style={styles.close}>
            <Text style={styles.closeText}>닫기</Text>
          </Pressable>
          <ScrollView maximumZoomScale={4} minimumZoomScale={1} centerContent contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            {open && <Image source={{ uri: open.uri }} style={styles.full} resizeMode="contain" />}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const W = Dimensions.get('window').width;
const styles = StyleSheet.create({
  hint: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3 },
  cell: { width: '33.333%', aspectRatio: 3 / 4, padding: 3 },
  img: { flex: 1, borderRadius: 8, backgroundColor: colors.surface },
  viewer: { flex: 1, backgroundColor: '#000' },
  close: { alignSelf: 'flex-end', padding: 16 },
  closeText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16 },
  full: { width: W, height: W * 1.5 },
});
