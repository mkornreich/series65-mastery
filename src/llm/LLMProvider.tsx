import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ChatMessage, Component, EngineStatus, GenerationParams, LLMModelInfo, Question } from '../types';
import { engine, isLlamaAvailable } from './LlamaEngine';
import { geminiSupported, geminiAvailable, geminiComplete } from './geminiEngine';
import {
  litertSupported,
  litertLoadModel,
  litertUnload,
  litertComplete,
  litertDir,
} from './litertEngine';
import { AVAILABLE_MODELS, MODEL_BY_ID } from '../data/models';
import { isDownloaded, modelPath, preloadBundledModel } from './modelManager';
import {
  buildExplainMessages,
  buildTutorMessages,
  buildGenerateMessages,
  parseGeneratedQuestions,
} from './prompts';
import { bankByComponent } from '../mastery/selection';
import { useStore } from '../store/useStore';

type EngineKind = 'gguf' | 'aicore' | 'litertlm';

const LOCAL_PREFIX = 'local:';
export function localLitertId(fileName: string): string {
  return LOCAL_PREFIX + fileName;
}
export function isLocalId(id: string): boolean {
  return id.startsWith(LOCAL_PREFIX);
}
export function localFileName(id: string): string {
  return id.slice(LOCAL_PREFIX.length);
}

/** Build a synthetic model-info for an on-device (imported) .litertlm file. */
export function localLitertModelInfo(fileName: string): LLMModelInfo {
  return {
    id: localLitertId(fileName),
    name: fileName.replace('.litertlm', '').replace(/[-_]+/g, ' '),
    family: 'LiteRT-LM',
    description: 'On-device LiteRT-LM model (imported). Runs on the GPU.',
    url: '',
    fileName,
    sizeMB: 0,
    params: '',
    quant: '',
    contextLength: 4096,
    kind: 'litertlm',
    backend: 'gpu',
    local: true,
  };
}

function kindOf(id: string | null): EngineKind | null {
  if (!id) return null;
  if (isLocalId(id)) return 'litertlm';
  return (MODEL_BY_ID[id]?.kind as EngineKind) ?? 'gguf';
}

interface LLMContextValue {
  available: boolean;
  status: EngineStatus;
  activeModelId: string | null;
  activeKind: EngineKind | null;
  /** Which processor the currently-loaded model actually runs on. */
  activeBackend: 'gpu' | 'cpu' | null;
  loadProgress: number;
  error: string | null;
  loadedModelId: string | null;
  loadModel: (id: string) => Promise<void>;
  unload: () => Promise<void>;
  ensureReady: () => Promise<void>;
  explain: (q: Question, chosenIndex: number, onToken?: (t: string) => void) => Promise<string>;
  tutor: (
    topicTitle: string | undefined,
    history: ChatMessage[],
    message: string,
    onToken?: (t: string) => void,
    context?: string
  ) => Promise<string>;
  generateQuestions: (
    component: Component,
    count: number,
    avoidStems?: string[],
    focus?: string
  ) => Promise<Question[]>;
  stop: () => Promise<void>;
}

const LLMContext = createContext<LLMContextValue | null>(null);

