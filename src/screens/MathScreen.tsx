import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen, Card, Body, Pill } from '../components/ui';
import { MasteryBar } from '../components/MasteryBar';
import { Markdown } from '../components/markdown';
import { spacing, font, masteryLabel, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/useStore';
import { MATH_TOPICS } from '../data/mathTopics';
import { getSubject } from '../data/curriculum';
import { masteryScore, masteryLevel } from '../mastery/engine';

type Props = NativeStackScreenProps<RootStackParamList, 'Math'>;

export default function MathScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const mastery = useStore((s) => s.progress.mastery);

  return (
    <Screen>
      <Text style={styles.h1}>Math & formulas</Text>
      <Body muted style={{ marginBottom: spacing.md }}>
        The calculations tested on the Series 65. Each formula is explained with a worked
        example — and practicing it builds mastery in the exam section it belongs to.
      </Body>

      {MATH_TOPICS.map((t) => {
        const m = mastery[t.homeComponentId];
        const score = masteryScore(m);
        const level = masteryLevel(m);
        const subject = getSubject(t.subjectId);
        return (
          <Card key={t.id} onPress={() => navigation.navigate('MathTopic', { topicId: t.id })}>
            <View style={styles.topRow}>
              <Text style={styles.title}>{t.title}</Text>
              <Pill label={masteryLabel[level]} color={colors.mastery[level]} bg={`${colors.mastery[level]}22`} />
            </View>
            <View style={styles.formulaWrap}>
              <Markdown source={`$$${t.formulaLatex}$$`} baseSize={font.small} />
            </View>
            <Text style={styles.counts}>
              Counts toward: {subject?.title ?? t.subjectId}
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

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    h1: { fontSize: font.h1, fontWeight: '800', color: colors.text, marginTop: spacing.sm, marginBottom: spacing.sm },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { flex: 1, color: colors.text, fontSize: font.body, fontWeight: '800', paddingRight: spacing.sm },
    formulaWrap: {
      backgroundColor: colors.bgAlt,
      borderRadius: 10,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginTop: spacing.sm,
      overflow: 'hidden',
    },
    counts: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.sm, fontWeight: '600' },
  });
