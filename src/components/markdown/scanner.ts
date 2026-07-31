// Low-level scanning helpers with zero React deps — unit-testable in isolation.
// Centralises the $-vs-currency rule so the block and inline layers agree.

/** Characters that only appear in real LaTeX, never in a plain price. Their
 *  presence inside a candidate span overrides the currency heuristic. */
export const MATH_SIGNAL = new Set(['\\', '^', '_', '{', '}']);

/** Is the char at index i escaped by an odd run of backslashes before it? */
export function isEscaped(src: string, i: number): boolean {
  let n = 0;
  let k = i - 1;
  while (k >= 0 && src[k] === '\\') {
    n++;
    k--;
  }
  return n % 2 === 1;
}

const isDigit = (c: string | undefined) => c !== undefined && c >= '0' && c <= '9';

/**
 * Find a valid closing single-`$` for an inline math span opened at openIdx.
 * Returns the index of the closer, or -1 if none qualifies.
 *
 * A closer is only valid if it is an UNESCAPED `$` that is NOT immediately
 * followed by a digit — that guard stops a math span from swallowing a
 * following currency amount (e.g. the `$` that begins "$10,795").
 */
export function findInlineMathClose(src: string, openIdx: number): number {
  for (let k = openIdx + 1; k < src.length; k++) {
    if (src[k] !== '$' || isEscaped(src, k)) continue;
    if (isDigit(src[k + 1])) continue; // reads as the start of a price, not a closer
    return k;
  }
  return -1;
}

const BARE_NUMBER = /^\s*[\d,]+(\.\d+)?\s*$/;

export function hasMathSignal(s: string): boolean {
  for (let k = 0; k < s.length; k++) {
    if (MATH_SIGNAL.has(s[k])) return true;
  }
  return false;
}

/**
 * Decide whether an unescaped single `$` at openIdx opens inline math.
 * Returns the closer index if it does, or -1 to treat the `$` as literal text.
 *
 * Two paths, so a currency amount can never swallow prose up to a distant `$`:
 *  - CURRENCY-SHAPED opener (`$` followed by a digit, e.g. $5, $1,000): only real
 *    math if the span up to the IMMEDIATE next `$` contains a LaTeX signal char.
 *    "$50 a year ... $5.26\%$" therefore reads $50 as currency (next `$` is $5.26,
 *    body has no signal) and only "$5.26\%$" as math — not one giant span.
 *  - OTHERWISE: close at the first `$` that is not itself immediately followed by a
 *    digit (so a trailing price can't be mistaken for the closer).
 * A bare-number span ("$5$", "$1,000$") is always literal.
 */
export function tryOpenInlineMath(src: string, openIdx: number): number {
  const currencyShaped = isDigit(src[openIdx + 1]);
  if (currencyShaped) {
    let close = -1;
    for (let k = openIdx + 1; k < src.length; k++) {
      if (src[k] === '$' && !isEscaped(src, k)) {
        close = k;
        break;
      }
    }
    if (close < 0) return -1;
    const body = src.slice(openIdx + 1, close);
    // A fully-delimited bare number ("$1.0$", "$0$") is math — models routinely
    // wrap plain numbers in $...$; real currency is written "$100" with no closing
    // "$". A LaTeX signal char also means math. Otherwise "$50 a year …" is currency.
    if (BARE_NUMBER.test(body) || hasMathSignal(body)) return close;
    return -1;
  }
  const close = findInlineMathClose(src, openIdx);
  if (close < 0) return -1;
  const body = src.slice(openIdx + 1, close);
  if (BARE_NUMBER.test(body)) return -1;
  return close;
}
