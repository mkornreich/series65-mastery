import { ChatMessage, GenerationParams } from '../types';

// Lazily require the native module so the JS bundle still loads in environments
// where it isn't present (Expo Go, web preview). On-device inference requires a
// development/production build that includes the llama.rn native code.
let LlamaModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  LlamaModule = require('llama.rn');
} catch {
  LlamaModule = null;
}

export function isLlamaAvailable(): boolean {
  return !!(LlamaModule && typeof LlamaModule.initLlama === 'function');
}

export interface LoadOptions {
  nCtx?: number;
  nGpuLayers?: number;
}

/**
 * Thin wrapper around llama.rn (llama.cpp). Holds a single loaded context and
 * exposes chat-style completion with token streaming.
 */
export class LlamaEngine {
  private context: any = null;
  modelPath: string | null = null;

  get isLoaded(): boolean {
    return !!this.context;
  }

  async load(
    modelPath: string,
    onProgress?: (pct: number) => void,
    opts: LoadOptions = {}
  ): Promise<void> {
    if (!isLlamaAvailable()) {
      throw new Error(
        'On-device LLM is unavailable in this build. Create a development build (not Expo Go) to enable it.'
      );
    }
    await this.unload();
    this.context = await LlamaModule.initLlama(
      {
        model: modelPath,
        n_ctx: opts.nCtx ?? 2048,
        // CPU by default for broad device compatibility. Raise to offload
        // layers to the GPU on capable devices (Settings can expose this).
        n_gpu_layers: opts.nGpuLayers ?? 0,
        use_mlock: false,
      },
      (p: number) => onProgress && onProgress(Math.round(p))
    );
    this.modelPath = modelPath;
  }

  async unload(): Promise<void> {
    if (this.context) {
      try {
        await this.context.release();
      } catch {
        /* ignore */
      }
      this.context = null;
      this.modelPath = null;
    }
  }

  async stop(): Promise<void> {
    if (this.context) {
      try {
        await this.context.stopCompletion();
      } catch {
        /* ignore */
      }
    }
  }

  // Prefer the non-empty of the two result fields. `text` is the raw output;
  // `content` is the reasoning/tool-filtered view. On a plain instruct model
  // they match, but if one is blank we still surface the other.
  private extractText(res: any): string {
    const text = res?.text != null ? String(res.text).trim() : '';
    if (text) return text;
    const content = res?.content != null ? String(res.content).trim() : '';
    return content;
  }

  // A small model that hits the token cap (no natural end-of-sequence) leaves a
  // dangling half-sentence. Trim back to the last completed sentence / list
  // item so the answer never ends mid-thought. Conservative: if the text
  // already ends cleanly, or trimming would gut it, leave it as-is.
  private trimToSentence(text: string): string {
    const t = text.trimEnd();
    if (!t) return t;
    // Already ends on terminal punctuation or a closing quote/bracket.
    if (/[.!?:”’")\]]$/.test(t)) return t;
    // Cut to the last sentence-ending punctuation followed by a space/newline.
    const m = t.match(/^[\s\S]*[.!?](?=[\s"'”’)\]]|$)/);
    if (m && m[0].trim().length >= 40) return m[0].trimEnd();
    // Otherwise drop just the trailing (incomplete) line.
    const nl = t.lastIndexOf('\n');
    if (nl >= 40) return t.slice(0, nl).trimEnd();
    return t;
  }

  async complete(
    messages: ChatMessage[],
    params: GenerationParams,
    onToken?: (t: string) => void
  ): Promise<string> {
    if (!this.context) throw new Error('No model is loaded.');

    // A tiny instruct model (e.g. SmolLM2-360M) will sometimes sample its
    // end-of-turn token FIRST — emitting zero content tokens and returning an
    // empty string — especially on prompts whose grounding block primes a
    // terse/refusing answer. Detect that (nothing streamed AND empty result)
    // and escalate: reseed hotter, then, as a hard guarantee, forbid the
    // end-of-generation tokens so real content MUST be produced.
    const base: Record<string, any> = {
      messages,
      jinja: true,
      n_predict: params.maxTokens,
      temperature: params.temperature,
      top_p: params.topP,
      // A tiny model degenerates into verbatim loops ("… contribute to a UTMA
      // account." repeated) and never reaches a natural stop. A mild repeat
      // penalty breaks those loops so it concludes on its own.
      penalty_repeat: 1.15,
    };
    const hot = Math.max(0.7, params.temperature);
    const attempts: Record<string, any>[] = [
      base,
      // Retry 1: reprocess with a fresh seed and a flatter distribution so the
      // end-of-turn token is far less likely to win the first position.
      { ...base, seed: Date.now() & 0x7fffffff, temperature: hot, top_p: 0.95 },
      // Retry 2 (guarantee): forbid EOS/EOG outright so at least some content
      // is emitted. Cap length so a rambly tail stays bounded.
      {
        ...base,
        ignore_eos: true,
        temperature: hot,
        top_p: 0.95,
        n_predict: Math.min(320, params.maxTokens),
      },
    ];

    let last = '';
    for (let i = 0; i < attempts.length; i++) {
      // Only clear the KV cache on retries — the first attempt keeps the normal
      // prefix-cache fast path (and leaves the working case byte-for-byte
      // unchanged). Clearing before a retry guarantees the prompt is genuinely
      // re-evaluated rather than reusing the state that just produced nothing.
      if (i > 0) {
        try {
          await this.context.clearCache(false);
        } catch {
          /* ignore — older native builds may lack clearCache */
        }
      }
      let acc = '';
      const res = await this.context.completion(attempts[i], (data: any) => {
        if (data?.token) {
          acc += data.token;
          if (onToken) onToken(data.token);
        }
      });
      let text = this.extractText(res) || acc.trim();
      if (text) {
        // If the model hit the token cap instead of ending naturally, the tail
        // is a half-finished sentence — trim it back to a clean stopping point.
        if (res && res.stopped_eos === false) text = this.trimToSentence(text);
        return text;
      }
      last = text;
    }
    return last;
  }

  async completeJson(
    messages: ChatMessage[],
    params: GenerationParams,
    onToken?: (t: string) => void
  ): Promise<string> {
    if (!this.context) throw new Error('No model is loaded.');
    const res = await this.context.completion(
      {
        messages,
        jinja: true,
        response_format: { type: 'json_object' },
        n_predict: params.maxTokens,
        temperature: params.temperature,
        top_p: params.topP,
      },
      (data: any) => {
        if (onToken && data?.token) onToken(data.token);
      }
    );
    return this.extractText(res);
  }
}

// A single shared engine instance for the whole app.
export const engine = new LlamaEngine();
