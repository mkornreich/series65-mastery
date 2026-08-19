// In-app textbook reader model. The textbook lives as section-chunks in
// textbookChunks.ts (also used by the RAG retriever); here we reconstruct whole
// sections for reading and expose a table of contents. Anchors match the RAG
// citations, so an AI answer's "Textbook sections" links resolve straight to
// the section screen.
import { TEXTBOOK_CHUNKS } from './textbookChunks';
import { SUBJECTS } from './curriculum';

export interface TextbookSectionMeta {
  /** e.g. "Part III" — empty string for the appendices. */
  part: string;
  /** e.g. "H. Special Types of Accounts". */
  section: string;
  /** GitHub-style heading slug; the id used by RAG citations. */
  anchor: string;
}

export interface TextbookSectionContent extends TextbookSectionMeta {
  /** The full section, reconstructed from its chunks, as Markdown. */
  markdown: string;
}

let SECTIONS: TextbookSectionMeta[] | null = null;

/** Ordered, de-duplicated list of textbook sections, in book order. */
export function textbookSections(): TextbookSectionMeta[] {
  if (SECTIONS) return SECTIONS;
  const seen = new Set<string>();
  const out: TextbookSectionMeta[] = [];
  for (const c of TEXTBOOK_CHUNKS) {
    if (seen.has(c.anchor)) continue;
    seen.add(c.anchor);
    out.push({ part: c.part, section: c.section, anchor: c.anchor });
  }
  SECTIONS = out;
  return out;
}

/** Reconstruct one section's Markdown by joining its chunks in document order. */
export function sectionByAnchor(anchor: string): TextbookSectionContent | null {
  const chunks = TEXTBOOK_CHUNKS.filter((c) => c.anchor === anchor).sort(
    (a, b) => a.id - b.id
  );
  if (!chunks.length) return null;
  const { part, section } = chunks[0];
  const markdown = chunks.map((c) => c.text).join('\n\n');
  return { part, section, anchor, markdown };
}

/** Display heading for a part; the empty appendix part becomes "Appendices". */
export function partLabel(part: string): string {
  return part || 'Appendices';
}

// Each exam SUBJECT is a textbook Part; the components within a subject line up
// one-to-one, in order, with that Part's lettered sections (verified: component
// count == section count for every part). So a Learn topic maps to the textbook
// section at the same index within its Part.
const PART_OF_SUBJECT: Record<string, string> = {
  econ: 'Part I',
  vehicles: 'Part II',
  recommendations: 'Part III',
  laws: 'Part IV',
};

let COMPONENT_SECTIONS: Record<string, TextbookSectionMeta> | null = null;
function componentSectionMap(): Record<string, TextbookSectionMeta> {
  if (COMPONENT_SECTIONS) return COMPONENT_SECTIONS;
  const byPart: Record<string, TextbookSectionMeta[]> = {};
  for (const s of textbookSections()) {
    (byPart[s.part] = byPart[s.part] || []).push(s);
  }
  const map: Record<string, TextbookSectionMeta> = {};
  for (const subj of SUBJECTS) {
    const partSecs = byPart[PART_OF_SUBJECT[subj.id]] || [];
    subj.components.forEach((comp, i) => {
      if (partSecs[i]) map[comp.id] = partSecs[i];
    });
  }
  COMPONENT_SECTIONS = map;
  return map;
}

/** The textbook section that corresponds to a Learn topic (component), or null. */
export function textbookSectionForComponent(
  componentId: string
): TextbookSectionMeta | null {
  return componentSectionMap()[componentId] ?? null;
}

/** The textbook Part that an exam subject maps to, e.g. "Part IV" (or null). */
export function textbookPartForSubject(subjectId: string): string | null {
  return PART_OF_SUBJECT[subjectId] ?? null;
}

// ---- Search ----

export interface TextbookSearchResult extends TextbookSectionMeta {
  /** A short context excerpt around the first match (whitespace-collapsed). */
  snippet: string;
  /** Total occurrences of the query across the section. */
  matchCount: number;
}

function snippetAround(text: string, idx: number, qlen: number, pad = 64): string {
  const start = Math.max(0, idx - pad);
  const end = Math.min(text.length, idx + qlen + pad);
  let s = text.slice(start, end).replace(/\s+/g, ' ').trim();
  if (start > 0) s = '…' + s;
  if (end < text.length) s = s + '…';
  return s;
}

function countOccurrences(haystackLower: string, needleLower: string): number {
  let n = 0;
  let i = haystackLower.indexOf(needleLower);
  while (i >= 0) {
    n++;
    i = haystackLower.indexOf(needleLower, i + needleLower.length);
  }
  return n;
}

/**
 * Search the whole textbook for a query. Returns one result per matching
 * section (most matches first), each with a context snippet and match count.
 */
export function searchTextbook(query: string, maxResults = 60): TextbookSearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const bySection = new Map<
    string,
    { meta: TextbookSectionMeta; matchCount: number; snippet: string }
  >();
  for (const c of TEXTBOOK_CHUNKS) {
    const lc = c.text.toLowerCase();
    const idx = lc.indexOf(q);
    if (idx < 0) continue;
    const count = countOccurrences(lc, q);
    const existing = bySection.get(c.anchor);
    if (existing) {
      existing.matchCount += count;
    } else {
      bySection.set(c.anchor, {
        meta: { part: c.part, section: c.section, anchor: c.anchor },
        matchCount: count,
        snippet: snippetAround(c.text, idx, q.length),
      });
    }
  }
  return [...bySection.values()]
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, maxResults)
    .map((e) => ({ ...e.meta, snippet: e.snippet, matchCount: e.matchCount }));
}

/** The paragraphs (source chunks) of a section, in document order. */
export function sectionChunks(anchor: string): string[] {
  return TEXTBOOK_CHUNKS.filter((c) => c.anchor === anchor)
    .sort((a, b) => a.id - b.id)
    .map((c) => c.text);
}
