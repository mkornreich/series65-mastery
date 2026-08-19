import React, { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen, HighlightText } from '../components/ui';
import { spacing, font, radius, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import {
  textbookSections,
  partLabel,
  searchTextbook,
  TextbookSectionMeta,
} from '../data/textbook';

type Props = NativeStackScreenProps<RootStackParamList, 'Textbook'>;

export default function TextbookScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scrollToPart = route.params?.scrollToPart;
  const scrollRef = useRef<ScrollView | null>(null);
  const scrolledRef = useRef(false);
  const [query, setQuery] = useState('');
  const q = query.trim();

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

  const results = useMemo(() => (q.length >= 2 ? searchTextbook(q) : []), [q]);

  const openSection = (anchor: string, title: string, withQuery?: string) =>
    navigation.navigate('TextbookSection', { anchor, title, query: withQuery });

  return (
    <Screen scrollViewRef={scrollRef}>
      <Text style={styles.h1}>📖 Series 65 Textbook</Text>
      <Text style={styles.sub}>
        The full study text, organized by exam area. Tap a section to read it — the
        AI tutor cites these same sections.
      </Text>

      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search the whole textbook…"
          placeholderTextColor={colors.textFaint}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <Text style={styles.clear}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {q.length >= 2 ? (
        <View style={styles.group}>
          <Text style={styles.part}>
            {results.length
              ? `${results.length} section${results.length === 1 ? '' : 's'} match “${q}”`
              : `No matches for “${q}”`}
          </Text>
          {results.map((r) => (
            <Pressable
              key={r.anchor}
              style={({ pressed }) => [styles.result, pressed && styles.rowPressed]}
              onPress={() => openSection(r.anchor, r.section, q)}
            >
              <View style={styles.resultHead}>
                <Text style={styles.resultTitle}>
                  {(r.part ? r.part + ' · ' : '') + r.section}
                </Text>
                <Text style={styles.count}>{r.matchCount}</Text>
              </View>
              <HighlightText
                text={r.snippet}
                query={q}
                style={styles.snippet}
                numberOfLines={3}
              />
            </Pressable>
          ))}
        </View>
      ) : (
        groups.map((g) => (
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
                onPress={() => openSection(s.anchor, s.section)}
              >
                <Text style={styles.rowText}>{s.section}</Text>
                <Text style={styles.chev}>›</Text>
              </Pressable>
            ))}
          </View>
        ))
      )}
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
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      marginTop: spacing.md,
    },
    searchIcon: { fontSize: font.body, marginRight: spacing.sm },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: font.body,
      paddingVertical: spacing.sm,
    },
    clear: { color: colors.textFaint, fontSize: font.body, paddingHorizontal: 4 },
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
    result: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    resultHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    resultTitle: { flex: 1, color: colors.accent, fontSize: font.small, fontWeight: '700' },
    count: {
      color: colors.textMuted,
      fontSize: font.tiny,
      fontWeight: '800',
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 2,
      overflow: 'hidden',
    },
    snippet: { color: colors.textMuted, fontSize: font.small, lineHeight: 19 },
  });
