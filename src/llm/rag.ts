// Lightweight on-device RAG over the Series 65 textbook. No embedding model:
// a BM25 lexical index over the textbook passages, built once, lazily. Used to
// ground the AI tutor (which otherwise hallucinates) in real textbook sections
// and cite them.
import { TEXTBOOK_CHUNKS, TextbookChunk } from '../data/textbookChunks';

/** Public GitHub location of the textbook, for citation links. */
export const TEXTBOOK_URL =
  'https://github.com/mkornreich/series65-mastery/blob/main/docs/Series-65-Textbook.md';

export function sourceUrl(anchor: string): string {
  return anchor ? `${TEXTBOOK_URL}#${anchor}` : TEXTBOOK_URL;
}

export interface Source {
  /** Display label, e.g. "Part IV · A. Regulation of Investment Advisers". */
  label: string;
  anchor: string;
}

const STOP = new Set([
  'the', 'a', 'an', 'of', 'to', 'in', 'and', 'or', 'is', 'are', 'for', 'on', 'with', 'as',
  'by', 'that', 'this', 'it', 'its', 'be', 'at', 'from', 'which', 'you', 'your', 'not', 'can',
  'if', 'when', 'how', 'what', 'why', 'do', 'does', 'was', 'were', 'has', 'have', 'will', 'would',
  'about', 'into', 'than', 'then', 'they', 'their', 'them', 'so', 'but', 'also', 'may', 'each',
]);

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter((t) => t.length > 1 && !STOP.has(t));
}

interface Index {
  tf: Map<string, number>[];
  len: number[];
  df: Map<string, number>;
  avgLen: number;
  N: number;
}

let INDEX: Index | null = null;
function getIndex(): Index {
  if (INDEX) return INDEX;
  const tf: Map<string, number>[] = [];
  const len: number[] = [];
  const df = new Map<string, number>();
  let total = 0;
  for (const c of TEXTBOOK_CHUNKS) {
    // Weight the section heading by repeating it, so a query naming the topic
    // pulls the right section.
    const toks = tokenize(c.section + ' ' + c.section + ' ' + c.text);
    const m = new Map<string, number>();
    for (const t of toks) m.set(t, (m.get(t) || 0) + 1);
    tf.push(m);
    len.push(toks.length || 1);
    total += toks.length;
    for (const t of m.keys()) df.set(t, (df.get(t) || 0) + 1);
  }
  INDEX = { tf, len, df, avgLen: total / Math.max(1, TEXTBOOK_CHUNKS.length), N: TEXTBOOK_CHUNKS.length };
  return INDEX;
}

/** BM25 top-k passages for a query. */
export function retrieve(query: string, k = 3): { chunk: TextbookChunk; score: number }[] {
  const { tf, len, df, avgLen, N } = getIndex();
  const q = [...new Set(tokenize(query))];
  if (!q.length) return [];
  const k1 = 1.5;
  const b = 0.75;
  const scored: { i: number; s: number }[] = [];
  for (let i = 0; i < N; i++) {
    let s = 0;
    for (const t of q) {
      const f = tf[i].get(t);
      if (!f) continue;
      const n = df.get(t) || 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      s += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * len[i]) / avgLen)));
    }
    if (s > 0) scored.push({ i, s });
  }
  scored.sort((x, y) => y.s - x.s);
  return scored.slice(0, k).map((x) => ({ chunk: TEXTBOOK_CHUNKS[x.i], score: x.s }));
}

function sourceLabel(c: TextbookChunk): string {
  return (c.part ? `${c.part} · ` : '') + c.section;
}

/**
 * Build grounding context for the tutor from the query. Returns a system-prompt
 * addendum (textbook excerpts + instruction) and the list of cited sections.
 */
export function buildTutorContext(
  query: string,
  topicTitle?: string,
  maxChars = 1700,
): { context: string; sources: Source[] } {
  const hits = retrieve((topicTitle ? topicTitle + '. ' : '') + query, 4);
  if (!hits.length) return { context: '', sources: [] };

  const blocks: string[] = [];
  const sources: Source[] = [];
  const seenAnchor = new Set<string>();
  let used = 0;
  for (const { chunk } of hits) {
    if (used >= maxChars) break;
    const room = maxChars - used;
    const text = chunk.text.length > room ? chunk.text.slice(0, room) + '…' : chunk.text;
    blocks.push(`[${sourceLabel(chunk)}]\n${text}`);
    used += text.length;
    if (!seenAnchor.has(chunk.anchor)) {
      seenAnchor.add(chunk.anchor);
      sources.push({ label: sourceLabel(chunk), anchor: chunk.anchor });
    }
  }

  const context =
    'REFERENCE MATERIAL — excerpts from the official Series 65 study textbook. ' +
    'Use these excerpts as your primary source and stay faithful to them; prefer their wording, numbers, and rules over your own recall. ' +
    'Always give the student a clear, helpful, substantive answer. ' +
    'Name the section(s) you drew on (e.g., "Part IV — A."). ' +
    'If the excerpts only partially cover the question, still answer from sound Series 65 principles and note briefly that the excerpts were partial.\n\n' +
    blocks.join('\n\n');

  return { context, sources };
}
