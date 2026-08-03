// Shared domain types for the Series 65 Mastery app.

export type Difficulty = 'easy' | 'medium' | 'hard';

export type SubjectId = 'econ' | 'vehicles' | 'recommendations' | 'laws';

/** A Series 65 math/formula topic. Mastery flows to its home component (section). */
export interface MathTopic {
  id: string;
  title: string;
  homeComponentId: string;
  subjectId: string;
  formulaLatex: string;
  summary: string;
  variables: string[];
  whenToUse: string;
  workedExample: string;
  pitfall: string;
}

export interface Component {
  id: string;
  number: number;
  title: string;
  subjectId: SubjectId;
  /** Number of bank questions authored for this component. */
  questionTarget: number;
  subtopics: string[];
}

export interface Subject {
  id: SubjectId;
  code: number;
  title: string;
  /** Blueprint weighting, e.g. 15 for 15%. */
  weightPct: number;
  /** Scored questions this subject contributes to a real 130-question exam. */
  scoredQuestions: number;
  components: Component[];
}

export interface ExamSpec {
  totalQuestions: number; // 140
  scoredQuestions: number; // 130
  pretestQuestions: number; // 10
  passingCorrect: number; // 92
  timeLimitMinutes: number; // 180
  passPercent: number; // ~70.8
  source: string;
}

export interface Question {
  id: string;
  subjectId: SubjectId;
  componentId: string;
  subtopic: string;
  stem: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  difficulty: Difficulty;
  /** Where the question came from. */
  source?: 'bank' | 'ai';
}

export interface Notes {
  summary: string;
  keyPoints: string[];
  formulas?: string[];
  mnemonics?: string[];
  pitfalls?: string[];
}

// ---- Progress / mastery ----

/** SuperMemo-2 spaced-repetition state for a single question. */
export interface SRItem {
  qid: string;
  reps: number; // consecutive successful recalls
  interval: number; // days until next review
  ef: number; // easiness factor (>= 1.3)
  due: number; // epoch ms of next review
  lapses: number;
  seen: number;
  correct: number;
  lastReviewed: number;
}

export interface ComponentMastery {
  componentId: string;
  attempts: number;
  correct: number;
  /** Recency-weighted accuracy in [0,1]. */
  ewma: number;
  streak: number;
  coveredSubtopics: string[];
  lastPracticed?: number;
}

export type MasteryLevel =
  | 'not_started'
  | 'beginning'
  | 'developing'
  | 'proficient'
  | 'mastered';

export interface ExamSectionScore {
  subjectId: SubjectId;
  title: string;
  correct: number;
  total: number;
}

export interface ExamResult {
  id: string;
  date: number;
  scoredCorrect: number;
  scoredTotal: number; // 130
  passed: boolean;
  passingCorrect: number; // 92
  durationSec: number;
  sections: ExamSectionScore[];
  /** qid -> selected choice index (or -1 if unanswered). */
  answers: Record<string, number>;
  /** ordered question ids as presented, including pretest. */
  questionIds: string[];
  pretestIds: string[];
}

// ---- LLM ----

export interface LLMModelInfo {
  id: string;
  name: string;
  family: string;
  description: string;
  url: string;
  fileName: string;
  sizeMB: number;
  params: string;
  quant: string;
  contextLength: number;
  recommended?: boolean;
  /** 'gguf' = llama.cpp model; 'aicore' = system Gemini Nano; 'litertlm' = LiteRT-LM. */
  kind?: 'gguf' | 'aicore' | 'litertlm';
  /** Built into the device (no download), e.g. Gemini Nano. */
  builtIn?: boolean;
  /** Preferred accelerator for LiteRT-LM models. */
  backend?: 'gpu' | 'cpu';
  /** Minimum device RAM (GB) the model realistically needs. */
  minRamGb?: number;
  /** Already present on the device (imported / from another app). */
  local?: boolean;
  /** True if the download source requires Hugging Face auth (gated). */
  gated?: boolean;
}

export interface GenerationParams {
  temperature: number;
  topP: number;
  maxTokens: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type EngineStatus =
  | 'unavailable'
  | 'no-model'
  | 'idle'
  | 'loading'
  | 'ready'
  | 'generating'
  | 'error';
