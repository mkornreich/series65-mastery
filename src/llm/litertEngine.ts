import { ChatMessage } from '../types';
import {
  isLitertSupported,
  litertModelsDir,
  listLocalLitertModels,
  deleteLocalLitertModel,
  litertLoad,
  litertGenerate,
  litertRelease,
} from '../../modules/litert-lm';

export function litertSupported(): boolean {
  return isLitertSupported();
}

export function litertDir(): string | null {
  return litertModelsDir();
}

export function localLitertModels(): string[] {
  return listLocalLitertModels();
}

export function deleteLocalLitert(fileName: string): boolean {
  return deleteLocalLitertModel(fileName);
}

export async function litertLoadModel(
  modelPath: string,
  useGpu: boolean,
  maxTokens: number
): Promise<boolean> {
  return litertLoad(modelPath, useGpu, maxTokens);
}

export async function litertUnload(): Promise<void> {
  await litertRelease();
}

export async function litertComplete(
  messages: ChatMessage[],
  temperature: number,
  topP: number
): Promise<string> {
  // LiteRT-LM applies the model's own chat template, so pass the system prompt
  // as a proper systemInstruction and the user turn(s) as the message.
  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');
  const convo = messages.filter((m) => m.role !== 'system');
  const userPrompt =
    convo.length <= 1
      ? convo[0]?.content ?? ''
      : convo
          .map((m) => (m.role === 'user' ? 'User: ' : 'Assistant: ') + m.content)
          .join('\n');
  // LiteRT-LM's sampler exposes no repetition/frequency penalty, so a near-greedy
  // temperature makes small models (e.g. Gemma 3 1B) collapse into loops
  // ("They must be diligent. They must be transparent. …"). Warmth reduces it
  // (the only sampler lever here), so use Gemma's recommended settings...
  const temp = Math.max(0.9, temperature);
  const text = await litertGenerate(userPrompt, system, temp, 64, Math.max(0.95, topP));
  // ...and then hard-collapse any loop that still slips through, so the user
  // never sees a wall of repeated text.
  return collapseRepetition(text.trim());
}

/**
 * Truncate a generation at the point it degenerates into a loop: when a window
 * of `win` consecutive words recurs within `maxGap` words of its first sighting
 * (a tight repeat, not distant legitimate reuse), cut everything from the
 * repeat onward. Returns the text unchanged when no loop is found.
 */
export function collapseRepetition(text: string, win = 6, maxGap = 80): string {
  const toks = text.split(/\s+/).filter(Boolean);
  if (toks.length < win * 3) return text;
  const seen = new Map<string, number>();
  for (let i = 0; i + win <= toks.length; i++) {
    const gram = toks
      .slice(i, i + win)
      .join(' ')
      .toLowerCase();
    const prev = seen.get(gram);
    if (prev !== undefined && i - prev <= maxGap) {
      return toks.slice(0, i).join(' ').trim();
    }
    seen.set(gram, i);
  }
  return text;
}
