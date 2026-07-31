// Central design tokens. A calm, focused study palette (works in light mode).

export const colors = {
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
  // Per-subject accent colors (matches curriculum order)
  subject: {
    econ: '#4C8DFF',
    vehicles: '#22C7A9',
    recommendations: '#B583FF',
    laws: '#F5A623',
  } as Record<string, string>,
  // Mastery level colors
  mastery: {
    not_started: '#6B7A99',
    beginning: '#F26D6D',
    developing: '#F5A623',
    proficient: '#4C8DFF',
    mastered: '#3DDC97',
  } as Record<string, string>,
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
