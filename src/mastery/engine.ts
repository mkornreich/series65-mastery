import {
  ComponentMastery,
  MasteryLevel,
  SRItem,
  Question,
  Subject,
} from '../types';
import { SUBJECTS, COMPONENT_BY_ID } from '../data/curriculum';

// ---------------------------------------------------------------------------
// Mastery model
//
// Two complementary mechanisms drive "mastery learning" here:
//
//  1. Per-component mastery: a recency-weighted accuracy (EWMA) combined with a
//     confidence factor (have you practiced enough breadth?). This decides when
//     a component is considered "mastered" and drives adaptive practice.
//
//  2. Per-question spaced repetition (SuperMemo-2): schedules each question for
//     review so mastered material resurfaces before it is forgotten.
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;
const EWMA_ALPHA = 0.35; // weight on the most recent answer

export const MASTERY_THRESHOLD = 0.85; // recency-weighted accuracy to be "mastered"
const MIN_ATTEMPTS_FOR_MASTERY = 6;
const COVERAGE_FOR_MASTERY = 0.6; // fraction of subtopics touched

export function emptyComponentMastery(componentId: string): ComponentMastery {
  return {
    componentId,
    attempts: 0,
    correct: 0,
    ewma: 0,
    streak: 0,
    coveredSubtopics: [],
  };
}

/** Fold one answered question into the component's mastery aggregate. */
export function updateComponentMastery(
  prev: ComponentMastery | undefined,
  question: Question,
  correct: boolean,
  now: number
): ComponentMastery {
  const m = prev
    ? { ...prev, coveredSubtopics: [...prev.coveredSubtopics] }
    : emptyComponentMastery(question.componentId);
  const first = m.attempts === 0;
  m.attempts += 1;
  if (correct) m.correct += 1;
  m.ewma = first
    ? correct
      ? 1
      : 0
    : m.ewma * (1 - EWMA_ALPHA) + (correct ? 1 : 0) * EWMA_ALPHA;
  m.streak = correct ? m.streak + 1 : 0;
  if (question.subtopic && !m.coveredSubtopics.includes(question.subtopic)) {
    m.coveredSubtopics.push(question.subtopic);
  }
  m.lastPracticed = now;
  return m;
}

export function componentCoverage(m: ComponentMastery | undefined): number {
  if (!m) return 0;
  const comp = COMPONENT_BY_ID[m.componentId];
  const total = comp?.subtopics.length || 1;
  return Math.min(1, m.coveredSubtopics.length / total);
}

/** Confidence that we have enough data to trust the mastery estimate. */
export function componentConfidence(m: ComponentMastery | undefined): number {
  if (!m) return 0;
  const comp = COMPONENT_BY_ID[m.componentId];
  const target = Math.max(MIN_ATTEMPTS_FOR_MASTERY, (comp?.subtopics.length || 2) * 2);
  return Math.min(1, m.attempts / target);
}

/** Mastery score in [0,1] — the recency-weighted accuracy tempered by confidence. */
export function masteryScore(m: ComponentMastery | undefined): number {
  if (!m || m.attempts === 0) return 0;
  const conf = componentConfidence(m);
  // Low confidence pulls the score toward the middle so a lucky 2/2 isn't "mastered".
  return m.ewma * (0.55 + 0.45 * conf);
}

export function masteryLevel(m: ComponentMastery | undefined): MasteryLevel {
  if (!m || m.attempts === 0) return 'not_started';
  const score = m.ewma;
  const conf = componentConfidence(m);
  const cov = componentCoverage(m);
  if (
    score >= MASTERY_THRESHOLD &&
    conf >= 0.8 &&
    cov >= COVERAGE_FOR_MASTERY
  ) {
    return 'mastered';
  }
  if (score >= 0.7) return 'proficient';
  if (score >= 0.5) return 'developing';
  return 'beginning';
}

export function isMastered(m: ComponentMastery | undefined): boolean {
  return masteryLevel(m) === 'mastered';
}

// ---- Subject / overall rollups ----

export function subjectMastery(
  subject: Subject,
  masteryMap: Record<string, ComponentMastery>
): number {
  if (!subject.components.length) return 0;
  // Weight components equally within a subject.
  const sum = subject.components.reduce(
    (acc, c) => acc + masteryScore(masteryMap[c.id]),
    0
  );
  return sum / subject.components.length;
}

/** Overall exam readiness in [0,1], weighted by blueprint section weights. */
export function overallReadiness(
  masteryMap: Record<string, ComponentMastery>
): number {
  const totalWeight = SUBJECTS.reduce((a, s) => a + s.weightPct, 0);
  const weighted = SUBJECTS.reduce(
    (acc, s) => acc + subjectMastery(s, masteryMap) * s.weightPct,
    0
  );
  return totalWeight ? weighted / totalWeight : 0;
}

// ---------------------------------------------------------------------------
// Spaced repetition (SuperMemo-2)
// ---------------------------------------------------------------------------

export function emptySR(qid: string, now: number): SRItem {
  return {
    qid,
    reps: 0,
    interval: 0,
    ef: 2.5,
    due: now,
    lapses: 0,
    seen: 0,
    correct: 0,
    lastReviewed: now,
  };
}

/**
 * Update SM-2 state after answering. `quality` is 0..5. For a binary quiz we
 * map correct→4 and incorrect→1 (callers may pass a finer grade).
 */
export function scheduleSR(
  prev: SRItem | undefined,
  qid: string,
  quality: number,
  now: number
): SRItem {
  const item = prev ? { ...prev } : emptySR(qid, now);
  item.seen += 1;
  item.lastReviewed = now;
  const passed = quality >= 3;
  if (passed) item.correct += 1;

  // Easiness factor update (SM-2), clamped at 1.3.
  item.ef = Math.max(
    1.3,
    item.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  if (!passed) {
    item.reps = 0;
    item.interval = 1;
    item.lapses += 1;
  } else {
    item.reps += 1;
    if (item.reps === 1) item.interval = 1;
    else if (item.reps === 2) item.interval = 6;
    else item.interval = Math.round(item.interval * item.ef);
  }
  item.due = now + item.interval * DAY_MS;
  return item;
}

export function gradeFor(correct: boolean): number {
  return correct ? 4 : 1;
}

export function isDue(item: SRItem | undefined, now: number): boolean {
  // A lapsed card (reps reset to 0 on a wrong answer) is still due for its
  // next-day re-review, so gate only on the scheduled due time, not reps.
  return !!item && item.due <= now;
}

export function dueCount(
  srMap: Record<string, SRItem>,
  now: number
): number {
  return Object.values(srMap).filter((i) => isDue(i, now)).length;
}
