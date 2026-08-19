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
  maxChars = 1500,
): { context: string; sources: Source[] } {
  // Retrieve a wider candidate pool but include only the top few, kept WHOLE so
  // a numeric fact ("$10,000", "no contribution limit") or an exact act name is
  // never sliced off the end of the chunk the model needs to copy from.
  const hits = retrieve((topicTitle ? topicTitle + '. ' : '') + query, 6);
  if (!hits.length) return { context: '', sources: [] };

  const INCLUDE = 3;
  const PER_CHUNK = 700; // ~p90 of chunk length, so top chunks stay intact
  const chosen: { chunk: TextbookChunk; text: string }[] = [];
  const sources: Source[] = [];
  const seenAnchor = new Set<string>();
  let used = 0;
  for (const { chunk } of hits) {
    if (chosen.length >= INCLUDE || used >= maxChars) break;
    const room = Math.min(PER_CHUNK, maxChars - used);
    if (room < 120) break;
    const text = chunk.text.length > room ? chunk.text.slice(0, room) + '…' : chunk.text;
    chosen.push({ chunk, text }); // best-first; any truncation hits the least-relevant tail chunk
    used += text.length;
    if (!seenAnchor.has(chunk.anchor)) {
      seenAnchor.add(chunk.anchor);
      sources.push({ label: sourceLabel(chunk), anchor: chunk.anchor });
    }
  }

  const blocks = chosen.map(({ chunk, text }) => `[${sourceLabel(chunk)}]\n${text}`);

  const context =
    'REFERENCE MATERIAL — excerpts from the official Series 65 study textbook. ' +
    'Base your answer on these excerpts and explain it to the student in your own words (do not copy the ' +
    'excerpts verbatim or label your answer "Excerpt"). Spell every act or regulation name exactly as written ' +
    'below. Only state a number, dollar amount, limit, percentage, date, or law name if that exact fact appears ' +
    'below AND is about the thing being asked — never borrow a figure the excerpts give for a different account ' +
    'or topic, and never invent one; if a specific number is not given, describe the concept in words. ' +
    'Always give a clear, substantive answer and name the section(s) you used (e.g., "Part IV — A."). ' +
    'If the excerpts only partially cover the question, answer the covered part and briefly note they were partial.\n\n' +
    blocks.join('\n\n');

  return { context, sources };
}
