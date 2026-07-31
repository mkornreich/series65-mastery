import { ExamResult, ExamSectionScore, Question, SubjectId } from '../types';
import { SUBJECTS, EXAM_SPEC } from '../data/curriculum';

export interface ScoreInput {
  questions: Question[]; // presentation order (140)
  pretestIds: string[]; // 10 unscored
  answers: Record<string, number>; // qid -> chosen index (-1 unanswered)
  durationSec: number;
  startedAt: number;
}

/**
 * Score a completed exam against the NASAA rule: only the scored (non-pretest)
 * questions count, and a candidate must get at least 92 of 130 correct.
 * Also produces the four-section breakdown that mirrors the real score report.
 */
export function scoreExam(input: ScoreInput): ExamResult {
  const pretest = new Set(input.pretestIds);
  const scored = input.questions.filter((q) => !pretest.has(q.id));

  const sectionMap: Record<SubjectId, ExamSectionScore> = {} as any;
  for (const s of SUBJECTS) {
    sectionMap[s.id] = {
      subjectId: s.id,
      title: s.title,
      correct: 0,
      total: 0,
    };
  }

  let scoredCorrect = 0;
  for (const q of scored) {
    const sec = sectionMap[q.subjectId];
    if (!sec) continue;
    sec.total += 1;
    const chosen = input.answers[q.id];
    if (chosen === q.answerIndex) {
      sec.correct += 1;
      scoredCorrect += 1;
    }
  }

  const sections = SUBJECTS.map((s) => sectionMap[s.id]);
  const passingCorrect = EXAM_SPEC.passingCorrect;
  const passed = scoredCorrect >= passingCorrect;

  return {
    id: `exam-${input.startedAt}`,
    date: input.startedAt,
    scoredCorrect,
    scoredTotal: scored.length,
    passed,
    passingCorrect,
    durationSec: input.durationSec,
    sections,
    answers: input.answers,
    questionIds: input.questions.map((q) => q.id),
    pretestIds: input.pretestIds,
  };
}

export function scaledScore(scoredCorrect: number, scoredTotal: number): number {
  if (!scoredTotal) return 0;
  return Math.round((scoredCorrect / scoredTotal) * 100);
}
