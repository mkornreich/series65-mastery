import React, {
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Keyboard,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { spacing, font, radius, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useLLM } from '../llm/LLMProvider';
import { ChatMessage, Question } from '../types';
import { AppButton } from '../components/ui';
import { Markdown } from '../components/markdown';
import { buildTutorContext, Source } from '../llm/rag';
import { TUTOR_EMPTY_FALLBACK } from '../llm/prompts';

type Props = NativeStackScreenProps<RootStackParamList, 'Tutor'>;

function suggestionsFor(topic?: string): string[] {
  if (topic) {
    return [
      `Explain ${topic} simply.`,
      `Give me a memory trick for ${topic}.`,
      `What’s a common Series 65 exam trap in ${topic}?`,
      `Quiz me with one hard question on ${topic}.`,
    ];
  }
  return [
    'Explain a Series 65 concept simply.',
    'Give me a memory trick for the exam.',
    'What’s a common Series 65 exam trap?',
    'Quiz me with one hard Series 65 question.',
  ];
}

const LETTERS = ['A', 'B', 'C', 'D'];

// A bare greeting / thanks / acknowledgement. The model otherwise treats it as
// "start the lesson" and dumps an unprompted explanation, so we answer these
// briefly ourselves instead of generating.
const SMALL_TALK = new Set([
  'hi', 'hello', 'hey', 'heya', 'hiya', 'yo', 'sup', 'howdy', 'hola',
  'hi there', 'hey there', 'hello there', 'hi tutor', 'hello tutor',
  'good morning', 'good afternoon', 'good evening', 'morning', 'gm', 'gn',
  'thanks', 'thank you', 'thankyou', 'thx', 'ty', 'tysm', 'cheers', 'much appreciated',
  'ok', 'okay', 'k', 'kk', 'cool', 'nice', 'great', 'awesome', 'got it', 'gotcha',
  'sounds good', 'perfect', 'lol',
]);

function isSmallTalk(msg: string): boolean {
  const t = msg
    .trim()
    .toLowerCase()
    .replace(/[!.…,]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t || t.includes('?') || t.length > 20) return false;
  return SMALL_TALK.has(t);
}

const SMALL_TALK_REPLY =
  'Hi! I’m your Series 65 tutor. Ask me about any exam topic — like investment ' +
  'adviser registration, types of risk, or how to work through a specific practice ' +
  'question — and I’ll explain it.';

/** System-prompt grounding so the tutor answers about the exact question. */
function questionContext(q: Question, chosenIndex?: number): string {
  const choices = q.choices.map((c, i) => `${LETTERS[i]}. ${c}`).join('\n');
  const correct = `${LETTERS[q.answerIndex]}. ${q.choices[q.answerIndex]}`;
  const chose =
    typeof chosenIndex === 'number' && chosenIndex >= 0
      ? `${LETTERS[chosenIndex]}. ${q.choices[chosenIndex]}`
      : 'they did not answer (skipped it)';
  return (
    'The student is asking about THIS specific Series 65 practice question. ' +
    'Ground every answer in it and refer to the answer choices by letter.\n\n' +
    `Question: ${q.stem}\n${choices}\n\n` +
    `Correct answer: ${correct}\nThe student chose: ${chose}\n\n` +
    `Reference explanation: ${q.explanation}`
  );
}

function questionSuggestions(q: Question, chosenIndex?: number): string[] {
  const answeredWrong =
    typeof chosenIndex === 'number' && chosenIndex >= 0 && chosenIndex !== q.answerIndex;
  return [
    'Why is the correct answer right?',
    answeredWrong ? 'Why was my answer wrong?' : 'Why are the other choices wrong?',
    'Explain the concept behind this simply.',
    'Give me a memory trick for this.',
  ];
}

/** Three pulsing dots so it's obvious the on-device model is working. */
function ThinkingDots({ color }: { color: string }) {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;
  useEffect(() => {
    const anims = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay((2 - i) * 160),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [dots]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {dots.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            marginRight: 5,
            backgroundColor: color,
            opacity: v,
          }}
        />
      ))}
    </View>
  );
}

