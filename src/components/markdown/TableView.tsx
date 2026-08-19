import React from 'react';
import { View, ScrollView, Text, TextStyle } from 'react-native';
import { TableBlock } from './ast';
import { MarkdownStyles } from './styles';
import { InlineContext, renderSpans } from './InlineText';

const alignToText = (a: 'left' | 'center' | 'right' | null): TextStyle['textAlign'] =>
  a === 'center' ? 'center' : a === 'right' ? 'right' : 'left';

export function TableView({ block, styles, ctx }: { block: TableBlock; styles: MarkdownStyles; ctx: InlineContext }) {
  const cols = Math.max(block.header.length, ...block.rows.map((r) => r.length), 1);
  const MIN_COL = 96;

  const renderRow = (cells: { children: any[] }[], isHeader: boolean, rowIdx: number) => (
    <View style={styles.tableRow} key={rowIdx}>
      {Array.from({ length: cols }).map((_, ci) => {
        const cell = cells[ci];
        const align = alignToText(block.align[ci] ?? null);
        return (
          <View
            key={ci}
            style={[
              styles.tableCell,
              { minWidth: MIN_COL, borderRightWidth: ci < cols - 1 ? 1 : 0, borderBottomWidth: 1 },
              isHeader ? styles.tableHeaderCell : rowIdx % 2 === 0 ? styles.tableZebra : null,
            ]}
          >
            <Text style={[styles.text, isHeader ? styles.tableHeaderText : null, { textAlign: align }]}>
              {cell ? renderSpans(cell.children, ctx) : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.tableWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        persistentScrollbar
        // Let the inner table lay out at its natural width so wide tables scroll
        // horizontally instead of squishing/clipping their last columns.
        contentContainerStyle={{ flexGrow: 0 }}
      >
        <View>
          {renderRow(block.header, true, 0)}
          {block.rows.map((r, i) => renderRow(r, false, i + 1))}
        </View>
      </ScrollView>
    </View>
  );
}
