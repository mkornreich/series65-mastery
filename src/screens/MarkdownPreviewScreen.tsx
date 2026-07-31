import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '../components/ui';
import { Markdown } from '../components/markdown';
import { spacing, font, radius, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

// Dev-only gallery to visually verify every markdown + math rendering path,
// including a live "streaming" sample that re-parses one character at a time.

const SAMPLES: { title: string; src: string }[] = [
  {
    title: 'Inline math + currency',
    src: 'Current yield is $CY = \\frac{\\text{Annual Coupon}}{\\text{Market Price}}$. A bond paying $50 a year at $950 yields about $5.26\\%$.',
  },
  { title: 'Display: CAPM', src: 'The required return:\n\n$$r = r_f + \\beta(r_m - r_f)$$\n\nwhere $r_f$ is the risk-free rate.' },
  {
    title: 'Display: standard deviation',
    src: '$$\\sigma = \\sqrt{\\frac{1}{N}\\sum_{i=1}^{N} (x_i - \\mu)^2}$$',
  },
  {
    title: 'Display: compounding + \\left( \\right)',
    src: '$$FV = PV\\left(1 + \\frac{r}{m}\\right)^{m \\cdot t}$$\n\nAs $m \\to \\infty$, $FV = PV e^{rt}$.',
  },
  {
    title: 'Emphasis, quote, rule',
    src: '# Fiduciary Duty\n\nAn adviser owes a **fiduciary duty** — the *highest* standard, meaning ___best interest___.\n\n> An **agent** represents a broker-dealer.\n\n---\n\nClerical staff are *not* agents.',
  },
  {
    title: 'Table (alignment + math cells)',
    src: '| Metric | Formula |\n|--------|:-------:|\n| Current Yield | $\\frac{C}{P}$ |\n| YTM | solves $P = \\sum \\frac{C}{(1+y)^t}$ |',
  },
  {
    title: 'Nested list',
    src: 'Registration:\n\n- Federal (SEC)\n  - AUM $110 million or more\n  - Advises funds\n- State\n  1. AUM under $100 million\n  2. Notice filing',
  },
  {
    title: 'Fenced code',
    src: 'Compute it:\n\n```javascript\nfunction cy(coupon, price) {\n  return (coupon / price) * 100;\n}\n```\n\nThe `price` is market price.',
  },
  {
    title: 'Adversarial dollars (no math)',
    src: 'Accredited thresholds: $200,000 to $300,000 income, or $1,000,000 to $5,000,000 net worth. The bond costs $1,000 and pays $50.',
  },
  { title: 'Links + strikethrough', src: 'See the [NASAA site](https://www.nasaa.org). The old ~~net capital~~ rule varies.' },
];

const STREAM_SRC =
  '## Present Value\n\n**Present value** discounts a future cash flow:\n\n$$PV = \\frac{FV}{(1 + r)^n}$$\n\nSo $1,000 in 5 years at 6% is worth about $747 today.';

export default function MarkdownPreviewScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [n, setN] = useState(0);

  // Animate a streaming prefix to eyeball partial-token stability.
  useEffect(() => {
    if (n >= STREAM_SRC.length) return;
    const id = setTimeout(() => setN((v) => Math.min(STREAM_SRC.length, v + 2)), 45);
    return () => clearTimeout(id);
  }, [n]);

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.label}>STREAMING (partial re-parse)</Text>
        <Markdown source={STREAM_SRC.slice(0, n)} />
        <Text style={styles.replay} onPress={() => setN(0)}>
          ↻ replay
        </Text>
      </View>
      {SAMPLES.map((s) => (
        <View key={s.title} style={styles.card}>
          <Text style={styles.label}>{s.title}</Text>
          <Markdown source={s.src} />
        </View>
      ))}
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    label: {
      color: colors.accent,
      fontSize: font.tiny,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: spacing.sm,
    },
    replay: { color: colors.primary, fontSize: font.small, fontWeight: '700', marginTop: spacing.sm },
  });
