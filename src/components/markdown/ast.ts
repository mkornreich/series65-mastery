// The single AST shared by the block parser, inline parser, math boundary, and
// all view components. No React, no react-native imports — pure types + a couple
// of pure helpers, so the parsers stay unit-testable in plain Node.
//
// DESIGN RULE: every node that can come from an UNTERMINATED construct carries
// `closed: boolean`. Parsers never throw; end-of-buffer is an implicit closer,
// so a partial stream always yields a valid (possibly closed:false) tree.

import type { MathExpr } from './math/mathAst';

// ------------------------------------------------------------------ Inline layer
export type SpanNode =
  | TextSpan
  | StrongSpan
  | EmphasisSpan
  | StrongEmphasisSpan
  | StrikeSpan
  | CodeSpan
  | LinkSpan
  | MathSpan
  | HardBreakSpan;

export interface TextSpan {
  type: 'text';
  value: string;
}
export interface StrongSpan {
  type: 'strong';
  children: SpanNode[];
  closed: boolean;
}
export interface EmphasisSpan {
  type: 'emphasis';
  children: SpanNode[];
  closed: boolean;
}
export interface StrongEmphasisSpan {
  type: 'strongEmphasis';
  children: SpanNode[];
  closed: boolean;
}
export interface StrikeSpan {
  type: 'strike';
  children: SpanNode[];
  closed: boolean;
}
export interface CodeSpan {
  type: 'codeSpan';
  value: string;
  closed: boolean;
}
export interface LinkSpan {
  type: 'link';
  href: string;
  children: SpanNode[];
  closed: boolean;
}
export interface MathSpan {
  type: 'mathInline';
  math: MathNode;
}
export interface HardBreakSpan {
  type: 'break';
}

// ------------------------------------------------------------------ Block layer
export type BlockNode =
  | HeadingBlock
  | ParagraphBlock
  | CodeBlock
  | ListBlock
  | BlockquoteBlock
  | ThematicBreakBlock
  | TableBlock
  | MathBlock;

export interface HeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: SpanNode[];
}
export interface ParagraphBlock {
  type: 'paragraph';
  children: SpanNode[];
}
export interface CodeBlock {
  type: 'codeBlock';
  lang: string | null;
  value: string;
  closed: boolean;
}
export interface ThematicBreakBlock {
  type: 'thematicBreak';
}
export interface BlockquoteBlock {
  type: 'blockquote';
  children: BlockNode[];
}
export interface ListBlock {
  type: 'list';
  ordered: boolean;
  start: number;
  items: ListItem[];
}
export interface ListItem {
  type: 'listItem';
  children: BlockNode[];
}
export interface TableBlock {
  type: 'table';
  header: TableCell[];
  align: ColumnAlign[];
  rows: TableCell[][];
  closed: boolean;
}
export interface TableCell {
  children: SpanNode[];
}
export type ColumnAlign = 'left' | 'center' | 'right' | null;

export interface MathBlock {
  type: 'mathBlock';
  math: MathNode;
}

// ------------------------------------------------------------------ Document root
export interface MarkdownDoc {
  type: 'doc';
  children: BlockNode[];
}

// ------------------------------------------------------------------ Math boundary
// The envelope is owned by the markdown layer; `root` is owned + shaped by the
// math module and is opaque here — markdown code never inspects it, only passes
// it to <MathView/>.
export interface MathNode {
  /** true = display ($$…$$, \[…\]); false = inline ($…$, \(…\)). */
  display: boolean;
  /** LaTeX source WITHOUT delimiters; retained so views can fall back to raw text. */
  raw: string;
  /** false when the closing delimiter has not streamed in yet. */
  closed: boolean;
  /** Parsed layout row. Opaque outside math/. */
  root: MathExpr[];
}

export type { MathExpr };

// ------------------------------------------------------------------ Parse options
export interface ParseOptions {
  /** How to show emphasis/strong/strike/link whose closer hasn't arrived yet.
   *  'plain' (default): render children unstyled until the closer streams in, so
   *  the only visible change on close is the style toggling on (no raw ** leak).
   *  'style': speculatively apply the style while open. */
  resolveUnterminated?: 'plain' | 'style';
  /** Enable GitHub pipe tables (default true). */
  tables?: boolean;
}

// ------------------------------------------------------------------ Helpers
const BLOCK_TYPES = new Set([
  'heading',
  'paragraph',
  'codeBlock',
  'list',
  'blockquote',
  'thematicBreak',
  'table',
  'mathBlock',
]);

export const isBlock = (n: { type: string }): n is BlockNode => BLOCK_TYPES.has(n.type);
