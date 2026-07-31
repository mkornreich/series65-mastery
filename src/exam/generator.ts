import { Question, Subject } from '../types';
import { SUBJECTS, EXAM_SPEC } from '../data/curriculum';
import { bankBySubject, bankByComponent, shuffle, sample } from '../mastery/selection';

export interface ExamAssembly {
  /** All questions in presentation order (140), including pretest. */
  questions: Question[];
  /** ids of the 10 unscored pretest questions. */
  pretestIds: string[];
}

/** Largest-remainder allocation of `total` across integer weights. */
function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (w / sum) * total);
  const base = raw.map((x) => Math.floor(x));
  let remaining = total - base.reduce((a, b) => a + b, 0);
  const order = raw
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < order.length && remaining > 0; k++) {
    base[order[k].i] += 1;
    remaining -= 1;
  }
  return base;
}

/** Draw `n` questions from a subject, spread across its components, no repeats. */
function drawFromSubject(
  subject: Subject,
  n: number,
  used: Set<string>
): Question[] {
  const comps = subject.components;
  const targets = allocate(
    n,
    comps.map((c) => Math.max(1, c.questionTarget))
  );
  const out: Question[] = [];
  comps.forEach((c, idx) => {
    const want = targets[idx];
    const avail = shuffle(bankByComponent(c.id).filter((q) => !used.has(q.id)));
    for (let k = 0; k < want && k < avail.length; k++) {
      used.add(avail[k].id);
      out.push(avail[k]);
    }
  });
  // Top up from anywhere in the subject if some components were short.
  if (out.length < n) {
    const filler = shuffle(bankBySubject(subject.id).filter((q) => !used.has(q.id)));
    for (const q of filler) {
      if (out.length >= n) break;
      used.add(q.id);
      out.push(q);
    }
  }
  return out;
}

/**
 * Assemble a full practice exam that mirrors the blueprint:
 *  - 130 scored questions distributed 20 / 32 / 39 / 39 by subject,
 *  - plus 10 pretest questions spread by section weight,
 *  - shuffled into a single 140-question presentation order.
 */
export function generateExam(): ExamAssembly {
  const used = new Set<string>();
  const scored: Question[] = [];
  for (const s of SUBJECTS) {
    scored.push(...drawFromSubject(s, s.scoredQuestions, used));
  }

  // Pretest: spread by subject weight, drawn from whatever remains.
  const pretestPer = allocate(
    EXAM_SPEC.pretestQuestions,
    SUBJECTS.map((s) => s.weightPct)
  );
  const pretest: Question[] = [];
  SUBJECTS.forEach((s, idx) => {
    const want = pretestPer[idx];
    const avail = shuffle(bankBySubject(s.id).filter((q) => !used.has(q.id)));
    for (let k = 0; k < want && k < avail.length; k++) {
      used.add(avail[k].id);
      pretest.push(avail[k]);
    }
  });
  // If the bank was too small to supply all pretest slots, just proceed with
  // however many we could draw (scoring only depends on the scored set).
  const pretestIds = pretest.map((q) => q.id);

  const questions = shuffle([...scored, ...pretest]);
  return { questions, pretestIds };
}

/** Whether the bank is large enough to assemble a full unique exam. */
export function canBuildFullExam(): boolean {
  return SUBJECTS.every(
    (s) => bankBySubject(s.id).length >= s.scoredQuestions
  );
}

export function examShortfall(): { subjectId: string; have: number; need: number }[] {
  return SUBJECTS.filter((s) => bankBySubject(s.id).length < s.scoredQuestions).map(
    (s) => ({ subjectId: s.id, have: bankBySubject(s.id).length, need: s.scoredQuestions })
  );
}
