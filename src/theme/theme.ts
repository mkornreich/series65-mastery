// Design tokens. Two palettes (dark + light) share the same keys so components
// can switch themes at runtime via the ThemeContext.

export interface ThemeColors {
  bg: string;
  bgAlt: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  primary: string;
  primaryDark: string;
  accent: string;
  warn: string;
  danger: string;
  success: string;
  text: string;
  textMuted: string;
  textFaint: string;
  /** Foreground color for text/icons on top of bright buttons (primary/accent/danger). */
  onBright: string;
  subject: Record<string, string>;
  mastery: Record<string, string>;
}

export const darkColors: ThemeColors = {
  bg: '#0F1724',
  bgAlt: '#0B1220',
  surface: '#16213A',
  surfaceAlt: '#1E2A48',
  border: '#2A3A5C',
  primary: '#4C8DFF',
  primaryDark: '#2F6BE0',
  accent: '#22C7A9',
  warn: '#F5A623',
  danger: '#F26D6D',
  success: '#3DDC97',
  text: '#EAF0FB',
  textMuted: '#9FB0CC',
  textFaint: '#6B7A99',
  onBright: '#04122E',
  subject: {
    econ: '#4C8DFF',
    vehicles: '#22C7A9',
    recommendations: '#B583FF',
    laws: '#F5A623',
  },
  mastery: {
    not_started: '#6B7A99',
    beginning: '#F26D6D',
    developing: '#F5A623',
    proficient: '#4C8DFF',
    mastered: '#3DDC97',
  },
};

export const lightColors: ThemeColors = {
  bg: '#F4F6FB',
  bgAlt: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF1F8',
  border: '#DCE3EE',
  primary: '#2F6BE0',
  primaryDark: '#2456C0',
  accent: '#0F9E8C',
  warn: '#B9770B',
  danger: '#D64545',
  success: '#1F9D6B',
  text: '#131A26',
  textMuted: '#566074',
  textFaint: '#8A97AD',
  onBright: '#FFFFFF',
  subject: {
    econ: '#2F6BE0',
    vehicles: '#0F9E8C',
    recommendations: '#7C4DD6',
    laws: '#B9770B',
  },
  mastery: {
    not_started: '#8A97AD',
    beginning: '#D64545',
    developing: '#B9770B',
    proficient: '#2F6BE0',
    mastered: '#1F9D6B',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const font = {
  h1: 28,
  h2: 22,
  h3: 18,
  body: 15,
  small: 13,
  tiny: 11,
};

export const masteryLabel: Record<string, string> = {
  not_started: 'Not started',
  beginning: 'Beginning',
  developing: 'Developing',
  proficient: 'Proficient',
  mastered: 'Mastered',
};

// Backwards-compatible default export (dark palette) for any non-theming usage.
export const colors = darkColors;
