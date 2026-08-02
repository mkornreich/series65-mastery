// AUTO-GENERATED from the NASAA Series 65 blueprint. Do not hand-edit.
import { Subject, ExamSpec, Component } from '../types';

export const EXAM_SPEC: ExamSpec = {
  totalQuestions: 140,
  scoredQuestions: 130,
  pretestQuestions: 10,
  passingCorrect: 92,
  timeLimitMinutes: 180,
  passPercent: 70.8,
  source: "NASAA Uniform Investment Adviser Law Examination (Series 65) Overview, Sept 1, 2023",
};

export const SUBJECTS: Subject[] = [
  {
    id: "econ",
    code: 1,
    title: "Economic Factors and Business Information",
    weightPct: 15,
    scoredQuestions: 20,
    components: [
      {
        id: "econ-basic",
        number: 1,
        title: "Basic Economic Concepts",
        subjectId: "econ",
        questionTarget: 8,
        subtopics: [
          "Business cycles",
          "Monetary and fiscal policies",
          "Global and geopolitical factors (currency valuation, exchange-rate effects on returns, sovereign debt)",
          "Inflation/deflation",
          "Interest rates, yield curves, credit spreads",
          "Economic indicators (GDP, employment indicators, trade deficit, balance of payments, CPI)",
        ],
      },
      {
        id: "econ-reporting",
        number: 2,
        title: "Financial Reporting",
        subjectId: "econ",
        questionTarget: 7,
        subtopics: [
          "Financial reports (income statement, balance sheet, statement of cash flows, auditor disclosures, corporate SEC filings, annual reports)",
          "Accounting fundamentals (audited vs. unaudited financials, cash vs. accrual accounting)",
        ],
      },
      {
        id: "econ-analytical",
        number: 3,
        title: "Analytical Methods",
        subjectId: "econ",
        questionTarget: 9,
        subtopics: [
          "Time value of money (internal rate of return, net present value)",
          "Descriptive statistics (mean, median, mode, range, standard deviation, alpha, beta, Sharpe ratio, correlation)",
          "Financial ratios and their uses (current ratio, quick ratio, debt-to-equity ratio)",
          "Valuation ratios (price-to-earnings, price-to-book)",
        ],
      },
      {
        id: "econ-risk",
        number: 4,
        title: "Types of Risk",
        subjectId: "econ",
        questionTarget: 8,
        subtopics: [
          "Systematic risks",
          "Unsystematic risks",
          "Opportunity cost",
          "Capital structure including liquidation priority",
        ],
      },
    ],
  },
  {
    id: "vehicles",
    code: 2,
    title: "Investment Vehicle Characteristics",
    weightPct: 25,
    scoredQuestions: 32,
    components: [
      {
        id: "veh-cash",
        number: 1,
        title: "Cash and Cash Equivalents",
        subjectId: "vehicles",
        questionTarget: 5,
        subtopics: [
          "Insured deposits (demand deposits, certificates of deposit)",
          "Money market instruments (commercial paper, Treasury bills)",
        ],
      },
      {
        id: "veh-fixed-types",
        number: 2,
        title: "Types of Fixed Income Securities",
        subjectId: "vehicles",
        questionTarget: 6,
        subtopics: [
          "U.S. government and agency securities (Treasuries, MBS from Fannie Mae/Freddie Mac, TIPS)",
          "Asset-backed securities",
          "Corporate bonds",
          "Municipal bonds (general obligation, revenue, insured vs. uninsured)",
          "Foreign bonds (government debt, corporate debt)",
        ],
      },
      {
        id: "veh-fixed-char",
        number: 3,
        title: "Characteristics and Valuation of Fixed Income",
        subjectId: "vehicles",
        questionTarget: 7,
        subtopics: [
          "Characteristics (tax implications, liquidity, liquidation preference, call features, coupon vs. zero coupon, duration, premium)",
          "Valuation factors (maturity, yield-to-call, yield-to-maturity, conversion valuation, bond ratings, credit spread, discounted cash flow)",
        ],
      },
      {
        id: "veh-equity-types",
        number: 4,
        title: "Types of Equity Securities",
        subjectId: "vehicles",
        questionTarget: 4,
        subtopics: [
          "Common stock, domestic and foreign",
          "Preferred and convertible preferred stock",
        ],
      },
      {
        id: "veh-equity-char",
        number: 5,
        title: "Characteristics of Equity Securities",
        subjectId: "vehicles",
        questionTarget: 5,
        subtopics: [
          "Shareholder rights (voting rights, antidilution, liquidation preferences)",
          "Restricted stock and resale restrictions",
          "Dividends",
          "Employee stock options (incentive, nonqualified)",
        ],
      },
      {
        id: "veh-equity-value",
        number: 6,
        title: "Valuing Equity Securities",
        subjectId: "vehicles",
        questionTarget: 5,
        subtopics: [
          "Technical analysis",
          "Fundamental analysis",
          "Dividend discount model",
          "Discounted cash flow",
        ],
      },
      {
        id: "veh-offering",
        number: 7,
        title: "Equity Public Offering",
        subjectId: "vehicles",
        questionTarget: 4,
        subtopics: [
          "Initial public offering (IPO)",
          "Secondary offering",
          "SPAC / blind pools / blank check",
        ],
      },
      {
        id: "veh-pooled-types",
        number: 8,
        title: "Types of Pooled Investments",
        subjectId: "vehicles",
        questionTarget: 6,
        subtopics: [
          "Mutual funds (open-end vs. closed-end)",
          "Private funds (hedge funds, private equity, venture capital)",
          "Unit investment trusts (UITs)",
          "Exchange-traded funds (ETFs)",
          "Real estate investment trusts (REITs, listed and non-traded)",
        ],
      },
      {
        id: "veh-pooled-char",
        number: 9,
        title: "Characteristics of Pooled Investments",
        subjectId: "vehicles",
        questionTarget: 6,
        subtopics: [
          "Share classes",
          "Liquidity",
          "Tax implications",
          "Fee structures (load vs. no-load, CDSC, 12b-1 fees, breakpoints)",
          "Pricing (NAV, discount/premium)",
          "Benefits and risks; relative comparisons (benchmarks, manager tenure, indexes)",
        ],
      },
      {
        id: "veh-deriv-types",
        number: 10,
        title: "Types of Derivative Securities",
        subjectId: "vehicles",
        questionTarget: 4,
        subtopics: [
          "Options and warrants (definitions)",
          "Futures and forward contracts (definitions)",
        ],
      },
      {
        id: "veh-deriv-char",
        number: 11,
        title: "Characteristics of Derivatives",
        subjectId: "vehicles",
        questionTarget: 3,
        subtopics: [
          "Costs, benefits, and risks of derivative securities",
        ],
      },
      {
        id: "veh-alts",
        number: 12,
        title: "Alternative Investments",
        subjectId: "vehicles",
        questionTarget: 5,
        subtopics: [
          "Limited partnerships",
          "Exchange-traded notes (ETNs)",
          "Leveraged funds",
          "Inverse funds",
          "Structured products",
        ],
      },
      {
        id: "veh-insurance",
        number: 13,
        title: "Insurance-Based Products",
        subjectId: "vehicles",
        questionTarget: 5,
        subtopics: [
          "Annuities (fixed, variable, equity indexed)",
          "Life insurance (whole, term, universal, variable)",
        ],
      },
      {
        id: "veh-other",
        number: 14,
        title: "Other Assets",
        subjectId: "vehicles",
        questionTarget: 4,
        subtopics: [
          "Commodities and precious metals",
          "Digital assets",
        ],
      },
    ],
  },
  {
    id: "recommendations",
    code: 3,
    title: "Client Investment Recommendations and Strategies",
    weightPct: 30,
    scoredQuestions: 39,
    components: [
      {
        id: "rec-client-type",
        number: 1,
        title: "Type of Client",
        subjectId: "recommendations",
        questionTarget: 6,
        subtopics: [
          "Individual, natural person, sole proprietorship",
          "Business entities (general partnership, limited partnership, LLC, C and S corporations)",
          "Trusts and estates",
          "Foundations and charities",
        ],
      },
      {
        id: "rec-profile",
        number: 2,
        title: "Client Profile",
        subjectId: "recommendations",
        questionTarget: 7,
        subtopics: [
          "Financial goals and objectives",
          "Current and future financial situation (cash flow, balance sheet, existing investments, tax situation, Social Security, pensions)",
          "Risk tolerance",
          "Nonfinancial considerations (values, attitudes, experience, demographics, life events, behavioral finance)",
          "Client data gathering (identification, questionnaires, interviews)",
          "Time horizon",
        ],
      },
      {
        id: "rec-cmt",
        number: 3,
        title: "Capital Market Theory",
        subjectId: "recommendations",
        questionTarget: 5,
        subtopics: [
          "Investment theories and models (CAPM, modern portfolio theory, efficient market hypothesis)",
        ],
      },
      {
        id: "rec-portfolio",
        number: 4,
        title: "Portfolio Management Strategies, Styles, Techniques",
        subjectId: "recommendations",
        questionTarget: 6,
        subtopics: [
          "Strategies (strategic vs. tactical asset allocation)",
          "Styles (active, passive, growth, value, income, capital appreciation)",
          "Techniques (diversification, sector rotation, dollar-cost averaging, options, leveraging, volatility management, inverse strategies, HFT)",
        ],
      },
      {
        id: "rec-tax",
        number: 5,
        title: "Tax Considerations",
        subjectId: "recommendations",
        questionTarget: 6,
        subtopics: [
          "Individual income tax (capital gains, qualified dividends, tax basis, marginal bracket, AMT)",
          "Pension and retirement plan distributions (required minimum distributions, RMD)",
          "Government benefit implications (income-related monthly adjustment amounts, IRMAA)",
          "Corporations, trusts, and estates income tax",
          "Wealth transfer, estate tax, and gift tax fundamentals",
        ],
      },
      {
        id: "rec-retirement",
        number: 6,
        title: "Retirement Plans",
        subjectId: "recommendations",
        questionTarget: 6,
        subtopics: [
          "IRAs (traditional, Roth)",
          "Solo 401(k) (traditional, Roth)",
          "Qualified retirement plans",
          "Nonqualified retirement plans",
        ],
      },
      {
        id: "rec-erisa",
        number: 7,
        title: "ERISA Issues",
        subjectId: "recommendations",
        questionTarget: 4,
        subtopics: [
          "Fiduciary issues (investment choices, ERISA § 404(c))",
          "Investment policy statement",
          "Prohibited transactions",
        ],
      },
      {
        id: "rec-accounts",
        number: 8,
        title: "Special Types of Accounts",
        subjectId: "recommendations",
        questionTarget: 4,
        subtopics: [
          "Education accounts (529 plans, Coverdell)",
          "UTMA and UGMA",
          "Health savings accounts (HSA)",
        ],
      },
      {
        id: "rec-ownership",
        number: 9,
        title: "Ownership and Estate Planning",
        subjectId: "recommendations",
        questionTarget: 5,
        subtopics: [
          "Types of ownership (JTWROS, tenants in common, tenancy by the entirety, community property with rights of survivorship (CPWROS))",
          "Pay on death and transfer on death",
          "Beneficiary designation (including per stirpes)",
          "Trusts and wills",
          "Qualified domestic relations order (QDRO)",
          "Donor advised funds",
        ],
      },
      {
        id: "rec-trading",
        number: 10,
        title: "Trading Securities",
        subjectId: "recommendations",
        questionTarget: 5,
        subtopics: [
          "Terminology (bids, offers, quotes, market/limit/stop orders, short sales, cash vs. margin accounts, principal vs. agency trades, payment for order flow)",
          "Roles of broker-dealers, custodians, market makers, exchanges",
          "Costs of trading (commissions, markups, bid/ask spread, best execution)",
        ],
      },
      {
        id: "rec-performance",
        number: 11,
        title: "Portfolio Performance Measures",
        subjectId: "recommendations",
        questionTarget: 5,
        subtopics: [
          "Returns (risk-adjusted, time-weighted, dollar-weighted, annualized, total, holding period, IRR, expected, inflation-adjusted, after-tax)",
          "Current yield",
          "Relevant benchmarks",
        ],
      },
    ],
  },
  {
    id: "laws",
    code: 4,
    title: "Laws, Regulations, and Prohibition on Unethical Business Practices",
    weightPct: 30,
    scoredQuestions: 39,
    components: [
      {
        id: "law-ia",
        number: 1,
        title: "Regulation of Investment Advisers",
        subjectId: "laws",
        questionTarget: 10,
        subtopics: [
          "Definitions of an investment adviser (USA § 401, IAA § 202)",
          "Notice filing requirements",
          "Registration and post-registration requirements (books and records, Form ADV, IAA § 203/203A, USA § 201–204, SEC Rules 203A-1/2, 204-1, 204-3, NASAA model rules)",
          "Exemptions for exempt reporting advisers and private fund advisers",
          "IAR supervision",
        ],
      },
      {
        id: "law-iar",
        number: 2,
        title: "Regulation of Investment Adviser Representatives",
        subjectId: "laws",
        questionTarget: 6,
        subtopics: [
          "Definition of an IAR (USA § 401, SEC Rule 203A-3)",
          "Registration and post-registration (USA § 201–204, Form U4, NASAA model rules 202(a)-1, 204(b)(6)-1)",
        ],
      },
      {
        id: "law-bd",
        number: 3,
        title: "Regulation of Broker-Dealers",
        subjectId: "laws",
        questionTarget: 5,
        subtopics: [
          "Definition of a broker-dealer (USA § 401, IAA § 202)",
          "Definition of an underwriter (SA § 2)",
          "Definition of a market maker, associated person (SEA § 3)",
          "Registration and post-registration requirements",
        ],
      },
      {
        id: "law-bda",
        number: 4,
        title: "Regulation of Broker-Dealer Agents",
        subjectId: "laws",
        questionTarget: 4,
        subtopics: [
          "Definition of a broker-dealer agent (USA § 401)",
          "Registration and post-registration (Form U4)",
        ],
      },
      {
        id: "law-securities",
        number: 5,
        title: "Regulation of Securities and Issuers",
        subjectId: "laws",
        questionTarget: 6,
        subtopics: [
          "Definitions of security and issuer (USA § 401)",
          "Securities registration process (SA § 5, § 18, Reg D, USA § 301–305, § 402)",
          "Definitions of investment companies (ICA § 2)",
          "State antifraud authority",
        ],
      },
      {
        id: "law-remedies",
        number: 6,
        title: "Remedies and Administrative Provisions",
        subjectId: "laws",
        questionTarget: 5,
        subtopics: [
          "Authority of the state securities administrator (USA § 204, § 306, § 406, § 407, § 412)",
          "Administrative actions (USA § 408)",
          "Other penalties and liabilities (USA § 409, § 410, § 411)",
        ],
      },
      {
        id: "law-comms",
        number: 7,
        title: "Communication with Clients and Prospects",
        subjectId: "laws",
        questionTarget: 5,
        subtopics: [
          "Disclosures",
          "Unlawful representations concerning registrations",
          "Performance guarantees",
          "Client contracts (USA § 102, IAA § 205, NASAA model rule)",
          "Correspondence and advertising (social media, email, website, USA § 403/405, SEC Rules 206(4)-1, 204-2)",
        ],
      },
      {
        id: "law-ethics",
        number: 8,
        title: "Ethical Practices and Fiduciary Obligations",
        subjectId: "laws",
        questionTarget: 10,
        subtopics: [
          "Compensation (fees, commissions, performance-based fees, pay-to-play, soft dollars, SEA § 28(e), SEC Rule 206(4)-5, MSRB Rule G-37)",
          "Client funds and securities (custody, discretion, prudent investor, suitability, AML, Uniform Prudent Investor Act)",
          "Custody conditions (SEC Rule 206(4)-2, NASAA model rules)",
          "Conflicts of interest and prohibited conduct (insider trading, selling away, market manipulation, personal trades, SEC Rule 204A-1, NASAA Unethical Business Practices rules)",
          "Cybersecurity, privacy, data protection (SEC Regulation S-P)",
          "Business continuity and succession planning (NASAA model rule)",
        ],
      },
    ],
  },
];

export const ALL_COMPONENTS: Component[] = SUBJECTS.flatMap((s) => s.components);

export const SUBJECT_BY_ID: Record<string, Subject> = Object.fromEntries(
  SUBJECTS.map((s) => [s.id, s])
);

export const COMPONENT_BY_ID: Record<string, Component> = Object.fromEntries(
  ALL_COMPONENTS.map((c) => [c.id, c])
);

export function getSubject(id: string): Subject | undefined {
  return SUBJECT_BY_ID[id];
}

export function getComponent(id: string): Component | undefined {
  return COMPONENT_BY_ID[id];
}

