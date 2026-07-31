import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ChatMessage,
  Component,
  EngineStatus,
  Question,
} from '../types';
import { engine, isLlamaAvailable } from './LlamaEngine';
import { geminiSupported, geminiAvailable, geminiComplete } from './geminiEngine';
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

type EngineKind = 'gguf' | 'aicore';

interface LLMContextValue {
  available: boolean;
  status: EngineStatus;
  activeModelId: string | null;
  activeKind: EngineKind | null;
  loadProgress: number; // 0..100 (gguf load only)
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
  generateQuestions: (component: Component, count: number) => Promise<Question[]>;
  stop: () => Promise<void>;
}

const LLMContext = createContext<LLMContextValue | null>(null);

function kindOf(id: string | null): EngineKind | null {
  if (!id) return null;
  return (MODEL_BY_ID[id]?.kind as EngineKind) ?? 'gguf';
}

export function LLMProvider({ children }: { children: React.ReactNode }) {
  const available = isLlamaAvailable() || geminiSupported();
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

  useEffect(() => {
    if (!available) return;
    if (!loadedModelId) setStatus(activeModelId ? 'idle' : 'no-model');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModelId, available]);

  const loadModel = useCallback(
    async (id: string) => {
      if (!available) {
        setError('On-device AI is unavailable in this build.');
        setStatus('unavailable');
        return;
      }
      const model = MODEL_BY_ID[id];
      if (!model) throw new Error('Unknown model.');
      if (busy.current) return;
      busy.current = true;
      setError(null);
      setStatus('loading');
      setLoadProgress(0);
      try {
        if ((model.kind ?? 'gguf') === 'aicore') {
          if (!geminiSupported()) throw new Error('Gemini Nano is not in this build.');
          const ok = await geminiAvailable();
          if (!ok)
            throw new Error(
              'Gemini Nano isn’t available on this device (needs AICore / a supported Pixel).'
            );
          setLoadedModelId(id);
          setStatus('ready');
        } else {
          if (!(await isDownloaded(model))) throw new Error('Model is not downloaded yet.');
          await engine.load(modelPath(model), (p) => setLoadProgress(p), { nCtx, nGpuLayers });
          setLoadedModelId(id);
          setStatus('ready');
        }
      } catch (e: any) {
        setError(e?.message ?? String(e));
        setStatus('error');
      } finally {
        busy.current = false;
      }
    },
    [available, nCtx, nGpuLayers]
  );

  const unload = useCallback(async () => {
    await engine.unload();
    setLoadedModelId(null);
    setStatus(available ? (activeModelId ? 'idle' : 'no-model') : 'unavailable');
  }, [available, activeModelId]);

  useEffect(() => {
    (async () => {
      if (!autoLoadModel || !available || !activeModelId) return;
      const model = MODEL_BY_ID[activeModelId];
      if (!model) return;
      if ((model.kind ?? 'gguf') === 'aicore') {
        loadModel(activeModelId).catch(() => {});
      } else if (!engine.isLoaded && (await isDownloaded(model))) {
        loadModel(activeModelId).catch(() => {});
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureReady = useCallback(async () => {
    if (!available)
      throw new Error('On-device AI is unavailable in this build. Create a development build.');
    if (!activeModelId) throw new Error('No model selected. Choose one in Settings.');
    const kind = kindOf(activeModelId);
    if (kind === 'aicore') {
      if (loadedModelId === activeModelId) return;
      if (!geminiSupported()) throw new Error('Gemini Nano is not in this build.');
      const ok = await geminiAvailable();
      if (!ok) throw new Error('Gemini Nano isn’t available on this device.');
      setLoadedModelId(activeModelId);
      return;
    }
    if (engine.isLoaded) return;
    await loadModel(activeModelId);
    if (!engine.isLoaded) throw new Error(error || 'Model failed to load.');
  }, [available, activeModelId, loadedModelId, loadModel, error]);

  const runText = useCallback(
    async (messages: ChatMessage[], onToken?: (t: string) => void) => {
      await ensureReady();
      setStatus('generating');
      try {
        let out: string;
        if (kindOf(activeModelId) === 'aicore') {
          out = await geminiComplete(messages, genParams.temperature, genParams.maxTokens);
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
    },
    [ensureReady, genParams, activeModelId]
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
    async (component: Component, count: number) => {
      await ensureReady();
      setStatus('generating');
      try {
        const examples = bankByComponent(component.id);
        const messages = buildGenerateMessages(component, count, examples);
        const maxTokens = Math.max(768, count * 240);
        let text: string;
        if (kindOf(activeModelId) === 'aicore') {
          text = await geminiComplete(messages, genParams.temperature, maxTokens);
        } else {
          text = await engine.completeJson(messages, { ...genParams, maxTokens });
        }
        setStatus('ready');
        return parseGeneratedQuestions(text, component);
      } catch (e: any) {
        setStatus('ready');
        throw e;
      }
    },
    [ensureReady, genParams, activeModelId]
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
