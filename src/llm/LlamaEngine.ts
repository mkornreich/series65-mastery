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

  private extractText(res: any): string {
    return String(res?.text ?? res?.content ?? '').trim();
  }

  async complete(
    messages: ChatMessage[],
    params: GenerationParams,
    onToken?: (t: string) => void
  ): Promise<string> {
    if (!this.context) throw new Error('No model is loaded.');
    const res = await this.context.completion(
      {
        messages,
        jinja: true,
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
