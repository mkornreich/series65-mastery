// LaTeX-subset parser: raw source (delimiters already stripped) -> MathExpr[].
// Total function: never throws, treats end-of-input as an implicit closer for
// every open construct, so a half-streamed formula still yields a usable tree.

import type { MathExpr, AccentKind } from './mathAst';
import type { MathNode } from '../ast';
import { SYMBOLS, SPACES, UPRIGHT_WRAPPERS, FUNCTIONS } from './symbols';

// LaTeX accent commands -> accent kind rendered over the base.
const ACCENTS: Record<string, AccentKind> = {
  bar: 'bar',
  overline: 'bar',
  hat: 'hat',
  widehat: 'hat',
  vec: 'vec',
  tilde: 'tilde',
  widetilde: 'tilde',
  dot: 'dot',
  ddot: 'ddot',
};

interface Cur {
  s: string;
  i: number;
}

const MAX_DEPTH = 40; // guard against pathological nesting (never stack-overflow)
const isAlpha = (c: string | undefined) => c !== undefined && /[A-Za-z]/.test(c);
const isLetter = (c: string) => /[A-Za-z]/.test(c);

// Fence delimiters that arrive as commands after \left / \right.
const DELIM_CMD: Record<string, string> = {
  '{': '{',
  '}': '}',
  lbrace: '{',
  rbrace: '}',
  langle: '⟨',
  rangle: '⟩',
  lvert: '|',
  rvert: '|',
  vert: '|',
  '|': '‖',
  lceil: '⌈',
  rceil: '⌉',
  lfloor: '⌊',
  rfloor: '⌋',
};

function skipSpaces(cur: Cur): void {
  while (cur.i < cur.s.length && (cur.s[cur.i] === ' ' || cur.s[cur.i] === '\t' || cur.s[cur.i] === '\n')) {
    cur.i++;
  }
}

function peekCmd(cur: Cur): string | null {
  if (cur.s[cur.i] !== '\\') return null;
  let j = cur.i + 1;
  let name = '';
  while (j < cur.s.length && isLetter(cur.s[j])) {
    name += cur.s[j];
    j++;
  }
  return name;
}

function consumeCmdName(cur: Cur): void {
  cur.i++; // backslash
  while (cur.i < cur.s.length && isLetter(cur.s[cur.i])) cur.i++;
}

// Parse a row of atoms until '}', a stray ']' (when stopBracket), \right, or EOF.
function parseRow(cur: Cur, depth: number, stopBracket = false): MathExpr[] {
  const out: MathExpr[] = [];
  if (depth > MAX_DEPTH) {
    // Degrade the rest to literal text rather than recursing further.
    const rest = cur.s.slice(cur.i);
    cur.i = cur.s.length;
    return rest ? [{ t: 'text', s: rest }] : [];
  }
  while (cur.i < cur.s.length) {
    const c = cur.s[cur.i];
    if (c === '}') break;
    if (stopBracket && c === ']') break;
    if (c === '\\' && peekCmd(cur) === 'right') break;
    if (c === '^' || c === '_') {
      const base = out.pop();
      out.push(parseScripts(cur, base ? [base] : [], depth));
      continue;
    }
    const before = cur.i;
    const atom = parseAtom(cur, depth);
    if (atom) out.push(atom);
    if (cur.i === before) cur.i++; // hard progress guarantee
  }
  return out;
}

function parseScripts(cur: Cur, base: MathExpr[], depth: number): MathExpr {
  let sup: MathExpr[] | undefined;
  let sub: MathExpr[] | undefined;
  while (cur.i < cur.s.length && (cur.s[cur.i] === '^' || cur.s[cur.i] === '_')) {
    const isSup = cur.s[cur.i] === '^';
    cur.i++;
    const arg = parseScriptArg(cur, depth);
    // Keep the first of a repeated ^/_ ("x^2^3") instead of dropping a glyph.
    if (isSup) {
      if (sup === undefined) sup = arg;
    } else if (sub === undefined) {
      sub = arg;
    }
  }
  return { t: 'script', base, sup, sub };
}

function parseScriptArg(cur: Cur, depth: number): MathExpr[] {
  skipSpaces(cur);
  const c = cur.s[cur.i];
  if (c === undefined || c === '}' || c === '^' || c === '_') return [];
  if (c === '{') {
    cur.i++;
    const kids = parseRow(cur, depth + 1);
    if (cur.s[cur.i] === '}') cur.i++;
    return kids;
  }
  if (c === '\\') {
    const node = parseCommand(cur, depth);
    return node ? [node] : [];
  }
  cur.i++;
  return [{ t: 'text', s: c, upright: !isLetter(c) }];
}

function parseAtom(cur: Cur, depth: number): MathExpr | null {
  const c = cur.s[cur.i];
  if (c === ' ' || c === '\t' || c === '\n') {
    cur.i++;
    return null;
  }
  if (c === '{') {
    cur.i++;
    const kids = parseRow(cur, depth + 1);
    if (cur.s[cur.i] === '}') cur.i++;
    return { t: 'group', kids };
  }
  if (c === '\\') return parseCommand(cur, depth);
  cur.i++;
  return { t: 'text', s: c, upright: !isLetter(c) };
}

