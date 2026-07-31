import { requireNativeModule } from 'expo-modules-core';

interface LitertLmNative {
  isSupported(): boolean;
  modelsDir(): string;
  listLocalModels(): string[];
  load(modelPath: string, useGpu: boolean, maxTokens: number): Promise<boolean>;
  generate(
    prompt: string,
    system: string,
    temperature: number,
    topK: number,
    topP: number
  ): Promise<string>;
  release(): Promise<void>;
}

let native: LitertLmNative | null = null;
try {
  native = requireNativeModule<LitertLmNative>('LitertLm');
} catch {
  native = null;
}

/** Whether the LiteRT-LM native runtime is compiled into this build. */
export function isLitertSupported(): boolean {
  try {
    return !!native && native.isSupported();
  } catch {
    return false;
  }
}

/** Folder in the app's own external storage where .litertlm files can be dropped. */
export function litertModelsDir(): string | null {
  try {
    return native ? native.modelsDir() : null;
  } catch {
    return null;
  }
}

/** Filenames of .litertlm models present in the models dir (on-device / imported). */
export function listLocalLitertModels(): string[] {
  try {
    return native ? native.listLocalModels() : [];
  } catch {
    return [];
  }
}

export async function litertLoad(
  modelPath: string,
  useGpu: boolean,
  maxTokens: number
): Promise<boolean> {
  if (!native) throw new Error('LiteRT-LM is not available in this build.');
  return native.load(modelPath, useGpu, maxTokens);
}

export async function litertGenerate(
  prompt: string,
  system: string,
  temperature: number,
  topK: number,
  topP: number
): Promise<string> {
  if (!native) throw new Error('LiteRT-LM is not available in this build.');
  return native.generate(prompt, system, temperature, topK, topP);
}

export async function litertRelease(): Promise<void> {
  if (native) await native.release();
}
