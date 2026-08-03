// AUTO-GENERATED: bank questions that require a calculation (classified +
// adversarially verified). Used to serve calculation-only math practice.

export const MATH_QUESTION_IDS: string[] = [
  "econ-basic-7",
  "econ-basic-8",
  "econ-reporting-2",
  "econ-analytical-3",
  "econ-analytical-7",
  "veh-cash-5",
  "veh-fixed-char-1",
  "veh-fixed-char-5",
  "veh-equity-types-3",
  "veh-equity-types-4",
  "veh-equity-char-2",
  "veh-equity-char-3",
  "veh-equity-value-3",
  "veh-pooled-types-2",
  "veh-deriv-types-3",
  "veh-alts-3",
  "veh-insurance-3",
  "rec-profile-3",
  "rec-cmt-2",
  "rec-cmt-5",
  "rec-portfolio-3",
  "rec-tax-3",
  "rec-accounts-4",
  "rec-performance-2",
  "rec-performance-4",
  "law-remedies-4",
  "econ-analytical-add-fv",
  "econ-analytical-add-range",
  "veh-equity-types-add-marketcap",
  "econ-analytical-add-empirical",
  "rec-performance-add-alpha"
];

// The curriculum components that actually contain calculation questions.
export const MATH_QUESTION_COMPONENT_IDS: string[] = [
  "econ-basic",
  "econ-reporting",
  "econ-analytical",
  "veh-cash",
  "veh-fixed-char",
  "veh-equity-types",
  "veh-equity-char",
  "veh-equity-value",
  "veh-pooled-types",
  "veh-deriv-types",
  "veh-alts",
  "veh-insurance",
  "rec-profile",
  "rec-cmt",
  "rec-portfolio",
  "rec-tax",
  "rec-accounts",
  "rec-performance",
  "law-remedies"
];

export const MATH_QUESTIONS_BY_TOPIC: Record<string, string[]> = {
  "other": [
    "econ-basic-7",
    "econ-basic-8",
    "econ-reporting-2",
    "econ-analytical-3",
    "veh-cash-5",
    "veh-fixed-char-5",
    "veh-equity-types-3",
    "veh-equity-types-4",
    "veh-equity-char-2",
    "veh-equity-char-3",
    "veh-equity-value-3",
    "veh-deriv-types-3",
    "veh-alts-3",
    "veh-insurance-3",
    "rec-portfolio-3",
    "rec-tax-3",
    "rec-accounts-4",
    "rec-performance-4",
    "law-remedies-4",
    "econ-analytical-add-range",
    "econ-analytical-add-empirical"
  ],
  "current-ratio": [
    "econ-analytical-7"
  ],
  "tax-equivalent-yield": [
    "veh-fixed-char-1"
  ],
  "nav": [
    "veh-pooled-types-2"
  ],
  "after-tax-return": [
    "rec-profile-3"
  ],
  "capm": [
    "rec-cmt-2",
    "rec-cmt-5",
    "rec-performance-add-alpha"
  ],
  "current-yield": [
    "rec-performance-2"
  ],
  "future-value": [
    "econ-analytical-add-fv"
  ],
  "market-cap": [
    "veh-equity-types-add-marketcap"
  ]
};

const MATH_ID_SET = new Set(MATH_QUESTION_IDS);
export function isMathQuestion(id: string): boolean { return MATH_ID_SET.has(id); }
