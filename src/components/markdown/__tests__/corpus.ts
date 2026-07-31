// Auto-generated from the design-workflow corpus (36 realistic Series 65
// tutor outputs). Used by the Node parser tests — not shipped in the app bundle.

export interface Case { id: string; category: string; raw: string; expectedRender: string; }

export const CORPUS: Case[] = [
  {
    "id": "im-01-current-yield",
    "category": "math-inline",
    "raw": "Current yield is just the annual coupon divided by the market price: $CY = \\frac{\\text{Annual Coupon}}{\\text{Market Price}}$. So a bond paying $50 a year trading at $950 has a current yield of about $5.26\\%$.",
    "expectedRender": "A sentence with an inline formula rendering the fraction Annual Coupon over Market Price, then prose. '$50' and '5.26%' are literal text/percentage, NOT math — only the two $...$ spans (the fraction and 5.26\\%) render as math."
  },
  {
    "id": "im-02-paren-delim",
    "category": "math-inline",
    "raw": "The real (inflation-adjusted) return is approximately \\(r_{real} \\approx r_{nominal} - i\\), where \\(i\\) is the inflation rate.",
    "expectedRender": "Inline math via \\(...\\) delimiters: r subscript real approx r subscript nominal minus i, and a second inline \\(i\\). Subscripts render below-baseline."
  },
  {
    "id": "im-03-beta-inline",
    "category": "math-inline",
    "raw": "A stock with \\(\\beta = 1.5\\) is 50% more volatile than the market. If the market moves up $2\\%$, this stock tends to move up about $3\\%$.",
    "expectedRender": "Inline Greek beta = 1.5 via \\(...\\), then two inline percent math spans 2\\% and 3\\%. '50%' in prose is plain text."
  },
  {
    "id": "im-04-mixed-delims",
    "category": "math-inline",
    "raw": "Standard deviation is denoted $\\sigma$ and variance is $\\sigma^2$. Higher $\\sigma$ means more dispersion around the mean $\\mu$.",
    "expectedRender": "Three inline math spans: sigma, sigma squared (superscript 2), and sigma again; plus mu. Greek letters render correctly."
  },
  {
    "id": "dm-01-capm",
    "category": "math-display",
    "raw": "The Capital Asset Pricing Model gives the required return:\n\n$$r = r_f + \\beta(r_m - r_f)$$\n\nwhere $r_f$ is the risk-free rate and $r_m$ is the expected market return.",
    "expectedRender": "A centered display equation r = r_f + beta times (r_m minus r_f) on its own line, with subscripts, surrounded by prose. The inline $r_f$ and $r_m$ below render inline."
  },
  {
    "id": "dm-02-pv",
    "category": "math-display",
    "raw": "Present value discounts a future cash flow back to today:\n\n$$PV = \\frac{FV}{(1 + r)^n}$$\n\nSo $1,000 received in 5 years at 6% is worth less than $1,000 today.",
    "expectedRender": "Display fraction FV over (1+r) to the n-th power. The trailing sentence contains literal dollar amounts '$1,000 ... $1,000' that must render as plain currency text, NOT as a math span between the two dollar signs."
  },
  {
    "id": "dm-03-bracket-delim",
    "category": "math-display",
    "raw": "The future value of a lump sum compounding annually is:\n\n\\[ FV = PV \\times (1 + r)^n \\]\n\nNotice the exponent $n$ is the number of periods.",
    "expectedRender": "Display math via \\[...\\] delimiters: FV = PV times (1+r)^n, times sign rendered, superscript n. Trailing inline $n$."
  },
  {
    "id": "dm-04-stddev-sum",
    "category": "math-display",
    "raw": "Population standard deviation is the square root of the average squared deviation:\n\n$$\\sigma = \\sqrt{\\frac{1}{N}\\sum_{i=1}^{N} (x_i - \\mu)^2}$$",
    "expectedRender": "Display equation: sigma equals a square root enclosing a fraction 1/N times a summation from i=1 to N of (x_i minus mu) squared. Radical spans the whole expression; summation has sub/superscript limits."
  },
  {
    "id": "dm-05-expected-return",
    "category": "math-display",
    "raw": "Expected return is the probability-weighted average of outcomes:\n\n$$E(R) = \\sum_{i=1}^{n} p_i \\, r_i$$\n\nEach $p_i$ is the probability of scenario $i$ and $r_i$ its return.",
    "expectedRender": "Display summation E(R) = sum from i=1 to n of p_i r_i with a thin space between. Inline subscript spans follow in prose."
  },
  {
    "id": "dm-06-compound-freq",
    "category": "math-display",
    "raw": "With compounding $m$ times per year:\n\n$$FV = PV\\left(1 + \\frac{r}{m}\\right)^{m \\cdot t}$$\n\nAs $m \\to \\infty$ this approaches continuous compounding $FV = PV e^{rt}$.",
    "expectedRender": "Display equation with \\left( \\right) auto-sized parentheses around 1 + r/m, raised to the power m·t (with \\cdot dot). Trailing prose: m approaching infinity, and inline continuous-compounding formula."
  },
  {
    "id": "mb-01-heading-emphasis",
    "category": "markdown-basic",
    "raw": "# Fiduciary Duty\n\nAn investment adviser owes a **fiduciary duty** to clients. This is the *highest* standard of care under the Uniform Securities Act.\n\nIt means always acting in the client's ___best interest___.",
    "expectedRender": "An H1 heading 'Fiduciary Duty', a paragraph with bold 'fiduciary duty' and italic 'highest', then a paragraph ending with bold-italic 'best interest' (triple underscore)."
  },
  {
    "id": "mb-02-all-heading-levels",
    "category": "markdown-basic",
    "raw": "# Series 65 Topics\n## Regulation\n### State Registration\n#### Exemptions\n##### Federal Covered\n###### Notice Filing\n\nEach level nests the study outline.",
    "expectedRender": "Six headings decreasing in size from H1 to H6, each on its own line, followed by a paragraph."
  },
  {
    "id": "mb-03-blockquote-hr",
    "category": "markdown-basic",
    "raw": "Key definition:\n\n> An **agent** is an individual who represents a broker-dealer in effecting securities transactions.\n\n---\n\nNote: clerical employees are generally *not* agents.",
    "expectedRender": "A lead-in line, a blockquote (indented/bordered) containing bold 'agent', a horizontal rule, then a paragraph with italic 'not'."
  },
  {
    "id": "mb-04-links-strike",
    "category": "markdown-basic",
    "raw": "See the [NASAA website](https://www.nasaa.org) for the model rules. The old ~~net capital~~ minimum financial requirement varies by state.",
    "expectedRender": "A paragraph with a hyperlink labeled 'NASAA website', and 'net capital' rendered with strikethrough."
  },
  {
    "id": "mb-05-inline-code",
    "category": "markdown-basic",
    "raw": "The registration form for investment advisers is called `Form ADV`, and the annual updating amendment is filed via the `IARD` system.",
    "expectedRender": "A paragraph with two inline code spans: 'Form ADV' and 'IARD', styled monospace with a subtle background."
  },
  {
    "id": "tbl-01-security-compare",
    "category": "markdown-table",
    "raw": "Here's how the main security types compare:\n\n| Security | Ownership? | Priority in Bankruptcy | Income |\n|----------|:----------:|-----------------------|-------:|\n| Common Stock | Yes | Last | Dividends |\n| Preferred Stock | Yes | Middle | Fixed Dividend |\n| Bond | No (creditor) | First | Interest |\n\nBonds have the highest claim priority.",
    "expectedRender": "A GitHub pipe table with 4 columns and a header row, 3 data rows. Column 2 center-aligned, column 4 right-aligned, others left. Followed by a summary sentence."
  },
  {
    "id": "tbl-02-order-types",
    "category": "markdown-table",
    "raw": "| Order Type | Fills At | Guarantees |\n| --- | --- | --- |\n| Market | Best available price | Execution, not price |\n| Limit | Your price or better | Price, not execution |\n| Stop | Becomes market when triggered | Neither |",
    "expectedRender": "A three-column pipe table (no surrounding prose), header row plus three data rows, all columns default/left aligned."
  },
  {
    "id": "tbl-03-dollars-in-cells",
    "category": "markdown-table",
    "raw": "Breakpoint schedule for a mutual fund:\n\n| Investment | Sales Charge |\n| --- | --- |\n| $0 - $9,999 | 5.00% |\n| $10,000 - $24,999 | 4.25% |\n| $25,000+ | 3.50% |\n\nLarger investments earn lower sales charges.",
    "expectedRender": "A two-column pipe table whose cells contain literal dollar ranges ('$0 - $9,999' etc.) that must render as plain currency text, NOT interpreted as math delimiters despite multiple $ signs per row."
  },
  {
    "id": "lst-01-nested-bullets",
    "category": "markdown-list",
    "raw": "Investment adviser registration options:\n\n- Federal (SEC) registration\n  - Assets under management $110 million or more\n  - Advisers to investment companies\n- State registration\n  - AUM under $100 million\n  - Notice filing may still apply\n- Exempt reporting advisers",
    "expectedRender": "A bulleted list with three top-level items; the first two have indented sub-bullets (two each). Literal dollar amounts in sub-bullets stay plain text."
  },
  {
    "id": "lst-02-ordered",
    "category": "markdown-list",
    "raw": "Steps in the investment planning process:\n\n1. Gather client data and define goals\n2. Analyze the client's current situation\n3. Develop recommendations\n4. Implement the plan\n5. Monitor and review periodically",
    "expectedRender": "An ordered list numbered 1 through 5, each item on its own line."
  },
  {
    "id": "lst-03-mixed-nested",
    "category": "markdown-list",
    "raw": "Types of risk:\n\n1. **Systematic** (non-diversifiable)\n   - Market risk\n   - Interest rate risk\n   - Inflation (purchasing power) risk\n2. **Unsystematic** (diversifiable)\n   - Business risk\n   - Financial risk\n\nDiversification only reduces the *second* kind.",
    "expectedRender": "An ordered list with two items, each bolded, each followed by an indented bulleted sub-list. Trailing paragraph with italic 'second'. Ordered numbers and bullet markers both render."
  },
  {
    "id": "lst-04-marker-variants",
    "category": "markdown-list",
    "raw": "Prohibited practices include:\n\n* Churning\n+ Front running\n- Painting the tape",
    "expectedRender": "Three bullet list items using three different bullet markers (*, +, -) that all render as a uniform bulleted list."
  },
  {
    "id": "code-01-fenced-js",
    "category": "code",
    "raw": "Here's how you'd compute current yield in code:\n\n```javascript\nfunction currentYield(annualCoupon, price) {\n  return (annualCoupon / price) * 100;\n}\ncurrentYield(50, 950); // => 5.26\n```\n\nThe `price` argument is the market price, not par.",
    "expectedRender": "Prose, then a fenced code block with JavaScript syntax (monospace, preserved indentation, no markdown/math interpretation inside), then a paragraph with inline code 'price'."
  },
  {
    "id": "code-02-fence-nolang",
    "category": "code",
    "raw": "The formula in plain notation:\n\n```\nFV = PV * (1 + r)^n\nCY = coupon / price\n```\n\nNote the `^` here means exponent.",
    "expectedRender": "A fenced code block with no language tag containing two formula lines verbatim (the ^ and * are literal, not rendered as math/superscript), then a paragraph with inline code caret."
  },
  {
    "id": "mix-01-full-lesson",
    "category": "mixed",
    "raw": "## Duration and Interest Rate Risk\n\n**Duration** measures a bond's price sensitivity to rate changes. The approximate price change is:\n\n$$\\Delta P \\approx -D \\times \\Delta y \\times P$$\n\nKey points:\n\n1. Longer maturity → higher duration\n2. Lower coupon → higher duration\n\n> A bond with duration of 7 falls about 7% if rates rise 1%.\n\nSee `bondmath.calcDuration()` for the implementation.",
    "expectedRender": "H2 heading, paragraph with bold 'Duration', a display equation with Delta symbols and times/arrow, an ordered list (with → arrows in text), a blockquote, and a closing paragraph with inline code. All features coexist."
  },
  {
    "id": "mix-02-table-plus-math",
    "category": "mixed",
    "raw": "### Comparing Yields\n\n| Metric | Formula |\n| --- | --- |\n| Current Yield | $\\frac{C}{P}$ |\n| Yield to Maturity | solves $P = \\sum \\frac{C}{(1+y)^t} + \\frac{F}{(1+y)^n}$ |\n\nYTM is the internal rate of return assuming the bond is held to maturity.",
    "expectedRender": "H3 heading, a pipe table where cells contain inline math (a fraction, and a summation-based pricing equation), then a paragraph. Math inside table cells renders as math."
  },
  {
    "id": "mix-03-dollar-and-formula",
    "category": "mixed",
    "raw": "A client buys a bond for $980 with a $1,000 par value and a 6% coupon. The current yield is:\n\n$$CY = \\frac{60}{980} = 0.0612 = 6.12\\%$$\n\nSo paying below par ($980 < $1,000) pushes the current yield above the 6% coupon rate.",
    "expectedRender": "A sentence with literal currency ('$980', '$1,000') as plain text, a display fraction equation ending in 6.12\\% math percent, then a closing sentence where '$980 < $1,000' must render as plain currency text and NOT as a math span."
  },
  {
    "id": "ps-01-unclosed-dollar",
    "category": "partial-stream",
    "raw": "The present value formula is $PV = \\frac{FV}{(1 +",
    "expectedRender": "Mid-stream fragment: an opened but unterminated inline $ math with a half-written fraction. Renderer must not crash; should show the partial content as readable text/best-effort math and wait for more tokens rather than flashing raw garbage."
  },
  {
    "id": "ps-02-unclosed-bold",
    "category": "partial-stream",
    "raw": "An investment adviser representative must register in **every state where",
    "expectedRender": "Mid-stream fragment with an unclosed ** bold marker. Renderer should degrade gracefully — either show the trailing text as plain or as pending-bold — without breaking layout."
  },
  {
    "id": "ps-03-half-frac",
    "category": "partial-stream",
    "raw": "Standard deviation: $$\\sigma = \\sqrt{\\frac{1}{N}\\sum_{i=1}^{N}(x_i - \\mu)",
    "expectedRender": "Mid-stream display-math fragment: opened $$ with an unclosed \\sqrt/\\frac/\\sum and a dangling group. Must not throw; render best-effort partial and resolve as remaining tokens arrive."
  },
  {
    "id": "ps-04-unclosed-fence",
    "category": "partial-stream",
    "raw": "Example calculation:\n\n```python\ndef pv(fv, r, n):\n    return fv / (1 + r) ** n",
    "expectedRender": "Mid-stream fragment with an opened ``` code fence that is never closed. Renderer should treat the following lines as code (monospace, verbatim) rather than crashing or leaking the backticks as literal text into the flow."
  },
  {
    "id": "ps-05-unfinished-table-row",
    "category": "partial-stream",
    "raw": "| Security | Risk Level |\n| --- | --- |\n| Treasury Bill | Very Low |\n| Corporate Bond |",
    "expectedRender": "Mid-stream table fragment: header and separator complete, one full data row, and a final row that is started but has no closing cell/pipe. Renderer should show the complete rows and tolerate the incomplete last row without breaking the table."
  },
  {
    "id": "ps-06-lone-dollar-eol",
    "category": "partial-stream",
    "raw": "The bond was issued at a discount and now trades at $",
    "expectedRender": "A single trailing '$' at the end of a token stream. Ambiguous: could be start of a price or start of math. Renderer must render the '$' (or hold it) as plain text without entering a broken math state or crashing."
  },
  {
    "id": "adv-01-price-not-math",
    "category": "adversarial-dollar",
    "raw": "The bond costs $1,000 and yields 5% annually, paying $50 in interest each year.",
    "expectedRender": "Plain prose with two literal dollar amounts '$1,000' and '$50'. The text between the two dollar signs ('1,000 and yields 5% annually, paying ') must NOT be swallowed and rendered as italic math — it stays plain."
  },
  {
    "id": "adv-02-dollar-range",
    "category": "adversarial-dollar",
    "raw": "Accredited investor thresholds often fall in the $200,000 to $300,000 income range, or $1,000,000 to $5,000,000 in net worth.",
    "expectedRender": "Prose with four literal dollar amounts forming two ranges. None of the spans between dollar signs should be parsed as math; all render as plain currency text."
  },
  {
    "id": "adv-03-price-plus-formula",
    "category": "adversarial-dollar",
    "raw": "A T-bill with face value $10,000 sells at $9,700. The discount yield uses $\\frac{10000 - 9700}{10000} \\times \\frac{360}{n}$, so the $300 discount over 91 days annualizes.",
    "expectedRender": "One sentence mixing literal currency ('$10,000', '$9,700', '$300') with a genuine inline math fraction span. Only the \\frac...\\frac expression between its delimiters renders as math; the dollar amounts stay plain text — the parser must distinguish real math delimiters from currency."
  },
  {
    "id": "adv-04-percent-and-dollar",
    "category": "adversarial-dollar",
    "raw": "If you invest $5,000 at 8% compounded annually, after 10 years you'll have $5,000 \\times (1.08)^{10} \\approx $10,795.",
    "expectedRender": "Tricky: literal '$5,000' currency appears, then a formula that is NOT wrapped in delimiters (the model forgot them). Ideally the bare LaTeX ('\\times (1.08)^{10}') degrades to readable text; the '$5,000' and '$10,795' remain plain currency. Must not crash on the stray backslash commands outside math mode."
  },
  {
    "id": "adv-05-dollar-adjacent",
    "category": "adversarial-dollar",
    "raw": "Compare a $100 bond to a $1,000 bond: the formula $ratio = \\frac{1000}{100} = 10$ shows a tenfold difference.",
    "expectedRender": "Literal '$100' and '$1,000', then a real inline math span '$ratio = \\frac{1000}{100} = 10$'. Challenge: the '$1,000' immediately before could be mis-paired with the opening '$' of the formula. Correct render keeps '$100' and '$1,000' as currency and the ratio formula as math."
  },
  {
    "id": "edge-01-escaped-dollar",
    "category": "edge",
    "raw": "To show a literal dollar sign in math, escape it: the price target is $\\$1,200$ per the analyst's note.",
    "expectedRender": "An inline math span containing an escaped dollar sign \\$ so it renders a literal '$1,200' INSIDE math styling. The outer $...$ are delimiters; the inner \\$ is a literal dollar glyph."
  },
  {
    "id": "edge-02-underscore-in-code",
    "category": "edge",
    "raw": "The variable `risk_free_rate` uses underscores; they should NOT trigger italics inside `snake_case` identifiers.",
    "expectedRender": "A paragraph with two inline code spans containing underscores ('risk_free_rate', 'snake_case'). Underscores inside code must stay literal and NOT be parsed as italic emphasis markers."
  },
  {
    "id": "edge-03-percent-escape-math",
    "category": "edge",
    "raw": "The required return works out to $r = 4\\% + 1.2 \\times (9\\% - 4\\%) = 10\\%$ using CAPM.",
    "expectedRender": "An inline math span using escaped percent signs (\\%) so each renders a literal '%' glyph inside math, with \\times operator. The whole CAPM arithmetic is one math span."
  },
  {
    "id": "edge-04-consecutive-display",
    "category": "edge",
    "raw": "Two ways to express the same growth:\n\n$$A = P(1 + r)^n$$\n\n$$A = P \\cdot e^{rt} \\quad (\\text{continuous})$$",
    "expectedRender": "Two separate display-math blocks stacked vertically with spacing between them. Second uses \\cdot, e^{rt}, a \\quad space, and \\text{...} for the parenthetical label."
  },
  {
    "id": "edge-05-empty-and-special",
    "category": "edge",
    "raw": "Risk-adjusted return (Sharpe ratio):\n\n$$S = \\frac{r_p - r_f}{\\sigma_p}$$\n\nA higher $S$ is better. Values above $1.0$ are generally considered good, and $\\geq 2.0$ is excellent.",
    "expectedRender": "Display Sharpe-ratio fraction (r_p minus r_f) over sigma_p, then prose with inline math '$S$', '$1.0$', and a '$\\geq 2.0$' span rendering the greater-than-or-equal operator."
  },
  {
    "id": "edge-06-heading-with-inline-math",
    "category": "edge",
    "raw": "## The $\\beta$ Coefficient\n\nBeta measures systematic risk relative to the market, where $\\beta = 1$ is market-average volatility.",
    "expectedRender": "An H2 heading that itself contains an inline math span (Greek beta), then a paragraph with inline '$\\beta = 1$'. Math must render inside heading-styled text."
  },
  {
    "id": "edge-07-blockquote-nested-list",
    "category": "edge",
    "raw": "> **Exam tip:** Remember the order of claim priority:\n>\n> 1. Secured creditors\n> 2. Unsecured creditors (bondholders)\n> 3. Preferred shareholders\n> 4. Common shareholders",
    "expectedRender": "A blockquote containing bold 'Exam tip:' text and, still inside the quote, a four-item ordered list. Both blockquote styling and list numbering apply together."
  }
];
