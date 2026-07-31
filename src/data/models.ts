import { LLMModelInfo } from '../types';

// Curated list of small, mobile-friendly instruction-tuned LLMs in GGUF format.
// They run fully on-device via llama.rn (llama.cpp). Files are hosted on
// Hugging Face; the app downloads the one the user picks in Settings.
//
// Choose a model that fits the phone's RAM. Rough guidance:
//   ~1 GB models  -> most modern phones (>=4 GB RAM)
//   ~2 GB models  -> phones with >=6-8 GB RAM
// Quantization Q4_K_M balances size and quality.

export const AVAILABLE_MODELS: LLMModelInfo[] = [
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
