import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

export function Segmented<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={[styles.item, on && styles.itemOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
            <Text style={[styles.label, on && styles.labelOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 4 },
  item: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  itemOn: { backgroundColor: colors.accent },
  label: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 14 },
  labelOn: { color: colors.bg },
});
