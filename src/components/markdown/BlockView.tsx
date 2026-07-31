import React from 'react';
import { View, Text } from 'react-native';
import { BlockNode, ListBlock } from './ast';
import { headingSize } from './styles';
import { InlineContext, renderSpans } from './InlineText';
import { CodeBlockView } from './CodeBlockView';
import { TableView } from './TableView';
import { MathView } from './math';

function List({ block, ctx }: { block: ListBlock; ctx: InlineContext }) {
  const { styles } = ctx;
  return (
    <View>
      {block.items.map((item, i) => {
        const marker = block.ordered ? `${block.start + i}.` : '•';
        return (
          <View key={i} style={styles.listRow}>
            <View style={styles.listMarkerBox}>
              <Text style={styles.listMarker}>{marker}</Text>
            </View>
            <View style={{ flex: 1 }}>{renderBlocks(item.children, ctx)}</View>
          </View>
        );
      })}
    </View>
  );
}

function renderBlock(block: BlockNode, ctx: InlineContext): React.ReactNode {
  const { styles, colors, baseSize } = ctx;
  switch (block.type) {
    case 'heading': {
      const size = headingSize(block.level);
      return (
        <Text style={[styles.heading, { fontSize: size, lineHeight: Math.round(size * 1.28) }]}>
          {renderSpans(block.children, ctx)}
        </Text>
      );
    }
    case 'paragraph':
      return <Text style={styles.paragraph}>{renderSpans(block.children, ctx)}</Text>;
    case 'codeBlock':
      return <CodeBlockView block={block} styles={styles} />;
    case 'table':
      return <TableView block={block} styles={styles} ctx={ctx} />;
    case 'thematicBreak':
      return <View style={styles.hr} />;
    case 'mathBlock':
      return <MathView node={block.math} colors={colors} baseSize={baseSize} />;
    case 'blockquote':
      return <View style={styles.blockquote}>{renderBlocks(block.children, ctx)}</View>;
    case 'list':
      return <List block={block} ctx={ctx} />;
    default:
      return null;
  }
}

/** Render a block sequence, adding vertical spacing between (not before) blocks. */
export function renderBlocks(blocks: BlockNode[], ctx: InlineContext): React.ReactNode[] {
  return blocks.map((b, i) => (
    <View key={i} style={i === 0 ? undefined : ctx.styles.blockGap}>
      {renderBlock(b, ctx)}
    </View>
  ));
}
