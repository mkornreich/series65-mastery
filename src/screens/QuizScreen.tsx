import React, { useMemo, useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, AnswerRecord } from '../navigation/types';
import { Question } from '../types';
import { Screen, Card, AppButton, Body } from '../components/ui';
import { QuestionBlock } from '../components/QuestionBlock';
import { CalculatorModal } from '../components/Calculator';
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
  bankByComponent,
} from '../mastery/selection';
import { isMastered, masteryScore } from '../mastery/engine';
import { COMPONENT_BY_ID, getSubject } from '../data/curriculum';
import { Component } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

// Endless AI practice: prefetch a fresh batch when this many questions remain.
const AI_PREFETCH_AHEAD = 2;
const AI_BATCH = 3;
const normStem = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

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
  const [generatingMore, setGeneratingMore] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [showCalc, setShowCalc] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => setShowCalc(true)} hitSlop={12} style={{ paddingHorizontal: spacing.sm }}>
          <Text style={{ fontSize: 20 }}>🧮</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const current = questions[index];
  const isFlagged = current ? flagged.includes(current.id) : false;

  // Endless AI practice. In component mode we always generate for that one
  // component; in section (subject) mode we rotate through the section's topics
  // so a "Practice (endless)" on a whole section covers all of it evenly.
  const aiInfinite = !!config.aiInfinite;
  const genRotationRef = useRef(0);
  const pickGenComponent = useCallback((): Component | undefined => {
    if (config.componentId) return COMPONENT_BY_ID[config.componentId];
    if (config.subjectId) {
      const comps = (getSubject(config.subjectId)?.components ?? []).filter(
        (c) => bankByComponent(c.id).length > 0
      );
      if (!comps.length) return undefined;
      const c = comps[genRotationRef.current % comps.length];
      genRotationRef.current += 1;
      return c;
    }
    return undefined;
  }, [config.componentId, config.subjectId]);
  const generatingRef = useRef(false);
  // Normalized stems already served, to drop repeated generations (lazy-init once).
  const seenStemsRef = useRef<Set<string> | null>(null);
  if (seenStemsRef.current === null) {
    seenStemsRef.current = new Set(questions.map((q) => normStem(q.stem)));
  }
  // Blocks a second tap from advancing twice before the re-render commits
  // (functional setIndex would otherwise compound and skip past the end).
  const advanceGuard = useRef(false);
  useEffect(() => {
    advanceGuard.current = false;
  });
  // Skip background-prefetch state updates once the screen has gone away.
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  // Clear a transient generation error on advance so the background prefetch
  // re-attempts while buffered questions remain (soft retry, not a hard latch).
  useEffect(() => {
    setGenError(null);
  }, [current?.id]);

  // Endless AI practice: prefetch the next batch in the background as the user
  // nears the end of what's loaded, deduping repeats so it never runs dry.
  useEffect(() => {
    if (!aiInfinite || !current) return;
    const remaining = questions.length - 1 - index;
    if (remaining > AI_PREFETCH_AHEAD) return;
    if (generatingRef.current || genError) return; // one at a time; wait on a surfaced error
    const target = pickGenComponent();
    if (!target) return;
    generatingRef.current = true;
    setGeneratingMore(true);
    const avoid = questions.slice(-12).map((q) => q.stem);
    llm
      .generateQuestions(target, AI_BATCH, avoid)
      .then((qs) => {
        if (!mountedRef.current) return;
        const seen = seenStemsRef.current!;
        const fresh = qs.filter((q) => {
          const key = normStem(q.stem);
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        if (fresh.length) setQuestions((prev) => [...prev, ...fresh]);
        else setGenError('The model kept repeating itself.');
      })
      .catch((e: any) => {
        if (mountedRef.current) setGenError(e?.message ?? 'Could not generate more questions.');
      })
      .finally(() => {
        generatingRef.current = false;
        if (mountedRef.current) setGeneratingMore(false);
      });
  }, [aiInfinite, pickGenComponent, current, index, questions, genError, llm]);

  const retryGenerate = useCallback(() => setGenError(null), []);

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

  const finishSession = useCallback(() => finish(records), [finish, records]);

  const next = useCallback(() => {
    // Ignore a second tap fired before this one's re-render commits.
    if (advanceGuard.current) return;
    advanceGuard.current = true;
    const finalRecords = records;
    const atEnd = index >= questions.length - 1;
    if (!atEnd) {
      setIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      return;
    }
    // Endless AI practice never auto-finishes; the prefetch appends more and the
    // user ends it with "Finish session".
    if (config.aiInfinite) return;
    // Mastery drill: keep serving questions until mastered (or bank dry).
    if (config.masteryDrill) {
      const st = useStore.getState().progress;
      const appendAndAdvance = (more: Question[]) => {
        setQuestions((qs) => [...qs, ...more]);
        setServedIds((s) => {
          const n = new Set(s);
          more.forEach((q) => n.add(q.id));
          return n;
        });
        setIndex((i) => i + 1);
        setSelected(null);
        setRevealed(false);
      };
      if (config.componentId) {
        // One topic: drill until that topic is mastered.
        if (!isMastered(st.mastery[config.componentId])) {
          // Rank the whole bank, drop already-served, THEN take the next few —
          // filtering after a top-N slice would strip every fresh question once
          // the highest-priority (missed) items are all served, ending early.
          const more = selectForComponent(config.componentId, st.sr, st.missed, 999)
            .filter((q) => !servedIds.has(q.id))
            .slice(0, 5);
          if (more.length) {
            appendAndAdvance(more);
            return;
          }
        }
      } else if (config.subjectId) {
        // Whole section: drill the weakest not-yet-mastered topic, moving on as
        // each is mastered, until every topic in the section is mastered.
        const comps = (getSubject(config.subjectId)?.components ?? []).filter(
          (c) => bankByComponent(c.id).length > 0
        );
        const unmastered = comps
          .filter((c) => !isMastered(st.mastery[c.id]))
          .sort((a, b) => masteryScore(st.mastery[a.id]) - masteryScore(st.mastery[b.id]));
        for (const c of unmastered) {
          const more = selectForComponent(c.id, st.sr, st.missed, 999)
            .filter((q) => !servedIds.has(q.id))
            .slice(0, 5);
          if (more.length) {
            appendAndAdvance(more);
            return;
          }
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
      {config.aiInfinite ? (
        <View style={styles.aiInfHeader}>
          <Text style={styles.aiInfLabel}>♾️  Endless practice</Text>
          <Text style={styles.aiInfCount}>
            Question {index + 1}
            {generatingMore ? '  ·  generating…' : ''}
          </Text>
        </View>
      ) : (
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
      )}

      <Card>
        <View style={styles.topRow}>
          <Text style={styles.topic}>{comp?.title ?? 'Practice'}</Text>
          {current.source !== 'ai' && (
            <Text
              style={[styles.flag, { color: isFlagged ? colors.warn : colors.textFaint }]}
              onPress={() => toggleFlag(current.id)}
            >
              {isFlagged ? '★ Flagged' : '☆ Flag'}
            </Text>
          )}
        </View>

        <QuestionBlock
          question={current}
          selected={selected}
          revealed={revealed}
          onSelect={setSelected}
          index={index}
          total={config.aiInfinite ? undefined : questions.length}
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
              <AppButton
                title={llm.available ? 'Ask AI tutor about this question' : 'AI tutor (needs setup)'}
                variant="ghost"
                icon="💬"
                onPress={
                  llm.available
                    ? () =>
                        navigation.navigate('Tutor', {
                          topicTitle: comp?.title,
                          componentId: current.componentId,
                          question: current,
                          chosenIndex: selected ?? -1,
                        })
                    : () => navigation.navigate('ModelManager')
                }
              />
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
      ) : config.aiInfinite ? (
        <>
          {index < questions.length - 1 ? (
            <AppButton title="Next question" onPress={next} />
          ) : genError ? (
            <>
              <AppButton title="↻ Generate more" onPress={retryGenerate} />
              <Text style={styles.aiError}>{genError}</Text>
            </>
          ) : (
            <AppButton title="Generating more…" loading disabled />
          )}
          <AppButton
            title="Finish session"
            variant="ghost"
            onPress={finishSession}
            style={{ marginTop: spacing.sm }}
          />
        </>
      ) : (
        <AppButton
          title={index >= questions.length - 1 && !config.masteryDrill ? 'See results' : 'Next question'}
          onPress={next}
        />
      )}

      <CalculatorModal
        visible={showCalc}
        onClose={() => setShowCalc(false)}
        resetKey={current?.id}
      />
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
  aiInfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  aiInfLabel: { color: colors.accent, fontSize: font.small, fontWeight: '800' },
  aiInfCount: { color: colors.textMuted, fontSize: font.small, fontWeight: '600' },
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
