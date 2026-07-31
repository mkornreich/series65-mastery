// Inline math -> a single Unicode string, so inline formulas render as an
// ordinary <Text> run that flows and wraps with the surrounding prose (RN/Fabric
// forbids a <View> inside <Text>, which rules out a 2-D layout inline). Uses real
// Unicode super/subscripts and Greek where available; fractions become "a/b".
// Display math uses the full 2-D layout instead (see MathView).

import type { MathExpr } from './mathAst';

const SUP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', '.': '·',
  a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ', i: 'ⁱ', j: 'ʲ', k: 'ᵏ',
  l: 'ˡ', m: 'ᵐ', n: 'ⁿ', o: 'ᵒ', p: 'ᵖ', r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ', z: 'ᶻ',
  A: 'ᴬ', B: 'ᴮ', D: 'ᴰ', E: 'ᴱ', G: 'ᴳ', H: 'ᴴ', I: 'ᴵ', J: 'ᴶ', K: 'ᴷ', L: 'ᴸ', M: 'ᴹ',
  N: 'ᴺ', O: 'ᴼ', P: 'ᴾ', R: 'ᴿ', T: 'ᵀ', U: 'ᵁ', V: 'ⱽ', W: 'ᵂ',
};

const SUB: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ',
  p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ',
};

const OPERATORS = ['+', '−', '-', '±', '∓', '×', '÷', '⋅', '·', '∑', '∏', '∫'];

function mapAll(s: string, table: Record<string, string>): string | null {
  let out = '';
  for (const ch of s) {
    const m = table[ch];
    if (m === undefined) return null;
    out += m;
  }
  return out;
}

function hasOperator(s: string): boolean {
  return OPERATORS.some((op) => s.includes(op));
}

function supOf(s: string): string {
  if (!s) return '';
  return mapAll(s, SUP) ?? '^' + (s.length > 1 ? `(${s})` : s);
}
function subOf(s: string): string {
  if (!s) return '';
  return mapAll(s, SUB) ?? '_' + (s.length > 1 ? `(${s})` : s);
}

function delimGlyph(d: string): string {
  if (d === '.' || d === '') return '';
  return d;
}

// Combining diacritics so an inline accent stays a single text run (x̄, x̂, …).
const ACCENT_COMBINING: Record<string, string> = {
  bar: '̄', // combining macron
  hat: '̂', // combining circumflex
  vec: '⃗', // combining right arrow above
  tilde: '̃', // combining tilde
  dot: '̇', // combining dot above
  ddot: '̈', // combining diaeresis
};

function applyCombining(s: string, mark: string): string {
  // Attach the mark to each base character so a multi-char base is fully covered.
  return [...s].map((ch) => (/\s/.test(ch) ? ch : ch + mark)).join('');
}

function row(nodes: MathExpr[]): string {
  return nodes.map(atom).join('');
}

function maybeParen(nodes: MathExpr[]): string {
  const s = row(nodes);
  if (nodes.length > 1 && hasOperator(s)) return `(${s})`;
  return s;
}

function atom(n: MathExpr): string {
  switch (n.t) {
    case 'text':
      return n.s;
    case 'sym':
      return n.s;
    case 'space':
      return n.em <= 0 ? '' : ' ';
    case 'group':
      return row(n.kids);
    case 'frac':
      return `${maybeParen(n.num)}/${maybeParen(n.den)}`;
    case 'sqrt': {
      const idx = n.index && n.index.length ? row(n.index) : '';
      const rad = n.rad;
      const body = rad.length > 1 && hasOperator(row(rad)) ? `(${row(rad)})` : row(rad);
      return `${idx}√${body}`;
    }
    case 'fence':
      return `${delimGlyph(n.left)}${row(n.kids)}${n.open ? '' : delimGlyph(n.right)}`;
    case 'accent':
      return applyCombining(row(n.base), ACCENT_COMBINING[n.kind] ?? '');
    case 'script': {
      let out = row(n.base);
      if (n.sup) out += supOf(row(n.sup));
      if (n.sub) out += subOf(row(n.sub));
      return out;
    }
    default:
      return '';
  }
}

/** Render a parsed math row as an inline Unicode string. */
export function mathToUnicode(nodes: MathExpr[]): string {
  return row(nodes);
}
