import React, { useMemo, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen } from '../components/ui';
import { spacing, font, radius, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { textbookSections, partLabel, TextbookSectionMeta } from '../data/textbook';

type Props = NativeStackScreenProps<RootStackParamList, 'Textbook'>;

export default function TextbookScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scrollToPart = route.params?.scrollToPart;
  const scrollRef = useRef<ScrollView | null>(null);
  // Guard so we only auto-scroll to the requested Part once (its heading's
  // onLayout can fire more than once, e.g. on theme change).
  const scrolledRef = useRef(false);

  const groups = useMemo(() => {
    const secs = textbookSections();
    const byPart: { part: string; items: TextbookSectionMeta[] }[] = [];
    for (const s of secs) {
      let g = byPart.find((x) => x.part === s.part);
      if (!g) {
        g = { part: s.part, items: [] };
        byPart.push(g);
      }
      g.items.push(s);
    }
    return byPart;
  }, []);

  return (
    <Screen scrollViewRef={scrollRef}>
      <Text style={styles.h1}>📖 Series 65 Textbook</Text>
      <Text style={styles.sub}>
        The full study text, organized by exam area. Tap a section to read it — the
        AI tutor cites these same sections.
      </Text>

      {groups.map((g) => (
        <View
          key={g.part || 'appendix'}
          style={styles.group}
          onLayout={
            scrollToPart && g.part === scrollToPart
              ? (e) => {
                  if (scrolledRef.current) return;
                  scrolledRef.current = true;
                  const y = Math.max(0, e.nativeEvent.layout.y - spacing.md);
                  scrollRef.current?.scrollTo({ y, animated: false });
                }
              : undefined
          }
        >
          <Text style={styles.part}>{partLabel(g.part)}</Text>
          {g.items.map((s) => (
            <Pressable
              key={s.anchor}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() =>
                navigation.navigate('TextbookSection', {
                  anchor: s.anchor,
                  title: s.section,
                })
              }
            >
              <Text style={styles.rowText}>{s.section}</Text>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    h1: { color: colors.text, fontSize: font.h2, fontWeight: '800' },
    sub: {
      color: colors.textMuted,
      fontSize: font.small,
      lineHeight: 20,
      marginTop: spacing.xs,
    },
    group: { marginTop: spacing.lg },
    part: {
      color: colors.accent,
      fontSize: font.tiny,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
    },
    rowPressed: { opacity: 0.6 },
    rowText: { flex: 1, color: colors.text, fontSize: font.body, fontWeight: '600' },
    chev: { color: colors.textFaint, fontSize: font.h3, marginLeft: spacing.sm },
  });
