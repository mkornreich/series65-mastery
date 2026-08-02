// Line-based block scanner: markdown source -> MarkdownDoc. Total function;
// end-of-buffer implicitly closes any open fence/table/display-math (emitting a
// closed:false node) so a partial stream always parses.

import {
  BlockNode,
  ColumnAlign,
  ListItem,
  MarkdownDoc,
  ParseOptions,
  TableCell,
} from './ast';
import { parseInline } from './inlineParser';
import { parseMath } from './math/parseMath';

const MAX_DEPTH = 12;

const RE_HEADING = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const RE_FENCE = /^(\s*)(`{3,}|~{3,})(.*)$/;
const RE_FENCE_CLOSE = /^(\s*)(`{3,}|~{3,})\s*$/;
const RE_HR = /^ {0,3}([-*_])[ \t]*(?:\1[ \t]*){2,}$/;
const RE_QUOTE = /^ {0,3}>/;
const RE_LIST_ITEM = /^(\s*)([-*+]|\d{1,9}[.)])[ \t]+(.*)$/;

interface ListMatch {
  indent: number;
  marker: string;
  ordered: boolean;
  content: string;
}

function matchListItem(line: string): ListMatch | null {
  const m = RE_LIST_ITEM.exec(line);
  if (!m) return null;
  return { indent: m[1].length, marker: m[2], ordered: /\d/.test(m[2]), content: m[3] };
}

const indentOf = (l: string) => l.length - l.trimStart().length;

function isDelimRow(l: string): boolean {
  if (!l.includes('-')) return false;
  return /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/.test(l);
}

