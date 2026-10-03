import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { repo } from '../../src/data';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CatAvatar } from '../../src/components/CatAvatar';
import { Screen } from '../../src/components/Screen';
import { colors, fonts } from '../../src/theme';

const SETTINGS = [
  { key: 'notifications', label: '알림', value: '켜짐' },
  { key: 'language', label: '언어', value: '한국어' },
];

export default function More() {
  const [stamps, setStamps] = useState(0);
  useFocusEffect(useCallback(() => void repo.getStamps().then(setStamps), []));
  return (
    <Screen title="더보기" header={<Pressable onPress={() => router.push('/avatar')} accessibilityLabel="아바타 꾸미기"><CatAvatar size={56} /></Pressable>}>
      <View style={styles.group}>
        <Pressable style={styles.row} onPress={() => router.push('/avatar')}>
          <Text style={styles.label}>내 고양이 꾸미기</Text>
          <Text style={styles.value}>아바타</Text>
        </Pressable>
        <View style={[styles.row, styles.divider]}>
          <Text style={styles.label}>모은 발도장</Text>
          <Text style={styles.value}>{stamps}개</Text>
        </View>
        <Pressable style={[styles.row, styles.divider]} onPress={() => router.push('/friends')}>
          <Text style={styles.label}>친구</Text>
          <Text style={styles.value}>목록 · 코드로 추가</Text>
        </Pressable>
        <Pressable style={[styles.row, styles.divider]} onPress={() => router.push('/invite')}>
          <Text style={styles.label}>친구 초대</Text>
          <Text style={styles.value}>아이템 선물</Text>
        </Pressable>
      </View>
      <Text style={styles.section}>설정</Text>
      <View style={styles.group}>
        {SETTINGS.map((s, i) => (
          <Pressable key={s.key} style={[styles.row, i > 0 && styles.divider]}>
            <Text style={styles.label}>{s.label}</Text>
            <Text style={styles.value}>{s.value}</Text>
          </Pressable>
        ))}
      </View>
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
});
