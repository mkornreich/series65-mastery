import React, { useLayoutEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen, Card, AppButton, Pill } from '../components/ui';
import { MasteryBar } from '../components/MasteryBar';
import { colors, spacing, font, masteryLabel } from '../theme/theme';
import { useStore } from '../store/useStore';
import { getSubject } from '../data/curriculum';
import { masteryScore, masteryLevel } from '../mastery/engine';
import { bankByComponent } from '../mastery/selection';

type Props = NativeStackScreenProps<RootStackParamList, 'Subject'>;

export default function SubjectScreen({ route, navigation }: Props) {
  const { subjectId } = route.params;
  const subject = getSubject(subjectId);
  const mastery = useStore((s) => s.progress.mastery);

  useLayoutEffect(() => {
    navigation.setOptions({ title: subject ? `Section ${subject.code}` : 'Section' });
  }, [navigation, subject]);

  if (!subject) {
    return (
      <Screen>
        <Text style={styles.title}>Section not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>{subject.title}</Text>
      <Text style={styles.meta}>
        {subject.weightPct}% of exam · {subject.scoredQuestions} scored questions
      </Text>

      <AppButton
        title="Practice this section"
        icon="✎"
        style={{ marginTop: spacing.md }}
        onPress={() =>
          navigation.navigate('Quiz', {
            config: {
              title: subject.title,
              mode: 'subject',
              subjectId: subject.id,
              count: 15,
            },
          })
        }
      />

      <Text style={styles.sectionTitle}>Topics</Text>
      {subject.components.map((c) => {
        const m = mastery[c.id];
        const score = masteryScore(m);
        const level = masteryLevel(m);
        const bankCount = bankByComponent(c.id).length;
        return (
          <Card key={c.id} onPress={() => navigation.navigate('Topic', { componentId: c.id })}>
            <View style={styles.topRow}>
              <Text style={styles.topicTitle}>
                {c.number}. {c.title}
              </Text>
              <Pill
                label={masteryLabel[level]}
                color={colors.mastery[level]}
                bg={`${colors.mastery[level]}22`}
              />
            </View>
            <Text style={styles.topicMeta}>
              {c.subtopics.length} subtopics · {bankCount} questions
            </Text>
            <View style={{ marginTop: spacing.sm }}>
              <MasteryBar score={score} level={level} showLabel={false} height={6} />
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.h2, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  meta: { fontSize: font.small, color: colors.textMuted, marginTop: 4 },
  sectionTitle: {
    fontSize: font.h3,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topicTitle: { flex: 1, color: colors.text, fontSize: font.body, fontWeight: '700', paddingRight: spacing.sm },
  topicMeta: { color: colors.textMuted, fontSize: font.small, marginTop: 4 },
});
