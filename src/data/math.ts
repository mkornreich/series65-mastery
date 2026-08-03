import { ComponentMastery } from '../types';
import { MATH_TOPICS } from './mathTopics';
import { masteryScore } from '../mastery/engine';

/** The curriculum components every math formula topic feeds into (deduped). */
export const MATH_COMPONENT_IDS = [...new Set(MATH_TOPICS.map((t) => t.homeComponentId))];

/** Overall math mastery = average mastery across those home components (0..1). */
export function mathMasteryScore(mastery: Record<string, ComponentMastery>): number {
  return (
    MATH_COMPONENT_IDS.reduce((a, id) => a + masteryScore(mastery[id]), 0) /
    Math.max(1, MATH_COMPONENT_IDS.length)
  );
}
