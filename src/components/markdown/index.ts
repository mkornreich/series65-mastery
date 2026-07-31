// Public entry point for the streaming-safe markdown + LaTeX-math renderer.
// Pure-TS parsers (no react-native) live in ast/scanner/inlineParser/blockParser
// + math/; the React views wrap them. Designed to tolerate partial input on every
// streamed token — see blockParser/inlineParser (total, never-throw).

export { Markdown } from './Markdown';
export type { MarkdownProps } from './Markdown';
export { parseDocument } from './blockParser';
export { parseInline } from './inlineParser';
export type {
  MarkdownDoc,
  BlockNode,
  SpanNode,
  MathNode,
  ParseOptions,
} from './ast';
