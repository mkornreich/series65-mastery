// Node parser tests (no react-native). Run via:
//   tsc __tests__/run.ts --ignoreConfig ... && node run.js
// Asserts (A) streaming never-throws on every prefix and (B) targeted structure.

import { CORPUS } from './corpus';
import { parseDocument } from '../blockParser';
import { parseInline } from '../inlineParser';
import { BlockNode, SpanNode, MarkdownDoc } from '../ast';
import type { MathExpr } from '../math/mathAst';
import { mathToUnicode } from '../math/inlineMath';

const mathToUnicodeSafe = (mb: any): string => (mb ? mathToUnicode(mb.math.root) : '');

let pass = 0;
let fail = 0;
const failures: string[] = [];
function check(name: string, cond: boolean, detail = '') {
  if (cond) pass++;
  else {
    fail++;
    failures.push(`✗ ${name}${detail ? ' — ' + detail : ''}`);
  }
}

// ---- tree walkers -------------------------------------------------
function walkSpans(spans: SpanNode[], visit: (s: SpanNode) => void) {
  for (const s of spans) {
    visit(s);
    if ('children' in s && Array.isArray((s as any).children)) walkSpans((s as any).children, visit);
  }
}
function allBlocks(blocks: BlockNode[], visit: (b: BlockNode) => void) {
  for (const b of blocks) {
    visit(b);
    if (b.type === 'blockquote') allBlocks(b.children, visit);
    if (b.type === 'list') for (const it of b.items) allBlocks(it.children, visit);
  }
}
function spansOf(b: BlockNode): SpanNode[] {
  if (b.type === 'heading' || b.type === 'paragraph') return b.children;
  return [];
}
function countMathSpans(blocks: BlockNode[]): number {
  let n = 0;
  const tally = (s: SpanNode) => { if (s.type === 'mathInline') n++; };
  allBlocks(blocks, (b) => {
    walkSpans(spansOf(b), tally);
    if (b.type === 'table') {
      for (const c of [...b.header, ...b.rows.flat()]) walkSpans(c.children, tally);
    }
  });
  return n;
}
function plainText(blocks: BlockNode[]): string {
  let out = '';
  const visit = (s: SpanNode) => { if (s.type === 'text') out += s.value; };
  allBlocks(blocks, (b) => {
    walkSpans(spansOf(b), visit);
    if (b.type === 'table') for (const c of [...b.header, ...b.rows.flat()]) walkSpans(c.children, visit);
  });
  return out;
}
function emphasisCount(blocks: BlockNode[]): number {
  let n = 0;
  allBlocks(blocks, (b) =>
    walkSpans(spansOf(b), (s) => {
      if (s.type === 'emphasis' || s.type === 'strong' || s.type === 'strongEmphasis') n++;
    })
  );
  return n;
}
function findBlock(doc: MarkdownDoc, type: string): BlockNode | undefined {
  let found: BlockNode | undefined;
  allBlocks(doc.children, (b) => { if (!found && b.type === type) found = b; });
  return found;
}
function mathHasType(root: MathExpr[], t: string): boolean {
  for (const n of root) {
    if ((n as any).t === t) return true;
    const kids: MathExpr[][] = [];
    const a = n as any;
    if (a.kids) kids.push(a.kids);
    if (a.num) kids.push(a.num);
    if (a.den) kids.push(a.den);
    if (a.rad) kids.push(a.rad);
    if (a.base) kids.push(a.base);
    if (a.sup) kids.push(a.sup);
    if (a.sub) kids.push(a.sub);
    if (a.index) kids.push(a.index);
    for (const k of kids) if (mathHasType(k, t)) return true;
  }
  return false;
}
const byId = (id: string) => CORPUS.find((c) => c.id === id || c.id.startsWith(id + '-'))!;

