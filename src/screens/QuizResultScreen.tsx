import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen, Card, AppButton, Body, Divider } from '../components/ui';
import { ProgressRing } from '../components/ProgressRing';
import { colors, spacing, font } from '../theme/theme';
import { COMPONENT_BY_ID } from '../data/curriculum';

type Props = NativeStackScreenProps<RootStackParamList, 'QuizResult'>;

export default function QuizResultScreen({ route, navigation }: Props) {
  const { title, records, config } = route.params;
  const total = records.length;
  const correct = records.filter((r) => r.correct).length;
  const pct = total ? correct / total : 0;
  const missed = records.filter((r) => !r.correct);

  const ringColor =
    pct >= 0.8 ? colors.success : pct >= 0.6 ? colors.warn : colors.danger;

  const message =
    pct >= 0.9
      ? 'Excellent — you have strong command here.'
      : pct >= 0.72
      ? 'Solid. Keep drilling to lock it in.'
      : pct >= 0.5
      ? 'Getting there. Review the misses and try again.'
      : 'Keep at it — review the explanations below.';

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.ringWrap}>
          <ProgressRing
            progress={pct}
            color={ringColor}
            label={`${Math.round(pct * 100)}%`}
            sublabel={`${correct}/${total}`}
          />
        </View>
        <Body muted style={{ textAlign: 'center' }}>
          {message}
        </Body>
      </Card>

      <View style={styles.actions}>
        {missed.length > 0 && (
          <AppButton
            title={`Retry ${missed.length} missed`}
            icon="↻"
            onPress={() =>
              navigation.replace('Quiz', {
                config: {
                  title: 'Retry missed',
                  mode: 'custom',
                  questionIds: missed.map((m) => m.question.id),
                },
              })
            }
          />
        )}
        <AppButton
          title="Done"
          variant="secondary"
          onPress={() => navigation.popToTop()}
          style={{ marginTop: spacing.sm }}
        />
      </View>

      {missed.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Review your misses</Text>
          {missed.map((r, i) => {
            const comp = COMPONENT_BY_ID[r.question.componentId];
            return (
              <Card key={i}>
                <Text style={styles.topic}>{comp?.title}</Text>
                <Body style={{ fontWeight: '600', marginBottom: spacing.sm }}>
                  {r.question.stem}
                </Body>
                <Text style={styles.correctLine}>
                  Correct: {String.fromCharCode(65 + r.question.answerIndex)}.{' '}
                  {r.question.choices[r.question.answerIndex]}
                </Text>
                {r.chosen >= 0 && (
                  <Text style={styles.yourLine}>
                    You chose: {String.fromCharCode(65 + r.chosen)}.{' '}
                    {r.question.choices[r.chosen]}
                  </Text>
                )}
                <Divider />
                <Body muted>{r.question.explanation}</Body>
              </Card>
            );
          })}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.h3, fontWeight: '800', color: colors.text, textAlign: 'center' },
  ringWrap: { alignItems: 'center', marginVertical: spacing.lg },
  actions: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: font.h3,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  topic: { color: colors.textMuted, fontSize: font.small, fontWeight: '700', marginBottom: 4 },
  correctLine: { color: colors.success, fontSize: font.small, fontWeight: '600', marginBottom: 2 },
  yourLine: { color: colors.danger, fontSize: font.small, fontWeight: '600' },
});
