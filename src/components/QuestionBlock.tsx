import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, radius, font } from '../theme/theme';
import { Question } from '../types';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export function QuestionBlock({
  question,
  selected,
  revealed,
  onSelect,
  index,
  total,
}: {
  question: Question;
  selected: number | null;
  revealed: boolean;
  onSelect: (i: number) => void;
  index?: number;
  total?: number;
}) {
  return (
    <View>
      {index != null && total != null && (
        <Text style={styles.counter}>
          Question {index + 1} of {total}
        </Text>
      )}
      <Text style={styles.stem}>{question.stem}</Text>
      <View style={{ marginTop: spacing.md }}>
        {question.choices.map((choice, i) => {
          const isSelected = selected === i;
          const isCorrect = i === question.answerIndex;
          let border = colors.border;
          let bg = colors.surface;
          let letterBg = colors.surfaceAlt;
          if (revealed) {
            if (isCorrect) {
              border = colors.success;
              bg = 'rgba(61,220,151,0.12)';
              letterBg = colors.success;
            } else if (isSelected) {
              border = colors.danger;
              bg = 'rgba(242,109,109,0.12)';
              letterBg = colors.danger;
            }
          } else if (isSelected) {
            border = colors.primary;
            bg = 'rgba(76,141,255,0.12)';
            letterBg = colors.primary;
          }
          return (
            <Pressable
              key={i}
              onPress={() => !revealed && onSelect(i)}
              style={[styles.choice, { borderColor: border, backgroundColor: bg }]}
            >
              <View style={[styles.letter, { backgroundColor: letterBg }]}>
                <Text style={styles.letterText}>{LETTERS[i]}</Text>
              </View>
              <Text style={styles.choiceText}>{choice}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    fontSize: font.tiny,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  stem: {
    fontSize: font.h3,
    lineHeight: 26,
    color: colors.text,
    fontWeight: '600',
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  letter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  letterText: { color: '#04122E', fontWeight: '800', fontSize: font.small },
  choiceText: { flex: 1, color: colors.text, fontSize: font.body, lineHeight: 21 },
});