function splitRow(line: string): string[] {
  let t = line.trim();
  if (t.startsWith('|')) t = t.slice(1);
  // drop a single unescaped trailing pipe
  if (t.endsWith('|') && !t.endsWith('\\|')) t = t.slice(0, -1);
  const cells: string[] = [];
  let cur = '';
  for (let k = 0; k < t.length; k++) {
    if (t[k] === '\\' && t[k + 1] === '|') {
      cur += '|';
      k++;
    } else if (t[k] === '|') {
      cells.push(cur);
      cur = '';
    } else {
      cur += t[k];
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

function parseAlign(cell: string): ColumnAlign {
  const c = cell.trim();
  const left = c.startsWith(':');
  const right = c.endsWith(':');
  if (left && right) return 'center';
  if (right) return 'right';
  if (left) return 'left';
  return null;
}

// A display-math opener: "$$" or "\[". Returns [openTok, closeTok] or null.
function displayOpen(trimmed: string): [string, string] | null {
  if (trimmed.startsWith('$$')) return ['$$', '$$'];
  if (trimmed.startsWith('\\[')) return ['\\[', '\\]'];
  return null;
}

// Does the line at index i begin a new block (used to terminate a paragraph)?
function isBlockStart(lines: string[], i: number): boolean {
  const l = lines[i];
  if (l.trim() === '') return true;
  if (RE_HEADING.test(l)) return true;
  if (RE_FENCE.test(l)) return true;
  if (RE_HR.test(l)) return true;
  if (RE_QUOTE.test(l)) return true;
  if (matchListItem(l)) return true;
  if (displayOpen(l.trim())) return true;
  if (l.includes('|') && i + 1 < lines.length && isDelimRow(lines[i + 1])) return true;
  return false;
}

function cell(text: string, opts: ParseOptions): TableCell {
  return { children: parseInline(text, opts) };
}

function parseList(
  lines: string[],
  start: number,
  opts: ParseOptions,
  depth: number
): { block: BlockNode; next: number } {
  const first = matchListItem(lines[start])!;
  const baseIndent = first.indent;
  const ordered = first.ordered;
  const parsedStart = parseInt(first.marker, 10);
  // `|| 1` would coerce a legitimate start of 0 to 1; guard on NaN instead.
  const startNum = ordered && !Number.isNaN(parsedStart) ? parsedStart : 1;
  const items: ListItem[] = [];
  let i = start;

  while (i < lines.length) {
    const l = lines[i];
    if (l.trim() === '') {
      // Skip blank(s) only if the list continues after them (loose list).
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j++;
      const nm = j < lines.length ? matchListItem(lines[j]) : null;
      if (nm && nm.indent === baseIndent && nm.ordered === ordered) {
        i = j;
        continue;
      }
      break;
    }
    const m = matchListItem(l);
    if (!m || indentOf(l) !== baseIndent || m.ordered !== ordered) break;

    const contentIndent = baseIndent + m.marker.length + 1;
    const body = [m.content];
    i++;
    while (i < lines.length) {
      const bl = lines[i];
      if (bl.trim() === '') {
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === '') j++;
        if (j < lines.length && indentOf(lines[j]) > baseIndent) {
          body.push('');
          i++;
          continue;
        }
        break;
      }
      if (indentOf(bl) > baseIndent) {
        body.push(bl.slice(Math.min(indentOf(bl), contentIndent)));
        i++;
        continue;
      }
      break;
    }
    while (body.length && body[body.length - 1] === '') body.pop();
    items.push({ type: 'listItem', children: parseBlocks(body, opts, depth + 1) });
  }

  return { block: { type: 'list', ordered, start: startNum, items }, next: i };
}

export function parseBlocks(lines: string[], opts: ParseOptions, depth = 0): BlockNode[] {
  const blocks: BlockNode[] = [];
  const tables = opts.tables !== false;
  let i = 0;

  if (depth > MAX_DEPTH) {
    const text = lines.join('\n').trim();
    return text ? [{ type: 'paragraph', children: parseInline(text, opts) }] : [];
  }

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Fenced code block
    const fence = RE_FENCE.exec(line);
    if (fence) {
      const marker = fence[2][0];
      const minLen = fence[2].length;
      const lang = fence[3].trim() || null;
      i++;
      const body: string[] = [];
      let closed = false;
      while (i < lines.length) {
        const cl = RE_FENCE_CLOSE.exec(lines[i]);
        if (cl && cl[2][0] === marker && cl[2].length >= minLen) {
          closed = true;
          i++;
          break;
        }
        body.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'codeBlock', lang, value: body.join('\n'), closed });
      continue;
    }

    // Display math ($$…$$ or \[…\])
    const disp = displayOpen(line.trim());
    if (disp) {
      const [openTok, closeTok] = disp;
      const trimmed = line.trim();
      const afterOpen = trimmed.slice(openTok.length);
      const sameLineClose = afterOpen.indexOf(closeTok);
      if (sameLineClose >= 0) {
        const bodyText = afterOpen.slice(0, sameLineClose);
        blocks.push({ type: 'mathBlock', math: parseMath(bodyText.trim(), { display: true, closed: true }) });
        // Keep any text after the closing delimiter on the same line (e.g. a label).
        const rest = afterOpen.slice(sameLineClose + closeTok.length);
        if (rest.trim()) lines[i] = rest;
        else i++;
        continue;
      }
      const body: string[] = afterOpen ? [afterOpen] : [];
      i++;
      let closed = false;
      let tail = '';
      while (i < lines.length) {
        const idx = lines[i].indexOf(closeTok);
        if (idx >= 0) {
          if (lines[i].slice(0, idx).trim()) body.push(lines[i].slice(0, idx));
          closed = true;
          tail = lines[i].slice(idx + closeTok.length);
          break;
        }
        body.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'mathBlock', math: parseMath(body.join('\n').trim(), { display: true, closed }) });
      if (tail.trim()) lines[i] = tail;
      else i++;
      continue;
    }

    // ATX heading
    const h = RE_HEADING.exec(line);
    if (h) {
      const level = h[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({ type: 'heading', level, children: parseInline(h[2], opts) });
      i++;
      continue;
    }

    // Thematic break
    if (RE_HR.test(line)) {
      blocks.push({ type: 'thematicBreak' });
      i++;
      continue;
    }

    // Blockquote
    if (RE_QUOTE.test(line)) {
      const inner: string[] = [];
      while (i < lines.length && RE_QUOTE.test(lines[i])) {
        inner.push(lines[i].replace(/^ {0,3}>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', children: parseBlocks(inner, opts, depth + 1) });
      continue;
    }

    // Pipe table
    if (tables && line.includes('|') && i + 1 < lines.length && isDelimRow(lines[i + 1])) {
      const header = splitRow(line).map((c) => cell(c, opts));
      const align = splitRow(lines[i + 1]).map(parseAlign);
      i += 2;
      const rows: TableCell[][] = [];
      while (i < lines.length && lines[i].trim() !== '' && lines[i].includes('|')) {
        rows.push(splitRow(lines[i]).map((c) => cell(c, opts)));
        i++;
      }
      blocks.push({ type: 'table', header, align, rows, closed: true });
      continue;
    }

    // List
    if (matchListItem(line)) {
      const { block, next } = parseList(lines, i, opts, depth);
      blocks.push(block);
      i = next;
      continue;
    }

    // Paragraph: gather until blank or a new block start
    const para = [line];
    i++;
    while (i < lines.length && !isBlockStart(lines, i)) {
      para.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'paragraph', children: parseInline(para.join('\n'), opts) });
  }

  return blocks;
}

export function parseDocument(src: string, opts: ParseOptions = {}): MarkdownDoc {
  const lines = (src ?? '').replace(/\r\n?/g, '\n').split('\n');
  return { type: 'doc', children: parseBlocks(lines, opts, 0) };
}
