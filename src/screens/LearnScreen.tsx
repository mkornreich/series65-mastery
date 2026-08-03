import React, { useMemo } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen, Card } from '../components/ui';
import { MasteryBar } from '../components/MasteryBar';
import { spacing, font } from '../theme/theme';
import { ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/useStore';
import { SUBJECTS } from '../data/curriculum';
import { subjectMastery } from '../mastery/engine';
import { mathMasteryScore } from '../data/math';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function levelFor(score: number) {
  if (score === 0) return 'not_started';
  if (score >= 0.85) return 'mastered';
  if (score >= 0.7) return 'proficient';
  if (score >= 0.5) return 'developing';
  return 'beginning';
}

export default function LearnScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const mastery = useStore((s) => s.progress.mastery);
  const mathScore = mathMasteryScore(mastery);

  return (
    <Screen topInset>
      <Text style={styles.h1}>Learn</Text>
      <Text style={styles.sub}>
        The four exam sections and their blueprint weights. Study each topic, then
        practice to mastery.
      </Text>

      {SUBJECTS.map((s) => {
        const score = subjectMastery(s, mastery);
        return (
          <Card
            key={s.id}
            accent={colors.subject[s.id]}
            onPress={() => navigation.navigate('Subject', { subjectId: s.id })}
          >
            <View style={styles.row}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{s.code}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{s.title}</Text>
                <Text style={styles.meta}>
                  {s.components.length} topics · {s.weightPct}% of exam
                </Text>
              </View>
            </View>
            <View style={{ marginTop: spacing.md }}>
              <MasteryBar score={score} level={levelFor(score) as any} />
            </View>
          </Card>
        );
      })}

      <Card accent={colors.accent} onPress={() => navigation.navigate('Math')}>
        <View style={styles.row}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>∑</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Math & formulas</Text>
            <Text style={styles.meta}>
              Every Series 65 calculation, explained — mastery counts toward its section.
            </Text>
          </View>
        </View>
        <View style={{ marginTop: spacing.md }}>
          <MasteryBar score={mathScore} level={levelFor(mathScore) as any} />
        </View>
      </Card>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    h1: { fontSize: font.h1, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
    sub: { fontSize: font.small, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 19 },
    row: { flexDirection: 'row', alignItems: 'center' },
    badge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    badgeText: { color: colors.text, fontWeight: '800', fontSize: font.h3 },
    title: { color: colors.text, fontSize: font.body, fontWeight: '800' },
    meta: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  });
