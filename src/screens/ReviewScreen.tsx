import React, { useMemo } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen, Card, AppButton, StatTile, Body } from '../components/ui';
import { spacing, font, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/useStore';
import { dueCount } from '../mastery/engine';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ReviewScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const sr = useStore((s) => s.progress.sr);
  const missed = useStore((s) => s.progress.missed);
  const flagged = useStore((s) => s.progress.flagged);

  const due = useMemo(() => dueCount(sr, Date.now()), [sr]);
  const tracked = Object.keys(sr).length;

  return (
    <Screen topInset>
      <Text style={styles.h1}>Review</Text>
      <Text style={styles.sub}>
        Spaced repetition resurfaces questions right before you’d forget them, so
        mastery sticks.
      </Text>

      <Card>
        <View style={styles.statsRow}>
          <StatTile value={`${due}`} label="due now" color={due ? colors.warn : colors.textMuted} />
          <StatTile value={`${missed.length}`} label="missed" color={missed.length ? colors.danger : colors.textMuted} />
          <StatTile value={`${flagged.length}`} label="flagged" color={flagged.length ? colors.accent : colors.textMuted} />
        </View>
        <Body muted style={{ marginTop: spacing.md }}>
          {tracked} questions in your review system.
        </Body>
      </Card>

      <AppButton
        title={
          due
            ? `Review ${due} due questions`
            : missed.length
            ? `Review ${missed.length} missed questions`
            : 'Nothing due right now'
        }
        icon="🔁"
        disabled={!due && missed.length === 0}
        onPress={() =>
          navigation.navigate('Quiz', {
            config: {
              title: 'Spaced review',
              mode: 'review',
              count: due ? Math.min(due, 25) : 20,
            },
          })
        }
      />
      <View style={{ height: spacing.sm }} />
      <AppButton
        title={`Practice missed (${missed.length})`}
        icon="✗"
        variant="secondary"
        disabled={!missed.length}
        onPress={() =>
          navigation.navigate('Quiz', {
            config: { title: 'Missed questions', mode: 'missed', count: 30 },
          })
        }
      />
      <View style={{ height: spacing.sm }} />
      <AppButton
        title={`Flagged questions (${flagged.length})`}
        icon="★"
        variant="secondary"
        disabled={!flagged.length}
        onPress={() =>
          navigation.navigate('Quiz', {
            config: { title: 'Flagged questions', mode: 'flagged' },
          })
        }
      />
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    h1: { fontSize: font.h1, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
    sub: { fontSize: font.small, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 19 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  });
