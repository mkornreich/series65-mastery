// Curated Series 65 video library for the Watch tab.
//
// Every entry is a REAL, verified YouTube video (each id confirmed live via the
// YouTube oembed endpoint — real title + channel, HTTP 200). Headlined by Dean
// Tinney (the "Guru") and Brian Lee (the "Geek") of TestGeek Exam Prep, whose
// "The Geek and the Guru" Series 65 podcast walks the whole blueprint, and
// rounded out with other well-known Series 65 prep creators. Some entries are
// shared Series 65/66 content — the two exams test the same adviser-law,
// economics, and math material — and are noted as such.
//
// Videos are grouped by exam topic below so the unfiltered list reads in
// blueprint order.

export type VideoTopicId =
  | 'overview'
  | 'economics'
  | 'vehicles'
  | 'recommendations'
  | 'laws'
  | 'math';

export interface VideoTopic {
  id: VideoTopicId;
  label: string;
}

/** Topic filter chips, ordered to mirror the exam blueprint. */
export const VIDEO_TOPICS: VideoTopic[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'economics', label: 'Economics' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'laws', label: 'Laws & Ethics' },
  { id: 'math', label: 'Math' },
];

export interface Video {
  /** YouTube video id (verified live). */
  id: string;
  title: string;
  channel: string;
  topic: VideoTopicId;
  /** Optional one-line descriptor shown under the title. */
  note?: string;
}

