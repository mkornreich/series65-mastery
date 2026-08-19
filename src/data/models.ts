import { LLMModelInfo } from '../types';

// Curated list of small, mobile-friendly instruction-tuned LLMs in GGUF format.
// They run fully on-device via llama.rn (llama.cpp). Files are hosted on
// Hugging Face; the app downloads the one the user picks in Settings.
//
// Choose a model that fits the phone's RAM. Rough guidance:
//   ~1 GB models  -> most modern phones (>=4 GB RAM)
//   ~2 GB models  -> phones with >=6-8 GB RAM
// Quantization Q4_K_M balances size and quality.

// Gemini Nano ships inside the OS on supported devices (recent Pixels) via
// AICore. There is no file to download — the app talks to the system model.
export const GEMINI_NANO: LLMModelInfo = {
  id: 'gemini-nano',
  name: 'Gemini Nano (built-in)',
  family: 'Gemini',
  description:
    'Google’s on-device model, built into supported Pixel devices through AICore. No download — it runs through the system.',
  url: '',
  fileName: '',
  sizeMB: 0,
  params: 'system',
  quant: 'system',
  contextLength: 4096,
  // Google's ML Kit GenAI Prompt API hard-caps maxOutputTokens at 256.
  maxOutputTokens: 256,
  kind: 'aicore',
  builtIn: true,
  recommended: true,
};

// LiteRT-LM (.litertlm) models — the exact files used by Google's AI Edge
// Gallery, run through the LiteRT-LM engine on the GPU. Downloaded from the
// litert-community org (ungated).
const LITERTLM_MODELS: LLMModelInfo[] = [
  {
    id: 'litertlm-gemma-4-e2b',
    name: 'Gemma 4 E2B (LiteRT-LM)',
    family: 'Gemma',
    description:
      'Google’s Gemma 4 (E2B) — the AI Edge Gallery’s flagship, run on the GPU via LiteRT-LM. Best on phones with 8 GB+ RAM.',
    url: 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it.litertlm',
    fileName: 'gemma-4-E2B-it.litertlm',
    sizeMB: 2588,
    params: '2B (eff.)',
    quant: 'int4',
    contextLength: 4096,
    kind: 'litertlm',
    backend: 'gpu',
    minRamGb: 8,
    recommended: true,
  },
  {
    id: 'litertlm-qwen2.5-1.5b',
    name: 'Qwen2.5 1.5B (LiteRT-LM)',
    family: 'Qwen',
    description:
      'Qwen2.5 1.5B in the AI Edge Gallery’s LiteRT-LM format, GPU-accelerated. A strong all-round tutor.',
    url: 'https://huggingface.co/litert-community/Qwen2.5-1.5B-Instruct/resolve/main/Qwen2.5-1.5B-Instruct_multi-prefill-seq_q8_ekv4096.litertlm',
    fileName: 'Qwen2.5-1.5B-Instruct_q8_ekv4096.litertlm',
    sizeMB: 1598,
    params: '1.5B',
    quant: 'q8',
    contextLength: 4096,
    kind: 'litertlm',
    backend: 'gpu',
    minRamGb: 6,
  },
  {
    id: 'litertlm-deepseek-r1-1.5b',
    name: 'DeepSeek-R1 Distill Qwen 1.5B (LiteRT-LM)',
    family: 'DeepSeek',
    description:
      'The AI Edge Gallery’s DeepSeek-R1 distill in LiteRT-LM format, GPU-accelerated. Good at step-by-step reasoning.',
    url: 'https://huggingface.co/litert-community/DeepSeek-R1-Distill-Qwen-1.5B/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B_multi-prefill-seq_q8_ekv4096.litertlm',
    fileName: 'DeepSeek-R1-Distill-Qwen-1.5B_q8_ekv4096.litertlm',
    sizeMB: 1833,
    params: '1.5B',
    quant: 'q8',
    contextLength: 4096,
    kind: 'litertlm',
    backend: 'gpu',
    minRamGb: 6,
  },
];

