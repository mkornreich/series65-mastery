import React from 'react';
import { Text, TextStyle } from 'react-native';
import { ThemeColors } from '../../theme/theme';
import { ParseOptions, SpanNode } from './ast';
import { MarkdownStyles } from './styles';
import { MathView } from './math';

export interface InlineContext {
  colors: ThemeColors;
  styles: MarkdownStyles;
  baseSize: number;
  options: ParseOptions;
  onLinkPress?: (href: string) => void;
}

// A wrapper span shows its style only once its closer has streamed in (default
// 'plain'), so an unterminated **… renders as plain text rather than flashing raw
// markers, then the style toggles on when the closer arrives.
function styleIfClosed(
  ctx: InlineContext,
  closed: boolean,
  style: TextStyle | TextStyle[]
): TextStyle | TextStyle[] | undefined {
  if (closed) return style;
  return ctx.options.resolveUnterminated === 'style' ? style : undefined;
}

function renderSpan(span: SpanNode, key: number, ctx: InlineContext): React.ReactNode {
  const { styles } = ctx;
  switch (span.type) {
    case 'text':
      return span.value;
    case 'break':
      return '\n';
    case 'strong':
      return (
        <Text key={key} style={styleIfClosed(ctx, span.closed, styles.strong)}>
          {renderSpans(span.children, ctx)}
        </Text>
      );
    case 'emphasis':
      return (
        <Text key={key} style={styleIfClosed(ctx, span.closed, styles.emphasis)}>
          {renderSpans(span.children, ctx)}
        </Text>
      );
    case 'strongEmphasis':
      return (
        <Text key={key} style={styleIfClosed(ctx, span.closed, [styles.strong, styles.emphasis])}>
          {renderSpans(span.children, ctx)}
        </Text>
      );
    case 'strike':
      return (
        <Text key={key} style={styleIfClosed(ctx, span.closed, styles.strike)}>
          {renderSpans(span.children, ctx)}
        </Text>
      );
    case 'codeSpan':
      return (
        <Text key={key} style={styles.codeSpan}>
          {span.value}
        </Text>
      );
    case 'link':
      return (
        <Text key={key} style={styles.link} onPress={ctx.onLinkPress ? () => ctx.onLinkPress!(span.href) : undefined}>
          {renderSpans(span.children, ctx)}
        </Text>
      );
    case 'mathInline':
      return <MathView key={key} inline node={span.math} colors={ctx.colors} baseSize={ctx.baseSize} />;
    default:
      return null;
  }
}

export function renderSpans(spans: SpanNode[], ctx: InlineContext): React.ReactNode[] {
  return spans.map((s, i) => renderSpan(s, i, ctx));
}

/** Render inline spans as a self-contained <Text> block (used for paragraphs/headings). */
export function InlineText({ spans, ctx, style }: { spans: SpanNode[]; ctx: InlineContext; style?: TextStyle | TextStyle[] }) {
  return <Text style={style}>{renderSpans(spans, ctx)}</Text>;
}
