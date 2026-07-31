import { ChatMessage } from '../types';
import {
  isGeminiNanoSupported,
  isGeminiNanoAvailable,
  geminiGenerate,
} from '../../modules/gemini-nano';

export function geminiSupported(): boolean {
  return isGeminiNanoSupported();
}

export function geminiAvailable(): Promise<boolean> {
  return isGeminiNanoAvailable();
}

// Gemini Nano takes a single prompt string. Flatten a chat transcript into one.
export function messagesToPrompt(messages: ChatMessage[]): string {
  const parts: string[] = [];
  for (const m of messages) {
    if (m.role === 'system') parts.push(m.content);
    else if (m.role === 'user') parts.push(`User: ${m.content}`);
    else parts.push(`Assistant: ${m.content}`);
  }
  parts.push('Assistant:');
  return parts.join('\n\n');
}

export async function geminiComplete(
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const text = await geminiGenerate(messagesToPrompt(messages), temperature, maxTokens);
  return text.trim();
}