// ---- (A) streaming never-throws ----------------------------------
let prefixThrows = 0;
for (const c of CORPUS) {
  for (let len = 0; len <= c.raw.length; len++) {
    try {
      const doc = parseDocument(c.raw.slice(0, len));
      // touch the tree to force any lazy blowups
      JSON.stringify(doc).length;
    } catch (e) {
      prefixThrows++;
      failures.push(`✗ throw on prefix len=${len} of ${c.id}: ${(e as Error).message}`);
      break;
    }
  }
}
check(`streaming: no throws across all prefixes of all ${CORPUS.length} cases`, prefixThrows === 0, `${prefixThrows} throwing prefixes`);

// ---- (B) targeted structural assertions --------------------------

// Dollar ambiguity: pure-currency prose has zero math spans.
check('adv-01 currency-only prose → 0 math spans', countMathSpans(parseDocument(byId('adv-01').raw).children) === 0);
check('adv-02 dollar ranges → 0 math spans', countMathSpans(parseDocument(byId('adv-02').raw).children) === 0);

// im-01: exactly the two real math spans ($CY=…$ and $5.26\%$); $50/$950 stay literal.
check('im-01 → exactly 2 math spans', countMathSpans(parseDocument(byId('im-01').raw).children) === 2,
  `got ${countMathSpans(parseDocument(byId('im-01').raw).children)}`);
// Regression: the "$50 … $5.26\%$" run must NOT be swallowed into one giant math span.
{
  const pt = plainText(parseDocument(byId('im-01').raw).children);
  check('im-01 → prose "a year trading at" stays plain text', pt.includes('a year trading at'), `plain="${pt}"`);
  check('im-01 → prose "has a current yield of about" stays plain text', pt.includes('has a current yield of about'));
}

// Regression (finding #1): a spaced "*" operator is not emphasis.
{
  const doc = parseDocument('You get 5 * 3 = 15 units and 2 * 4 = 8 total.');
  check('operator: "5 * 3" → 0 emphasis spans', emphasisCount(doc.children) === 0, `got ${emphasisCount(doc.children)}`);
  check('operator: asterisks preserved as text', plainText(doc.children).includes('*'));
}

// A fully-delimited bare number is math (models write $1.0$, $0$); currency ("$50",
// "$1,000" with no closing $) stays literal.
{
  const doc = parseDocument('A beta of $1.0$ or $0$ is common.');
  check('bare $1.0$/$0$ → 2 math spans', countMathSpans(doc.children) === 2, `got ${countMathSpans(doc.children)}`);
  check('bare $1.0$ → no stray $ in prose', !plainText(doc.children).includes('$'), `text="${plainText(doc.children)}"`);
}
{
  const doc = parseDocument('The bond costs $1,000 and pays $50 yearly.');
  check('currency $1,000/$50 → 0 math spans', countMathSpans(doc.children) === 0, `got ${countMathSpans(doc.children)}`);
  check('currency → dollar amounts stay literal', plainText(doc.children).includes('$1,000') && plainText(doc.children).includes('$50'));
}

// Regression (finding #2): a bare "$$" in prose does not swallow the paragraph.
{
  const doc = parseDocument('Companies with $$ to invest tend to win.');
  check('bare $$ → 0 math spans', countMathSpans(doc.children) === 0, `got ${countMathSpans(doc.children)}`);
  check('bare $$ → prose after it survives', plainText(doc.children).includes('to invest tend to win'));
}

// Regression (finding #6): text after a same-line display-math closer is kept.
{
  const doc = parseDocument('$$E = mc^2$$ (the mass-energy relation)');
  check('display trailing text → mathBlock present', !!findBlock(doc, 'mathBlock'));
  check('display trailing text → "(the mass-energy relation)" kept', plainText(doc.children).includes('mass-energy relation'),
    `plain="${plainText(doc.children)}"`);
}

// dm-02: display PV block present; trailing "$1,000 … $1,000" sentence has no math span.
{
  const doc = parseDocument(byId('dm-02').raw);
  check('dm-02 → has a display mathBlock', !!findBlock(doc, 'mathBlock'));
  // the paragraph(s) must contain no inline math
  check('dm-02 → currency sentence has 0 inline math', countMathSpans(doc.children) === 0,
    `got ${countMathSpans(doc.children)}`);
}

