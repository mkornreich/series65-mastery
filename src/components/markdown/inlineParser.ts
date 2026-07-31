// Char-based inline scanner: one logical paragraph/line -> SpanNode[].
// Total function; unmatched delimiters degrade to a closed:false node (rendered
// per ParseOptions.resolveUnterminated) or to literal text, never a throw.

import { ParseOptions, SpanNode } from './ast';
import { isEscaped, tryOpenInlineMath, hasMathSignal } from './scanner';
import { parseMath } from './math/parseMath';

interface Cur {
  s: string;
  i: number;
}

// Markdown punctuation that a backslash can escape into a literal.
const ESCAPABLE = new Set(['\\', '`', '*', '_', '{', '}', '[', ']', '(', ')', '#', '+', '-', '.', '!', '~', '|', '$', '"', "'", '>', '<']);

const isAlnum = (c: string | undefined) => c !== undefined && /[0-9A-Za-z]/.test(c);

function wrapEmphasis(runLen: number, children: SpanNode[], closed: boolean): SpanNode {
  if (runLen >= 3) return { type: 'strongEmphasis', children, closed };
  if (runLen === 2) return { type: 'strong', children, closed };
  return { type: 'emphasis', children, closed };
}

function parseSpans(cur: Cur, opts: ParseOptions, stops: string[]): { nodes: SpanNode[]; hitStop: string | null } {
  const s = cur.s;
  const nodes: SpanNode[] = [];
  let text = '';
  const flush = () => {
    if (text) {
      nodes.push({ type: 'text', value: text });
      text = '';
    }
  };
  // Longest-first so "**" wins over "*" when both are active closers.
  const sortedStops = stops.length > 1 ? [...stops].sort((a, b) => b.length - a.length) : stops;

  while (cur.i < s.length) {
    // Active closer for an enclosing construct?
    let stopped: string | null = null;
    for (const st of sortedStops) {
      if (st && s.startsWith(st, cur.i)) {
        stopped = st;
        break;
      }
    }
    if (stopped) {
      flush();
      return { nodes, hitStop: stopped };
    }

    const c = s[cur.i];
    const c2 = s[cur.i + 1];

    // Math delimiters \( \[ must be checked before the generic backslash-escape.
    if (c === '\\' && (c2 === '(' || c2 === '[')) {
      flush();
      const display = c2 === '[';
      const closeTok = display ? '\\]' : '\\)';
      const close = s.indexOf(closeTok, cur.i + 2);
      const body = close < 0 ? s.slice(cur.i + 2) : s.slice(cur.i + 2, close);
      nodes.push({ type: 'mathInline', math: parseMath(body, { display, closed: close >= 0 }) });
      cur.i = close < 0 ? s.length : close + 2;
      continue;
    }

    // Backslash escape of a literal punctuation char.
    if (c === '\\' && c2 !== undefined && ESCAPABLE.has(c2)) {
      text += c2;
      cur.i += 2;
      continue;
    }

    // Inline code span (literal content; underscores/asterisks inside stay literal).
    if (c === '`') {
      let n = 0;
      while (s[cur.i + n] === '`') n++;
      const fence = '`'.repeat(n);
      flush();
      const start = cur.i + n;
      const close = s.indexOf(fence, start);
      if (close < 0) {
        nodes.push({ type: 'codeSpan', value: s.slice(start), closed: false });
        cur.i = s.length;
      } else {
        nodes.push({ type: 'codeSpan', value: s.slice(start, close), closed: true });
        cur.i = close + n;
      }
      continue;
    }

    // Display math $$…$$ appearing inline. Guard against a literal "$$" in prose:
    // with no closer yet, only open if the body already looks like LaTeX (a signal
    // char), else keep "$$" literal so it doesn't swallow the rest of the paragraph.
    if (c === '$' && c2 === '$' && !isEscaped(s, cur.i)) {
      const close = s.indexOf('$$', cur.i + 2);
      const body = close < 0 ? s.slice(cur.i + 2) : s.slice(cur.i + 2, close);
      if (close < 0 && !hasMathSignal(body)) {
        text += '$$';
        cur.i += 2;
        continue;
      }
      flush();
      nodes.push({ type: 'mathInline', math: parseMath(body, { display: true, closed: close >= 0 }) });
      cur.i = close < 0 ? s.length : close + 2;
      continue;
    }

    // Inline math $…$ — only when the currency heuristic says it's really math.
    if (c === '$' && !isEscaped(s, cur.i)) {
      const close = tryOpenInlineMath(s, cur.i);
      if (close < 0) {
        text += c;
        cur.i++;
        continue;
      }
      flush();
      nodes.push({ type: 'mathInline', math: parseMath(s.slice(cur.i + 1, close), { display: false, closed: true }) });
      cur.i = close + 1;
      continue;
    }

    // Links [label](href)
    if (c === '[') {
      const closeBracket = s.indexOf(']', cur.i + 1);
      if (closeBracket >= 0 && s[closeBracket + 1] === '(') {
        const closeParen = s.indexOf(')', closeBracket + 2);
        if (closeParen >= 0) {
          flush();
          const label = s.slice(cur.i + 1, closeBracket);
          const href = s.slice(closeBracket + 2, closeParen).trim();
          nodes.push({ type: 'link', href, children: parseInline(label, opts), closed: true });
          cur.i = closeParen + 1;
          continue;
        }
      }
      text += c;
      cur.i++;
      continue;
    }

    // Strikethrough ~~…~~
    if (c === '~' && c2 === '~') {
      flush();
      cur.i += 2;
      const inner = parseSpans(cur, opts, ['~~', ...stops]);
      if (inner.hitStop === '~~') {
        cur.i += 2;
        nodes.push({ type: 'strike', children: inner.nodes, closed: true });
      } else if (inner.hitStop && stops.includes(inner.hitStop)) {
        nodes.push({ type: 'text', value: '~~' }, ...inner.nodes);
        return { nodes, hitStop: inner.hitStop };
      } else {
        nodes.push({ type: 'strike', children: inner.nodes, closed: false });
      }
      continue;
    }

    // Emphasis / strong *…* **…** ***…*** and _ variants.
    if (c === '*' || c === '_') {
      // Underscore does not open/close inside a word (snake_case stays literal).
      if (c === '_' && isAlnum(s[cur.i - 1]) && isAlnum(c2)) {
        text += c;
        cur.i++;
        continue;
      }
      let n = 0;
      while (s[cur.i + n] === c) n++;
      // Left-flanking: a delimiter run followed by whitespace/EOF cannot OPEN
      // emphasis, so a spaced operator like "5 * 3" or "P * Q" stays literal.
      const afterRun = s[cur.i + n];
      if (afterRun === undefined || /\s/.test(afterRun)) {
        text += c;
        cur.i++;
        continue;
      }
      const runLen = Math.min(n, 3);
      const token = c.repeat(runLen);
      flush();
      cur.i += runLen;
      const inner = parseSpans(cur, opts, [token, ...stops]);
      if (inner.hitStop === token) {
        cur.i += token.length;
        nodes.push(wrapEmphasis(runLen, inner.nodes, true));
      } else if (inner.hitStop && stops.includes(inner.hitStop)) {
        // A parent's closer arrived first: our opener is unmatched -> literal.
        nodes.push({ type: 'text', value: token }, ...inner.nodes);
        return { nodes, hitStop: inner.hitStop };
      } else {
        nodes.push(wrapEmphasis(runLen, inner.nodes, false));
      }
      continue;
    }

    // Newline inside a paragraph -> soft break (space).
    if (c === '\n') {
      if (!text.endsWith(' ')) text += ' ';
      cur.i++;
      continue;
    }

    text += c;
    cur.i++;
  }
  flush();
  return { nodes, hitStop: null };
}

export function parseInline(src: string, opts: ParseOptions = {}): SpanNode[] {
  return parseSpans({ s: src, i: 0 }, opts, []).nodes;
}
