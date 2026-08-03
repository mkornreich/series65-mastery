// Curated Series 65 video library for the Watch tab.
//
// Every entry is a REAL, verified YouTube video (each id was confirmed live via
// the YouTube oembed endpoint — real title + channel). The headliners are Dean
// Tinney (the "Guru") and Brian Lee (the "Geek") of TestGeek Exam Prep, whose
// 6-part "The Geek and the Guru" Series 65 podcast walks the whole blueprint,
// rounded out with other well-known Series 65 prep creators.

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
  // ── The Geek and the Guru (Dean Tinney + Brian Lee, TestGeek) ──────────────
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
    id: 'MleeXnso50o',
    title: 'Economics & Business Information',
    channel: 'The Geek & the Guru',
    topic: 'economics',
    note: 'Business cycle, monetary & fiscal policy, financial reporting.',
  },
  {
    id: 'aH7h7BGS0s4',
    title: 'Client Recommendations & Investment Strategies',
    channel: 'The Geek & the Guru',
    topic: 'recommendations',
    note: 'Suitability, client profiles, and portfolio strategies.',
  },
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
    id: 'ePTToPOhrpk',
    title: 'Laws & Regulations (Registrations)',
    channel: 'The Geek & the Guru',
    topic: 'laws',
    note: 'Registration of advisers, agents, and securities.',
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
  // ── Series 7 Guru (Dean Tinney solo) ──────────────────────────────────────
  {
    id: 'H8SQiseYAg0',
    title: 'Economics & Financial Reporting — Test Specs Explained',
    channel: 'Series 7 Guru',
    topic: 'economics',
    note: 'Walks the official test specifications point by point.',
  },
  // ── Achievable (Tony Denaro) ──────────────────────────────────────────────
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
  // ── Series 7 Whisperer ────────────────────────────────────────────────────
  {
    id: 'gU4aaTHhRtc',
    title: 'Formulas to Know',
    channel: 'Series 7 Whisperer',
    topic: 'math',
    note: 'The calculations tested — yields, returns, ratios, valuation.',
  },
  {
    id: '2XNW0a5tQz8',
    title: 'Series 65 Final Exam — Can You Pass?',
    channel: 'Series 7 Whisperer',
    topic: 'overview',
    note: 'Timed practice questions worked through with answers.',
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
