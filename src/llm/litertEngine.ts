import { ChatMessage } from '../types';
import {
  isLitertSupported,
  litertModelsDir,
  listLocalLitertModels,
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
  const text = await litertGenerate(userPrompt, system, temperature, 40, topP);
  return text.trim();
}
