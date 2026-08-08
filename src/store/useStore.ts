import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ComponentMastery,
  ExamResult,
  GenerationParams,
  Question,
  SRItem,
} from '../types';
import { updateComponentMastery, scheduleSR, gradeFor } from '../mastery/engine';

export type ThemeMode = 'system' | 'dark' | 'light';

export interface Settings {
  activeModelId: string | null;
  themeMode: ThemeMode;
  genParams: GenerationParams;
  nGpuLayers: number;
  nCtx: number;
  /** Use the on-device LLM to generate fresh exam questions instead of the bank. */
  useAIForExam: boolean;
  /** Offer AI explanations after answering. */
  aiExplanations: boolean;
  /** Load the active model automatically on app launch. */
  autoLoadModel: boolean;
}

export interface ProgressState {
  mastery: Record<string, ComponentMastery>;
  sr: Record<string, SRItem>;
  missed: string[];
  flagged: string[];
  /** Watch-tab video ids the user has marked as watched. */
  watchedVideos: string[];
  /** Flashcard ids the user has starred for review. */
  starredCards: string[];
  examHistory: ExamResult[];
  totalAnswered: number;
  totalCorrect: number;
  studyStreakDays: number;
  lastStudyDay: string | null;
}

interface StoreState {
  settings: Settings;
  progress: ProgressState;
  // actions
  recordAnswer: (q: Question, chosenIndex: number) => void;
  toggleFlag: (qid: string) => void;
  toggleWatchedVideo: (id: string) => void;
  toggleStarredCard: (id: string) => void;
  addExamResult: (r: ExamResult) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setGenParams: (patch: Partial<GenerationParams>) => void;
  setActiveModel: (id: string | null) => void;
  resetProgress: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  activeModelId: null,
  themeMode: 'system',
  genParams: { temperature: 0.4, topP: 0.9, maxTokens: 512 },
  nGpuLayers: 0,
  nCtx: 2048,
  useAIForExam: false,
  aiExplanations: true,
  // Warm the on-device model (on the GPU when supported) as soon as the app
  // opens, so the first tutor/generation has no load latency.
  autoLoadModel: true,
};

const EMPTY_PROGRESS: ProgressState = {
  mastery: {},
  sr: {},
  missed: [],
  flagged: [],
  watchedVideos: [],
  starredCards: [],
  examHistory: [],
  totalAnswered: 0,
  totalCorrect: 0,
  studyStreakDays: 0,
  lastStudyDay: null,
};

function dayString(ms: number): string {
  // Local calendar day (not UTC) so the streak rolls over at the user's own
  // midnight rather than at UTC midnight.
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      progress: EMPTY_PROGRESS,

      recordAnswer: (q, chosenIndex) =>
        set((s) => {
          const now = Date.now();
          const correct = chosenIndex === q.answerIndex;
          // AI-generated questions DO count toward per-component mastery, streak,
          // and totals — but NOT the spaced-repetition scheduler or the missed
          // queue, which are keyed by bank ids that an ai-<…> id can never resolve
          // (that would leave dead entries the review screen can't open).
          const isAi = q.source === 'ai';

          const mastery = { ...s.progress.mastery };
          mastery[q.componentId] = updateComponentMastery(
            mastery[q.componentId],
            q,
            correct,
            now
          );

          let sr = s.progress.sr;
          let missed = s.progress.missed;
          if (!isAi) {
            sr = { ...s.progress.sr };
            sr[q.id] = scheduleSR(sr[q.id], q.id, gradeFor(correct), now);
            missed = correct
              ? missed.filter((id) => id !== q.id)
              : [q.id, ...missed.filter((id) => id !== q.id)].slice(0, 300);
          }

          const day = dayString(now);
          let { studyStreakDays, lastStudyDay } = s.progress;
          if (lastStudyDay !== day) {
            const yesterday = dayString(now - 86400000);
            studyStreakDays = lastStudyDay === yesterday ? studyStreakDays + 1 : 1;
            lastStudyDay = day;
          }

          return {
            progress: {
              ...s.progress,
              mastery,
              sr,
              missed,
              totalAnswered: s.progress.totalAnswered + 1,
              totalCorrect: s.progress.totalCorrect + (correct ? 1 : 0),
              studyStreakDays,
              lastStudyDay,
            },
          };
        }),

      toggleFlag: (qid) =>
        set((s) => {
          const has = s.progress.flagged.includes(qid);
          const flagged = has
            ? s.progress.flagged.filter((id) => id !== qid)
            : [qid, ...s.progress.flagged];
          return { progress: { ...s.progress, flagged } };
        }),

      toggleWatchedVideo: (id) =>
        set((s) => {
          // `?? []` guards installs whose persisted progress predates this field.
          const cur = s.progress.watchedVideos ?? [];
          const has = cur.includes(id);
          const watchedVideos = has ? cur.filter((x) => x !== id) : [id, ...cur];
          return { progress: { ...s.progress, watchedVideos } };
        }),

      toggleStarredCard: (id) =>
        set((s) => {
          const cur = s.progress.starredCards ?? [];
          const has = cur.includes(id);
          const starredCards = has ? cur.filter((x) => x !== id) : [id, ...cur];
          return { progress: { ...s.progress, starredCards } };
        }),

      addExamResult: (r) =>
        set((s) => ({
          progress: {
            ...s.progress,
            examHistory: [r, ...s.progress.examHistory].slice(0, 25),
          },
        })),

      setSetting: (key, value) =>
        set((s) => ({ settings: { ...s.settings, [key]: value } })),

      setGenParams: (patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            genParams: { ...s.settings.genParams, ...patch },
          },
        })),

      setActiveModel: (id) =>
        set((s) => ({ settings: { ...s.settings, activeModelId: id } })),

      resetProgress: () => set({ progress: EMPTY_PROGRESS }),
    }),
    {
      name: 'series65-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ settings: s.settings, progress: s.progress }),
      version: 2,
      // v1: default to loading the model (on the GPU) at launch. Flip existing
      // installs on once; users who later turn it off keep that choice.
      // (v2 briefly added an "open videos in NewPipe" setting, since removed —
      // videos now always try NewPipe → YouTube → browser.)
      migrate: (persisted: any, version: number) => {
        if (version < 1 && persisted?.settings) {
          persisted.settings.autoLoadModel = true;
        }
        return persisted;
      },
    }
  )
);
