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

export interface Settings {
  activeModelId: string | null;
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
  addExamResult: (r: ExamResult) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setGenParams: (patch: Partial<GenerationParams>) => void;
  setActiveModel: (id: string | null) => void;
  resetProgress: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  activeModelId: null,
  genParams: { temperature: 0.4, topP: 0.9, maxTokens: 512 },
  nGpuLayers: 0,
  nCtx: 2048,
  useAIForExam: false,
  aiExplanations: true,
  autoLoadModel: false,
};

const EMPTY_PROGRESS: ProgressState = {
  mastery: {},
  sr: {},
  missed: [],
  flagged: [],
  examHistory: [],
  totalAnswered: 0,
  totalCorrect: 0,
  studyStreakDays: 0,
  lastStudyDay: null,
};

function dayString(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
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

          const mastery = { ...s.progress.mastery };
          mastery[q.componentId] = updateComponentMastery(
            mastery[q.componentId],
            q,
            correct,
            now
          );

          const sr = { ...s.progress.sr };
          sr[q.id] = scheduleSR(sr[q.id], q.id, gradeFor(correct), now);

          let missed = s.progress.missed;
          if (correct) {
            missed = missed.filter((id) => id !== q.id);
          } else {
            missed = [q.id, ...missed.filter((id) => id !== q.id)].slice(0, 300);
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
    }
  )
);