export const AVAILABLE_MODELS: LLMModelInfo[] = [
  // Preloaded, bundled inside the app — ready with no download, works fully
  // offline. Tiny (360M), so it's grounded with textbook RAG in the AI tutor.
  {
    id: 'smollm2-360m-instruct-q8',
    name: 'SmolLM2 360M (preloaded)',
    family: 'SmolLM',
    description:
      'HuggingFaceTB SmolLM2-360M-Instruct, shipped inside the app — ready instantly, no download, fully offline. Tiny and fast; the AI tutor grounds it in the built-in Series 65 textbook (RAG) to keep answers accurate.',
    url: 'https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct-GGUF/resolve/main/smollm2-360m-instruct-q8_0.gguf',
    fileName: 'smollm2-360m-instruct-q8_0.gguf',
    sizeMB: 369,
    params: '360M',
    quant: 'Q8_0',
    contextLength: 4096,
    kind: 'gguf',
    bundled: true,
    bundledAsset: 'models/smollm2-360m-instruct-q8_0.gguf',
    recommended: true,
  },
  GEMINI_NANO,
  ...LITERTLM_MODELS,
  {
    id: 'gemma-3-1b-it-q4',
    name: 'Gemma 3 1B Instruct',
    family: 'Gemma',
    description:
      'Google’s Gemma 3 1B — the same model featured in Google’s AI Edge Gallery. Small and fast; great for tutoring and explanations.',
    url: 'https://huggingface.co/ggml-org/gemma-3-1b-it-GGUF/resolve/main/gemma-3-1b-it-Q4_K_M.gguf',
    fileName: 'gemma-3-1b-it-Q4_K_M.gguf',
    sizeMB: 806,
    params: '1B',
    quant: 'Q4_K_M',
    contextLength: 4096,
    recommended: true,
  },
  {
    id: 'deepseek-r1-distill-qwen-1.5b-q4',
    name: 'DeepSeek-R1 Distill Qwen 1.5B',
    family: 'DeepSeek',
    description:
      'A reasoning-distilled 1.5B model, also offered in Google’s AI Edge Gallery. Strong at step-by-step explanations.',
    url: 'https://huggingface.co/bartowski/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf',
    fileName: 'DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf',
    sizeMB: 1117,
    params: '1.5B',
    quant: 'Q4_K_M',
    contextLength: 4096,
  },
  {
    id: 'llama-3.2-1b-instruct-q4',
    name: 'Llama 3.2 1B Instruct',
    family: 'Llama',
    description:
      'Meta’s smallest instruct model. Fast on almost any phone; good for quick explanations and tutoring.',
    url: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    fileName: 'Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    sizeMB: 808,
    params: '1.2B',
    quant: 'Q4_K_M',
    contextLength: 4096,
    recommended: true,
  },
  {
    id: 'qwen2.5-1.5b-instruct-q4',
    name: 'Qwen2.5 1.5B Instruct',
    family: 'Qwen',
    description:
      'Strong reasoning for its size. A good balance of quality and speed for generating questions.',
    url: 'https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf',
    fileName: 'Qwen2.5-1.5B-Instruct-Q4_K_M.gguf',
    sizeMB: 986,
    params: '1.5B',
    quant: 'Q4_K_M',
    contextLength: 4096,
    recommended: true,
  },
  {
    id: 'gemma-2-2b-it-q4',
    name: 'Gemma 2 2B Instruct',
    family: 'Gemma',
    description:
      'Google’s 2B instruct model. Higher quality answers; needs a phone with more RAM.',
    url: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
    fileName: 'gemma-2-2b-it-Q4_K_M.gguf',
    sizeMB: 1710,
    params: '2.6B',
    quant: 'Q4_K_M',
    contextLength: 4096,
  },
  {
    id: 'llama-3.2-3b-instruct-q4',
    name: 'Llama 3.2 3B Instruct',
    family: 'Llama',
    description:
      'The most capable option here – best explanations and question quality. Best on flagship phones (>=8 GB RAM).',
    url: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    fileName: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    sizeMB: 2020,
    params: '3.2B',
    quant: 'Q4_K_M',
    contextLength: 4096,
  },
  {
    id: 'smollm2-1.7b-instruct-q4',
    name: 'SmolLM2 1.7B Instruct',
    family: 'SmolLM',
    description:
      'Compact and efficient. A lightweight fallback that still handles tutoring well.',
    url: 'https://huggingface.co/bartowski/SmolLM2-1.7B-Instruct-GGUF/resolve/main/SmolLM2-1.7B-Instruct-Q4_K_M.gguf',
    fileName: 'SmolLM2-1.7B-Instruct-Q4_K_M.gguf',
    sizeMB: 1060,
    params: '1.7B',
    quant: 'Q4_K_M',
    contextLength: 4096,
  },
];

export const MODEL_BY_ID: Record<string, LLMModelInfo> = Object.fromEntries(
  AVAILABLE_MODELS.map((m) => [m.id, m])
);

export function humanSize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}
