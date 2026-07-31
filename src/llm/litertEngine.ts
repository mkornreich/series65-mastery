import { ChatMessage } from '../types';
import {
  isLitertSupported,
  litertModelsDir,
  listLocalLitertModels,
  litertLoad,
  litertGenerate,
  litertRelease,
} from '../../modules/litert-lm';
import { messagesToPrompt } from './geminiEngine';

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
  const prompt = messagesToPrompt(messages);
  const text = await litertGenerate(prompt, temperature, 40, topP);
  return text.trim();
}
