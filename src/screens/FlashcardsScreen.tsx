import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Screen, Card, AppButton, Body } from '../components/ui';
import { Markdown } from '../components/markdown';
import { spacing, font, radius, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/useStore';
import { MATH_TOPICS } from '../data/mathTopics';
import { questionsByIds } from '../mastery/selection';

type DeckId = 'formulas' | 'missed' | 'flagged';

interface FCard {
  id: string;
  /** Prompt shown on the front. */
  front: string;
  /** True for formula cards (back renders LaTeX + summary); false for question cards. */
  isFormula: boolean;
  formulaLatex?: string;
  summary?: string;
  answer?: string;
  explanation?: string;
}

function letter(i: number): string {
  return String.fromCharCode(65 + i);
}

function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashcardsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const missedIds = useStore((s) => s.progress.missed);
  const flaggedIds = useStore((s) => s.progress.flagged);

  const decks = useMemo<Record<DeckId, FCard[]>>(() => {
    const formulas: FCard[] = MATH_TOPICS.map((t) => ({
      id: t.id,
      front: t.title,
      isFormula: true,
      formulaLatex: t.formulaLatex,
      summary: t.summary,
    }));
    const toQ = (ids: string[]): FCard[] =>
      questionsByIds(ids).map((q) => ({
        id: q.id,
        front: q.stem,
        isFormula: false,
        answer: `${letter(q.answerIndex)}. ${q.choices[q.answerIndex]}`,
        explanation: q.explanation,
      }));
    return { formulas, missed: toQ(missedIds), flagged: toQ(flaggedIds) };
  }, [missedIds, flaggedIds]);

  const DECK_META: { id: DeckId; title: string; desc: string; accent: string }[] = [
    { id: 'formulas', title: 'Formulas', desc: 'Every Series 65 calculation — name on the front, formula on the back.', accent: colors.accent },
    { id: 'missed', title: 'Practice misses', desc: 'Questions you got wrong, as review cards.', accent: colors.danger },
    { id: 'flagged', title: 'Flagged questions', desc: 'Questions you flagged during practice.', accent: colors.warn },
  ];

  const [deck, setDeck] = useState<DeckId | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const openDeck = useCallback((id: DeckId, doShuffle: boolean) => {
    const n = decks[id].length;
    setDeck(id);
    setOrder(doShuffle ? shuffled(n) : Array.from({ length: n }, (_, i) => i));
    setPos(0);
    setFlipped(false);
  }, [decks]);

  const cards = deck ? decks[deck] : [];
  const card = deck && order.length ? cards[order[pos]] : null;

  const go = useCallback(
    (delta: number) => {
      setFlipped(false);
      setPos((p) => Math.min(cards.length - 1, Math.max(0, p + delta)));
    },
    [cards.length],
  );

  // ── Deck picker ────────────────────────────────────────────────────────────
  if (!deck) {
    return (
      <Screen topInset settingsGear>
        <Text style={styles.h1}>Flashcards</Text>
        <Text style={styles.sub}>
          Quick recall practice. Tap a card to flip it; shuffle and review until it sticks.
        </Text>
        {DECK_META.map((d) => {
          const count = decks[d.id].length;
          const empty = count === 0;
          return (
            <Card key={d.id} accent={d.accent} onPress={empty ? undefined : () => openDeck(d.id, false)}>
              <View style={styles.deckRow}>
                <Text style={styles.deckTitle}>{d.title}</Text>
                <Text style={[styles.deckCount, { color: empty ? colors.textFaint : d.accent }]}>{count}</Text>
              </View>
              <Body muted style={{ fontSize: font.small, marginTop: 4 }}>
                {empty && d.id !== 'formulas' ? 'None yet — do some practice to fill this deck.' : d.desc}
              </Body>
            </Card>
          );
        })}
      </Screen>
    );
  }

  // ── Card viewer ─────────────────────────────────────────────────────────────
  // (No settings gear here — the viewer has its own top-right "Shuffle" control.)
  const meta = DECK_META.find((d) => d.id === deck)!;
  return (
    <Screen topInset>
      <View style={styles.viewerHeader}>
        <Pressable onPress={() => setDeck(null)} hitSlop={8}>
          <Text style={styles.link}>‹ Decks</Text>
        </Pressable>
        <Text style={styles.progress}>
          {order.length ? `${pos + 1} / ${order.length}` : '0 / 0'}
        </Text>
        <Pressable onPress={() => openDeck(deck, true)} hitSlop={8}>
          <Text style={styles.link}>Shuffle ⇄</Text>
        </Pressable>
      </View>

      {card ? (
        <>
          <Pressable onPress={() => setFlipped((f) => !f)}>
            <Card accent={meta.accent} style={styles.cardFace}>
              <Text style={styles.faceLabel}>{flipped ? 'ANSWER' : card.isFormula ? 'FORMULA' : 'QUESTION'}</Text>
              {!flipped ? (
                <Text style={styles.frontText}>{card.front}</Text>
              ) : card.isFormula ? (
                <View>
                  <View style={styles.formulaWrap}>
                    <Markdown source={`$$${card.formulaLatex}$$`} baseSize={font.body} />
                  </View>
                  <Body style={{ marginTop: spacing.md }}>{card.summary}</Body>
                </View>
              ) : (
                <View>
                  <Body style={{ fontWeight: '800', color: colors.success }}>{card.answer}</Body>
                  <Body muted style={{ marginTop: spacing.sm }}>{card.explanation}</Body>
                </View>
              )}
              <Text style={styles.tapHint}>{flipped ? 'Tap to hide' : 'Tap to reveal'}</Text>
            </Card>
          </Pressable>

          <View style={styles.navRow}>
            <AppButton title="‹ Prev" variant="secondary" disabled={pos === 0} onPress={() => go(-1)} style={styles.navBtn} />
            <AppButton
              title={pos >= order.length - 1 ? 'Done' : 'Next ›'}
              onPress={() => (pos >= order.length - 1 ? setDeck(null) : go(1))}
              style={styles.navBtn}
            />
          </View>
        </>
      ) : (
        <Card>
          <Body muted>This deck is empty.</Body>
        </Card>
      )}
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    h1: { fontSize: font.h1, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
    sub: { fontSize: font.small, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 19 },
    deckRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    deckTitle: { fontSize: font.body, fontWeight: '800', color: colors.text },
    deckCount: { fontSize: font.h3, fontWeight: '800' },
    viewerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    link: { color: colors.primary, fontSize: font.small, fontWeight: '700' },
    progress: { color: colors.textMuted, fontSize: font.small, fontWeight: '700' },
    cardFace: { minHeight: 260, justifyContent: 'center' },
    faceLabel: {
      position: 'absolute',
      top: spacing.md,
      left: spacing.lg,
      color: colors.textFaint,
      fontSize: font.tiny,
      fontWeight: '800',
      letterSpacing: 1,
    },
    frontText: { color: colors.text, fontSize: font.h3, fontWeight: '700', lineHeight: 26, textAlign: 'center' },
    formulaWrap: {
      backgroundColor: colors.bgAlt,
      borderRadius: 10,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      overflow: 'hidden',
    },
    tapHint: {
      position: 'absolute',
      bottom: spacing.md,
      alignSelf: 'center',
      color: colors.textFaint,
      fontSize: font.tiny,
      fontWeight: '600',
    },
    navRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
    navBtn: { flex: 1 },
  });