export const VIDEOS: Video[] = [
  // ── Overview ──────────────────────────────────────────────────────────────
  {
    id: '6vW_cNzPaTc',
    title: 'FINRA Series 65 Exam: Introduction',
    channel: 'The Geek & the Guru',
    topic: 'overview',
    note: 'Dean Tinney & Brian Lee frame what the exam covers.',
  },
  {
    id: 'tBtg1s8P_9s',
    title: 'The Geek & the Guru — Series 65, Episode 1',
    channel: 'The Geek & the Guru',
    topic: 'overview',
    note: 'Dean Tinney & Brian Lee kick off their 6-part Series 65 podcast.',
  },
  {
    id: 'keKL5mHtsys',
    title: 'The Geek & the Guru — Series 65, Episode 2',
    channel: 'The Geek & the Guru',
    topic: 'overview',
  },
  {
    id: 'blvieXKvLW8',
    title: 'The Geek & the Guru — Series 65, Episode 3',
    channel: 'The Geek & the Guru',
    topic: 'overview',
  },
  {
    id: 'YDcgUO6Cuhk',
    title: 'Series 65 Exam Changes',
    channel: 'The Geek & the Guru',
    topic: 'overview',
    note: 'What shifted on the exam and how to adjust your prep.',
  },
  {
    id: 'ZgGpInOniG0',
    title: 'Series 65 FAQ',
    channel: 'The Geek & the Guru',
    topic: 'overview',
    note: 'Common questions about the exam, answered.',
  },
  {
    id: 'wi2QVnyM1ZA',
    title: 'What Is the Series 65 Exam? How to Prep',
    channel: 'Achievable',
    topic: 'overview',
    note: 'Format, scoring, and a study plan for the exam.',
  },
  {
    id: 'taeJUT7bSZU',
    title: 'Preparing for the Series 65 Exam',
    channel: 'Achievable',
    topic: 'overview',
  },
  {
    id: 'Rf-PaEtJ6lM',
    title: 'What Is the Series 65 — and How Do You Pass It?',
    channel: 'Pass Masters',
    topic: 'overview',
  },
  {
    id: 'gz1kOCRtcZA',
    title: 'Pass by Knowing the Test Specifications',
    channel: 'Series 7 Guru',
    topic: 'overview',
    note: 'Uses the official blueprint to target your studying.',
  },
  {
    id: 'WeMa8IYvNX4',
    title: 'Practice Test 2, Fully Explained',
    channel: 'Series 7 Guru',
    topic: 'overview',
    note: 'Walks each question and every answer choice.',
  },
  {
    id: 'OmFVqPEnVhE',
    title: 'Practice Test & Review — 35 Fundamental Questions',
    channel: 'Exam Ready HQ',
    topic: 'overview',
  },
  {
    id: '2XNW0a5tQz8',
    title: 'Series 65 Final Exam — Can You Pass?',
    channel: 'Series 7 Whisperer',
    topic: 'overview',
    note: 'Timed practice questions worked through with answers.',
  },

  // ── Economics ─────────────────────────────────────────────────────────────
  {
    id: 'MleeXnso50o',
    title: 'Economics & Business Information',
    channel: 'The Geek & the Guru',
    topic: 'economics',
    note: 'Business cycle, monetary & fiscal policy, financial reporting.',
  },
  {
    id: 'H8SQiseYAg0',
    title: 'Economics & Financial Reporting — Test Specs Explained',
    channel: 'Series 7 Guru',
    topic: 'economics',
    note: 'Walks the official test specifications point by point.',
  },
  {
    id: 'FShQ52w1pvk',
    title: 'Economic Factors & Business Reporting',
    channel: 'Examzone',
    topic: 'economics',
  },
  {
    id: '438Aak5Zdvc',
    title: 'Economics & the Balance Sheet (Tutoring Replay)',
    channel: 'Series 7 Guru',
    topic: 'economics',
  },
  {
    id: 'Vp7oeM6MvK0',
    title: 'Know Your Balance Sheet',
    channel: 'Series 7 Guru',
    topic: 'economics',
    note: 'Reading financial statements for the exam.',
  },

  // ── Investment Vehicles ───────────────────────────────────────────────────
  {
    id: 'XG5bacYItJY',
    title: 'Investment Vehicles',
    channel: 'The Geek & the Guru',
    topic: 'vehicles',
    note: 'Stocks, bonds, funds, and their characteristics.',
  },
  {
    id: 'OmhJdG9R7nE',
    title: 'Investment Vehicles (Episode 4)',
    channel: 'The Geek & the Guru',
    topic: 'vehicles',
  },
  {
    id: 'Z06tx5YGw6c',
    title: 'The Bond Seesaw — Understanding Yields',
    channel: 'Tony Denaro',
    topic: 'vehicles',
    note: 'Why bond prices and yields move in opposite directions.',
  },
  {
    id: 'nMOtmtp1cGU',
    title: 'Fixed-Income Securities (3 Questions)',
    channel: 'Series 7 Guru',
    topic: 'vehicles',
  },
  {
    id: '3HKySlCMgNY',
    title: 'Corporate & Municipal Bonds — Quick Overview',
    channel: 'Series 7 Guru',
    topic: 'vehicles',
  },
  {
    id: 'Kk5eEX_GT78',
    title: 'Equity Securities: Ownership, Risk & Suitability',
    channel: 'Business with Mr. G',
    topic: 'vehicles',
  },
  {
    id: 'zRV1GiF1q30',
    title: 'Mutual Funds, ETFs, REITs & ETNs (Replay)',
    channel: 'Series 7 Guru',
    topic: 'vehicles',
  },
  {
    id: 'IeDF225sPFQ',
    title: 'Forwards vs. Futures',
    channel: 'Series 7 Guru',
    topic: 'vehicles',
  },
  {
    id: 'lrUL9MAcO88',
    title: 'Annuities: Variable, Fixed & Equity-Indexed',
    channel: 'Tony Denaro',
    topic: 'vehicles',
  },
  {
    id: 'dELl4PWWoXk',
    title: 'A Trick for TIPS',
    channel: 'Series 7 Guru',
    topic: 'vehicles',
    note: 'Inflation-protected Treasuries made simple.',
  },

  // ── Client Recommendations & Strategies ───────────────────────────────────
  {
    id: 'aH7h7BGS0s4',
    title: 'Client Recommendations & Investment Strategies',
    channel: 'The Geek & the Guru',
    topic: 'recommendations',
    note: 'Suitability, client profiles, and portfolio strategies.',
  },
  {
    id: 'Ru5C1rVDe3Y',
    title: 'Suitability vs. Fiduciary Standard',
    channel: 'Business with Mr. G',
    topic: 'recommendations',
  },
  {
    id: 'xMQ4KMf3p3I',
    title: 'Efficient Frontier & Efficient Portfolios',
    channel: 'Series 7 Guru',
    topic: 'recommendations',
    note: 'Modern portfolio theory as the exam tests it.',
  },
  {
    id: 'n0irTa_SYlg',
    title: 'Customer Accounts (Class Replay)',
    channel: 'Series 7 Guru',
    topic: 'recommendations',
  },
  {
    id: 'uOYGujnVTtk',
    title: 'Tax Questions That Trip Up Test-Takers',
    channel: 'Pass Masters',
    topic: 'recommendations',
  },

  // ── Laws, Regulations & Ethics ────────────────────────────────────────────
  {
    id: 'ePTToPOhrpk',
    title: 'Laws & Regulations (Registrations)',
    channel: 'The Geek & the Guru',
    topic: 'laws',
    note: 'Registration of advisers, agents, and securities.',
  },
  {
    id: 'I_eVkzpA4oM',
    title: 'The Geek & the Guru — Disclosures & Unethical Practices',
    channel: 'The Geek & the Guru',
    topic: 'laws',
    note: 'Ethics content shared by the Series 65 & 66 exams.',
  },
  {
    id: 'nyRac0aTYbE',
    title: 'The Investment Advisers Act of 1940',
    channel: 'Business with Mr. G',
    topic: 'laws',
  },
  {
    id: '4JVdnd6_ihg',
    title: 'Form ADV — Test Concepts',
    channel: 'The Geek & the Guru',
    topic: 'laws',
  },
  {
    id: 'h9eW01x9BnY',
    title: 'Exemptions vs. Exclusions from Registration',
    channel: 'Business with Mr. G',
    topic: 'laws',
  },
  {
    id: '6U_GgTCDFMk',
    title: 'Fiduciary Duty for Investment Advisers',
    channel: 'Business with Mr. G',
    topic: 'laws',
  },
  {
    id: 'NeDhegtQr_0',
    title: 'Ethics (2026): Fiduciary Duty, Reg BI & New Rules',
    channel: 'Open Exam Prep',
    topic: 'laws',
  },
  {
    id: '_vtHKfHA9Nw',
    title: 'Custody vs. Discretion',
    channel: 'Series 7 Guru',
    topic: 'laws',
  },

  // ── Math & Formulas ───────────────────────────────────────────────────────
  {
    id: 'gU4aaTHhRtc',
    title: 'Formulas to Know',
    channel: 'Series 7 Whisperer',
    topic: 'math',
    note: 'The calculations tested — yields, returns, ratios, valuation.',
  },
  {
    id: 'MhBsFykaa2o',
    title: 'Formulas for the Series 65/66 Exam',
    channel: 'Series 7 Guru',
    topic: 'math',
  },
  {
    id: 'bf0J_VUOxyg',
    title: 'Alpha, Beta & Standard Deviation',
    channel: 'Open Exam Prep',
    topic: 'math',
  },
  {
    id: 'vONCWQqRq3c',
    title: 'Present Value & Future Value',
    channel: 'Series 7 Guru',
    topic: 'math',
  },
  {
    id: 'Ai1HA-UUCVs',
    title: 'Net Present Value — A Worked Example',
    channel: 'Series 7 Guru',
    topic: 'math',
  },
  {
    id: '2wSEw527AN8',
    title: 'Investment Analysis: DCF & IRR',
    channel: 'The Geek & the Guru',
    topic: 'math',
  },
];

/** Best 16:9 thumbnail that YouTube always has for a video (no black bars). */
export function videoThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
}

/** Canonical watch URL to open externally. */
export function videoUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
