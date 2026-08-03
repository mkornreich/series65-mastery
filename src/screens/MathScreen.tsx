import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen, Card, AppButton, Body, Pill } from '../components/ui';
import { MasteryBar } from '../components/MasteryBar';
import { Markdown } from '../components/markdown';
import { spacing, font, masteryLabel, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/useStore';
import { MATH_TOPICS } from '../data/mathTopics';
import { getSubject } from '../data/curriculum';
import { masteryScore, masteryLevel } from '../mastery/engine';
import { bankByComponent } from '../mastery/selection';
import { useLLM } from '../llm/LLMProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Math'>;

// The curriculum components every math topic feeds into (deduped).
const MATH_COMPONENT_IDS = [...new Set(MATH_TOPICS.map((t) => t.homeComponentId))];

export default function MathScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const mastery = useStore((s) => s.progress.mastery);
  const llm = useLLM();
  const aiCapable = llm.available && !!llm.activeModelId;

  // Overall math mastery = average across every math topic's home component.
  const overall =
    MATH_COMPONENT_IDS.reduce((a, id) => a + masteryScore(mastery[id]), 0) /
    Math.max(1, MATH_COMPONENT_IDS.length);
  const overallLevel =
    overall >= 0.85
      ? 'mastered'
      : overall >= 0.7
      ? 'proficient'
      : overall >= 0.5
      ? 'developing'
      : overall > 0
      ? 'beginning'
      : 'not_started';
  const mathBankCount = MATH_COMPONENT_IDS.reduce(
    (a, id) => a + bankByComponent(id).length,
    0
  );

  return (
    <Screen>
      <Text style={styles.h1}>Math & formulas</Text>
      <Body muted style={{ marginBottom: spacing.md }}>
        The calculations tested on the Series 65. Each formula is explained with a worked
        example — and practicing it builds mastery in the exam section it belongs to.
      </Body>

      {/* Practice / mastery for ALL math at once, up top like the main sections. */}
      <Card>
        <View style={styles.topRow}>
          <Text style={styles.overallLabel}>Your math mastery</Text>
          <Pill label={masteryLabel[overallLevel]} color={colors.mastery[overallLevel]} bg={`${colors.mastery[overallLevel]}22`} />
        </View>
        <MasteryBar score={overall} level={overallLevel} />
        <View style={{ height: spacing.md }} />
        <AppButton
          title="Mastery drill (all math)"
          icon="🎯"
          onPress={() =>
            navigation.navigate('Quiz', {
              config: {
                title: 'Mastery: Math',
                mode: 'components',
                componentIds: MATH_COMPONENT_IDS,
                count: 5,
                masteryDrill: true,
              },
            })
          }
        />
        <View style={{ height: spacing.sm }} />
        <AppButton
          title={aiCapable ? 'Practice all math (endless)' : 'Practice all math'}
          icon="✎"
          variant="secondary"
          onPress={() =>
            navigation.navigate('Quiz', {
              config: {
                title: 'Math practice',
                mode: 'components',
                componentIds: MATH_COMPONENT_IDS,
                count: aiCapable ? Math.max(mathBankCount, 1) : 12,
                aiInfinite: aiCapable,
              },
            })
          }
        />
      </Card>

      <Text style={styles.sectionTitle}>Formulas</Text>
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
            <Text style={styles.counts}>Counts toward: {subject?.title ?? t.subjectId}</Text>
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
    sectionTitle: { fontSize: font.h3, fontWeight: '800', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    overallLabel: { color: colors.textMuted, fontSize: font.small, fontWeight: '700' },
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