// mix-03: "$980 < $1,000" literal; has a display block.
{
  const doc = parseDocument(byId('mix-03').raw);
  check('mix-03 → has a display mathBlock', !!findBlock(doc, 'mathBlock'));
  check('mix-03 → no inline math in the currency prose', countMathSpans(doc.children) === 0,
    `got ${countMathSpans(doc.children)}`);
}

// adv-05: "$100"/"$1,000" literal, "$ratio = \frac{1000}{100} = 10$" is math (1 span).
check('adv-05 → exactly 1 math span (ratio formula)', countMathSpans(parseDocument(byId('adv-05').raw).children) === 1,
  `got ${countMathSpans(parseDocument(byId('adv-05').raw).children)}`);

// adv-03: T-bill has one real inline fraction span; the $-amounts are literal.
check('adv-03 → exactly 1 math span (discount-yield fraction)', countMathSpans(parseDocument(byId('adv-03').raw).children) === 1,
  `got ${countMathSpans(parseDocument(byId('adv-03').raw).children)}`);

// Table: tbl-01 → 4-col table, 3 rows, col2 center, col4 right.
{
  const t = findBlock(parseDocument(byId('tbl-01').raw), 'table') as any;
  check('tbl-01 → table detected', !!t);
  check('tbl-01 → 4 header cells', !!t && t.header.length === 4, t && `got ${t.header.length}`);
  check('tbl-01 → 3 body rows', !!t && t.rows.length === 3, t && `got ${t.rows.length}`);
  check('tbl-01 → col2 center', !!t && t.align[1] === 'center', t && `got ${t.align[1]}`);
  check('tbl-01 → col4 right', !!t && t.align[3] === 'right', t && `got ${t.align[3]}`);
}

// Table with currency cells: tbl-03 → table present, cells keep literal $, no math.
{
  const doc = parseDocument(byId('tbl-03').raw);
  const t = findBlock(doc, 'table') as any;
  check('tbl-03 → table detected', !!t);
  check('tbl-03 → currency cells produce no math spans', countMathSpans(doc.children) === 0,
    `got ${countMathSpans(doc.children)}`);
}

// mix-02: table whose cells contain inline math → at least 2 math spans total.
check('mix-02 → math inside table cells', countMathSpans(parseDocument(byId('mix-02').raw).children) >= 2,
  `got ${countMathSpans(parseDocument(byId('mix-02').raw).children)}`);

// Nested list: lst-01 → a list whose first item contains a nested list.
{
  const list = findBlock(parseDocument(byId('lst-01').raw), 'list') as any;
  check('lst-01 → list detected', !!list);
  check('lst-01 → 3 top-level items', !!list && list.items.length === 3, list && `got ${list.items.length}`);
  const firstHasNested = !!list && list.items[0].children.some((c: BlockNode) => c.type === 'list');
  check('lst-01 → first item has a nested list', firstHasNested);
}

// Ordered list: lst-02 → ordered, 5 items, start 1.
{
  const list = findBlock(parseDocument(byId('lst-02').raw), 'list') as any;
  check('lst-02 → ordered list, 5 items', !!list && list.ordered && list.items.length === 5,
    list && `ordered=${list.ordered} items=${list.items.length}`);
}

// Code fence with lang: code-01 → codeBlock, lang javascript, closed.
{
  const cb = findBlock(parseDocument(byId('code-01').raw), 'codeBlock') as any;
  check('code-01 → code block, lang=javascript, closed', !!cb && cb.lang === 'javascript' && cb.closed === true,
    cb && `lang=${cb.lang} closed=${cb.closed}`);
  check('code-01 → code body has no markdown interpretation', !!cb && cb.value.includes('annualCoupon / price'));
}

// Unclosed fence (partial stream): ps-04 → codeBlock closed:false.
{
  const cb = findBlock(parseDocument(byId('ps-04').raw), 'codeBlock') as any;
  check('ps-04 → unclosed fence → codeBlock closed:false', !!cb && cb.closed === false, cb && `closed=${cb.closed}`);
}

