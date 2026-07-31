import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen, Card, AppButton, Body, Divider } from '../components/ui';
import { ProgressRing } from '../components/ProgressRing';
import { MasteryBar } from '../components/MasteryBar';
import { spacing, font, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/useStore';
import { EXAM_SPEC } from '../data/curriculum';
import { BANK_BY_ID } from '../mastery/selection';

type Props = NativeStackScreenProps<RootStackParamList, 'ExamResult'>;

export default function ExamResultScreen({ route, navigation }: Props) {
  const { resultId } = route.params;
  const result = useStore((s) => s.progress.examHistory.find((r) => r.id === resultId));
  const [showMisses, setShowMisses] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!result) {
    return (
      <Screen>
        <Text style={styles.title}>Result not found.</Text>
        <AppButton title="Back" variant="secondary" onPress={() => navigation.popToTop()} />
      </Screen>
    );
  }

  const pct = result.scoredTotal ? result.scoredCorrect / result.scoredTotal : 0;
  const pretest = new Set(result.pretestIds);
  const scoredQuestions = result.questionIds
    .map((id) => BANK_BY_ID[id])
    .filter((q) => q && !pretest.has(q.id));
  const misses = scoredQuestions.filter((q) => result.answers[q.id] !== q.answerIndex);

  const mins = Math.floor(result.durationSec / 60);
  const secs = result.durationSec % 60;

  return (
    <Screen>
      <Card accent={result.passed ? colors.success : colors.danger}>
        <Text style={[styles.verdict, { color: result.passed ? colors.success : colors.danger }]}>
          {result.passed ? 'PASS' : 'FAIL'}
        </Text>
        <View style={styles.ringWrap}>
          <ProgressRing
            progress={pct}
            color={result.passed ? colors.success : colors.danger}
            label={`${result.scoredCorrect}`}
            sublabel={`of ${result.scoredTotal}`}
          />
        </View>
        <Body muted style={{ textAlign: 'center' }}>
          You needed {result.passingCorrect} correct to pass. Time: {mins}m {secs}s.
        </Body>
      </Card>

      <Text style={styles.sectionTitle}>Section breakdown</Text>
      {result.sections.map((sec) => {
        const p = sec.total ? sec.correct / sec.total : 0;
        return (
          <Card key={sec.subjectId} accent={colors.subject[sec.subjectId]}>
            <View style={styles.secRow}>
              <Text style={styles.secTitle}>{sec.title}</Text>
              <Text style={styles.secScore}>
                {sec.correct}/{sec.total}
              </Text>
            </View>
            <MasteryBar
              score={p}
              level={p >= 0.7 ? 'proficient' : p >= 0.5 ? 'developing' : 'beginning'}
              showLabel={false}
              height={6}
            />
          </Card>
        );
      })}

      <View style={{ marginTop: spacing.lg }}>
        {misses.length > 0 && (
          <AppButton
            title={showMisses ? 'Hide missed questions' : `Review ${misses.length} missed`}
            variant="secondary"
            onPress={() => setShowMisses((v) => !v)}
          />
        )}
        <View style={{ height: spacing.sm }} />
        <AppButton title="Done" onPress={() => navigation.popToTop()} />
      </View>

      {showMisses &&
        misses.map((q, i) => (
          <Card key={i} style={{ marginTop: spacing.sm }}>
            <Body style={{ fontWeight: '600', marginBottom: spacing.sm }}>{q.stem}</Body>
            <Text style={styles.correctLine}>
              Correct: {String.fromCharCode(65 + q.answerIndex)}. {q.choices[q.answerIndex]}
            </Text>
            {result.answers[q.id] != null && result.answers[q.id] >= 0 && (
              <Text style={styles.yourLine}>
                You: {String.fromCharCode(65 + result.answers[q.id])}. {q.choices[result.answers[q.id]]}
              </Text>
            )}
            <Divider />
            <Body muted>{q.explanation}</Body>
          </Card>
        ))}
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  title: { fontSize: font.h3, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  verdict: { fontSize: font.h1, fontWeight: '900', textAlign: 'center' },
  ringWrap: { alignItems: 'center', marginVertical: spacing.lg },
  sectionTitle: { fontSize: font.h3, fontWeight: '800', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  secRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  secTitle: { flex: 1, color: colors.text, fontSize: font.small, fontWeight: '700', paddingRight: spacing.sm },
  secScore: { color: colors.text, fontSize: font.body, fontWeight: '800' },
  correctLine: { color: colors.success, fontSize: font.small, fontWeight: '600', marginBottom: 2 },
  yourLine: { color: colors.danger, fontSize: font.small, fontWeight: '600' },
});
