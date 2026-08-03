import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ThemeColors, font, spacing } from '../../../theme/theme';
import type { MathExpr } from './mathAst';
import { hasBlockAtom } from './mathAst';
import type { MathNode } from '../ast';
import { mathToUnicode } from './inlineMath';

const MIN_SIZE = font.tiny; // 11px floor so nested scripts stay legible

// Render math in the platform serif face so it reads like real math typography
// (upright serif numbers/operators, italic serif variables — LaTeX's look).
const MATH_FONT = 'serif';

interface MCtx {
  size: number;
  color: string;
  colors: ThemeColors;
}

function scaled(ctx: MCtx, f: number): MCtx {
  return { ...ctx, size: Math.max(MIN_SIZE, Math.round(ctx.size * f)) };
}

const isVar = (n: MathExpr) => n.t === 'text' && !n.upright && /^[A-Za-z]$/.test(n.s);

function Glyph({ node, ctx }: { node: MathExpr; ctx: MCtx }) {
  const s = node.t === 'text' || node.t === 'sym' ? node.s : '';
  const style: TextStyle = {
    fontSize: ctx.size,
    color: ctx.color,
    fontFamily: MATH_FONT,
    fontStyle: isVar(node) ? 'italic' : 'normal',
    includeFontPadding: false,
    textAlignVertical: 'center',
  };
  return (
    <Text allowFontScaling={false} style={style}>
      {s}
    </Text>
  );
}

function Row({ nodes, ctx }: { nodes: MathExpr[]; ctx: MCtx }) {
  const twoD = hasBlockAtom(nodes);
  return (
    <View style={{ flexDirection: 'row', alignItems: twoD ? 'center' : 'baseline', flexWrap: 'nowrap' }}>
      {nodes.map((n, i) => (
        <Atom key={i} node={n} ctx={ctx} />
      ))}
    </View>
  );
}

function Frac({ node, ctx }: { node: MathExpr & { t: 'frac' }; ctx: MCtx }) {
  const inner = scaled(ctx, 0.94);
  return (
    <View style={{ flexDirection: 'column', alignItems: 'center', paddingHorizontal: 3 }}>
      <Row nodes={node.num} ctx={inner} />
      <View
        style={{
          height: Math.max(StyleSheet.hairlineWidth, 1),
          alignSelf: 'stretch',
          backgroundColor: ctx.color,
          marginVertical: 2,
        }}
      />
      <Row nodes={node.den} ctx={inner} />
    </View>
  );
}

function Scripts({ node, ctx }: { node: MathExpr & { t: 'script' }; ctx: MCtx }) {
  const s = scaled(ctx, 0.72);
  const f = ctx.size;
  const both = node.sup && node.sup.length && node.sub && node.sub.length;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Row nodes={node.base} ctx={ctx} />
      {both ? (
        <View style={{ flexDirection: 'column', justifyContent: 'center', marginLeft: 1, transform: [{ translateY: -f * 0.1 }] }}>
          <Row nodes={node.sup!} ctx={s} />
          <Row nodes={node.sub!} ctx={s} />
        </View>
      ) : node.sup && node.sup.length ? (
        <View style={{ transform: [{ translateY: -f * 0.42 }], marginLeft: 1 }}>
          <Row nodes={node.sup} ctx={s} />
        </View>
      ) : node.sub && node.sub.length ? (
        <View style={{ transform: [{ translateY: f * 0.22 }], marginLeft: 1 }}>
          <Row nodes={node.sub} ctx={s} />
        </View>
      ) : null}
    </View>
  );
}

function Sqrt({ node, ctx }: { node: MathExpr & { t: 'sqrt' }; ctx: MCtx }) {
  const [h, setH] = useState(Math.round(ctx.size * 1.3));
  const stroke = Math.max(1, ctx.size / 14);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      {node.index && node.index.length ? (
        <View style={{ transform: [{ translateY: -h * 0.32 }], marginRight: -4, zIndex: 1 }}>
          <Row nodes={node.index} ctx={scaled(ctx, 0.55)} />
        </View>
      ) : null}
      <Svg width={Math.round(ctx.size * 0.7)} height={h} viewBox={`0 0 ${Math.round(ctx.size * 0.7)} ${h}`}>
        <Path
          d={`M0 ${(h * 0.6).toFixed(1)} L${(ctx.size * 0.22).toFixed(1)} ${(h * 0.6).toFixed(1)} L${(ctx.size * 0.42).toFixed(1)} ${(h - 1).toFixed(1)} L${(ctx.size * 0.68).toFixed(1)} 2`}
          stroke={ctx.color}
          strokeWidth={stroke}
          fill="none"
        />
      </Svg>
      <View style={{ borderTopWidth: Math.max(1, stroke), borderTopColor: ctx.color, paddingTop: 2, paddingRight: 3 }}>
        <View
          onLayout={(e) => {
            const nh = Math.ceil(e.nativeEvent.layout.height) + 4;
            if (Math.abs(nh - h) > 1) setH(nh);
          }}
        >
          <Row nodes={node.rad} ctx={ctx} />
        </View>
      </View>
    </View>
  );
}

