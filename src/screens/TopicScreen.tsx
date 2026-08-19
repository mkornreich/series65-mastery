import React, { useLayoutEffect, useMemo } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen, Card, AppButton, Pill, Body, Divider } from '../components/ui';
import { MasteryBar } from '../components/MasteryBar';
import { spacing, font, masteryLabel, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/useStore';
import { getComponent, getSubject } from '../data/curriculum';
import { STUDY_NOTES } from '../data/studyNotes';
import { textbookSectionForComponent } from '../data/textbook';
import {
  masteryScore,
  masteryLevel,
  componentCoverage,
} from '../mastery/engine';
import { bankByComponent } from '../mastery/selection';
import { useLLM } from '../llm/LLMProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Topic'>;

function Bullets({ title, items, color }: { title: string; items?: string[]; color?: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  if (!items || !items.length) return null;
  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={[styles.notesHeading, color ? { color } : null]}>{title}</Text>
      {items.map((it, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={[styles.bulletDot, color ? { color } : null]}>•</Text>
          <Body style={{ flex: 1 }}>{it}</Body>
        </View>
      ))}
    </View>
  );
}

export default function TopicScreen({ route, navigation }: Props) {
  const { componentId } = route.params;
  const component = getComponent(componentId);
  const subject = component ? getSubject(component.subjectId) : undefined;
  const mastery = useStore((s) => s.progress.mastery)[componentId];
  const llm = useLLM();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: subject ? `Section ${subject.code}` : 'Topic' });
  }, [navigation, subject]);

  if (!component) {
    return (
      <Screen>
        <Text style={styles.title}>Topic not found.</Text>
      </Screen>
    );
  }

  const notes = STUDY_NOTES[componentId];
  const tbSection = textbookSectionForComponent(componentId);
  const score = masteryScore(mastery);
  const level = masteryLevel(mastery);
  const coverage = Math.round(componentCoverage(mastery) * 100);
  const bankCount = bankByComponent(componentId).length;

  // Practice runs endlessly when an on-device model is set: it serves the curated
  // bank first, then the model keeps generating fresh questions. Both count toward
  // mastery. Without a model it's a normal finite bank quiz.
  const aiCapable = llm.available && !!llm.activeModelId;

  return (
    <Screen>
      <Text style={styles.title}>{component.title}</Text>

      <Card>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Your mastery</Text>
          <Pill label={masteryLabel[level]} color={colors.mastery[level]} bg={`${colors.mastery[level]}22`} />
        </View>
        <MasteryBar score={score} level={level} />
        <Text style={styles.statusMeta}>
          {mastery?.attempts ?? 0} attempts · {coverage}% of subtopics covered
        </Text>
      </Card>

      <View style={styles.chips}>
        {component.subtopics.map((s, i) => (
          <View key={i} style={styles.chip}>
            <Text style={styles.chipText}>{s}</Text>
          </View>
        ))}
      </View>

      <AppButton
        title="Mastery drill (until mastered)"
        icon="🎯"
        onPress={() =>
          navigation.navigate('Quiz', {
            config: {
              title: `Mastery: ${component.title}`,
              mode: 'component',
              componentId,
              count: 5,
              masteryDrill: true,
            },
          })
        }
      />
      <View style={{ height: spacing.sm }} />
      <AppButton
        title={aiCapable ? 'Practice (endless)' : 'Practice this topic'}
        icon="✎"
        variant="secondary"
        onPress={() =>
          navigation.navigate('Quiz', {
            config: {
              title: component.title,
              mode: 'component',
              componentId,
              count: aiCapable ? Math.max(bankCount, 1) : 10,
              aiInfinite: aiCapable,
            },
          })
        }
      />
      <View style={{ height: spacing.sm }} />
      <AppButton
        title="Ask AI tutor"
        icon="💬"
        variant="ghost"
        onPress={() => navigation.navigate('Tutor', { topicTitle: component.title, componentId })}
      />
      {tbSection ? (
        <>
          <View style={{ height: spacing.sm }} />
          <AppButton
            title="Read in the textbook"
            icon="📖"
            variant="ghost"
            onPress={() =>
              navigation.navigate('TextbookSection', {
                anchor: tbSection.anchor,
                title: tbSection.section,
              })
            }
          />
        </>
      ) : null}

      {notes ? (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.notesTitle}>Study notes</Text>
          <Body style={{ marginTop: spacing.sm }}>{notes.summary}</Body>
          <Bullets title="Key points" items={notes.keyPoints} />
          <Bullets title="Formulas" items={notes.formulas} color={colors.primary} />
          <Bullets title="Memory aids" items={notes.mnemonics} color={colors.accent} />
          <Bullets title="Common traps" items={notes.pitfalls} color={colors.warn} />
        </Card>
      ) : (
        <Card style={{ marginTop: spacing.lg }}>
          <Body muted>
            Study notes for this topic aren’t bundled. Use “Ask AI tutor” to learn it
            interactively, or jump straight into practice.
          </Body>
        </Card>
      )}
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  title: { fontSize: font.h2, fontWeight: '800', color: colors.text, marginTop: spacing.sm, marginBottom: spacing.md },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  statusLabel: { color: colors.textMuted, fontSize: font.small, fontWeight: '700' },
  statusMeta: { color: colors.textFaint, fontSize: font.small, marginTop: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md, marginTop: spacing.xs },
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: { color: colors.textMuted, fontSize: font.tiny, fontWeight: '600' },
  aiRow: { flexDirection: 'row' },
  notesTitle: { fontSize: font.h3, fontWeight: '800', color: colors.text },
  notesHeading: {
    fontSize: font.small,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bulletRow: { flexDirection: 'row', marginBottom: 4 },
  bulletDot: { color: colors.textMuted, marginRight: 8, fontSize: font.body, lineHeight: 22 },
});
