import { Question } from '../types';

export type QuizMode =
  | 'adaptive'
  | 'component'
  | 'subject'
  | 'review'
  | 'flagged'
  | 'missed'
  | 'ai'
  | 'custom';

export interface QuizConfig {
  title: string;
  mode: QuizMode;
  componentId?: string;
  subjectId?: string;
  count?: number;
  /** Explicit ordered question ids from the bank. */
  questionIds?: string[];
  /** Inline questions (e.g. AI-generated), serialized in nav params. */
  inlineQuestions?: Question[];
  /** Keep serving questions until the component is mastered. */
  masteryDrill?: boolean;
}

export interface AnswerRecord {
  question: Question;
  chosen: number; // -1 if skipped
  correct: boolean;
}

export type RootStackParamList = {
  Tabs: undefined;
  Subject: { subjectId: string };
  Topic: { componentId: string };
  Quiz: { config: QuizConfig };
  QuizResult: {
    title: string;
    records: AnswerRecord[];
    config?: QuizConfig;
  };
  Exam: { useAI?: boolean };
  ExamResult: { resultId: string };
  Tutor: { topicTitle?: string; componentId?: string };
  ModelManager: undefined;
  About: undefined;
  MarkdownPreview: undefined;
};

export type TabParamList = {
  Home: undefined;
  Learn: undefined;
  ExamTab: undefined;
  Review: undefined;
  Settings: undefined;
};
