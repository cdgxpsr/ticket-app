import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ymdLocal, type DateSpan } from '../data/culture';
import { colors, fonts } from '../theme';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const md = (s: string) => `${Number(s.slice(5, 7))}.${Number(s.slice(8, 10))}`;

export const spanLabel = (s: DateSpan) => (!s ? '날짜' : s.from === s.to ? md(s.from) : `${md(s.from)}~${md(s.to)}`);

/** Month calendar: tap a day for that day, tap a second day to make a range. */
export function Calendar({ value, onChange, onDone }: { value: DateSpan; onChange: (s: DateSpan) => void; onDone: () => void }) {
  const today = ymdLocal(new Date());
  const [month, setMonth] = useState(() => { const d = value ? new Date(value.from) : new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [picking, setPicking] = useState<string | null>(null);

  const first = month.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => ymdLocal(new Date(month.getFullYear(), month.getMonth(), i + 1)))];
  while (cells.length % 7) cells.push(null);
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  const tap = (d: string) => {
    if (!picking) { setPicking(d); onChange({ from: d, to: d }); return; }
    const [a, b] = picking <= d ? [picking, d] : [d, picking];
    onChange({ from: a, to: b });
    setPicking(null);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Pressable onPress={() => shift(-1)} hitSlop={10}><Text style={styles.arrow}>‹</Text></Pressable>
        <Text style={styles.month}>{month.getFullYear()}년 {month.getMonth() + 1}월</Text>
        <Pressable onPress={() => shift(1)} hitSlop={10}><Text style={styles.arrow}>›</Text></Pressable>
      </View>
      <View style={styles.row}>
        {WEEK.map((w, i) => <Text key={w} style={[styles.week, i === 0 && { color: '#FF7A8A' }, i === 6 && { color: '#7AB8FF' }]}>{w}</Text>)}
      </View>
      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={styles.cell} />;
          const inSpan = !!value && d >= value.from && d <= value.to;
          const edge = !!value && (d === value.from || d === value.to);
          return (
            <Pressable key={d} style={[styles.cell, inSpan && styles.span, edge && styles.edge]} onPress={() => tap(d)} accessibilityLabel={d}>
              <Text style={[styles.day, d < today && styles.past, d === today && styles.today, edge && styles.edgeText]}>{Number(d.slice(8))}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>{picking ? '끝나는 날을 눌러 주세요 (같은 날을 누르면 하루만)' : '날짜를 누르고, 기간이면 끝나는 날도 눌러 주세요'}</Text>
      <View style={styles.actions}>
        <Pressable onPress={() => { setPicking(null); onChange(null); }} style={styles.reset}><Text style={styles.resetText}>전체 기간</Text></Pressable>
        <Pressable onPress={onDone} style={styles.done}><Text style={styles.doneText}>{value ? `${spanLabel(value)} 보기` : '닫기'}</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 6 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  arrow: { color: colors.text, fontSize: 24, lineHeight: 28, paddingHorizontal: 8 },
  month: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
  row: { flexDirection: 'row' },
  week: { flex: 1, textAlign: 'center', color: '#8E859A', fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 40, alignItems: 'center', justifyContent: 'center' },
  span: { backgroundColor: 'rgba(242,180,65,0.18)' },
  edge: { backgroundColor: colors.accent, borderRadius: 10 },
  day: { color: colors.text, fontFamily: fonts.regular, fontSize: 15, lineHeight: 20 },
  past: { color: '#5C5468' },
  today: { color: colors.accent, fontFamily: fonts.bold },
  edgeText: { color: colors.bg, fontFamily: fonts.bold },
  hint: { color: '#8E859A', fontFamily: fonts.regular, fontSize: 12, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  reset: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, alignItems: 'center' },
  resetText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  done: { flex: 2, borderRadius: 12, backgroundColor: colors.accent, paddingVertical: 12, alignItems: 'center' },
  doneText: { color: colors.bg, fontFamily: fonts.bold, fontSize: 14 },
});