export function LLMProvider({ children }: { children: React.ReactNode }) {
  const available =
    isLlamaAvailable() || geminiSupported() || litertSupported();
  const activeModelId = useStore((s) => s.settings.activeModelId);
  const genParams = useStore((s) => s.settings.genParams);
  const nCtx = useStore((s) => s.settings.nCtx);
  const nGpuLayers = useStore((s) => s.settings.nGpuLayers);
  const autoLoadModel = useStore((s) => s.settings.autoLoadModel);

  const activeKind = kindOf(activeModelId);

  const [status, setStatus] = useState<EngineStatus>(
    available ? (activeModelId ? 'idle' : 'no-model') : 'unavailable'
  );
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadedModelId, setLoadedModelId] = useState<string | null>(null);
  const [activeBackend, setActiveBackend] = useState<'gpu' | 'cpu' | null>(null);
  const busy = useRef(false);
  // The in-flight model-load promise, so a call that lands mid-load can await it
  // instead of failing with "already loading".
  const loadPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (!available) return;
    if (!loadedModelId) setStatus(activeModelId ? 'idle' : 'no-model');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModelId, available]);

  const loadedRef = useRef<string | null>(null);

  const releaseAll = useCallback(async () => {
    try {
      await engine.unload();
    } catch {
      /* ignore */
    }
    try {
      await litertUnload();
    } catch {
      /* ignore */
    }
  }, []);

  // Core loader: throws on failure; updates loadedRef + state on success.
  const doLoad = useCallback(
    async (id: string) => {
      const model = isLocalId(id) ? localLitertModelInfo(localFileName(id)) : MODEL_BY_ID[id];
      if (!model) throw new Error('Unknown model.');
      const kind = kindOf(id);
      if (kind === 'aicore') {
        if (!geminiSupported()) throw new Error('Gemini Nano is not in this build.');
        const ok = await geminiAvailable();
        if (!ok) throw new Error('Gemini Nano isn’t available on this device.');
        await releaseAll();
      } else if (kind === 'litertlm') {
        if (!litertSupported()) throw new Error('LiteRT-LM is not in this build.');
        let path: string;
        if (model.local) {
          const dir = litertDir();
          if (!dir) throw new Error('LiteRT-LM models directory is unavailable.');
          path = `${dir}/${model.fileName}`;
        } else {
          if (!(await isDownloaded(model))) throw new Error('Model is not downloaded yet.');
          path = modelPath(model);
        }
        await releaseAll();
        const wantGpu = model.backend !== 'cpu';
        try {
          await litertLoadModel(path, wantGpu, Math.max(1024, nCtx));
          setActiveBackend(wantGpu ? 'gpu' : 'cpu');
        } catch (e) {
          if (wantGpu) {
            await litertLoadModel(path, false, Math.max(1024, nCtx));
            setActiveBackend('cpu'); // GPU load failed; running on CPU fallback
          } else throw e;
        }
      } else {
        if (!(await isDownloaded(model))) throw new Error('Model is not downloaded yet.');
        await litertUnload().catch(() => {});
        await engine.load(modelPath(model), (p) => setLoadProgress(p), { nCtx, nGpuLayers });
        setActiveBackend(nGpuLayers > 0 ? 'gpu' : 'cpu');
      }
      loadedRef.current = id;
      setLoadedModelId(id);
    },
    [nCtx, nGpuLayers, releaseAll]
  );

  const loadModel = useCallback(
    async (id: string) => {
      if (!available) {
        setError('On-device AI is unavailable in this build.');
        setStatus('unavailable');
        return;
      }
      if (busy.current) return;
      busy.current = true;
      setError(null);
      setStatus('loading');
      setLoadProgress(0);
      const p = doLoad(id);
      loadPromiseRef.current = p;
      try {
        await p;
        setStatus('ready');
      } catch (e: any) {
        setError(e?.message ?? String(e));
        setStatus('error');
      } finally {
        busy.current = false;
        loadPromiseRef.current = null;
      }
    },
    [available, doLoad]
  );

  const unload = useCallback(async () => {
    await releaseAll();
    loadedRef.current = null;
    setLoadedModelId(null);
    setActiveBackend(null);
    setStatus(available ? (activeModelId ? 'idle' : 'no-model') : 'unavailable');
  }, [available, activeModelId, releaseAll]);

  // Preload any model that ships bundled inside the APK, copying it out of
  // assets into the models dir on first launch so it's ready with no download.
  // Runs once; each copy is a no-op if the model is already present.
  const preloadedRef = useRef(false);
  useEffect(() => {
    if (preloadedRef.current || !available) return;
    preloadedRef.current = true;
    (async () => {
      for (const m of AVAILABLE_MODELS) {
        if (m.bundled) await preloadBundledModel(m).catch(() => {});
      }
    })();
  }, [available]);

  // Auto-load the active model on startup. Settings are persisted via zustand +
  // AsyncStorage, which rehydrates ASYNCHRONOUSLY — so on the first render the
  // values are still the defaults (activeModelId=null). Depend on the hydrated
  // values (not `[]`) and guard with a ref so it runs exactly once, after the
  // real settings land. An empty-deps effect would only ever see the defaults.
  const autoLoadedRef = useRef(false);
  useEffect(() => {
    if (autoLoadedRef.current) return;
    (async () => {
      if (!autoLoadModel || !available || !activeModelId) return;
      const model = isLocalId(activeModelId)
        ? localLitertModelInfo(localFileName(activeModelId))
        : MODEL_BY_ID[activeModelId];
      // If the active model is bundled, make sure it's been copied out of the
      // APK before we try to load it (first launch may race the preload above).
      if (model?.bundled && !(await isDownloaded(model))) {
        await preloadBundledModel(model).catch(() => {});
      }
      const kind = kindOf(activeModelId);
      let canLoad = kind === 'aicore';
      if (!canLoad) {
        canLoad = !!model && (model.local || (await isDownloaded(model)));
      }
      if (canLoad && !autoLoadedRef.current) {
        autoLoadedRef.current = true;
        loadModel(activeModelId).catch(() => {});
      }
    })();
  }, [autoLoadModel, available, activeModelId, loadModel]);

  const ensureReady = useCallback(async () => {
    if (!available)
      throw new Error('On-device AI is unavailable in this build. Create a development build.');
    if (!activeModelId) throw new Error('No model selected. Choose one in Settings.');
    if (loadedRef.current === activeModelId) return;
    // A load is already in flight (e.g. auto-load on startup): wait for it rather
    // than failing, then use it if it produced the model we need.
    if (busy.current && loadPromiseRef.current) {
      await loadPromiseRef.current.catch(() => {});
      if (loadedRef.current === activeModelId) return;
    }
    if (busy.current) throw new Error('A model is already loading. Try again in a moment.');
    busy.current = true;
    setStatus('loading');
    const p = doLoad(activeModelId);
    loadPromiseRef.current = p;
    try {
      await p;
      setStatus('ready');
    } catch (e) {
      setStatus('error');
      throw e;
    } finally {
      busy.current = false;
      loadPromiseRef.current = null;
    }
  }, [available, activeModelId, doLoad]);

  // Serialize all model calls. The on-device engine handles one request at a
  // time, so background question prefetch must not collide with an explanation
  // or tutor turn — later callers queue behind the in-flight one.
  const llmLock = useRef<Promise<unknown>>(Promise.resolve());
  const runExclusive = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    const run = llmLock.current.then(fn, fn);
    llmLock.current = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }, []);

  const runText = useCallback(
    (
      messages: ChatMessage[],
      onToken?: (t: string) => void,
      maxTokens?: number,
      sampling?: Partial<GenerationParams>
    ) =>
      runExclusive(async () => {
        await ensureReady();
        setStatus('generating');
        try {
          let out: string;
          const kind = kindOf(activeModelId);
          // Optional per-call token budget (the tutor needs more room than the
          // 512-token default) and an optional per-call sampling override (the
          // tutor uses a sharper, tail-truncating profile). Neither mutates the
          // user's persisted genParams — they are merged into a fresh object.
          const gp = { ...genParams, ...(maxTokens ? { maxTokens } : {}), ...(sampling || {}) };
          if (kind === 'aicore') {
            out = await geminiComplete(messages, gp.temperature, gp.maxTokens);
            if (onToken && out) onToken(out);
          } else if (kind === 'litertlm') {
            out = await litertComplete(messages, gp.temperature, gp.topP);
            if (onToken && out) onToken(out);
          } else {
            out = await engine.complete(messages, gp, onToken);
          }
          setStatus('ready');
          return out;
        } catch (e: any) {
          setStatus('ready');
          throw e;
        }
      }),
    [ensureReady, genParams, activeModelId, runExclusive]
  );

  const explain = useCallback(
    (q: Question, chosenIndex: number, onToken?: (t: string) => void) =>
      runText(buildExplainMessages(q, chosenIndex), onToken),
    [runText]
  );

  const tutor = useCallback(
    (
      topicTitle: string | undefined,
      history: ChatMessage[],
      message: string,
      onToken?: (t: string) => void,
      context?: string
    ) => {
      // Tutor answers were being cut off mid-sentence at the 512-token default.
      // Give them room to finish, but reserve enough of the context window for
      // the prompt (system + ~600-token RAG excerpts + up to 8 history turns)
      // so prompt + answer still fit and llama.cpp doesn't have to shift context.
      const budget = Math.max(512, Math.min(896, nCtx - 1152));
      // Tutor-only sampling: keep the working temperature (a near-greedy 0.25
      // made the 360M deterministically repeat its own previous turn), but add
      // tail-truncating top_k/min_p to prune the low-probability invented-fact
      // tokens. Passed as a per-call override so the persisted genParams (and
      // every other path) are intact.
      return runText(
        buildTutorMessages(topicTitle, history, message, context),
        onToken,
        budget,
        { temperature: 0.4, topP: 0.9, topK: 40, minP: 0.08 }
      );
    },
    [runText, nCtx]
  );

  const generateQuestions = useCallback(
    (component: Component, count: number, avoidStems: string[] = [], focus?: string) =>
      runExclusive(async () => {
        await ensureReady();
        setStatus('generating');
        try {
          const examples = bankByComponent(component.id);
          const messages = buildGenerateMessages(component, count, examples, avoidStems, focus);
          const maxTokens = Math.max(768, count * 240);
          const kind = kindOf(activeModelId);
          let text: string;
          if (kind === 'aicore') {
            text = await geminiComplete(messages, genParams.temperature, maxTokens);
          } else if (kind === 'litertlm') {
            text = await litertComplete(messages, genParams.temperature, genParams.topP);
          } else {
            text = await engine.completeJson(messages, { ...genParams, maxTokens });
          }
          setStatus('ready');
          return parseGeneratedQuestions(text, component);
        } catch (e: any) {
          setStatus('ready');
          throw e;
        }
      }),
    [ensureReady, genParams, activeModelId, runExclusive]
  );

  const stop = useCallback(async () => {
    await engine.stop();
  }, []);

  const value = useMemo<LLMContextValue>(
    () => ({
      available,
      status,
      activeModelId,
      activeKind,
      activeBackend,
      loadProgress,
      error,
      loadedModelId,
      loadModel,
      unload,
      ensureReady,
      explain,
      tutor,
      generateQuestions,
      stop,
    }),
    [
      available,
      status,
      activeModelId,
      activeKind,
      activeBackend,
      loadProgress,
      error,
      loadedModelId,
      loadModel,
      unload,
      ensureReady,
      explain,
      tutor,
      generateQuestions,
      stop,
    ]
  );

  return <LLMContext.Provider value={value}>{children}</LLMContext.Provider>;
}

export function useLLM(): LLMContextValue {
  const ctx = useContext(LLMContext);
  if (!ctx) throw new Error('useLLM must be used within an LLMProvider');
  return ctx;
}
