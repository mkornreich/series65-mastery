// In-app textbook reader model. The textbook lives as section-chunks in
// textbookChunks.ts (also used by the RAG retriever); here we reconstruct whole
// sections for reading and expose a table of contents. Anchors match the RAG
// citations, so an AI answer's "Textbook sections" links resolve straight to
// the section screen.
import { TEXTBOOK_CHUNKS } from './textbookChunks';

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
