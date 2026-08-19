import { requireNativeModule } from 'expo-modules-core';

interface GeminiNanoNative {
  isAvailable(): Promise<boolean>;
  generate(prompt: string, temperature: number, maxTokens: number): Promise<string>;
}

let native: GeminiNanoNative | null = null;
try {
  native = requireNativeModule<GeminiNanoNative>('GeminiNano');
} catch {
  // Module not present (e.g. web, or a build without the native module).
  native = null;
}

/** Whether the native Gemini Nano module is compiled into this build. */
export function isGeminiNanoSupported(): boolean {
  return native != null;
}

/** Whether Gemini Nano is actually usable on this device right now (AICore + model ready). */
export async function isGeminiNanoAvailable(): Promise<boolean> {
  if (!native) return false;
  try {
    return await native.isAvailable();
  } catch {
    return false;
  }
}

// Google's ML Kit GenAI Prompt API rejects the request unless maxOutputTokens is
// in [1, 256]. Clamp here so no caller can trip that validation error.
const GEMINI_NANO_MAX_OUTPUT_TOKENS = 256;

export async function geminiGenerate(
  prompt: string,
  temperature = 0.3,
  maxTokens = 256
): Promise<string> {
  if (!native) throw new Error('Gemini Nano is not available in this build.');
  const capped = Math.max(
    1,
    Math.min(GEMINI_NANO_MAX_OUTPUT_TOKENS, Math.round(maxTokens) || GEMINI_NANO_MAX_OUTPUT_TOKENS)
  );
  return native.generate(prompt, temperature, capped);
}
