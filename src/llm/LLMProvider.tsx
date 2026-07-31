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

interface LLMContextValue {
  available: boolean;
  status: EngineStatus;
  activeModelId: string | null;
  loadProgress: number; // 0..100
  error: string | null;
  loadedModelId: string | null;
  loadModel: (id: string) => Promise<void>;
  unload: () => Promise<void>;
  ensureReady: () => Promise<void>;
  explain: (
    q: Question,
    chosenIndex: number,
    onToken?: (t: string) => void
  ) => Promise<string>;
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

export function LLMProvider({ children }: { children: React.ReactNode }) {
  const available = isLlamaAvailable();
  const activeModelId = useStore((s) => s.settings.activeModelId);
  const genParams = useStore((s) => s.settings.genParams);
  const nCtx = useStore((s) => s.settings.nCtx);
  const nGpuLayers = useStore((s) => s.settings.nGpuLayers);
  const autoLoadModel = useStore((s) => s.settings.autoLoadModel);

  const [status, setStatus] = useState<EngineStatus>(
    available ? (activeModelId ? 'idle' : 'no-model') : 'unavailable'
  );
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadedModelId, setLoadedModelId] = useState<string | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    if (!available) return;
    if (!loadedModelId) {
      setStatus(activeModelId ? 'idle' : 'no-model');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModelId, available]);

  const loadModel = useCallback(
    async (id: string) => {
      if (!available) {
        setError(
          'On-device LLM is unavailable in this build. Use a development build.'
        );
        setStatus('unavailable');
        return;
      }
      const model = MODEL_BY_ID[id];
      if (!model) throw new Error('Unknown model.');
      if (!(await isDownloaded(model))) {
        throw new Error('Model is not downloaded yet.');
      }
      if (busy.current) return;
      busy.current = true;
      setError(null);
      setStatus('loading');
      setLoadProgress(0);
      try {
        await engine.load(modelPath(model), (p) => setLoadProgress(p), {
          nCtx,
          nGpuLayers,
        });
        setLoadedModelId(id);
        setStatus('ready');
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

  // Optional auto-load on launch.
  useEffect(() => {
    (async () => {
      if (autoLoadModel && available && activeModelId && !engine.isLoaded) {
        const model = MODEL_BY_ID[activeModelId];
        if (model && (await isDownloaded(model))) {
          loadModel(activeModelId).catch(() => {});
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureReady = useCallback(async () => {
    if (!available)
      throw new Error(
        'On-device AI is unavailable in this build. Create a development build to enable it.'
      );
    if (engine.isLoaded) return;
    if (!activeModelId)
      throw new Error('No model selected. Choose one in Settings.');
    await loadModel(activeModelId);
    if (!engine.isLoaded) throw new Error(error || 'Model failed to load.');
  }, [available, activeModelId, loadModel, error]);

  const runText = useCallback(
    async (messages: ChatMessage[], onToken?: (t: string) => void) => {
      await ensureReady();
      setStatus('generating');
      try {
        const out = await engine.complete(messages, genParams, onToken);
        setStatus('ready');
        return out;
      } catch (e: any) {
        setStatus('ready');
        throw e;
      }
    },
    [ensureReady, genParams]
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
        const text = await engine.completeJson(messages, {
          ...genParams,
          maxTokens: Math.max(768, count * 240),
        });
        setStatus('ready');
        return parseGeneratedQuestions(text, component);
      } catch (e: any) {
        setStatus('ready');
        throw e;
      }
    },
    [ensureReady, genParams]
  );

  const stop = useCallback(async () => {
    await engine.stop();
  }, []);

  const value = useMemo<LLMContextValue>(
    () => ({
      available,
      status,
      activeModelId,
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
