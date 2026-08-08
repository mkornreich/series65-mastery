import React, { useMemo } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { spacing, radius, font, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors]);
}

export function Screen({
  children,
  scroll = true,
  contentStyle,
  padded = true,
  topInset = false,
  settingsGear = false,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
  /** Pad for the status bar on screens that have no navigation header. */
  topInset?: boolean;
  /** Overlay a settings gear in the top-right that opens the Settings screen. */
  settingsGear?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const pad = padded ? spacing.lg : 0;
  const base: ViewStyle = {
    paddingHorizontal: pad,
    paddingTop: topInset ? insets.top + spacing.sm : 0,
    paddingBottom: insets.bottom + spacing.xxl,
  };
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[base, contentStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, base, contentStyle]}>{children}</View>
  );
  if (!settingsGear) return body;
  return (
    <View style={styles.flex}>
      {body}
      <ScreenSettingsGear top={insets.top + spacing.sm} />
    </View>
  );
}

/** Floating top-right gear that opens the Settings stack screen. */
function ScreenSettingsGear({ top }: { top: number }) {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  return (
    <Pressable
      onPress={() => navigation.navigate('Settings')}
      hitSlop={12}
      style={{ position: 'absolute', top, right: spacing.lg, padding: 4 }}
    >
      <Text style={{ fontSize: 22, color: colors.textMuted }}>⚙</Text>
    </Pressable>
  );
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
  const styles = useStyles();
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
  const { colors } = useTheme();
  const styles = useStyles();
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
      ? colors.danger
      : variant === 'secondary'
      ? colors.surfaceAlt
      : 'transparent';
  const fg =
    variant === 'primary' || variant === 'danger' ? colors.onBright : colors.text;
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
  color,
  bg,
}: {
  label: string;
  color?: string;
  bg?: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.pill, { backgroundColor: bg ?? colors.surfaceAlt }]}>
      <Text style={[styles.pillText, { color: color ?? colors.textMuted }]}>{label}</Text>
    </View>
  );
}

export function StatTile({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color?: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: color ?? colors.text }]}>{value}</Text>
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
  const styles = useStyles();
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function Divider() {
  const styles = useStyles();
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
  const { colors } = useTheme();
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

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
