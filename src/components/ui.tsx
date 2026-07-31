import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, font } from '../theme/theme';

export function Screen({
  children,
  scroll = true,
  contentStyle,
  padded = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const pad = padded ? spacing.lg : 0;
  const base: ViewStyle = {
    paddingHorizontal: pad,
    paddingBottom: insets.bottom + spacing.xxl,
  };
  if (scroll) {
    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[base, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.flex, base, contentStyle]}>{children}</View>;
}

export function Card({
  children,
  style,
  onPress,
  accent,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accent?: string;
}) {
  const content = (
    <View
      style={[
        styles.card,
        accent ? { borderLeftWidth: 3, borderLeftColor: accent } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
      ? colors.danger
      : variant === 'secondary'
      ? colors.surfaceAlt
      : 'transparent';
  const fg =
    variant === 'primary' || variant === 'danger' ? '#04122E' : colors.text;
  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.9 : 1 },
        variant === 'ghost' ? styles.ghostBorder : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.buttonText, { color: fg }]}>
          {icon ? `${icon}  ` : ''}
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Pill({
  label,
  color = colors.textMuted,
  bg,
}: {
  label: string;
  color?: string;
  bg?: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: bg ?? 'rgba(255,255,255,0.06)' }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function StatTile({
  value,
  label,
  color = colors.text,
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function Body({
  children,
  muted,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[
        { color: muted ? colors.textMuted : colors.text, fontSize: font.body, lineHeight: 22 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBorder: { borderWidth: 1, borderColor: colors.border },
  buttonText: { fontSize: font.body, fontWeight: '700' },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: font.tiny, fontWeight: '700', letterSpacing: 0.3 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: font.h2, fontWeight: '800' },
  statLabel: { fontSize: font.tiny, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: font.h3, fontWeight: '800', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
});