function readGroup(cur: Cur, depth: number): MathExpr[] {
  skipSpaces(cur);
  if (cur.s[cur.i] === '{') {
    cur.i++;
    const kids = parseRow(cur, depth + 1);
    if (cur.s[cur.i] === '}') cur.i++;
    return kids;
  }
  const atom = parseAtom(cur, depth);
  return atom ? [atom] : [];
}

// Capture literal text inside a {...} (for \text / \mathrm), preserving spaces.
function readRawGroup(cur: Cur): string {
  skipSpaces(cur);
  if (cur.s[cur.i] !== '{') {
    const c = cur.s[cur.i];
    if (c === undefined) return '';
    cur.i++;
    return c;
  }
  cur.i++;
  let depth = 1;
  let out = '';
  while (cur.i < cur.s.length && depth > 0) {
    const c = cur.s[cur.i];
    if (c === '{') {
      depth++;
      out += c;
      cur.i++;
    } else if (c === '}') {
      depth--;
      if (depth === 0) {
        cur.i++;
        break;
      }
      out += c;
      cur.i++;
    } else if (c === '\\' && cur.i + 1 < cur.s.length && !isLetter(cur.s[cur.i + 1])) {
      out += cur.s[cur.i + 1]; // \% -> %, \$ -> $
      cur.i += 2;
    } else {
      out += c;
      cur.i++;
    }
  }
  return out;
}

function readDelim(cur: Cur): string {
  skipSpaces(cur);
  const c = cur.s[cur.i];
  if (c === undefined) return '.';
  if (c === '\\') {
    cur.i++;
    const n = cur.s[cur.i];
    if (isAlpha(n)) {
      let name = '';
      while (cur.i < cur.s.length && isLetter(cur.s[cur.i])) {
        name += cur.s[cur.i];
        cur.i++;
      }
      return DELIM_CMD[name] ?? '.';
    }
    cur.i++;
    return DELIM_CMD[n] ?? n; // \{ -> {
  }
  cur.i++;
  return c; // ( ) [ ] . |
}

function parseCommand(cur: Cur, depth: number): MathExpr | null {
  cur.i++; // consume backslash
  if (cur.i >= cur.s.length) return { t: 'text', s: '\\' }; // lone backslash at EOF
  const c = cur.s[cur.i];
  if (!isLetter(c)) {
    cur.i++;
    if (c === ',' || c === ';' || c === ':' || c === ' ' || c === '!') {
      return { t: 'space', em: SPACES[c] ?? 0.3 };
    }
    if (c === '\\') return { t: 'space', em: 0 }; // \\ line break -> treat as nothing inline
    return { t: 'text', s: c, upright: true }; // \% \$ \# \& \{ \} \_
  }
  let name = '';
  while (cur.i < cur.s.length && isLetter(cur.s[cur.i])) {
    name += cur.s[cur.i];
    cur.i++;
  }
  return applyCommand(cur, name, depth);
}

function applyCommand(cur: Cur, name: string, depth: number): MathExpr | null {
  if (name === 'frac' || name === 'dfrac' || name === 'tfrac' || name === 'cfrac') {
    const num = readGroup(cur, depth);
    const den = readGroup(cur, depth);
    return { t: 'frac', num, den };
  }
  if (name === 'sqrt') {
    let index: MathExpr[] | undefined;
    skipSpaces(cur);
    if (cur.s[cur.i] === '[') {
      cur.i++;
      index = parseRow(cur, depth + 1, true);
      if (cur.s[cur.i] === ']') cur.i++;
    }
    const rad = readGroup(cur, depth);
    return { t: 'sqrt', index, rad };
  }
  if (UPRIGHT_WRAPPERS.has(name)) {
    const raw = readRawGroup(cur);
    return { t: 'text', s: raw, upright: true };
  }
  const accent = ACCENTS[name];
  if (accent) {
    return { t: 'accent', kind: accent, base: readGroup(cur, depth) };
  }
  if (name === 'left') {
    const left = readDelim(cur);
    const kids = parseRow(cur, depth + 1);
    let open = true;
    let right = '.';
    if (cur.s[cur.i] === '\\' && peekCmd(cur) === 'right') {
      consumeCmdName(cur);
      right = readDelim(cur);
      open = false;
    }
    return { t: 'fence', left, right, kids, open };
  }
  if (name === 'right') {
    // stray \right with no \left — swallow its delimiter, render literally
    const d = readDelim(cur);
    return { t: 'text', s: d === '.' ? '' : d, upright: true };
  }
  if (SPACES[name] != null) return { t: 'space', em: SPACES[name] };
  if (FUNCTIONS.has(name)) return { t: 'text', s: name, upright: true };
  const sym = SYMBOLS[name];
  if (sym) return { t: 'sym', s: sym };
  // Unknown command: render literally so nothing silently disappears.
  return { t: 'text', s: '\\' + name, upright: true };
}

export function parseMathRoot(raw: string): MathExpr[] {
  try {
    return parseRow({ s: raw, i: 0 }, 0);
  } catch {
    return raw ? [{ t: 'text', s: raw }] : [];
  }
}

/** Boundary entry point used by the markdown layer. */
export function parseMath(raw: string, opts: { display: boolean; closed: boolean }): MathNode {
  return {
    display: opts.display,
    raw,
    closed: opts.closed,
    root: parseMathRoot(raw),
  };
}
