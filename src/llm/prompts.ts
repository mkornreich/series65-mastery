import { ChatMessage, Component, Question } from '../types';

export const TUTOR_SYSTEM =
  'You are a patient, precise tutor for the NASAA Series 65 (Uniform Investment Adviser Law Examination). ' +
  'Explain concepts clearly and concisely for an exam candidate. Ground answers in general finance/economics/investing ' +
  'principles, the Investment Advisers Act of 1940, the Securities Acts of 1933 and 1934, SEC/FINRA rules, and the ' +
  'Uniform Securities Act of 1956 as amended by NASAA. Prefer short paragraphs and bullet points. If a question is ' +
  'outside the Series 65 scope, say so briefly. Never claim to give personalized investment advice. ' +
  'Format answers in Markdown: use **bold** for key terms, bullet or numbered lists, and tables when comparing things. ' +
  'Write every formula or calculation in LaTeX — inline math between $...$ and display equations between $$...$$ — for ' +
  'example $$\\text{Current Yield} = \\frac{\\text{Annual Coupon}}{\\text{Market Price}}$$. ' +
  'Write literal dollar amounts as ordinary text (e.g. $1,000), not as math.';

export function buildExplainMessages(
  question: Question,
  chosenIndex: number
): ChatMessage[] {
  const letters = ['A', 'B', 'C', 'D'];
  const choiceText = question.choices
    .map((c, i) => `${letters[i]}. ${c}`)
    .join('\n');
  const chosen =
    chosenIndex >= 0 ? letters[chosenIndex] : '(no answer selected)';
  const correct = letters[question.answerIndex];
  return [
    { role: 'system', content: TUTOR_SYSTEM },
    {
      role: 'user',
      content:
        `Here is a Series 65 practice question.\n\n` +
        `Question: ${question.stem}\n${choiceText}\n\n` +
        `Correct answer: ${correct}. The student chose: ${chosen}.\n\n` +
        `In 3-6 sentences, explain WHY ${correct} is correct and why the student's ` +
        `choice (if different) is wrong. Then give one memory tip. Be direct and exam-focused.`,
    },
  ];
}

export function buildTutorMessages(
  topicTitle: string | undefined,
  history: ChatMessage[],
  userMessage: string
): ChatMessage[] {
  const sys =
    TUTOR_SYSTEM +
    (topicTitle ? ` The student is currently studying: "${topicTitle}".` : '');
  return [
    { role: 'system', content: sys },
    ...history.slice(-8),
    { role: 'user', content: userMessage },
  ];
}

/** Ask the model to author fresh practice questions for a component as JSON.
 *  `avoidStems` lists recently-asked question stems the model must not repeat —
 *  used when generating an endless stream so batches stay distinct. */
export function buildGenerateMessages(
  component: Component,
  count: number,
  examples: Question[],
  avoidStems: string[] = []
): ChatMessage[] {
  const exampleBlock = examples
    .slice(0, 2)
    .map(
      (q) =>
        `{"stem":${JSON.stringify(q.stem)},"choices":${JSON.stringify(
          q.choices
        )},"answerIndex":${q.answerIndex},"explanation":${JSON.stringify(
          q.explanation.slice(0, 160)
        )},"subtopic":${JSON.stringify(q.subtopic)},"difficulty":"medium"}`
    )
    .join(',\n');

  const subtopics = component.subtopics.map((s) => `- ${s}`).join('\n');
  const avoidBlock = avoidStems.length
    ? `Do NOT repeat or paraphrase these already-asked questions:\n` +
      avoidStems.slice(-12).map((s) => `- ${s}`).join('\n') +
      `\n\n`
    : '';

  return [
    {
      role: 'system',
      content:
        'You are an expert NASAA Series 65 exam-question author. You output ONLY valid JSON. ' +
        'Every question has exactly 4 choices and exactly one correct answer.',
    },
    {
      role: 'user',
      content:
        `Write ${count} NEW, original Series 65 multiple-choice questions for the topic ` +
        `"${component.title}". Cover these subtopics:\n${subtopics}\n\n` +
        `Return ONLY a JSON object of the form {"questions":[ ... ]} where each item is:\n` +
        `{"stem": string, "choices": [4 strings], "answerIndex": 0-3, "explanation": string, ` +
        `"subtopic": string, "difficulty": "easy"|"medium"|"hard"}\n\n` +
        (exampleBlock ? `Example items (format only — do NOT copy their content):\n${exampleBlock}\n\n` : '') +
        avoidBlock +
        `Rules: exactly 4 choices; one unambiguous best answer; plausible distractors; ` +
        `no "all/none of the above"; vary the subtopic and difficulty across the set; ` +
        `keep each stem self-contained and DISTINCT from any listed above. Output JSON only, no prose.`,
    },
  ];
}

// ---- Robust JSON extraction for small on-device models ----

export function extractJson(text: string): any | null {
  if (!text) return null;
  let t = text.trim();
  // Strip code fences.
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  // Fast path.
  try {
    return JSON.parse(t);
  } catch {
    /* fall through */
  }
  // Find the first balanced {...} or [...] region.
  const start = t.search(/[{[]/);
  if (start < 0) return null;
  const open = t[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        const slice = t.slice(start, i + 1);
        try {
          return JSON.parse(slice);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

const DIFFS = ['easy', 'medium', 'hard'];

/** Validate + coerce a raw AI question into our Question shape (or null). */
export function coerceQuestion(
  raw: any,
  component: Component,
  idx: number
): Question | null {
  if (!raw || typeof raw !== 'object') return null;
  const stem = typeof raw.stem === 'string' ? raw.stem.trim() : '';
  const choices = Array.isArray(raw.choices)
    ? raw.choices.map((c: any) => String(c)).filter((c: string) => c.length)
    : [];
  const answerIndex = Number(raw.answerIndex);
  if (!stem || choices.length !== 4) return null;
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3)
    return null;
  const difficulty = DIFFS.includes(raw.difficulty) ? raw.difficulty : 'medium';
  const subtopic =
    typeof raw.subtopic === 'string' && raw.subtopic
      ? raw.subtopic
      : component.subtopics[0] || component.title;
  return {
    id: `ai-${component.id}-${Date.now()}-${idx}`,
    subjectId: component.subjectId,
    componentId: component.id,
    subtopic,
    stem,
    choices,
    answerIndex,
    explanation:
      typeof raw.explanation === 'string' ? raw.explanation : '',
    difficulty,
    source: 'ai',
  };
}

export function parseGeneratedQuestions(
  text: string,
  component: Component
): Question[] {
  const parsed = extractJson(text);
  if (!parsed) return [];
  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.questions)
    ? parsed.questions
    : [];
  return arr
    .map((raw: any, i: number) => coerceQuestion(raw, component, i))
    .filter(Boolean) as Question[];
}