// edge-02: underscores inside inline code stay literal (2 code spans, no emphasis).
{
  const doc = parseDocument(byId('edge-02').raw);
  let codeCount = 0;
  let emphCount = 0;
  allBlocks(doc.children, (b) =>
    walkSpans(spansOf(b), (s) => {
      if (s.type === 'codeSpan') codeCount++;
      if (s.type === 'emphasis' || s.type === 'strongEmphasis') emphCount++;
    })
  );
  check('edge-02 → 2 inline code spans', codeCount === 2, `got ${codeCount}`);
  check('edge-02 → no stray emphasis from underscores', emphCount === 0, `got ${emphCount}`);
}

// Headings: mb-02 → six headings levels 1..6.
{
  const doc = parseDocument(byId('mb-02').raw);
  const levels: number[] = [];
  allBlocks(doc.children, (b) => { if (b.type === 'heading') levels.push(b.level); });
  check('mb-02 → six headings 1..6', JSON.stringify(levels) === JSON.stringify([1, 2, 3, 4, 5, 6]), `got ${levels}`);
}

// edge-06: heading contains an inline math span.
{
  const doc = parseDocument(byId('edge-06').raw);
  const heading = findBlock(doc, 'heading') as any;
  const hasMath = heading && heading.children.some((s: SpanNode) => s.type === 'mathInline');
  check('edge-06 → heading has inline math', !!hasMath);
}

// Math structure: dm-04 stddev → mathBlock root contains a sqrt (and a frac inside).
{
  const mb = findBlock(parseDocument(byId('dm-04').raw), 'mathBlock') as any;
  check('dm-04 → mathBlock present', !!mb);
  check('dm-04 → contains \\sqrt', !!mb && mathHasType(mb.math.root, 'sqrt'));
  check('dm-04 → contains \\frac (inside sqrt)', !!mb && mathHasType(mb.math.root, 'frac'));
}

// Accent: \bar{R} parses to an accent node (was rendering literal "\barR").
{
  const mb = findBlock(parseDocument('$$\\bar{R} = 0.1125$$'), 'mathBlock') as any;
  check('accent → \\bar{R} is an accent node', !!mb && mathHasType(mb.math.root, 'accent'));
  const pt = mathToUnicodeSafe(mb);
  check('accent → inline \\bar{R} renders R with a combining mark', pt.includes('R̄'), `got "${pt}"`);
}

// dm-01 CAPM: display block with a fence (parentheses) and scripts (subscripts).
{
  const mb = findBlock(parseDocument(byId('dm-01').raw), 'mathBlock') as any;
  check('dm-01 → mathBlock present', !!mb);
  check('dm-01 → has subscript scripts', !!mb && mathHasType(mb.math.root, 'script'));
}

// blockquote + nested list: edge-07 → blockquote containing a list.
{
  const bq = findBlock(parseDocument(byId('edge-07').raw), 'blockquote') as any;
  check('edge-07 → blockquote present', !!bq);
  const hasList = bq && bq.children.some((c: BlockNode) => c.type === 'list');
  check('edge-07 → blockquote contains an ordered list', !!hasList);
}

// Emphasis: mb-01 → bold + italic + bold-italic present.
{
  const doc = parseDocument(byId('mb-01').raw);
  let strong = 0, emph = 0, both = 0;
  allBlocks(doc.children, (b) =>
    walkSpans(spansOf(b), (s) => {
      if (s.type === 'strong') strong++;
      if (s.type === 'emphasis') emph++;
      if (s.type === 'strongEmphasis') both++;
    })
  );
  check('mb-01 → has bold', strong >= 1, `strong=${strong}`);
  check('mb-01 → has italic', emph >= 1, `emph=${emph}`);
  check('mb-01 → has bold-italic (___)', both >= 1, `both=${both}`);
}

// ---- report -------------------------------------------------------
console.log(`\nPARSER TESTS: ${pass} passed, ${fail} failed (of ${pass + fail})\n`);
if (failures.length) {
  console.log(failures.join('\n'));
  process.exit(1);
} else {
  console.log('ALL GREEN ✓');
}
