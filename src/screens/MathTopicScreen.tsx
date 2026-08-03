import React, { useLayoutEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen, Card, AppButton, Body, Pill, Divider } from '../components/ui';
import { MasteryBar } from '../components/MasteryBar';
import { Markdown } from '../components/markdown';
import { spacing, font, masteryLabel, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/useStore';
import { MATH_TOPICS } from '../data/mathTopics';
import { getComponent, getSubject } from '../data/curriculum';
import { masteryScore, masteryLevel } from '../mastery/engine';
import { bankByComponent } from '../mastery/selection';
import { useLLM } from '../llm/LLMProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'MathTopic'>;

export default function MathTopicScreen({ route, navigation }: Props) {
  const { topicId } = route.params;
  const topic = MATH_TOPICS.find((t) => t.id === topicId);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const mastery = useStore((s) => s.progress.mastery)[topic?.homeComponentId ?? ''];
  const llm = useLLM();

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Formula' });
  }, [navigation]);

  if (!topic) {
    return (
      <Screen>
        <Text style={styles.title}>Formula not found.</Text>
      </Screen>
    );
  }

  const home = getComponent(topic.homeComponentId);
  const subject = getSubject(topic.subjectId);
  const score = masteryScore(mastery);
  const level = masteryLevel(mastery);
  const aiCapable = llm.available && !!llm.activeModelId;
  const bankCount = bankByComponent(topic.homeComponentId).length;

  return (
    <Screen>
      <Text style={styles.title}>{topic.title}</Text>

      <Card>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>
            Mastery in {subject?.title ?? topic.subjectId}
          </Text>
          <Pill label={masteryLabel[level]} color={colors.mastery[level]} bg={`${colors.mastery[level]}22`} />
        </View>
        <MasteryBar score={score} level={level} />
        <Body muted style={{ fontSize: font.small, marginTop: spacing.sm }}>
          Practicing this formula builds mastery in {home?.title ?? 'its topic'}, which counts
          toward the {subject?.title ?? 'exam'} section.
        </Body>
      </Card>

      <View style={{ height: spacing.md }} />
      <AppButton
        title="Mastery drill (until mastered)"
        icon="🎯"
        onPress={() =>
          navigation.navigate('Quiz', {
            config: {
              title: `Mastery: ${topic.title}`,
              mode: 'component',
              componentId: topic.homeComponentId,
              count: 5,
              masteryDrill: true,
            },
          })
        }
      />
      <View style={{ height: spacing.sm }} />
      <AppButton
        title={aiCapable ? 'Practice (endless)' : 'Practice this formula'}
        icon="✎"
        variant="secondary"
        onPress={() =>
          navigation.navigate('Quiz', {
            config: {
              title: topic.title,
              mode: 'component',
              componentId: topic.homeComponentId,
              count: aiCapable ? Math.max(bankCount, 1) : 10,
              aiInfinite: aiCapable,
            },
          })
        }
      />
      <View style={{ height: spacing.sm }} />
      <AppButton
        title="Ask AI tutor about this formula"
        icon="💬"
        variant="ghost"
        onPress={() =>
          navigation.navigate('Tutor', {
            topicTitle: `${topic.title} (formula)`,
            componentId: topic.homeComponentId,
          })
        }
      />

      <Card style={{ marginTop: spacing.lg }}>
        <View style={styles.formulaWrap}>
          <Markdown source={`$$${topic.formulaLatex}$$`} baseSize={font.body} />
        </View>
        <Body style={{ marginTop: spacing.md }}>{topic.summary}</Body>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.h2}>What the variables mean</Text>
        {topic.variables.map((v, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.dot}>•</Text>
            <Markdown source={v} baseSize={font.body} />
          </View>
        ))}
        <Divider />
        <Text style={styles.h2}>When to use it</Text>
        <Body>{topic.whenToUse}</Body>
        <Divider />
        <Text style={styles.h2}>Worked example</Text>
        <Markdown source={topic.workedExample} baseSize={font.body} />
        <Divider />
        <Text style={[styles.h2, { color: colors.warn }]}>Common trap</Text>
        <Body>{topic.pitfall}</Body>
      </Card>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    title: { fontSize: font.h2, fontWeight: '800', color: colors.text, marginTop: spacing.sm, marginBottom: spacing.md },
    h2: { fontSize: font.small, fontWeight: '800', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.xs },
    formulaWrap: {
      backgroundColor: colors.bgAlt,
      borderRadius: 12,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      overflow: 'hidden',
    },
    bulletRow: { flexDirection: 'row', marginBottom: spacing.xs },
    dot: { color: colors.textMuted, marginRight: 8, fontSize: font.body, lineHeight: 22 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    statusLabel: { color: colors.textMuted, fontSize: font.small, fontWeight: '700', flex: 1, paddingRight: spacing.sm },
  });