export default function TutorScreen({ route, navigation }: Props) {
  const { topicTitle, question, chosenIndex } = route.params ?? {};
  const qContext = useMemo(
    () => (question ? questionContext(question, chosenIndex) : undefined),
    [question, chosenIndex]
  );
  const SUGGESTIONS = useMemo(
    () =>
      question ? questionSuggestions(question, chosenIndex) : suggestionsFor(topicTitle),
    [question, chosenIndex, topicTitle]
  );
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const llm = useLLM();
  const insets = useSafeAreaInsets();
  // Native-stack header height (includes the top safe-area inset). Used as the
  // KeyboardAvoidingView offset so the lifted input lands exactly on the
  // keyboard's top edge, reconciling the scene-relative layout frame with the
  // keyboard's absolute screenY.
  const headerHeight = useHeaderHeight();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Textbook sections the RAG retriever grounded each assistant reply in, keyed
  // by that message's index — rendered as tappable citations under the answer.
  const [msgSources, setMsgSources] = useState<Record<number, Source[]>>({});
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  // Synchronous mirror of `sending`: a double-tap fires two handlers in the same
  // frame, before setSending re-renders, so the state guard alone can't block it.
  const sendingRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  // If the user navigates away mid-generation, abort so the shared (serialized)
  // LLM lock is released instead of being held by an orphaned request.
  useEffect(
    () => () => {
      if (sendingRef.current) llm.stop().catch(() => {});
    },
    [llm]
  );

  // The app is edge-to-edge (decorFitsSystemWindows=false), so adjustResize no
  // longer shrinks the window for the IME and endCoordinates.height is
  // unreliable (0). KeyboardAvoidingView lifts the column using the keyboard's
  // screenY instead. We only track visibility to trim the resting nav-bar gap
  // and to keep the chat pinned to the latest message while typing.
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'AI Tutor' });
  }, [navigation]);

  const send = useCallback(
    async (text: string) => {
      const msg = text.trim();
      if (!msg || sendingRef.current) return;
      sendingRef.current = true;
      setInput('');
      const history = messages;
      // The assistant reply lands right after the user turn we're about to add.
      const assistantIndex = history.length + 1;
      setMessages((m) => [...m, { role: 'user', content: msg }, { role: 'assistant', content: '' }]);

      // A bare greeting: answer briefly without the model, which would otherwise
      // launch into an unprompted lesson. (Question mode always goes to the model.)
      if (!question && isSmallTalk(msg)) {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: 'assistant', content: SMALL_TALK_REPLY };
          return copy;
        });
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
        sendingRef.current = false;
        return;
      }

      setSending(true);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

      // RAG: retrieve the most relevant Series 65 textbook sections and feed them
      // to the model as grounding so it stays faithful and cites real sections.
      const ragQuery = question ? `${question.stem} ${msg}` : msg;
      const rag = buildTutorContext(ragQuery, topicTitle);
      if (rag.sources.length) {
        setMsgSources((s) => ({ ...s, [assistantIndex]: rag.sources }));
      }
      const context = [qContext, rag.context].filter(Boolean).join('\n\n') || undefined;

      try {
        const out = await llm.tutor(
          topicTitle,
          history,
          msg,
          (tok) => {
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = {
                role: 'assistant',
                content: copy[copy.length - 1].content + tok,
              };
              return copy;
            });
            scrollRef.current?.scrollToEnd({ animated: false });
          },
          context
        );
        // Finalize the bubble to the resolved text: it's the authoritative
        // answer (trimmed of any mid-sentence tail, and — after a retry — only
        // the successful attempt's output, not the concatenated stream).
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last && last.role === 'assistant') {
            copy[copy.length - 1] = {
              role: 'assistant',
              content: (out && out.trim()) || last.content.trim() || TUTOR_EMPTY_FALLBACK,
            };
          }
          return copy;
        });
      } catch (e: any) {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: 'assistant',
            content:
              (e?.message ?? 'The tutor is unavailable.') +
              '\n\nTip: choose and load an on-device model in Settings → Choose / manage models.',
          };
          return copy;
        });
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [messages, llm, topicTitle, qContext, question]
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {question && (
          <View style={styles.qCard}>
            <Text style={styles.qCardLabel}>ABOUT THIS QUESTION</Text>
            <Text style={styles.qCardStem}>{question.stem}</Text>
            <View style={styles.qChoices}>
              {question.choices.map((c, i) => {
                const isCorrect = i === question.answerIndex;
                const isChosen = i === chosenIndex;
                return (
                  <View
                    key={i}
                    style={[
                      styles.qChoice,
                      isCorrect
                        ? styles.qChoiceCorrect
                        : isChosen
                        ? styles.qChoiceWrong
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.qChoiceLetter,
                        isCorrect
                          ? styles.qLetterCorrect
                          : isChosen
                          ? styles.qLetterWrong
                          : null,
                      ]}
                    >
                      {LETTERS[i]}
                    </Text>
                    <Text style={styles.qChoiceText}>{c}</Text>
                    {isCorrect ? (
                      <Text style={styles.qTagCorrect}>✓ Correct</Text>
                    ) : isChosen ? (
                      <Text style={styles.qTagWrong}>Your answer</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
            {question.explanation ? (
              <Text style={styles.qExplain}>{question.explanation}</Text>
            ) : null}
          </View>
        )}
        {messages.length === 0 && (
          <View>
            <Text style={styles.hello}>
              {question
                ? 'Ask about this question'
                : topicTitle
                ? `Ask about “${topicTitle}”`
                : 'Ask me anything about the Series 65.'}
            </Text>
            <Text style={styles.helloSub}>
              I run on your device. {llm.available ? '' : 'Set up a model in Settings to begin.'}
            </Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} style={styles.suggestion} onPress={() => send(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {messages.map((m, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              m.role === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            {m.role === 'assistant' && <Text style={styles.aiTag}>TUTOR</Text>}
            {m.role === 'user' ? (
              <Text style={styles.userText}>{m.content}</Text>
            ) : m.content ? (
              <Markdown source={m.content} baseSize={font.body} />
            ) : sending ? (
              // No tokens yet: make it obvious the on-device model is working.
              <View style={styles.thinkingRow}>
                <ThinkingDots color={colors.accent} />
                <Text style={styles.thinkingText}>Thinking…</Text>
              </View>
            ) : (
              <Text style={styles.aiText}>…</Text>
            )}
            {m.role === 'assistant' && !!m.content && msgSources[i]?.length ? (
              <View style={styles.sources}>
                <Text style={styles.sourcesLabel}>TEXTBOOK SECTIONS</Text>
                {msgSources[i].map((src) => (
                  <Pressable
                    key={src.anchor + src.label}
                    style={styles.sourceChip}
                    onPress={() =>
                      navigation.navigate('TextbookSection', {
                        anchor: src.anchor,
                        title: src.label,
                      })
                    }
                  >
                    <Text style={styles.sourceText} numberOfLines={2}>
                      📖 {src.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <View
        style={[
          styles.inputRow,
          { paddingBottom: keyboardVisible ? spacing.sm : insets.bottom + spacing.sm },
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder="Type your question…"
          placeholderTextColor={colors.textFaint}
          value={input}
          onChangeText={setInput}
          multiline
          editable={!sending}
        />
        <Pressable
          style={[styles.sendBtn, { opacity: sending || !input.trim() ? 0.5 : 1 }]}
          onPress={() => send(input)}
          disabled={sending || !input.trim()}
        >
          <Text style={styles.sendText}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.bg },
  qCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  qCardLabel: {
    color: colors.accent,
    fontSize: font.tiny,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  qCardStem: { color: colors.text, fontSize: font.body, fontWeight: '700', lineHeight: 22 },
  qChoices: { marginTop: spacing.sm },
  qChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: 6,
  },
  qChoiceCorrect: { borderColor: colors.success, backgroundColor: `${colors.success}18` },
  qChoiceWrong: { borderColor: colors.danger, backgroundColor: `${colors.danger}18` },
  qChoiceLetter: { width: 22, fontSize: font.small, fontWeight: '800', color: colors.textMuted },
  qLetterCorrect: { color: colors.success },
  qLetterWrong: { color: colors.danger },
  qChoiceText: { flex: 1, color: colors.text, fontSize: font.small, lineHeight: 19 },
  qTagCorrect: { color: colors.success, fontSize: font.tiny, fontWeight: '800', marginLeft: 6 },
  qTagWrong: { color: colors.danger, fontSize: font.tiny, fontWeight: '800', marginLeft: 6 },
  qExplain: {
    color: colors.textMuted,
    fontSize: font.small,
    lineHeight: 19,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  hello: { color: colors.text, fontSize: font.h3, fontWeight: '800', marginTop: spacing.md },
  helloSub: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.xs, marginBottom: spacing.lg },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap' },
  suggestion: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  suggestionText: { color: colors.textMuted, fontSize: font.small },
  bubble: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, maxWidth: '90%' },
  userBubble: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' },
  userText: { color: colors.onBright, fontSize: font.body, lineHeight: 21, fontWeight: '600' },
  aiText: { color: colors.text, fontSize: font.body, lineHeight: 22 },
  aiTag: { color: colors.accent, fontSize: font.tiny, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  sources: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sourcesLabel: {
    color: colors.textFaint,
    fontSize: font.tiny,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  sourceChip: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginBottom: 6,
  },
  sourceText: { color: colors.accent, fontSize: font.small, fontWeight: '600', lineHeight: 18 },
  thinkingRow: { flexDirection: 'row', alignItems: 'center' },
  thinkingText: { color: colors.textMuted, fontSize: font.small, fontWeight: '600', marginLeft: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgAlt,
  },
  input: {
    flex: 1,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 120,
    fontSize: font.body,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  sendText: { color: colors.onBright, fontSize: font.h3, fontWeight: '800' },
});
