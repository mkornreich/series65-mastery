import { Question } from '../types';

export type QuizMode =
  | 'adaptive'
  | 'component'
  | 'components'
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
  /** For mode 'components': practice/drill across this set of components at once. */
  componentIds?: string[];
  subjectId?: string;
  count?: number;
  /** Explicit ordered question ids from the bank. */
  questionIds?: string[];
  /** Inline questions (e.g. AI-generated), serialized in nav params. */
  inlineQuestions?: Question[];
  /** Keep serving questions until the component is mastered. */
  masteryDrill?: boolean;
  /** Endlessly generate fresh AI questions for the component as you progress. */
  aiInfinite?: boolean;
  /** Serve only calculation (math) questions from the selected component(s). */
  mathOnly?: boolean;
  /** Restrict to one math formula topic's calculation questions. */
  mathTopicId?: string;
  /** Extra instruction for endless generation, e.g. to force calculation problems. */
  genFocus?: string;
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
  Tutor: {
    topicTitle?: string;
    componentId?: string;
    /** When opened from a practice question, scope the chat to it. */
    question?: Question;
    chosenIndex?: number;
  };
  Math: undefined;
  MathTopic: { topicId: string };
  ModelManager: undefined;
  About: undefined;
  MarkdownPreview: undefined;
};

export type TabParamList = {
  Home: undefined;
  Learn: undefined;
  ExamTab: undefined;
  Watch: undefined;
  Settings: undefined;
};
