import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen, Card, AppButton, StatTile } from '../components/ui';
import { ProgressRing } from '../components/ProgressRing';
import { ThemeColors, spacing, font } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/useStore';
import { EXAM_SPEC } from '../data/curriculum';
import { overallReadiness, dueCount } from '../mastery/engine';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const mastery = useStore((s) => s.progress.mastery);
  const sr = useStore((s) => s.progress.sr);
  const missed = useStore((s) => s.progress.missed);
  const flagged = useStore((s) => s.progress.flagged);
  const totalAnswered = useStore((s) => s.progress.totalAnswered);
  const streak = useStore((s) => s.progress.studyStreakDays);

  const readiness = useMemo(() => overallReadiness(mastery), [mastery]);
  const due = useMemo(() => dueCount(sr, Date.now()), [sr]);
  const readyPct = Math.round(readiness * 100);
  const passMark = Math.round((EXAM_SPEC.passingCorrect / EXAM_SPEC.scoredQuestions) * 100);

  const ringColor =
    readyPct >= passMark ? colors.success : readyPct >= 50 ? colors.warn : colors.primary;

  return (
    <Screen topInset>
      <Text style={styles.h1}>Series 65 Mastery</Text>
      <Text style={styles.sub}>Uniform Investment Adviser Law Exam</Text>

      <Card>
        <View style={styles.readyRow}>
          <ProgressRing
            progress={readiness}
            color={ringColor}
            size={128}
            label={`${readyPct}%`}
            sublabel="ready"
          />
          <View style={styles.readyText}>
            <Text style={styles.readyTitle}>Exam readiness</Text>
            <Text style={styles.readyBody}>
              Estimated from your mastery across the four exam sections, weighted like
              the real blueprint.
            </Text>
            <Text style={[styles.passNote, { color: readyPct >= passMark ? colors.success : colors.textMuted }]}>
              Pass target: {passMark}% ({EXAM_SPEC.passingCorrect}/{EXAM_SPEC.scoredQuestions})
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.statsRow}>
          <StatTile value={`${streak}`} label="day streak" color={colors.accent} />
          <StatTile value={`${totalAnswered}`} label="answered" />
          <StatTile value={`${due}`} label="due to review" color={due ? colors.warn : colors.textMuted} />
        </View>
      </Card>

      <AppButton
        title="Quick practice (adaptive)"
        icon="⚡"
        onPress={() =>
          navigation.navigate('Quiz', {
            config: { title: 'Adaptive practice', mode: 'adaptive', count: 10 },
          })
        }
      />
      <View style={{ height: spacing.sm }} />
      <AppButton
        title={due ? `Review ${due} due now` : 'Review (none due)'}
        variant="secondary"
        icon="🔁"
        disabled={!due}
        onPress={() =>
          navigation.navigate('Quiz', {
            config: { title: 'Spaced review', mode: 'review', count: Math.min(due, 25) },
          })
        }
      />
      <View style={{ height: spacing.sm }} />
      <AppButton
        title={`Practice missed (${missed.length})`}
        variant="secondary"
        icon="✗"
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
        variant="secondary"
        icon="★"
        disabled={!flagged.length}
        onPress={() =>
          navigation.navigate('Quiz', {
            config: { title: 'Flagged questions', mode: 'flagged' },
          })
        }
      />

      <Text style={styles.srNote}>
        Spaced repetition resurfaces questions right before you’d forget them, so
        mastery sticks.
      </Text>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  h1: { fontSize: font.h1, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  sub: { fontSize: font.small, color: colors.textMuted, marginBottom: spacing.lg },
  readyRow: { flexDirection: 'row', alignItems: 'center' },
  readyText: { flex: 1, marginLeft: spacing.lg },
  readyTitle: { fontSize: font.h3, fontWeight: '800', color: colors.text },
  readyBody: { fontSize: font.small, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  passNote: { fontSize: font.small, fontWeight: '700', marginTop: spacing.sm },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  srNote: {
    fontSize: font.small,
    color: colors.textMuted,
    lineHeight: 19,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
});
