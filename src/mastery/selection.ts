import { ComponentMastery, Question, SRItem } from '../types';
import { QUESTION_BANK } from '../data/questionBank';
import { SUBJECTS, ALL_COMPONENTS } from '../data/curriculum';
import { masteryScore, isDue } from './engine';

// ---- Fisher-Yates shuffle (runtime randomness is fine here) ----
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

// ---- Bank indexes ----
export const BANK_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTION_BANK.map((q) => [q.id, q])
);

export function bankByComponent(componentId: string): Question[] {
  return QUESTION_BANK.filter((q) => q.componentId === componentId);
}

export function bankBySubject(subjectId: string): Question[] {
  return QUESTION_BANK.filter((q) => q.subjectId === subjectId);
}

export function questionsByIds(ids: string[]): Question[] {
  return ids.map((id) => BANK_BY_ID[id]).filter(Boolean) as Question[];
}

// ---- Weak-area ranking ----
export function weakComponents(
  masteryMap: Record<string, ComponentMastery>,
  limit = 5
): string[] {
  const withBank = ALL_COMPONENTS.filter((c) => bankByComponent(c.id).length > 0);
  return withBank
    .map((c) => ({ id: c.id, score: masteryScore(masteryMap[c.id]) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((x) => x.id);
}

/**
 * Order a pool so the "most valuable to study now" come first:
 * previously-missed > spaced-repetition due > unseen > already-correct.
 */
function priority(
  q: Question,
  srMap: Record<string, SRItem>,
  missed: Set<string>,
  now: number
): number {
  if (missed.has(q.id)) return 0;
  const sr = srMap[q.id];
  if (isDue(sr, now)) return 1;
  if (!sr || sr.seen === 0) return 2;
  return 3;
}

export function selectAdaptive(
  masteryMap: Record<string, ComponentMastery>,
  srMap: Record<string, SRItem>,
  missedIds: string[],
  count: number
): Question[] {
  const now = Date.now();
  const missed = new Set(missedIds);
  const weak = weakComponents(masteryMap, 6);
  // Pool = questions from the weakest components.
  let pool = weak.flatMap((cid) => bankByComponent(cid));
  if (pool.length < count) pool = QUESTION_BANK.slice();
  const ranked = shuffle(pool).sort(
    (a, b) => priority(a, srMap, missed, now) - priority(b, srMap, missed, now)
  );
  // De-dup and take count.
  const seen = new Set<string>();
  const out: Question[] = [];
  for (const q of ranked) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    out.push(q);
    if (out.length >= count) break;
  }
  return out;
}

export function selectReview(
  srMap: Record<string, SRItem>,
  missedIds: string[],
  count: number
): Question[] {
  const now = Date.now();
  const dueIds = Object.values(srMap)
    .filter((i) => isDue(i, now))
    .sort((a, b) => a.due - b.due)
    .map((i) => i.qid);
  const ordered = [...dueIds, ...missedIds];
  const seen = new Set<string>();
  const out: Question[] = [];
  for (const id of ordered) {
    if (seen.has(id)) continue;
    seen.add(id);
    const q = BANK_BY_ID[id];
    if (q) out.push(q);
    if (out.length >= count) break;
  }
  return out;
}

/** Questions for a "learn then master" drill on one component. */
export function selectForComponent(
  componentId: string,
  srMap: Record<string, SRItem>,
  missedIds: string[],
  count: number
): Question[] {
  const now = Date.now();
  const missed = new Set(missedIds);
  const pool = bankByComponent(componentId);
  const ranked = shuffle(pool).sort(
    (a, b) => priority(a, srMap, missed, now) - priority(b, srMap, missed, now)
  );
  return ranked.slice(0, Math.min(count, ranked.length));
}

export function selectForSubject(subjectId: string, count: number): Question[] {
  return sample(bankBySubject(subjectId), count);
}

export function totalBankQuestions(): number {
  return QUESTION_BANK.length;
}

export function bankCountsBySubject(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of SUBJECTS) out[s.id] = bankBySubject(s.id).length;
  return out;
}