const FENCE_GLYPH: Record<string, string> = { '.': '', '\\{': '{', '\\}': '}' };

function fenceChar(d: string): string {
  return FENCE_GLYPH[d] ?? d;
}

function Fence({ node, ctx }: { node: MathExpr & { t: 'fence' }; ctx: MCtx }) {
  const [h, setH] = useState(Math.round(ctx.size * 1.25));
  const scaleY = Math.min(2.6, Math.max(1, h / (ctx.size * 1.05)));
  const paren = (glyph: string) =>
    glyph ? (
      <Text
        allowFontScaling={false}
        style={{ fontSize: ctx.size, color: ctx.color, fontFamily: MATH_FONT, transform: [{ scaleY }], includeFontPadding: false, paddingHorizontal: 1 }}
      >
        {glyph}
      </Text>
    ) : (
      <View style={{ width: 2 }} />
    );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {paren(fenceChar(node.left))}
      <View
        onLayout={(e) => {
          const nh = Math.ceil(e.nativeEvent.layout.height);
          if (Math.abs(nh - h) > 1) setH(nh);
        }}
      >
        <Row nodes={node.kids} ctx={ctx} />
      </View>
      {node.open ? null : paren(fenceChar(node.right))}
    </View>
  );
}

const ACCENT_GLYPH: Record<string, string> = { hat: '^', tilde: '~', vec: '→', dot: '·', ddot: '··' };

function Accent({ node, ctx }: { node: MathExpr & { t: 'accent' }; ctx: MCtx }) {
  const base = <Row nodes={node.base} ctx={ctx} />;
  if (node.kind === 'bar') {
    return (
      <View style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <View style={{ height: Math.max(StyleSheet.hairlineWidth, 1), backgroundColor: ctx.color, marginBottom: 1 }} />
        {base}
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'column', alignItems: 'center' }}>
      <Text
        allowFontScaling={false}
        style={{ fontSize: ctx.size * 0.7, color: ctx.color, includeFontPadding: false, marginBottom: -ctx.size * 0.16, lineHeight: ctx.size * 0.7 }}
      >
        {ACCENT_GLYPH[node.kind] ?? ''}
      </Text>
      {base}
    </View>
  );
}

function Atom({ node, ctx }: { node: MathExpr; ctx: MCtx }) {
  switch (node.t) {
    case 'text':
    case 'sym':
      return <Glyph node={node} ctx={ctx} />;
    case 'space':
      return <View style={{ width: Math.max(0, node.em) * ctx.size * 0.5 }} />;
    case 'group':
      return <Row nodes={node.kids} ctx={ctx} />;
    case 'frac':
      return <Frac node={node} ctx={ctx} />;
    case 'script':
      return <Scripts node={node} ctx={ctx} />;
    case 'sqrt':
      return <Sqrt node={node} ctx={ctx} />;
    case 'fence':
      return <Fence node={node} ctx={ctx} />;
    case 'accent':
      return <Accent node={node} ctx={ctx} />;
    default:
      return null;
  }
}

export interface MathViewProps {
  node: MathNode;
  colors: ThemeColors;
  baseSize: number;
  /** Inline (flows in prose) vs display (own centered line). */
  inline?: boolean;
  /** Style for the inline text run. */
  inlineStyle?: TextStyle;
}

function MathViewImpl({ node, colors, baseSize, inline, inlineStyle }: MathViewProps) {
  // Inline: a Unicode text run so it wraps with the sentence.
  if (inline) {
    const str = node.root.length ? mathToUnicode(node.root) : node.raw;
    return (
      <Text
        allowFontScaling={false}
        style={[{ color: colors.text, fontSize: baseSize, fontFamily: MATH_FONT }, inlineStyle]}
      >
        {str}
      </Text>
    );
  }
  // Display: full 2-D layout, centered, horizontally scrollable if wide.
  // paddingVertical gives super/subscripts (positioned by transform, which does
  // not enlarge the layout box) room so the horizontal ScrollView doesn't clip them.
  const ctx: MCtx = { size: Math.round(baseSize * 1.12), color: colors.text, colors };
  const vpad = Math.round(baseSize * 0.7);
  return (
    <View style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: spacing.sm,
          paddingVertical: vpad,
        }}
      >
        {node.root.length ? (
          <Row nodes={node.root} ctx={ctx} />
        ) : (
          <Text allowFontScaling={false} style={{ color: colors.textMuted, fontSize: baseSize }}>
            {node.raw}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

// Settled blocks keep the same raw text as later tokens stream in; skip their
// (potentially deep) re-render. node.raw + display + closed fully determine layout.
export const MathView = React.memo(
  MathViewImpl,
  (a, b) =>
    a.node.raw === b.node.raw &&
    a.node.display === b.node.display &&
    a.node.closed === b.node.closed &&
    a.baseSize === b.baseSize &&
    a.colors === b.colors &&
    a.inline === b.inline
);
