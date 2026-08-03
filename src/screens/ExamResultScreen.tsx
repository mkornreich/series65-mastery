import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen, Card, AppButton, Body, Divider } from '../components/ui';
import { ProgressRing } from '../components/ProgressRing';
import { MasteryBar } from '../components/MasteryBar';
import { spacing, font, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/useStore';
import { BANK_BY_ID } from '../mastery/selection';
import { COMPONENT_BY_ID } from '../data/curriculum';
import { useLLM } from '../llm/LLMProvider';
import { Question } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ExamResult'>;

/** Review filter: a whole set, one section, or nothing shown. */
type Filter = 'none' | 'all' | 'missed' | { subjectId: string };

export default function ExamResultScreen({ route, navigation }: Props) {
  const { resultId } = route.params;
  const result = useStore((s) => s.progress.examHistory.find((r) => r.id === resultId));
  const [filter, setFilter] = useState<Filter>('none');
  const { colors } = useTheme();
  const llm = useLLM();
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
    .filter((q): q is Question => !!q && !pretest.has(q.id));

  const isCorrect = (q: Question) => result.answers[q.id] === q.answerIndex;
  const isUnanswered = (q: Question) =>
    result.answers[q.id] == null || result.answers[q.id] < 0;
  const misses = scoredQuestions.filter((q) => !isCorrect(q));
  const unansweredCount = scoredQuestions.filter(isUnanswered).length;

  const reviewList: Question[] =
    filter === 'all'
      ? scoredQuestions
      : filter === 'missed'
      ? misses
      : typeof filter === 'object'
      ? scoredQuestions.filter((q) => q.subjectId === filter.subjectId)
      : [];

  const reviewTitle =
    filter === 'all'
      ? `All ${scoredQuestions.length} questions`
      : filter === 'missed'
      ? `${misses.length} missed`
      : typeof filter === 'object'
      ? result.sections.find((s) => s.subjectId === filter.subjectId)?.title ?? 'Section'
      : '';

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
        <View style={styles.statsRow}>
          <Stat label="Correct" value={`${result.scoredCorrect}`} color={colors.success} />
          <Stat label="Incorrect" value={`${misses.length - unansweredCount}`} color={colors.danger} />
          <Stat label="Unanswered" value={`${unansweredCount}`} color={colors.warn} />
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Section breakdown</Text>
      <Body muted style={{ fontSize: font.small, marginBottom: spacing.sm }}>
        Tap a section to review its questions.
      </Body>
      {result.sections.map((sec) => {
        const p = sec.total ? sec.correct / sec.total : 0;
        const active = typeof filter === 'object' && filter.subjectId === sec.subjectId;
        return (
          <Card
            key={sec.subjectId}
            accent={colors.subject[sec.subjectId]}
            onPress={() => setFilter(active ? 'none' : { subjectId: sec.subjectId })}
          >
            <View style={styles.secRow}>
              <Text style={styles.secTitle}>{sec.title}</Text>
              <Text style={styles.secScore}>
                {sec.correct}/{sec.total} {active ? '▲' : '▸'}
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
        <View style={styles.reviewBtns}>
          <AppButton
            title={filter === 'all' ? 'Hide review' : 'Review entire exam'}
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => setFilter(filter === 'all' ? 'none' : 'all')}
          />
          {misses.length > 0 && (
            <>
              <View style={{ width: spacing.sm }} />
              <AppButton
                title={filter === 'missed' ? 'Hide missed' : `Review ${misses.length} missed`}
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() => setFilter(filter === 'missed' ? 'none' : 'missed')}
              />
            </>
          )}
        </View>
        <View style={{ height: spacing.sm }} />
        <AppButton title="Done" onPress={() => navigation.popToTop()} />
      </View>

      {reviewList.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{reviewTitle}</Text>
          {reviewList.map((q, i) => {
            const chosen = result.answers[q.id];
            const correct = isCorrect(q);
            return (
              <Card key={q.id + i} style={{ marginTop: spacing.sm }} accent={correct ? colors.success : colors.danger}>
                <Text style={[styles.qTag, { color: correct ? colors.success : colors.danger }]}>
                  {correct ? '✓ Correct' : chosen == null || chosen < 0 ? '— Unanswered' : '✗ Incorrect'}
                  {'  ·  '}
                  {COMPONENT_BY_ID[q.componentId]?.title ?? ''}
                </Text>
                <Body style={{ fontWeight: '600', marginVertical: spacing.sm }}>{q.stem}</Body>
                <Text style={styles.correctLine}>
                  Correct: {String.fromCharCode(65 + q.answerIndex)}. {q.choices[q.answerIndex]}
                </Text>
                {chosen != null && chosen >= 0 && chosen !== q.answerIndex && (
                  <Text style={styles.yourLine}>
                    You: {String.fromCharCode(65 + chosen)}. {q.choices[chosen]}
                  </Text>
                )}
                <Divider />
                <Body muted>{q.explanation}</Body>
                {llm.available && (
                  <AppButton
                    title="Ask AI tutor about this question"
                    variant="ghost"
                    icon="💬"
                    style={{ marginTop: spacing.sm }}
                    onPress={() =>
                      navigation.navigate('Tutor', {
                        topicTitle: COMPONENT_BY_ID[q.componentId]?.title,
                        componentId: q.componentId,
                        question: q,
                        chosenIndex: chosen ?? -1,
                      })
                    }
                  />
                )}
              </Card>
            );
          })}
        </>
      )}
    </Screen>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    title: { fontSize: font.h3, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
    verdict: { fontSize: font.h1, fontWeight: '900', textAlign: 'center' },
    ringWrap: { alignItems: 'center', marginVertical: spacing.lg },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.md,
    },
    stat: { alignItems: 'center' },
    statValue: { fontSize: font.h2, fontWeight: '900' },
    statLabel: { color: colors.textMuted, fontSize: font.tiny, fontWeight: '700', marginTop: 2 },
    sectionTitle: { fontSize: font.h3, fontWeight: '800', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
    secRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    secTitle: { flex: 1, color: colors.text, fontSize: font.small, fontWeight: '700', paddingRight: spacing.sm },
    secScore: { color: colors.text, fontSize: font.body, fontWeight: '800' },
    reviewBtns: { flexDirection: 'row' },
    qTag: { fontSize: font.tiny, fontWeight: '800', letterSpacing: 0.5 },
    correctLine: { color: colors.success, fontSize: font.small, fontWeight: '600', marginBottom: 2 },
    yourLine: { color: colors.danger, fontSize: font.small, fontWeight: '600' },
  });
