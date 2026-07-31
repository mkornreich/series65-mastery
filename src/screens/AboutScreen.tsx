import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Screen, Card, Body, Divider } from '../components/ui';
import { colors, spacing, font } from '../theme/theme';
import { EXAM_SPEC, SUBJECTS } from '../data/curriculum';
import { totalBankQuestions } from '../mastery/selection';

export default function AboutScreen() {
  return (
    <Screen>
      <Text style={styles.h1}>About</Text>
      <Card>
        <Text style={styles.title}>Series 65 Mastery</Text>
        <Body muted style={{ marginTop: spacing.xs }}>
          A study companion for the NASAA Uniform Investment Adviser Law Examination
          (Series 65), built around mastery learning and spaced repetition, with an
          optional on-device AI tutor.
        </Body>
      </Card>

      <Card>
        <Text style={styles.h3}>How it works</Text>
        <Body style={{ marginTop: spacing.sm }}>
          • <Text style={styles.b}>Mastery learning:</Text> each of the {SUBJECTS.reduce((n, s) => n + s.components.length, 0)} topics
          tracks a mastery level from your recent accuracy and coverage. Drill a topic
          until it’s mastered.
        </Body>
        <Body style={{ marginTop: spacing.sm }}>
          • <Text style={styles.b}>Spaced repetition:</Text> a SuperMemo-2 scheduler
          resurfaces questions before you forget them.
        </Body>
        <Body style={{ marginTop: spacing.sm }}>
          • <Text style={styles.b}>Full practice exam:</Text> {EXAM_SPEC.totalQuestions} questions
          assembled at the real blueprint weights, scored against {EXAM_SPEC.passingCorrect}/
          {EXAM_SPEC.scoredQuestions}.
        </Body>
        <Body style={{ marginTop: spacing.sm }}>
          • <Text style={styles.b}>On-device AI:</Text> a small language model runs locally
          for explanations, tutoring, and generating fresh questions — private and offline.
        </Body>
      </Card>

      <Card>
        <Text style={styles.h3}>Content</Text>
        <Body muted style={{ marginTop: spacing.sm }}>
          {totalBankQuestions()} practice questions across four sections. Curriculum
          structure follows the NASAA Series 65 exam content outline.
        </Body>
        <Divider />
        <Text style={styles.source}>Blueprint source: {EXAM_SPEC.source}</Text>
      </Card>

      <Card>
        <Text style={styles.h3}>Disclaimer</Text>
        <Body muted style={{ marginTop: spacing.sm }}>
          This is an independent study aid. It is not affiliated with or endorsed by
          NASAA or FINRA. Practice questions are original and do not reproduce actual
          exam questions. Not investment advice.
        </Body>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: font.h1, fontWeight: '800', color: colors.text, marginTop: spacing.sm, marginBottom: spacing.md },
  title: { fontSize: font.h2, fontWeight: '800', color: colors.text },
  h3: { fontSize: font.h3, fontWeight: '800', color: colors.text },
  b: { fontWeight: '800', color: colors.text },
  source: { color: colors.textFaint, fontSize: font.small, fontStyle: 'italic' },
});
