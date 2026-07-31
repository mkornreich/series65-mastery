import React, { useMemo } from 'react';
import { View, Text, Linking, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { font, ThemeColors } from '../../theme/theme';
import { ParseOptions } from './ast';
import { parseDocument } from './blockParser';
import { makeMarkdownStyles } from './styles';
import { renderBlocks } from './BlockView';
import { InlineContext } from './InlineText';

const EMPTY_OPTS: ParseOptions = {};

export interface MarkdownProps {
  source: string;
  /** Base body font size (defaults to font.body = 15). */
  baseSize?: number;
  /** Override the theme palette (defaults to the active app theme). */
  colors?: ThemeColors;
  options?: ParseOptions;
  onLinkPress?: (href: string) => void;
  style?: StyleProp<ViewStyle>;
}

function defaultLinkPress(href: string) {
  if (/^(https?:|mailto:)/i.test(href)) {
    Linking.openURL(href).catch(() => {});
  }
}

// Any unexpected render error degrades to the raw source as plain, readable text
// rather than a red box — the last line of defense behind the total parsers.
class ErrorBoundary extends React.Component<
  { fallback: string; color: string; size: number; children: React.ReactNode },
  { failed: boolean; renderedFor: string }
> {
  state = { failed: false, renderedFor: this.props.fallback };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  static getDerivedStateFromProps(
    props: { fallback: string },
    state: { failed: boolean; renderedFor: string }
  ) {
    // A new source (the next streamed token) retries the parsed render rather than
    // latching on a transient mid-stream failure for the rest of the message.
    if (props.fallback !== state.renderedFor) {
      return { failed: false, renderedFor: props.fallback };
    }
    return null;
  }
  render() {
    if (this.state.failed) {
      return <Text style={{ color: this.props.color, fontSize: this.props.size }}>{this.props.fallback}</Text>;
    }
    return this.props.children;
  }
}

export function Markdown({ source, baseSize, colors: colorsProp, options, onLinkPress, style }: MarkdownProps) {
  const { colors: themeColors } = useTheme();
  const colors = colorsProp ?? themeColors;
  const size = baseSize ?? font.body;
  const opts = options ?? EMPTY_OPTS;

  const styles = useMemo(() => makeMarkdownStyles({ colors, baseSize: size }), [colors, size]);
  const doc = useMemo(() => parseDocument(source ?? '', opts), [source, opts]);
  const ctx: InlineContext = useMemo(
    () => ({ colors, styles, baseSize: size, options: opts, onLinkPress: onLinkPress ?? defaultLinkPress }),
    [colors, styles, size, opts, onLinkPress]
  );

  return (
    <ErrorBoundary fallback={source} color={colors.text} size={size}>
      <View style={style}>{renderBlocks(doc.children, ctx)}</View>
    </ErrorBoundary>
  );
}
