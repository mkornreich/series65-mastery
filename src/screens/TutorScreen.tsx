import React, { useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { spacing, font, radius, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useLLM } from '../llm/LLMProvider';
import { ChatMessage } from '../types';
import { AppButton } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Tutor'>;

const SUGGESTIONS = [
  'Explain this topic simply.',
  'Give me a memory trick.',
  'What’s a common exam trap here?',
  'Quiz me with one hard question.',
];

export default function TutorScreen({ route, navigation }: Props) {
  const { topicTitle } = route.params ?? {};
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const llm = useLLM();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: topicTitle ? 'AI Tutor' : 'AI Tutor' });
  }, [navigation, topicTitle]);

  const send = useCallback(
    async (text: string) => {
      const msg = text.trim();
      if (!msg || sending) return;
      setInput('');
      const history = messages;
      setMessages((m) => [...m, { role: 'user', content: msg }, { role: 'assistant', content: '' }]);
      setSending(true);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
      try {
        await llm.tutor(topicTitle, history, msg, (tok) => {
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = {
              role: 'assistant',
              content: copy[copy.length - 1].content + tok,
            };
            return copy;
          });
          scrollRef.current?.scrollToEnd({ animated: false });
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
        setSending(false);
      }
    },
    [messages, sending, llm, topicTitle]
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.content}>
        {messages.length === 0 && (
          <View>
            <Text style={styles.hello}>
              {topicTitle ? `Ask about “${topicTitle}”` : 'Ask me anything about the Series 65.'}
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
            <Text style={m.role === 'user' ? styles.userText : styles.aiText}>
              {m.content || (sending ? '…' : '')}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
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
