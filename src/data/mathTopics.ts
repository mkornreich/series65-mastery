import { MathTopic } from '../types';

// AUTO-GENERATED Series 65 math/formula topics (authored + adversarially verified).
// Each topic mastery flows to its home curriculum component and thus its exam
// section. Do not hand-edit.

export const MATH_TOPICS: MathTopic[] = [
  {
    "id": "tax-equivalent-yield",
    "title": "Tax-equivalent yield (municipal bond)",
    "homeComponentId": "rec-tax",
    "subjectId": "recommendations",
    "formulaLatex": "\\text{Tax-Equivalent Yield} = \\frac{\\text{Municipal (Tax-Free) Yield}}{1 - \\text{Marginal Tax Rate}}",
    "summary": "Tax-equivalent yield (TEY) converts a tax-free municipal bond's yield into the yield a taxable bond would need to pay to leave an investor with the same after-tax return. It lets a candidate compare munis and taxable bonds on an apples-to-apples basis.",
    "variables": [
      "Municipal (Tax-Free) Yield: the stated yield on the tax-exempt municipal bond, expressed as a decimal (e.g., 4% = $0.04$).",
      "Marginal Tax Rate: the investor's highest (marginal) income-tax bracket, expressed as a decimal (e.g., 35% = $0.35$). Use the combined federal (and, where applicable, state/local) rate only when the bond is exempt at those levels."
    ],
    "whenToUse": "Use it whenever you must decide whether a tax-free muni or a comparable taxable bond gives a better after-tax return for a specific investor. The higher the investor's tax bracket, the more attractive the muni becomes, so this calculation is central to suitability questions for high-income clients.",
    "workedExample": "A municipal bond yields 4% and the investor is in the 35% marginal bracket.\n\n$\\text{TEY} = \\dfrac{0.04}{1 - 0.35} = \\dfrac{0.04}{0.65} = 0.0615$\n\nSo the TEY is about **6.15%**. A taxable bond would have to yield more than 6.15% to beat this muni for this investor.",
    "pitfall": "Candidates often multiply by the tax rate or divide by the rate itself instead of dividing by (1 − tax rate), and they confuse TEY with the reverse \"tax-free equivalent yield\" (taxable yield × (1 − tax rate)) used to convert a taxable bond into muni terms."
  },
  {
    "id": "current-yield",
    "title": "Current yield of a bond",
    "homeComponentId": "veh-fixed-char",
    "subjectId": "vehicles",
    "formulaLatex": "\\text{Current Yield} = \\frac{\\text{Annual Coupon (in dollars)}}{\\text{Current Market Price}}",
    "summary": "Current yield measures a bond's annual coupon income as a percentage of its current market price, not its par value. It tells an investor the income return being earned at today's price and matters on the Series 65 as one rung in the yield hierarchy.",
    "variables": [
      "Annual Coupon (in dollars) = the stated coupon rate times par value; e.g. a 6% coupon on a $1,000 par bond pays $60 per year",
      "Current Market Price = the bond's current trading price, which may be above (premium) or below (discount) par"
    ],
    "whenToUse": "Use current yield when a question asks for the income return at a bond's current price, or when comparing yields to place a bond's yield measures in order. Remember the hierarchy: for a discount bond, nominal (coupon) yield < current yield < YTM < YTC; for a premium bond the order reverses (YTC < YTM < current yield < nominal).",
    "workedExample": "A $1,000 par bond carries a 6% coupon and currently trades at $960 (a discount).\n\nAnnual coupon = $6\\% \\times \\$1{,}000 = \\$60$.\n\n$\\text{Current Yield} = \\frac{60}{960} = 0.0625 = 6.25\\%$\n\nBecause the bond trades at a discount, the current yield ($6.25\\%$) is higher than the 6% nominal (coupon) yield, consistent with the discount-bond yield hierarchy.",
    "pitfall": "Dividing the coupon by par ($1,000) instead of the current market price — that gives the nominal (coupon) yield, not the current yield."
  },
  {
    "id": "nav",
    "title": "Net asset value (NAV) of a mutual fund",
    "homeComponentId": "veh-pooled-char",
    "subjectId": "vehicles",
    "formulaLatex": "\\text{NAV per share} = \\frac{\\text{Total Assets} - \\text{Total Liabilities}}{\\text{Shares Outstanding}}",
    "summary": "NAV per share is the dollar value of one mutual fund share, equal to the fund's net assets divided by the shares outstanding. It is the price at which open-end fund shares are redeemed and the baseline to which any sales charge is added.",
    "variables": [
      "Total Assets = market value of all securities in the portfolio plus cash and receivables",
      "Total Liabilities = amounts the fund owes (accrued fees, payables, short-term borrowing)",
      "Shares Outstanding = number of fund shares currently held by investors"
    ],
    "whenToUse": "Use it to find an open-end fund's redemption (bid) price and as the starting point for computing the public offering price (POP = NAV + sales charge). NAV is recomputed once per day under forward pricing, after the market closes.",
    "workedExample": "A fund holds $50,000,000 in securities and cash, owes $2,000,000 in liabilities, and has 4,000,000 shares outstanding.\n\n$NAV = \\dfrac{\\$50{,}000{,}000 - \\$2{,}000{,}000}{4{,}000{,}000} = \\dfrac{\\$48{,}000{,}000}{4{,}000{,}000}$\n\nNAV per share = \\$12.00. If the fund carries a sales charge, the POP would be higher; a no-load fund would sell shares at this same \\$12.00.",
    "pitfall": "Confusing NAV with the public offering price: NAV is the redemption/bid price, while the POP an investor pays equals NAV plus any front-end sales charge (POP is only equal to NAV for a no-load fund)."
  },
  {
    "id": "holding-period-return",
    "title": "Holding period (total) return",
    "homeComponentId": "rec-performance",
    "subjectId": "recommendations",
    "formulaLatex": "\\text{Holding Period Return} = \\frac{(P_{\\text{end}} - P_{\\text{begin}}) + \\text{Income}}{P_{\\text{begin}}}",
    "summary": "Holding period return (HPR) measures the total percentage gain or loss on an investment over the entire time it was held, combining both price appreciation (capital gain/loss) and any income received (dividends or interest). It is the fundamental \"total return\" measure the Series 65 tests for evaluating past performance.",
    "variables": [
      "$P_{\\text{end}}$ = ending price (sale price or current market value) of the investment",
      "$P_{\\text{begin}}$ = beginning price (original purchase price) of the investment",
      "$\\text{Income}$ = all cash income received during the holding period, such as dividends or interest coupons",
      "$P_{\\text{end}} - P_{\\text{begin}}$ = the capital gain (positive) or capital loss (negative)"
    ],
    "whenToUse": "Use HPR to find an investment's total return over its full holding period regardless of how long that period is, when the question gives you a purchase price, a sale or current price, and any dividends or interest received. It answers \"what was my overall percentage return?\" rather than a per-year rate.",
    "workedExample": "An investor buys a stock for \\$50, receives \\$2 in dividends while holding it, and sells it for \\$55.\n\nCapital gain = \\$55 − \\$50 = \\$5. Adding income of \\$2 gives \\$7 of total return.\n\n$\\text{HPR} = \\dfrac{(55 - 50) + 2}{50} = \\dfrac{7}{50} = 0.14 = 14\\%$\n\nThe 14% is the total return over the entire holding period, not per year.",
    "pitfall": "Candidates forget to include income (dividends/interest) in the numerator, counting only the price change, and they wrongly assume HPR is annualized — it is a cumulative total-period return that must be divided by the number of years to approximate an annual rate for comparison."
  },
  {
    "id": "current-ratio",
    "title": "Current ratio",
    "homeComponentId": "econ-analytical",
    "subjectId": "econ",
    "formulaLatex": "\\text{Current Ratio} = \\frac{\\text{Current Assets}}{\\text{Current Liabilities}}",
    "summary": "The current ratio is a liquidity measure that shows how many dollars of current assets a company has for every dollar of current liabilities. On the Series 65 it signals a firm's short-term ability to pay obligations coming due within one year.",
    "variables": [
      "Current Assets: assets expected to be converted to cash or used up within one year (cash, marketable securities, accounts receivable, inventory, prepaid expenses)",
      "Current Liabilities: obligations due within one year (accounts payable, short-term debt, accrued expenses, current portion of long-term debt)"
    ],
    "whenToUse": "Use it in fundamental analysis to gauge a company's short-term solvency and working-capital cushion when evaluating creditworthiness or comparing firms. A ratio above 1.0 means current assets exceed current liabilities; higher generally signals stronger liquidity, though an excessively high ratio can indicate idle, unproductive assets.",
    "workedExample": "A company reports current assets of \\$600,000 and current liabilities of \\$300,000.\n\n$\\text{Current Ratio} = \\frac{600{,}000}{300{,}000} = 2.0$\n\nThe firm has \\$2 of current assets for every \\$1 of current liabilities, indicating solid short-term liquidity.",
    "pitfall": "Do not confuse it with the quick (acid-test) ratio — the current ratio includes inventory and prepaid expenses in the numerator, while the quick ratio excludes them."
  },
  {
    "id": "quick-ratio",
    "title": "Quick (acid-test) ratio",
    "homeComponentId": "econ-analytical",
    "subjectId": "econ",
    "formulaLatex": "\\text{Quick Ratio} = \\frac{\\text{Current Assets} - \\text{Inventory} - \\text{Prepaid Expenses}}{\\text{Current Liabilities}}",
    "summary": "The quick (acid-test) ratio measures a company's ability to meet its short-term obligations using only its most liquid current assets, excluding inventory and prepaid expenses. It is a stricter liquidity gauge than the current ratio.",
    "variables": [
      "Current Assets: cash and assets expected to convert to cash within one year (cash, marketable securities, accounts receivable, inventory, prepaid expenses).",
      "Inventory: unsold goods; excluded because it is the hardest current asset to convert quickly to cash.",
      "Prepaid Expenses: amounts paid in advance (e.g. prepaid insurance); excluded because they cannot be converted back to cash.",
      "Current Liabilities: obligations due within one year (accounts payable, short-term debt, accrued expenses)."
    ],
    "whenToUse": "Use it when assessing whether a firm can cover current liabilities without relying on selling inventory. On the Series 65 it appears in fundamental analysis questions comparing liquidity ratios and interpreting corporate solvency.",
    "workedExample": "A company reports current assets of \\$500,000, of which inventory is \\$180,000 and prepaid expenses are \\$20,000, against current liabilities of \\$200,000.\n\nQuick assets $= 500{,}000 - 180{,}000 - 20{,}000 = 300{,}000$.\n\n$\\text{Quick Ratio} = \\frac{300{,}000}{200{,}000} = 1.5$\n\nA ratio of 1.5 means the firm has \\$1.50 of liquid assets for every \\$1.00 of current liabilities, so it can cover short-term debts without selling inventory.",
    "pitfall": "The most common mistake is forgetting to subtract inventory (and prepaid expenses) from current assets, which turns the quick ratio into the less conservative current ratio."
  },
  {
    "id": "debt-to-equity",
    "title": "Debt-to-equity ratio",
    "homeComponentId": "econ-analytical",
    "subjectId": "econ",
    "formulaLatex": "\\text{Debt-to-Equity Ratio} = \\frac{\\text{Total Long-Term Debt}}{\\text{Total Shareholders' Equity}}",
    "summary": "The debt-to-equity ratio measures how much of a company's capital structure is financed by long-term debt versus shareholders' equity. It is a leverage (capitalization) ratio that signals financial risk: the higher the ratio, the more leveraged and financially risky the firm.",
    "variables": [
      "Total Long-Term Debt — the firm's long-term borrowings, principally its outstanding bonds/debentures. On the Series 65, use long-term debt (bonds) rather than total liabilities.",
      "Total Shareholders' Equity — the common stockholders' stake, generally common stock at par plus additional paid-in capital plus retained earnings; broader definitions add preferred stock to the equity base."
    ],
    "whenToUse": "Use it to gauge a company's financial leverage and solvency risk when analyzing an issuer's bonds or stock. A rising ratio means heavier reliance on borrowed money, larger fixed interest obligations, and greater vulnerability in a downturn — key for judging creditworthiness and default risk.",
    "workedExample": "A company has \\$40 million in outstanding long-term bonds and \\$100 million in shareholders' equity.\n\n$\\text{D/E} = \\dfrac{40}{100} = 0.40$, or 40%.\n\nFor every \\$1 of equity the firm carries 40 cents of long-term debt — a relatively conservative, low-leverage capital structure.",
    "pitfall": "Candidates often plug in total liabilities (including short-term/current liabilities) instead of long-term debt, or forget that a higher ratio means more leverage and higher risk, not greater strength."
  },
  {
    "id": "pe-ratio",
    "title": "Price-to-earnings (P/E) ratio",
    "homeComponentId": "econ-analytical",
    "subjectId": "econ",
    "formulaLatex": "\\text{P/E Ratio} = \\frac{\\text{Market Price per Share}}{\\text{Earnings per Share (EPS)}}",
    "summary": "The price-to-earnings (P/E) ratio measures how much investors are paying for each dollar of a company's earnings. It is a core valuation multiple used to gauge whether a stock is relatively cheap or expensive.",
    "variables": [
      "Market Price per Share — the current trading price of one share of common stock.",
      "Earnings per Share (EPS) — net income available to common shareholders divided by the number of common shares outstanding, i.e. $\\text{EPS} = \\frac{\\text{Net Income} - \\text{Preferred Dividends}}{\\text{Common Shares Outstanding}}$."
    ],
    "whenToUse": "Use the P/E ratio to compare a stock's valuation against its own history, its peers, or the broader market. On the Series 65, it appears in fundamental analysis and as a quick relative-value screen — a high P/E often signals a growth stock, while a low P/E can indicate a value stock.",
    "workedExample": "A stock trades at \\$40 per share and reported EPS of \\$2.50.\n\n$\\text{P/E} = \\frac{40}{2.50} = 16$\n\nInvestors are paying 16 times earnings, or 16 dollars for every 1 dollar of annual earnings.",
    "pitfall": "Candidates often invert the ratio or plug in total net income instead of per-share EPS — always divide price per share by EPS, not the other way around and not by total earnings."
  },
  {
    "id": "future-value",
    "title": "Future value (time value of money)",
    "homeComponentId": "econ-analytical",
    "subjectId": "econ",
    "formulaLatex": "\\text{FV} = \\text{PV} \\times (1 + r)^{n}",
    "summary": "Future value tells you what a lump sum invested today will grow to after earning compound interest for a number of periods. It is the core time-value-of-money relationship the Series 65 uses to compare dollars across time.",
    "variables": [
      "$\\text{FV}$ = future value (the ending amount you are solving for)",
      "$\\text{PV}$ = present value (the lump sum invested or deposited today)",
      "$r$ = periodic interest (growth) rate expressed as a decimal",
      "$n$ = number of compounding periods"
    ],
    "whenToUse": "Use it to project the growth of a single deposit, or to see how much a client's money compounds over time. On the exam it also underlies present-value questions, which simply rearrange the same equation to solve for PV.",
    "workedExample": "Invest \\$1,000 today at 6% compounded annually for 3 years.\n\n$\\text{FV} = 1000 \\times (1 + 0.06)^{3} = 1000 \\times 1.191016 \\approx 1191.02$\n\nThe deposit grows to about \\$1,191.02.",
    "pitfall": "Match $r$ and $n$ to the compounding frequency: for non-annual compounding, divide the annual rate by the number of periods per year and multiply the years by that same number (e.g., 6% for 3 years compounded semiannually means $r = 0.03$ and $n = 6$)."
  },
  {
    "id": "net-present-value",
    "title": "Net present value (NPV)",
    "homeComponentId": "econ-analytical",
    "subjectId": "econ",
    "formulaLatex": "\\text{NPV} = \\left(\\sum_{t=1}^{n} \\frac{CF_t}{(1+r)^t}\\right) - CF_0",
    "summary": "NPV is the sum of an investment's future cash flows discounted back to today at a required rate of return, minus the initial cost. It tells you whether an investment adds value: a positive NPV means the expected return exceeds the discount rate, so the investment is worth more than its price.",
    "variables": [
      "$CF_t$ = the cash flow received in period $t$ (interest, dividends, sale proceeds, etc.)",
      "$CF_0$ = the initial cash outflow (the amount invested today), entered as a positive cost that is subtracted",
      "$r$ = the required rate of return, or discount rate, per period",
      "$t$ = the time period, running from 1 to $n$",
      "$n$ = the total number of periods"
    ],
    "whenToUse": "Use NPV to decide whether to accept an investment or capital project: accept when NPV is positive, reject when negative. On the Series 65, know the decision rule and the relationship of NPV vs. price: if NPV is positive the investment's intrinsic value exceeds its market price, and its internal rate of return (IRR) is greater than the discount rate.",
    "workedExample": "An investment costs \\$1,000 today and is expected to pay \\$500 at the end of year 1 and \\$700 at the end of year 2. Using a required return of $r = 10\\%$:\n\n- Year 1: $\\frac{500}{(1.10)^1} = 454.55$\n- Year 2: $\\frac{700}{(1.10)^2} = 578.51$\n\nPresent value of inflows $= 454.55 + 578.51 = 1{,}033.06$.\n\n$\\text{NPV} = 1{,}033.06 - 1{,}000 = 33.06$\n\nNPV is positive, so the investment is attractive (its IRR exceeds 10%).",
    "pitfall": "Candidates forget to subtract the initial investment ($CF_0$) or confuse NPV with IRR — remember a positive NPV means the IRR is greater than the discount rate, not equal to it."
  },
  {
    "id": "rule-of-72",
    "title": "Rule of 72 (years to double)",
    "homeComponentId": "econ-analytical",
    "subjectId": "econ",
    "formulaLatex": "\\text{Years to Double} = \\frac{72}{\\text{Interest Rate (\\%)}}",
    "summary": "The Rule of 72 is a quick mental-math shortcut that estimates how many years it takes an investment to double in value at a given fixed annual compound rate of return. On the Series 65 it lets you approximate doubling time without a financial calculator.",
    "variables": [
      "Years to Double = approximate number of years for the principal to grow to twice its starting value",
      "Interest Rate (%) = the annual compound rate of return, entered as a whole number (use $8$, not $0.08$)"
    ],
    "whenToUse": "Use it when a question asks roughly how long money takes to double (or, rearranged as $72 \\div \\text{years}$, what rate is needed to double in a set time). It is meant for fast estimation of fixed-rate compound growth, not precise calculation.",
    "workedExample": "An investor earns a fixed 6% annual return. Estimate the doubling time:\n\n$\\text{Years} = \\frac{72}{6} = 12$ years.\n\nSo \\$10,000 grows to about \\$20,000 in roughly 12 years. Rearranging, to double in 9 years an investor needs about $72 \\div 9 = 8\\%$.",
    "pitfall": "Plug in the rate as a whole number (72 ÷ 8, not 72 ÷ 0.08), and remember the result is only an approximation of true compound growth, not an exact figure."
  },
  {
    "id": "after-tax-return",
    "title": "After-tax return",
    "homeComponentId": "rec-tax",
    "subjectId": "recommendations",
    "formulaLatex": "\\text{After-Tax Return} = \\text{Pretax Return} \\times (1 - \\text{Tax Rate})",
    "summary": "The after-tax return is the portion of an investment's return an investor actually keeps after taxes are paid on it. It lets a candidate compare taxable and tax-advantaged investments on an equal, apples-to-apples basis.",
    "variables": [
      "Pretax Return — the nominal (stated) return or yield on the investment before taxes, expressed as a percent or dollar amount",
      "Tax Rate — the investor's applicable marginal tax rate on that income, expressed as a decimal (e.g., a 24% bracket = 0.24)",
      "After-Tax Return — the return the investor retains after tax"
    ],
    "whenToUse": "Use it to evaluate a taxable investment (corporate bond, taxable money market, taxable dividends) net of taxes, or to compare a taxable instrument against a tax-free municipal bond. It is the reciprocal idea to the tax-equivalent yield, which instead grosses a muni's yield up to a taxable-equivalent basis.",
    "workedExample": "A corporate bond yields 6% and the investor is in the 24% marginal tax bracket.\n\nAfter-Tax Return $= 6\\% \\times (1 - 0.24) = 6\\% \\times 0.76 = 4.56\\%$\n\nThe investor keeps 4.56% after tax, so a tax-free municipal bond yielding more than 4.56% would be the better after-tax choice.",
    "pitfall": "Applying this formula to tax-exempt municipal bond interest (which has no federal tax to subtract) or using it when the correct tool is the tax-equivalent yield, which grosses a muni yield up rather than netting a taxable yield down."
  },
  {
    "id": "capm",
    "title": "Capital Asset Pricing Model (CAPM) expected return",
    "homeComponentId": "rec-cmt",
    "subjectId": "recommendations",
    "formulaLatex": "\\text{Expected Return} = R_f + \\beta \\times (R_m - R_f)",
    "summary": "CAPM estimates the return an investor should expect from a security given its systematic (non-diversifiable) risk. It converts a stock's beta into a required rate of return by adding a risk-adjusted equity premium to the risk-free rate.",
    "variables": [
      "$R_f$ = risk-free rate (typically the yield on a short-term U.S. Treasury bill)",
      "$\\beta$ = beta, the security's sensitivity to overall market movements ($\\beta = 1$ moves with the market)",
      "$R_m$ = expected return of the overall market",
      "$(R_m - R_f)$ = the market risk premium, i.e., the excess return demanded for holding market risk",
      "$\\beta \\times (R_m - R_f)$ = the stock's risk premium"
    ],
    "whenToUse": "Use CAPM to find a security's required (expected) return based on its systematic risk, or as the discount rate/hurdle rate for evaluating whether an investment adequately compensates for market risk. On the exam it is the standard tool linking beta to expected return along the Security Market Line.",
    "workedExample": "A stock has a beta of $1.5$. The risk-free rate is $4\\%$ and the expected market return is $10\\%$.\n\nMarket risk premium $= 10\\% - 4\\% = 6\\%$.\n\nExpected return $= 4\\% + 1.5 \\times 6\\% = 4\\% + 9\\% = 13\\%$.\n\nSo the investor should require a $13\\%$ return to be compensated for this stock's systematic risk.",
    "pitfall": "Multiply beta only by the market risk premium $(R_m - R_f)$, not by the full market return, and remember to add the risk-free rate back at the end — a very common calculation slip."
  },
  {
    "id": "market-cap",
    "title": "Market capitalization",
    "homeComponentId": "veh-equity-types",
    "subjectId": "vehicles",
    "formulaLatex": "\\text{Market Capitalization} = \\text{Shares Outstanding} \\times \\text{Market Price per Share}",
    "summary": "Market capitalization is the total market value of a company's outstanding common stock, found by multiplying the number of shares outstanding by the current market price per share. It measures a company's size as valued by the market.",
    "variables": [
      "Shares Outstanding: the number of common shares currently issued and held by investors (issued shares minus treasury shares)",
      "Market Price per Share: the current trading price of one share of the common stock"
    ],
    "whenToUse": "Use market cap to gauge a company's size and to classify equities into large-cap, mid-cap, small-cap, and micro-cap tiers — a distinction that drives portfolio construction, style analysis, and suitability discussions on the exam. It is a market-based figure, so it changes continuously with the share price, unlike book value.",
    "workedExample": "A company has 20 million shares outstanding trading at $45 per share.\n\n$$\\text{Market Cap} = 20{,}000{,}000 \\times \\$45 = \\$900{,}000{,}000$$\n\nThe company's market capitalization is $900 million, placing it in the small-cap range.",
    "pitfall": "Do not confuse market capitalization (shares outstanding times market price) with book value or par value; also use shares outstanding, not authorized or issued shares, since treasury shares are excluded."
  },
  {
    "id": "dividend-yield",
    "title": "Dividend yield of a stock",
    "homeComponentId": "veh-equity-char",
    "subjectId": "vehicles",
    "formulaLatex": "\\text{Dividend Yield} = \\frac{\\text{Annual Dividend per Share}}{\\text{Current Market Price per Share}}",
    "summary": "Dividend yield measures the annual cash dividend a stock pays as a percentage of its current market price. It tells an investor the income return being earned on the stock at today's price, independent of any price appreciation.",
    "variables": [
      "Annual Dividend per Share: the total dividend paid per share over one year. If given a quarterly dividend, multiply it by 4 to annualize.",
      "Current Market Price per Share: the stock's current trading price (use the current market price, not the original purchase price or par value)."
    ],
    "whenToUse": "Use it to compare the income return of a dividend-paying stock against other income investments (such as a bond's current yield) or to gauge whether a stock is attractive to an income-oriented investor. On the Series 65 it also appears in questions contrasting dividend yield with total return and with a bond's current yield, since the structure ($\\text{income} \\div \\text{price}$) is identical.",
    "workedExample": "A stock trades at \\$40 and pays a quarterly dividend of \\$0.50 per share.\n\nFirst annualize the dividend: $0.50 \\times 4 = 2.00$, so the annual dividend is \\$2.00.\n\nThen divide by the market price:\n\n$$\\text{Dividend Yield} = \\frac{2.00}{40.00} = 0.05 = 5\\%$$\n\nThe stock has a dividend yield of 5%.",
    "pitfall": "Forgetting to annualize a quarterly dividend (multiply by 4) or dividing by par value or the original purchase price instead of the current market price."
  }
];
