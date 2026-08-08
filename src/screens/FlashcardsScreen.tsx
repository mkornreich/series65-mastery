import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Question } from '../types';
import { Screen, Card, AppButton, Body } from '../components/ui';
import { Markdown } from '../components/markdown';
import { spacing, font, radius, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/useStore';
import { useLLM } from '../llm/LLMProvider';
import { MATH_TOPICS } from '../data/mathTopics';
import { GLOSSARY } from '../data/glossary';
import { COMPONENT_BY_ID } from '../data/curriculum';
import { questionsByIds } from '../mastery/selection';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DeckId = 'starred' | 'formulas' | 'terms' | 'missed' | 'flagged';
type CardKind = 'formula' | 'question' | 'term';

interface FCard {
  /** Globally-unique id, also the star key. */
  id: string;
  kind: CardKind;
  front: string;
  // formula
  formulaLatex?: string;
  summary?: string;
  formulaComponentId?: string;
  formulaTopicId?: string;
  // question
  answer?: string;
  explanation?: string;
  question?: Question;
  // term
  definition?: string;
}

const letter = (i: number) => String.fromCharCode(65 + i);

function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function questionCard(q: Question): FCard {
  return {
    id: q.id,
    kind: 'question',
    front: q.stem,
    answer: `${letter(q.answerIndex)}. ${q.choices[q.answerIndex]}`,
    explanation: q.explanation,
    question: q,
  };
}

export default function FlashcardsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const llm = useLLM();

  const missedIds = useStore((s) => s.progress.missed);
  const flaggedIds = useStore((s) => s.progress.flagged);
  const starredIds = useStore((s) => s.progress.starredCards);
  const toggleStar = useStore((s) => s.toggleStarredCard);
  const starred = useMemo(() => new Set(starredIds ?? []), [starredIds]);

  // Stable card sources (formulas + terms don't change).
  const formulaCards = useMemo<FCard[]>(
    () =>
      MATH_TOPICS.map((t) => ({
        id: `f:${t.id}`,
        kind: 'formula',
        front: t.title,
        formulaLatex: t.formulaLatex,
        summary: t.summary,
        formulaComponentId: t.homeComponentId,
        formulaTopicId: t.id,
      })),
    [],
  );
  const termCards = useMemo<FCard[]>(
    () =>
      GLOSSARY.map((g) => ({ id: `t:${g.slug}`, kind: 'term', front: g.term, definition: g.definition })),
    [],
  );
  const formulaById = useMemo(() => new Map(formulaCards.map((c) => [c.id, c])), [formulaCards]);
  const termById = useMemo(() => new Map(termCards.map((c) => [c.id, c])), [termCards]);

  const decks = useMemo<Record<DeckId, FCard[]>>(() => {
    const missed = questionsByIds(missedIds).map(questionCard);
    const flagged = questionsByIds(flaggedIds).map(questionCard);
    // Resolve starred ids back to cards across all sources.
    const ids = starredIds ?? [];
    const qIds = ids.filter((id) => !id.startsWith('f:') && !id.startsWith('t:'));
    const qMap = new Map(questionsByIds(qIds).map((q) => [q.id, questionCard(q)]));
    const starredCards = ids
      .map((id) => formulaById.get(id) || termById.get(id) || qMap.get(id))
      .filter((c): c is FCard => !!c);
    return { starred: starredCards, formulas: formulaCards, terms: termCards, missed, flagged };
  }, [missedIds, flaggedIds, starredIds, formulaCards, termCards, formulaById, termById]);

  const DECK_META: { id: DeckId; title: string; desc: string; accent: string; emptyHint: string }[] = [
    { id: 'starred', title: 'Starred', desc: 'Cards you starred for review.', accent: colors.warn, emptyHint: 'Tap the ☆ on any card to add it here.' },
    { id: 'formulas', title: 'Formulas', desc: 'Every Series 65 calculation — name on the front, formula on the back.', accent: colors.accent, emptyHint: '' },
    { id: 'terms', title: 'Key terms', desc: 'Core Series 65 vocabulary — term on the front, definition on the back.', accent: colors.primary, emptyHint: '' },
    { id: 'missed', title: 'Practice misses', desc: 'Questions you got wrong, as review cards.', accent: colors.danger, emptyHint: 'None yet — do some practice to fill this deck.' },
    { id: 'flagged', title: 'Flagged questions', desc: 'Questions you flagged during practice.', accent: colors.warn, emptyHint: 'None yet — flag tricky questions during practice.' },
  ];

  const [deck, setDeck] = useState<DeckId | null>(null);
  const [activeCards, setActiveCards] = useState<FCard[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const openDeck = useCallback(
    (id: DeckId, doShuffle: boolean) => {
      const cards = decks[id];
      setDeck(id);
      setActiveCards(cards); // snapshot: starring/unstarring won't reshuffle mid-review
      setOrder(doShuffle ? shuffled(cards.length) : Array.from({ length: cards.length }, (_, i) => i));
      setPos(0);
      setFlipped(false);
    },
    [decks],
  );

  const go = useCallback(
    (delta: number) => {
      setFlipped(false);
      setPos((p) => Math.min(order.length - 1, Math.max(0, p + delta)));
    },
    [order.length],
  );

  const askAi = useCallback(
    (c: FCard) => {
      if (!llm.available) {
        navigation.navigate('ModelManager');
        return;
      }
      if (c.kind === 'question' && c.question) {
        navigation.navigate('Tutor', {
          topicTitle: COMPONENT_BY_ID[c.question.componentId]?.title,
          componentId: c.question.componentId,
          question: c.question,
          chosenIndex: -1,
        });
      } else if (c.kind === 'formula') {
        navigation.navigate('Tutor', { topicTitle: `${c.front} (formula)`, componentId: c.formulaComponentId });
      } else {
        navigation.navigate('Tutor', { topicTitle: c.front });
      }
    },
    [llm.available, navigation],
  );

  // Jump to where the card's content is taught (formula page or topic notes).
  // Term cards have no single home section, so they get no review link.
  const reviewNav = useCallback(
    (c: FCard): (() => void) | null => {
      if (c.kind === 'formula' && c.formulaTopicId) {
        const topicId = c.formulaTopicId;
        return () => navigation.navigate('MathTopic', { topicId });
      }
      if (c.kind === 'question' && c.question) {
        const componentId = c.question.componentId;
        return () => navigation.navigate('Topic', { componentId });
      }
      return null;
    },
    [navigation],
  );

  // ── Deck picker ────────────────────────────────────────────────────────────
  if (!deck) {
    return (
      <Screen topInset settingsGear>
        <Text style={styles.h1}>Flashcards</Text>
        <Text style={styles.sub}>
          Quick recall practice. Tap a card to flip it, star the tricky ones, and ask the AI tutor.
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
                {empty ? d.emptyHint : d.desc}
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
  const card = order.length ? activeCards[order[pos]] : null;
  const isStarred = card ? starred.has(card.id) : false;
  const review = card ? reviewNav(card) : null;

  return (
    <Screen topInset>
      <View style={styles.viewerHeader}>
        <Pressable onPress={() => setDeck(null)} hitSlop={8}>
          <Text style={styles.link}>‹ Decks</Text>
        </Pressable>
        <Text style={styles.progress}>{order.length ? `${pos + 1} / ${order.length}` : '0 / 0'}</Text>
        <Pressable onPress={() => openDeck(deck, true)} hitSlop={8}>
          <Text style={styles.link}>Shuffle ⇄</Text>
        </Pressable>
      </View>

      {card ? (
        <>
          <Pressable onPress={() => setFlipped((f) => !f)}>
            <Card accent={meta.accent} style={styles.cardFace}>
              <View style={styles.cardTop}>
                <Text style={styles.faceLabel}>
                  {flipped ? (card.kind === 'term' ? 'DEFINITION' : 'ANSWER') : card.kind.toUpperCase()}
                </Text>
                <Pressable onPress={() => toggleStar(card.id)} hitSlop={12}>
                  <Text style={[styles.starIcon, { color: isStarred ? colors.warn : colors.textFaint }]}>
                    {isStarred ? '★' : '☆'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.cardBody}>
                {!flipped ? (
                  <Text style={styles.frontText}>{card.front}</Text>
                ) : card.kind === 'formula' ? (
                  <View>
                    <View style={styles.formulaWrap}>
                      <Markdown source={`$$${card.formulaLatex}$$`} baseSize={font.body} />
                    </View>
                    <Body style={{ marginTop: spacing.md }}>{card.summary}</Body>
                  </View>
                ) : card.kind === 'term' ? (
                  <Body>{card.definition}</Body>
                ) : (
                  <View>
                    <Body style={{ fontWeight: '800', color: colors.success }}>{card.answer}</Body>
                    <Body muted style={{ marginTop: spacing.sm }}>{card.explanation}</Body>
                  </View>
                )}
              </View>

              <Text style={styles.tapHint}>{flipped ? 'Tap to hide' : 'Tap to reveal'}</Text>
            </Card>
          </Pressable>

          <AppButton
            title={llm.available ? '💬 Ask AI about this card' : '💬 Ask AI (needs setup)'}
            variant="ghost"
            onPress={() => askAi(card)}
            style={{ marginTop: spacing.md }}
          />
          {review && (
            <AppButton
              title="📖 Review this topic"
              variant="ghost"
              onPress={review}
              style={{ marginTop: spacing.sm }}
            />
          )}

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
    cardFace: { minHeight: 340 },
    cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    faceLabel: { color: colors.textFaint, fontSize: font.tiny, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
    starIcon: { fontSize: 24, fontWeight: '800' },
    cardBody: { flex: 1, justifyContent: 'center', paddingVertical: spacing.sm },
    frontText: { color: colors.text, fontSize: font.h3, fontWeight: '700', lineHeight: 26, textAlign: 'center' },
    formulaWrap: {
      backgroundColor: colors.bgAlt,
      borderRadius: 10,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      overflow: 'hidden',
    },
    tapHint: { alignSelf: 'center', color: colors.textFaint, fontSize: font.tiny, fontWeight: '600', marginTop: spacing.md },
    navRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    navBtn: { flex: 1 },
  });
