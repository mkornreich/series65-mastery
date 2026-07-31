import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen, Card, AppButton, Body, StatTile } from '../components/ui';
import { colors, spacing, font } from '../theme/theme';
import { EXAM_SPEC } from '../data/curriculum';
import { canBuildFullExam } from '../exam/generator';
import { useStore } from '../store/useStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ExamIntroScreen() {
  const navigation = useNavigation<Nav>();
  const history = useStore((s) => s.progress.examHistory);
  const ready = canBuildFullExam();

  return (
    <Screen>
      <Text style={styles.h1}>Practice Exam</Text>
      <Text style={styles.sub}>A full-length, blueprint-weighted mock exam.</Text>

      <Card>
        <View style={styles.statsRow}>
          <StatTile value={`${EXAM_SPEC.totalQuestions}`} label="questions" />
          <StatTile value={`${EXAM_SPEC.passingCorrect}/${EXAM_SPEC.scoredQuestions}`} label="to pass" color={colors.accent} />
          <StatTile value={`${EXAM_SPEC.timeLimitMinutes}m`} label="time limit" />
        </View>
        <Body muted style={{ marginTop: spacing.md }}>
          Like the real Series 65: {EXAM_SPEC.totalQuestions} multiple-choice questions
          ({EXAM_SPEC.scoredQuestions} scored + {EXAM_SPEC.pretestQuestions} unscored
          pretest), {EXAM_SPEC.timeLimitMinutes} minutes. You must answer at least{' '}
          {EXAM_SPEC.passingCorrect} of {EXAM_SPEC.scoredQuestions} scored questions
          correctly ({Math.round((EXAM_SPEC.passingCorrect / EXAM_SPEC.scoredQuestions) * 100)}%).
          Questions are drawn across all four sections at their blueprint weights.
        </Body>
      </Card>

      <AppButton
        title="Start full practice exam"
        icon="▶"
        disabled={!ready}
        onPress={() => navigation.navigate('Exam', {})}
      />
      {!ready && (
        <Text style={styles.warn}>
          Not enough questions in the bank to assemble a full exam.
        </Text>
      )}

      {history.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Past attempts</Text>
          {history.map((h) => (
            <Card key={h.id} onPress={() => navigation.navigate('ExamResult', { resultId: h.id })}>
              <View style={styles.histRow}>
                <View>
                  <Text style={[styles.histVerdict, { color: h.passed ? colors.success : colors.danger }]}>
                    {h.passed ? 'PASS' : 'FAIL'}
                  </Text>
                  <Text style={styles.histDate}>
                    {new Date(h.date).toLocaleDateString()} ·{' '}
                    {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.histScore}>
                  {h.scoredCorrect}/{h.scoredTotal}
                </Text>
              </View>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: font.h1, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  sub: { fontSize: font.small, color: colors.textMuted, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  warn: { color: colors.warn, fontSize: font.small, marginTop: spacing.sm, textAlign: 'center' },
  sectionTitle: { fontSize: font.h3, fontWeight: '800', color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  histVerdict: { fontSize: font.body, fontWeight: '800' },
  histDate: { fontSize: font.small, color: colors.textMuted, marginTop: 2 },
  histScore: { fontSize: font.h3, fontWeight: '800', color: colors.text },
});
