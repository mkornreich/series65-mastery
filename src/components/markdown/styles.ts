import { StyleSheet, TextStyle, Platform } from 'react-native';
import { ThemeColors, font, spacing, radius } from '../../theme/theme';

export interface MarkdownTheme {
  colors: ThemeColors;
  /** Base body text size (defaults to font.body). */
  baseSize: number;
}

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const HEADING_SIZE: Record<number, number> = {
  1: font.h1,
  2: font.h2,
  3: font.h3,
  4: font.body + 2,
  5: font.body + 1,
  6: font.body,
};

export function headingSize(level: number): number {
  return HEADING_SIZE[level] ?? font.body;
}

export function makeMarkdownStyles(theme: MarkdownTheme) {
  const { colors, baseSize } = theme;
  return StyleSheet.create({
    // block spacing
    blockGap: { marginTop: spacing.sm },
    paragraph: {
      color: colors.text,
      fontSize: baseSize,
      lineHeight: Math.round(baseSize * 1.5),
    },
    heading: {
      color: colors.text,
      fontWeight: '800',
    },
    // inline
    text: { color: colors.text, fontSize: baseSize, lineHeight: Math.round(baseSize * 1.5) } as TextStyle,
    strong: { fontWeight: '800' } as TextStyle,
    emphasis: { fontStyle: 'italic' } as TextStyle,
    strike: { textDecorationLine: 'line-through' } as TextStyle,
    link: { color: colors.primary, textDecorationLine: 'underline' } as TextStyle,
    codeSpan: {
      // colors.text (not accent) keeps inline code readable in the light theme,
      // where accent-on-surfaceAlt falls below the WCAG AA contrast floor.
      fontFamily: MONO,
      fontSize: baseSize - 1,
      color: colors.text,
      backgroundColor: colors.surfaceAlt,
    } as TextStyle,
    // code block
    codeBlock: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginTop: spacing.sm,
    },
    codeBlockText: {
      fontFamily: MONO,
      fontSize: baseSize - 1,
      color: colors.text,
      lineHeight: Math.round((baseSize - 1) * 1.45),
    } as TextStyle,
    codeLang: {
      color: colors.textFaint,
      fontSize: font.tiny,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginBottom: 4,
      textTransform: 'uppercase',
    } as TextStyle,
    // blockquote
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
      paddingLeft: spacing.md,
      marginTop: spacing.sm,
      opacity: 0.95,
    },
    // list
    listRow: { flexDirection: 'row', marginTop: 2 },
    listMarker: {
      color: colors.textMuted,
      fontSize: baseSize,
      lineHeight: Math.round(baseSize * 1.5),
    } as TextStyle,
    listMarkerBox: { minWidth: baseSize * 1.6, paddingRight: spacing.xs },
    // thematic break
    hr: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
    // table
    tableWrap: { marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, overflow: 'hidden' },
    tableRow: { flexDirection: 'row' },
    tableCell: {
      // Cap cell width so a long cell wraps to a few lines instead of running
      // off-screen; the table still scrolls horizontally when the total of all
      // columns exceeds the viewport.
      maxWidth: 240,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderColor: colors.border,
      justifyContent: 'center',
    },
    tableHeaderCell: { backgroundColor: colors.surfaceAlt },
    tableHeaderText: { fontWeight: '800' },
    // surfaceAlt reads against the white bubble in light mode (bgAlt collapses to it).
    tableZebra: { backgroundColor: colors.surfaceAlt },
  });
}

export type MarkdownStyles = ReturnType<typeof makeMarkdownStyles>;
