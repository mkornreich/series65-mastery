import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen, Card, AppButton, StatTile, SectionHeader } from '../components/ui';
import { ProgressRing } from '../components/ProgressRing';
import { MasteryBar } from '../components/MasteryBar';
import { colors, spacing, font } from '../theme/theme';
import { useStore } from '../store/useStore';
import { SUBJECTS, EXAM_SPEC } from '../data/curriculum';
import {
  overallReadiness,
  subjectMastery,
  masteryScore,
  masteryLevel,
  dueCount,
} from '../mastery/engine';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const mastery = useStore((s) => s.progress.mastery);
  const sr = useStore((s) => s.progress.sr);
  const totalAnswered = useStore((s) => s.progress.totalAnswered);
  const streak = useStore((s) => s.progress.studyStreakDays);

  const readiness = useMemo(() => overallReadiness(mastery), [mastery]);
  const due = useMemo(() => dueCount(sr, Date.now()), [sr]);
  const readyPct = Math.round(readiness * 100);
  const passMark = Math.round((EXAM_SPEC.passingCorrect / EXAM_SPEC.scoredQuestions) * 100);

  const ringColor =
    readyPct >= passMark ? colors.success : readyPct >= 50 ? colors.warn : colors.primary;

  return (
    <Screen>
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

      <SectionHeader title="Mastery by section" />
      {SUBJECTS.map((s) => {
        const score = subjectMastery(s, mastery);
        // Represent a subject's overall level by its average score bucket.
        const level =
          score === 0
            ? 'not_started'
            : score >= 0.85
            ? 'mastered'
            : score >= 0.7
            ? 'proficient'
            : score >= 0.5
            ? 'developing'
            : 'beginning';
        return (
          <Card key={s.id} accent={colors.subject[s.id]} onPress={() => navigation.navigate('Subject', { subjectId: s.id })}>
            <View style={styles.subjRow}>
              <Text style={styles.subjTitle}>{s.title}</Text>
              <Text style={styles.subjWeight}>{s.weightPct}%</Text>
            </View>
            <MasteryBar score={score} level={level as any} />
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: font.h1, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  sub: { fontSize: font.small, color: colors.textMuted, marginBottom: spacing.lg },
  readyRow: { flexDirection: 'row', alignItems: 'center' },
  readyText: { flex: 1, marginLeft: spacing.lg },
  readyTitle: { fontSize: font.h3, fontWeight: '800', color: colors.text },
  readyBody: { fontSize: font.small, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  passNote: { fontSize: font.small, fontWeight: '700', marginTop: spacing.sm },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  subjRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  subjTitle: { flex: 1, color: colors.text, fontSize: font.body, fontWeight: '700', paddingRight: spacing.sm },
  subjWeight: { color: colors.textFaint, fontSize: font.small, fontWeight: '700' },
});
