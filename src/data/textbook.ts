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
