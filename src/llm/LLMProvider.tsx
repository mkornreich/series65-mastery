import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ChatMessage, Component, EngineStatus, LLMModelInfo, Question } from '../types';
import { engine, isLlamaAvailable } from './LlamaEngine';
import { geminiSupported, geminiAvailable, geminiComplete } from './geminiEngine';
import {
  litertSupported,
  litertLoadModel,
  litertUnload,
  litertComplete,
  litertDir,
} from './litertEngine';
import { MODEL_BY_ID } from '../data/models';
import { isDownloaded, modelPath } from './modelManager';
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
function isLocalId(id: string): boolean {
  return id.startsWith(LOCAL_PREFIX);
}
function localFileName(id: string): string {
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
    onToken?: (t: string) => void
  ) => Promise<string>;
  generateQuestions: (
    component: Component,
    count: number,
    avoidStems?: string[]
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
        } catch (e) {
          if (wantGpu) await litertLoadModel(path, false, Math.max(1024, nCtx));
          else throw e;
        }
      } else {
        if (!(await isDownloaded(model))) throw new Error('Model is not downloaded yet.');
        await litertUnload().catch(() => {});
        await engine.load(modelPath(model), (p) => setLoadProgress(p), { nCtx, nGpuLayers });
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
    setStatus(available ? (activeModelId ? 'idle' : 'no-model') : 'unavailable');
  }, [available, activeModelId, releaseAll]);

  useEffect(() => {
    (async () => {
      if (!autoLoadModel || !available || !activeModelId) return;
      const kind = kindOf(activeModelId);
      if (kind === 'aicore') {
        loadModel(activeModelId).catch(() => {});
      } else {
        const model = isLocalId(activeModelId)
          ? localLitertModelInfo(localFileName(activeModelId))
          : MODEL_BY_ID[activeModelId];
        if (model && (model.local || (await isDownloaded(model)))) {
          loadModel(activeModelId).catch(() => {});
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    (messages: ChatMessage[], onToken?: (t: string) => void) =>
      runExclusive(async () => {
        await ensureReady();
        setStatus('generating');
        try {
          let out: string;
          const kind = kindOf(activeModelId);
          if (kind === 'aicore') {
            out = await geminiComplete(messages, genParams.temperature, genParams.maxTokens);
            if (onToken && out) onToken(out);
          } else if (kind === 'litertlm') {
            out = await litertComplete(messages, genParams.temperature, genParams.topP);
            if (onToken && out) onToken(out);
          } else {
            out = await engine.complete(messages, genParams, onToken);
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
      onToken?: (t: string) => void
    ) => runText(buildTutorMessages(topicTitle, history, message), onToken),
    [runText]
  );

  const generateQuestions = useCallback(
    (component: Component, count: number, avoidStems: string[] = []) =>
      runExclusive(async () => {
        await ensureReady();
        setStatus('generating');
        try {
          const examples = bankByComponent(component.id);
          const messages = buildGenerateMessages(component, count, examples, avoidStems);
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
