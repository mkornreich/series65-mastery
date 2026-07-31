import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { font, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 12,
  color,
  label,
  sublabel,
}: {
  progress: number; // 0..1
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const strokeColor = color ?? colors.primary;
  const p = Math.max(0, Math.min(1, progress));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - p);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.surfaceAlt}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        {label != null && <Text style={styles.label}>{label}</Text>}
        {sublabel != null && <Text style={styles.sub}>{sublabel}</Text>}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: font.h1, fontWeight: '800', color: colors.text },
    sub: { fontSize: font.tiny, color: colors.textMuted, marginTop: 2 },
  });
