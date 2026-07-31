import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { font, masteryLabel, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { MasteryLevel } from '../types';

export function MasteryBar({
  score,
  level,
  height = 8,
  showLabel = true,
}: {
  score: number; // 0..1
  level: MasteryLevel;
  height?: number;
  showLabel?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const color = colors.mastery[level] ?? colors.primary;
  const pct = Math.round(Math.max(0, Math.min(1, score)) * 100);
  return (
    <View style={styles.wrap}>
      <View style={[styles.track, { height, borderRadius: height }]}>
        <View
          style={{
            width: `${pct}%`,
            height,
            borderRadius: height,
            backgroundColor: color,
          }}
        />
      </View>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={[styles.level, { color }]}>{masteryLabel[level]}</Text>
          <Text style={styles.pct}>{pct}%</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { width: '100%' },
    track: {
      width: '100%',
      backgroundColor: colors.surfaceAlt,
      overflow: 'hidden',
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    level: { fontSize: font.tiny, fontWeight: '700' },
    pct: { fontSize: font.tiny, color: colors.textMuted, fontWeight: '600' },
  });
