import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CatAvatar } from '../../src/components/CatAvatar';
import { Screen } from '../../src/components/Screen';
import { colors, fonts } from '../../src/theme';

const SETTINGS = [
  { key: 'notifications', label: '알림', value: '켜짐' },
  { key: 'language', label: '언어', value: '한국어' },
];

export default function More() {
  return (
    <Screen title="더보기" header={<CatAvatar size={56} />}>
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
