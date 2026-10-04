import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { CatAvatar } from './CatAvatar';
import { PawStamp } from './PawStamp';
import { Ticket, TicketCard } from './TicketCard';
import { t } from '../i18n';

// Laid out at 360x640 logical points; captured at 1080x1920 pixels.
export const STORY_W = 360;
export const STORY_H = 640;

export const StoryShareView = forwardRef<View, { ticket: Ticket }>(function StoryShareView({ ticket }, ref) {
  return (
    <View ref={ref} collapsable={false} style={styles.root}>
      <View style={styles.header}>
        <CatAvatar size={72} />
        <Text style={styles.wordmark}>{t('냥냥수첩')}</Text>
      </View>
      <View style={styles.stamp}>
        <PawStamp size={88} color={colors.accent} rotate={-18} />
      </View>
      <TicketCard ticket={ticket} large />
      <View style={styles.footer}>
        <Text style={styles.cta}>{t('냥냥수첩에서 내 관람 기록 모으기')}</Text>
        <Text style={styles.small}>{t('냥냥수첩')}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { width: STORY_W, height: STORY_H, backgroundColor: colors.bg, padding: 24, justifyContent: 'space-between' },
  header: { alignItems: 'center', gap: 8, marginTop: 24 },
  wordmark: { color: colors.accent, fontFamily: fonts.bold, fontSize: 16, letterSpacing: 2 },
  stamp: { alignItems: 'center' },
  footer: { alignItems: 'center', gap: 6, marginBottom: 24 },
  cta: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  small: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11 },
});
