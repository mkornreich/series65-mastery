// The math layout tree. Owned by the math module; the markdown layer treats it
// as opaque and only forwards it to <MathView/>.
//
// A parsed math expression is a *row* of atoms: MathExpr[]. Every parse function
// is total (never throws) and treats end-of-input as an implicit closer, so a
// half-streamed formula like `\frac{a}{` still yields a valid (if incomplete)
// tree. Structure nodes carry what they have so far and fill in as tokens arrive.

export type MathExpr =
  | MathText // a run of literal characters (letters render italic, the rest upright)
  | MathSym // a symbol looked up from the LaTeX command map (×, ≤, σ, …)
  | MathGroup // a { … } grouping or \text{…}/\mathrm{…} wrapper
  | MathFrac // \frac{num}{den}
  | MathScript // base with a superscript and/or subscript (x^2, r_f, S_t^{max})
  | MathSqrt // \sqrt{…} or \sqrt[n]{…}
  | MathFence // \left( … \right) with auto-sized delimiters
  | MathSpace; // an explicit spacer (\,  \;  \quad)

export interface MathText {
  t: 'text';
  s: string;
  /** Force upright (non-italic). Set for \text{}/\mathrm{} content and digits. */
  upright?: boolean;
}
export interface MathSym {
  t: 'sym';
  s: string;
}
export interface MathGroup {
  t: 'group';
  kids: MathExpr[];
}
export interface MathFrac {
  t: 'frac';
  num: MathExpr[];
  den: MathExpr[];
}
export interface MathScript {
  t: 'script';
  base: MathExpr[];
  sup?: MathExpr[];
  sub?: MathExpr[];
}
export interface MathSqrt {
  t: 'sqrt';
  index?: MathExpr[];
  rad: MathExpr[];
}
export interface MathFence {
  t: 'fence';
  left: string; // the raw delimiter glyph, e.g. "(", "[", "\\{", or "." for invisible
  right: string;
  kids: MathExpr[];
  /** true while the matching \right has not been seen yet. */
  open: boolean;
}
export interface MathSpace {
  t: 'space';
  /** width in em-ish units (1 ≈ one space) */
  em: number;
}

/** True if a row contains any 2-D construct that must break out of <Text> flow. */
export function hasBlockAtom(nodes: MathExpr[]): boolean {
  return nodes.some(
    (n) =>
      n.t === 'frac' ||
      n.t === 'sqrt' ||
      n.t === 'fence' ||
      (n.t === 'group' && hasBlockAtom(n.kids)) ||
      (n.t === 'script' &&
        (hasBlockAtom(n.sup ?? []) || hasBlockAtom(n.sub ?? []) || hasBlockAtom(n.base)))
  );
}
