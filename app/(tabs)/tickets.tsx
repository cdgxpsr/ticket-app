import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CatAvatar } from '../../src/components/CatAvatar';
import { OriginalAlbum } from '../../src/components/OriginalAlbum';
import { Screen } from '../../src/components/Screen';
import { Segmented } from '../../src/components/Segmented';
import { Ticket, TicketCard } from '../../src/components/TicketCard';
import { listCards, SavedCard, syncCards } from '../../src/lib/cards';
import { listOriginals, OriginalPhoto } from '../../src/lib/originals';
import { colors, fonts } from '../../src/theme';
import { t } from '../../src/i18n';

const SAMPLE: Ticket[] = [
  { id: '1', title: '고양이 뮤지컬', venue: '냥냥아트홀', date: '2026.11.14', seat: 'R석 7열' },
  { id: '2', title: '야옹 재즈 나이트', venue: '꾹꾹이 라운지', date: '2026.12.02', seat: '스탠딩' },
  { id: '3', title: '집사 사진전', venue: '털뭉치 갤러리', date: '2027.01.09', seat: '자유 관람' },
];

type Mode = 'cards' | 'originals';

export default function Tickets() {
  const [mode, setMode] = useState<Mode>('cards');
  const [photos, setPhotos] = useState<OriginalPhoto[]>([]);
  const [cards, setCards] = useState<SavedCard[]>([]);
  useFocusEffect(useCallback(() => { setPhotos(listOriginals()); setCards(listCards()); syncCards().then(setCards).catch(() => {}); }, []));

  return (
    <Screen
      title={t('내 티켓')}
      subtitle={t('모아둔 관람 기록')}
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={() => router.push({ pathname: '/shop', params: { tab: 'inv' } })} accessibilityLabel={t('아바타 꾸미기')}>
          <CatAvatar size={44} />
        </Pressable>
        <Pressable onPress={() => router.push('/capture')} style={styles.add} accessibilityLabel={t('티켓 추가')}>
          <Text style={styles.addText}>+</Text>
        </Pressable>
        </View>
      }
    >
      <Segmented<Mode> options={[{ key: 'cards', label: t('카드') }, { key: 'originals', label: t('원본 앨범') }]} value={mode} onChange={setMode} />
      {mode === 'cards'
        ? cards.length
          ? cards.map((c) => (
              <Pressable key={c.id} onPress={() => router.push({ pathname: '/card/[id]', params: { id: c.id } })}>
                <TicketCard ticket={c} />
              </Pressable>
            ))
          : SAMPLE.map((s) => <TicketCard key={s.id} ticket={{ ...s, title: t(s.title), venue: t(s.venue), seat: t(s.seat) }} />) : <OriginalAlbum photos={photos} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  add: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  addText: { color: colors.bg, fontFamily: fonts.bold, fontSize: 26, lineHeight: 30 },
});
