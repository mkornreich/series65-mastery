import React, { useLayoutEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen } from '../components/ui';
import { Markdown } from '../components/markdown';
import { spacing, font, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { sectionByAnchor, partLabel } from '../data/textbook';

type Props = NativeStackScreenProps<RootStackParamList, 'TextbookSection'>;

export default function TextbookSectionScreen({ route, navigation }: Props) {
  const { anchor, title } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const content = useMemo(() => sectionByAnchor(anchor), [anchor]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Textbook' });
  }, [navigation]);

  if (!content) {
    return (
      <Screen>
        <Text style={styles.h1}>{title || 'Section'}</Text>
        <Text style={styles.sub}>This section couldn’t be found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      {content.part ? <Text style={styles.part}>{partLabel(content.part)}</Text> : null}
      <Text style={styles.h1}>{content.section}</Text>
      <View style={styles.body}>
        <Markdown source={content.markdown} baseSize={font.body} />
      </View>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    part: {
      color: colors.accent,
      fontSize: font.tiny,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
    },
    h1: { color: colors.text, fontSize: font.h2, fontWeight: '800', lineHeight: 28 },
    sub: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.sm },
    body: { marginTop: spacing.md },
  });
