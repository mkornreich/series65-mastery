import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, AnswerRecord } from '../navigation/types';
import { Question } from '../types';
import { Screen, Card, AppButton, Body } from '../components/ui';
import { QuestionBlock } from '../components/QuestionBlock';
import { Markdown } from '../components/markdown';
import { spacing, font, radius, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/useStore';
import { useLLM } from '../llm/LLMProvider';
import {
  selectAdaptive,
  selectForComponent,
  selectForSubject,
  selectReview,
  questionsByIds,
} from '../mastery/selection';
import { isMastered } from '../mastery/engine';
import { COMPONENT_BY_ID } from '../data/curriculum';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

function resolveQuestions(config: Props['route']['params']['config']): Question[] {
  const st = useStore.getState().progress;
  const count = config.count ?? 10;
  switch (config.mode) {
    case 'adaptive':
      return selectAdaptive(st.mastery, st.sr, st.missed, count);
    case 'component':
      return selectForComponent(config.componentId!, st.sr, st.missed, count);
    case 'subject':
      return selectForSubject(config.subjectId!, count);
    case 'review':
      return selectReview(st.sr, st.missed, config.count ?? 20);
    case 'flagged':
      return questionsByIds(st.flagged);
    case 'missed':
      return questionsByIds(st.missed).slice(0, config.count ?? 30);
    case 'custom':
      return questionsByIds(config.questionIds ?? []);
    case 'ai':
      return config.inlineQuestions ?? [];
    default:
      return [];
  }
}

export default function QuizScreen({ route, navigation }: Props) {
  const { config } = route.params;
  const recordAnswer = useStore((s) => s.recordAnswer);
  const toggleFlag = useStore((s) => s.toggleFlag);
  const flagged = useStore((s) => s.progress.flagged);
  const aiEnabled = useStore((s) => s.settings.aiExplanations);
  const llm = useLLM();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Resolve the working set once.
  const [questions, setQuestions] = useState<Question[]>(() =>
    resolveQuestions(config)
  );
  const [servedIds, setServedIds] = useState<Set<string>>(
    () => new Set(questions.map((q) => q.id))
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const current = questions[index];
  const isFlagged = current ? flagged.includes(current.id) : false;

  // Monotonic id for the in-flight AI explanation. Bumping it invalidates any
  // stream still arriving from a previous question so its tokens are dropped.
  const aiReqRef = useRef(0);

  // Reset the AI explanation whenever the question changes and cancel any stream
  // still loading, so a slow previous request can't render under the new question.
  useEffect(() => {
    aiReqRef.current += 1;
    setAiText('');
    setAiLoading(false);
    setAiError(null);
  }, [current?.id]);

  const submit = useCallback(() => {
    if (selected == null || !current) return;
    const correct = selected === current.answerIndex;
    recordAnswer(current, selected);
    setRecords((r) => [...r, { question: current, chosen: selected, correct }]);
    setRevealed(true);
  }, [selected, current, recordAnswer]);

  const dontKnow = useCallback(() => {
    if (!current || revealed) return;
    // Record as a miss (chosen -1 ≠ any answer) so it re-surfaces in review.
    recordAnswer(current, -1);
    setRecords((r) => [...r, { question: current, chosen: -1, correct: false }]);
    setSelected(null);
    setRevealed(true);
  }, [current, revealed, recordAnswer]);

  const askAI = useCallback(async () => {
    if (!current) return;
    const reqId = (aiReqRef.current += 1);
    setAiError(null);
    setAiText('');
    setAiLoading(true);
    try {
      await llm.explain(current, selected ?? -1, (tok) => {
        if (aiReqRef.current !== reqId) return; // stale stream from a prior question
        setAiText((t) => t + tok);
      });
    } catch (e: any) {
      if (aiReqRef.current === reqId) setAiError(e?.message ?? 'AI is unavailable.');
    } finally {
      if (aiReqRef.current === reqId) setAiLoading(false);
    }
  }, [current, selected, llm]);

  const finish = useCallback(
    (finalRecords: AnswerRecord[]) => {
      navigation.replace('QuizResult', {
        title: config.title,
        records: finalRecords,
        config,
      });
    },
    [navigation, config]
  );

  const next = useCallback(() => {
    const finalRecords = records;
    const atEnd = index >= questions.length - 1;
    if (!atEnd) {
      setIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      return;
    }
    // Mastery drill: keep going until the component is mastered (or bank dry).
    if (config.masteryDrill && config.componentId) {
      const mastery = useStore.getState().progress.mastery[config.componentId];
      if (!isMastered(mastery)) {
        const st = useStore.getState().progress;
        const more = selectForComponent(
          config.componentId,
          st.sr,
          st.missed,
          5
        ).filter((q) => !servedIds.has(q.id));
        if (more.length) {
          setQuestions((qs) => [...qs, ...more]);
          setServedIds((s) => {
            const n = new Set(s);
            more.forEach((q) => n.add(q.id));
            return n;
          });
          setIndex((i) => i + 1);
          setSelected(null);
          setRevealed(false);
          return;
        }
      }
    }
    finish(finalRecords);
  }, [index, questions.length, records, config, servedIds, finish]);

  if (!current) {
    return (
      <Screen>
        <Card>
          <Text style={styles.emptyTitle}>Nothing to practice here yet</Text>
          <Body muted>
            {config.mode === 'flagged'
              ? 'You have not flagged any questions. Flag tricky ones during practice to revisit them.'
              : config.mode === 'review'
              ? 'No questions are due for review right now. Practice more to build your review queue.'
              : 'No questions are available for this selection.'}
          </Body>
          <AppButton
            title="Go back"
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      </Screen>
    );
  }

  const comp = COMPONENT_BY_ID[current.componentId];

  return (
    <Screen>
      <View style={styles.progressTrack}>
        <View
          style={{
            width: `${((index + (revealed ? 1 : 0)) / questions.length) * 100}%`,
            height: 6,
            borderRadius: 6,
            backgroundColor: colors.primary,
          }}
        />
      </View>

      <Card>
        <View style={styles.topRow}>
          <Text style={styles.topic}>{comp?.title ?? 'Practice'}</Text>
          <Text
            style={[styles.flag, { color: isFlagged ? colors.warn : colors.textFaint }]}
            onPress={() => toggleFlag(current.id)}
          >
            {isFlagged ? '★ Flagged' : '☆ Flag'}
          </Text>
        </View>

        <QuestionBlock
          question={current}
          selected={selected}
          revealed={revealed}
          onSelect={setSelected}
          index={index}
          total={questions.length}
        />
      </Card>

      {revealed && (
        <Card accent={selected === current.answerIndex ? colors.success : colors.danger}>
          <Text
            style={[
              styles.verdict,
              { color: selected === current.answerIndex ? colors.success : colors.danger },
            ]}
          >
            {selected === current.answerIndex ? '✓ Correct' : '✗ Incorrect'}
          </Text>
          <Body style={{ marginTop: spacing.sm }}>{current.explanation}</Body>

          {aiEnabled && (
            <View style={{ marginTop: spacing.md }}>
              {!aiText && !aiLoading && (
                <AppButton
                  title={llm.available ? 'Explain with AI tutor' : 'AI tutor (needs setup)'}
                  variant="ghost"
                  icon="🤖"
                  onPress={
                    llm.available
                      ? askAI
                      : () => navigation.navigate('ModelManager')
                  }
                />
              )}
              {(aiLoading || aiText) && (
                <View style={styles.aiBox}>
                  <Text style={styles.aiLabel}>AI TUTOR</Text>
                  {aiText ? <Markdown source={aiText} baseSize={font.body} /> : <Body>Thinking…</Body>}
                </View>
              )}
              {aiError && <Text style={styles.aiError}>{aiError}</Text>}
            </View>
          )}
        </Card>
      )}

      {!revealed ? (
        <>
          <AppButton
            title="Submit answer"
            onPress={submit}
            disabled={selected == null}
          />
          <AppButton
            title="I don't know"
            variant="ghost"
            onPress={dontKnow}
            style={{ marginTop: spacing.sm }}
          />
        </>
      ) : (
        <AppButton
          title={index >= questions.length - 1 && !config.masteryDrill ? 'See results' : 'Next question'}
          onPress={next}
        />
      )}
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  topic: { color: colors.textMuted, fontSize: font.small, fontWeight: '700', flex: 1 },
  flag: { fontSize: font.small, fontWeight: '700', paddingLeft: spacing.sm },
  verdict: { fontSize: font.h3, fontWeight: '800' },
  aiBox: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiLabel: {
    fontSize: font.tiny,
    color: colors.accent,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  aiError: { color: colors.danger, fontSize: font.small, marginTop: spacing.sm },
  emptyTitle: { fontSize: font.h3, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
});
