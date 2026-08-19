import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen } from '../components/ui';
import { Markdown } from '../components/markdown';
import { spacing, font, radius, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { sectionByAnchor, partLabel, sectionChunks } from '../data/textbook';

type Props = NativeStackScreenProps<RootStackParamList, 'TextbookSection'>;

function countIn(text: string, q: string): number {
  const lc = text.toLowerCase();
  let n = 0;
  let i = lc.indexOf(q);
  while (i >= 0) {
    n++;
    i = lc.indexOf(q, i + q.length);
  }
  return n;
}

export default function TextbookSectionScreen({ route, navigation }: Props) {
  const { anchor, title } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const content = useMemo(() => sectionByAnchor(anchor), [anchor]);
  const chunks = useMemo(() => sectionChunks(anchor), [anchor]);
  const [query, setQuery] = useState(route.params.query ?? '');
  const q = query.trim().toLowerCase();

  const scrollRef = useRef<ScrollView | null>(null);
  // After tapping a search result we clear the query and scroll the full
  // section to that passage once it lays out.
  const [pendingScroll, setPendingScroll] = useState<number | null>(null);

  const matches = useMemo(() => {
    if (q.length < 2) return [];
    return chunks
      .map((text, index) => ({ index, text, count: countIn(text, q) }))
      .filter((m) => m.count > 0);
  }, [chunks, q]);
  const total = matches.reduce((n, m) => n + m.count, 0);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Textbook' });
  }, [navigation]);

  const openPassage = (index: number) => {
    setQuery('');
    setPendingScroll(index);
  };

  if (!content) {
    return (
      <Screen>
        <Text style={styles.h1}>{title || 'Section'}</Text>
        <Text style={styles.sub}>This section couldn’t be found.</Text>
      </Screen>
    );
  }

  return (
    <Screen scrollViewRef={scrollRef}>
      {content.part ? <Text style={styles.part}>{partLabel(content.part)}</Text> : null}
      <Text style={styles.h1}>{content.section}</Text>

      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search this section…"
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
        <>
          <Text style={styles.matchLabel}>
            {total
              ? `${total} match${total === 1 ? '' : 'es'} in this section — tap one to read it in context`
              : 'No matches in this section'}
          </Text>
          {matches.map((m) => (
            <Pressable
              key={m.index}
              style={({ pressed }) => [styles.passage, pressed && styles.passagePressed]}
              onPress={() => openPassage(m.index)}
            >
              <Markdown source={m.text} baseSize={font.body} highlight={q} />
              <Text style={styles.jump}>Read in context ›</Text>
            </Pressable>
          ))}
        </>
      ) : (
        chunks.map((text, index) => (
          <View
            key={index}
            style={index === 0 ? styles.firstChunk : styles.chunk}
            onLayout={
              pendingScroll === index
                ? (e) => {
                    scrollRef.current?.scrollTo({
                      y: Math.max(0, e.nativeEvent.layout.y - spacing.md),
                      animated: false,
                    });
                    setPendingScroll(null);
                  }
                : undefined
            }
          >
            <Markdown source={text} baseSize={font.body} />
          </View>
        ))
      )}
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    part: {
      color: colors.accent,
      fontSize: font.tiny,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
    },
    h1: { color: colors.text, fontSize: font.h2, fontWeight: '800', lineHeight: 28 },
    sub: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.sm },
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
    matchLabel: {
      color: colors.textMuted,
      fontSize: font.small,
      fontWeight: '700',
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    passage: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    passagePressed: { opacity: 0.6 },
    jump: {
      color: colors.accent,
      fontSize: font.tiny,
      fontWeight: '800',
      marginTop: spacing.sm,
    },
    firstChunk: { marginTop: spacing.md },
    chunk: { marginTop: spacing.sm },
  });
