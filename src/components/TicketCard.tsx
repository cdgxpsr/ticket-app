import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { PawStamp } from './PawStamp';

export type Ticket = { id: string; title: string; venue: string; date: string; seat: string; category?: string; time?: string };

export function TicketCard({ ticket, large }: { ticket: Ticket; large?: boolean }) {
  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.body}>
        {!!ticket.category && <Text style={styles.cat}>{ticket.category}</Text>}
        <Text style={[styles.title, large && styles.titleLarge]}>{ticket.title || '제목 없음'}</Text>
        <Text style={styles.meta}>{ticket.venue}</Text>
        <Text style={styles.meta}>{[ticket.date, ticket.time].filter(Boolean).join(' ')}{ticket.seat ? ` · ${ticket.seat}` : ''}</Text>
        <Text style={styles.price}>[가격]</Text>
      </View>
      <View style={styles.stamp}>
        <PawStamp size={large ? 56 : 28} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  accentBar: { width: 6, backgroundColor: colors.accent },
  body: { flex: 1, padding: 16, gap: 4 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 17 },
  titleLarge: { fontSize: 24 },
  cat: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 12 },
  meta: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13 },
  price: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 14, marginTop: 6 },
  stamp: { padding: 16, justifyContent: 'center' },
});
