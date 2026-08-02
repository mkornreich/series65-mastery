import React, { useLayoutEffect, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen, Card, AppButton } from '../components/ui';
import { QuestionBlock } from '../components/QuestionBlock';
import { CalculatorModal } from '../components/Calculator';
import { spacing, font, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { generateExam } from '../exam/generator';
import { scoreExam } from '../exam/scoring';
import { EXAM_SPEC } from '../data/curriculum';
import { useStore } from '../store/useStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Exam'>;

function fmt(sec: number): string {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const mm = String(m).padStart(2, '0');
  const sss = String(ss).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${sss}` : `${mm}:${sss}`;
}

export default function ExamScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const addExamResult = useStore((s) => s.addExamResult);

  const examRef = useRef(generateExam());
  const startedAtRef = useRef(Date.now());
  const submittedRef = useRef(false);
  const questions = examRef.current.questions;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showPalette, setShowPalette] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_SPEC.timeLimitMinutes * 60);

  const current = questions[index];
  const answeredCount = Object.keys(answers).length;

  const submit = useCallback(
    (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      const durationSec = Math.round((Date.now() - startedAtRef.current) / 1000);
      const result = scoreExam({
        questions,
        pretestIds: examRef.current.pretestIds,
        answers,
        durationSec,
        startedAt: startedAtRef.current,
      });
      addExamResult(result);
      navigation.replace('ExamResult', { resultId: result.id });
    },
    [answers, questions, addExamResult, navigation]
  );

  // Countdown timer.
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const left = EXAM_SPEC.timeLimitMinutes * 60 - elapsed;
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(id);
        submit(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [submit]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={[styles.timer, secondsLeft < 300 ? { color: colors.danger } : null]}>
          ⏱ {fmt(secondsLeft)}
        </Text>
      ),
      headerBackVisible: false,
      headerRight: () => (
        <Pressable onPress={() => setShowCalc(true)} hitSlop={12} style={{ paddingHorizontal: spacing.sm }}>
          <Text style={{ fontSize: 20 }}>🧮</Text>
        </Pressable>
      ),
    });
  }, [navigation, secondsLeft, colors]);

  // Confirm before leaving via gesture/back.
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (submittedRef.current) return;
      e.preventDefault();
      Alert.alert('Leave exam?', 'Your progress will be lost.', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return unsub;
  }, [navigation]);

  const choose = (i: number) => {
    if (!current) return;
    setAnswers((a) => ({ ...a, [current.id]: i }));
  };

  const confirmSubmit = () => {
    const unanswered = questions.length - answeredCount;
    Alert.alert(
      'Submit exam?',
      unanswered > 0
        ? `You have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}. Submit anyway?`
        : 'Submit your exam for scoring?',
      [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Submit', style: 'destructive', onPress: () => submit(false) },
      ]
    );
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.counter}>
          Question {index + 1} / {questions.length}
        </Text>
        <Text style={styles.answered}>{answeredCount} answered</Text>
      </View>
      <View style={styles.track}>
        <View style={{ width: `${(answeredCount / questions.length) * 100}%`, height: 6, backgroundColor: colors.accent, borderRadius: 6 }} />
      </View>

      {/* Submit sits at the top, away from the Prev/Next flow, so it isn't tapped by accident. */}
      <AppButton
        title="Submit exam"
        variant="secondary"
        style={{ marginTop: spacing.md }}
        onPress={confirmSubmit}
      />

      <Card style={{ marginTop: spacing.md }}>
        {current && (
          <QuestionBlock
            question={current}
            selected={answers[current.id] ?? null}
            revealed={false}
            onSelect={choose}
          />
        )}
      </Card>

      <View style={styles.navRow}>
        <AppButton
          title="Prev"
          variant="secondary"
          disabled={index === 0}
          style={{ flex: 1 }}
          onPress={() => setIndex((i) => Math.max(0, i - 1))}
        />
        <View style={{ width: spacing.sm }} />
        <AppButton
          title="Grid"
          variant="secondary"
          style={{ flex: 1 }}
          onPress={() => setShowPalette((s) => !s)}
        />
        <View style={{ width: spacing.sm }} />
        <AppButton
          title="Next →"
          variant="secondary"
          disabled={index >= questions.length - 1}
          style={{ flex: 1 }}
          onPress={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
        />
      </View>

      {showPalette && (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.paletteTitle}>Jump to question</Text>
          <View style={styles.palette}>
            {questions.map((q, i) => {
              const answered = answers[q.id] != null;
              const isCurrent = i === index;
              return (
                <Pressable
                  key={q.id}
                  onPress={() => {
                    setIndex(i);
                    setShowPalette(false);
                  }}
                  style={[
                    styles.cell,
                    answered && { backgroundColor: colors.primary, borderColor: colors.primary },
                    isCurrent && { borderColor: colors.accent, borderWidth: 2 },
                  ]}
                >
                  <Text style={[styles.cellText, answered && { color: colors.onBright }]}>{i + 1}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      )}

      <CalculatorModal visible={showCalc} onClose={() => setShowCalc(false)} />
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  counter: { color: colors.text, fontSize: font.small, fontWeight: '800' },
  answered: { color: colors.textMuted, fontSize: font.small, fontWeight: '600' },
  track: { height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 6, marginTop: spacing.sm, overflow: 'hidden' },
  timer: { color: colors.text, fontSize: font.h3, fontWeight: '800' },
  navRow: { flexDirection: 'row', marginTop: spacing.md },
  paletteTitle: { color: colors.textMuted, fontSize: font.small, fontWeight: '700', marginBottom: spacing.sm },
  palette: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
  },
  cellText: { color: colors.text, fontSize: font.small, fontWeight: '700' },
});
