import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { CodeBlock } from './ast';
import { MarkdownStyles } from './styles';

export function CodeBlockView({ block, styles }: { block: CodeBlock; styles: MarkdownStyles }) {
  return (
    <View style={styles.codeBlock}>
      {block.lang ? <Text style={styles.codeLang}>{block.lang}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text allowFontScaling style={styles.codeBlockText}>
          {block.value || ' '}
        </Text>
      </ScrollView>
    </View>
  );
}
