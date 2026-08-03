import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
} from 'react-native';
import { Screen, Pill } from '../components/ui';
import { spacing, font, radius, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { openVideo } from '../util/openVideo';
import {
  VIDEOS,
  VIDEO_TOPICS,
  VideoTopicId,
  Video,
  videoThumb,
  videoUrl,
} from '../data/videos';

type Filter = 'all' | VideoTopicId;

function topicColor(colors: ThemeColors, topic: VideoTopicId): string {
  switch (topic) {
    case 'economics':
      return colors.subject.econ;
    case 'vehicles':
      return colors.subject.vehicles;
    case 'recommendations':
      return colors.subject.recommendations;
    case 'laws':
      return colors.subject.laws;
    case 'math':
      return colors.accent;
    default:
      return colors.primary;
  }
}

const TOPIC_LABEL: Record<VideoTopicId, string> = VIDEO_TOPICS.reduce(
  (acc, t) => ({ ...acc, [t.id]: t.label }),
  {} as Record<VideoTopicId, string>,
);

export default function VideosScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(
    () => (filter === 'all' ? VIDEOS : VIDEOS.filter((v) => v.topic === filter)),
    [filter],
  );

  const open = (v: Video) => openVideo(videoUrl(v.id));

  const chips: Filter[] = ['all', ...VIDEO_TOPICS.map((t) => t.id)];

  return (
    <Screen topInset>
      <Text style={styles.h1}>Watch</Text>
      <Text style={styles.sub}>Free Series 65 video lessons from top instructors.</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        {chips.map((c) => {
          const active = filter === c;
          const label = c === 'all' ? 'All' : TOPIC_LABEL[c];
          const tint = c === 'all' ? colors.primary : topicColor(colors, c);
          return (
            <Pressable
              key={c}
              onPress={() => setFilter(c)}
              style={[
                styles.chip,
                active
                  ? { backgroundColor: tint, borderColor: tint }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? colors.onBright : colors.textMuted },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {visible.map((v) => {
        const tint = topicColor(colors, v.topic);
        return (
          <Pressable
            key={v.id}
            onPress={() => open(v)}
            style={({ pressed }) => [styles.card, pressed ? { opacity: 0.85 } : null]}
          >
            <View style={styles.thumbWrap}>
              <Image source={{ uri: videoThumb(v.id) }} style={styles.thumb} resizeMode="cover" />
              <View style={styles.playBadge}>
                <Text style={styles.playGlyph}>▶</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.title}>{v.title}</Text>
              {v.note ? <Text style={styles.note}>{v.note}</Text> : null}
              <View style={styles.metaRow}>
                <Pill label={TOPIC_LABEL[v.topic]} color={tint} bg={`${tint}22`} />
                <Text style={styles.channel}>{v.channel}</Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    h1: { fontSize: font.h1, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
    sub: { fontSize: font.small, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 19 },
    chipRow: { marginBottom: spacing.md, marginHorizontal: -spacing.lg },
    chipRowContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
    chip: {
      borderRadius: radius.pill,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: 7,
    },
    chipText: { fontSize: font.small, fontWeight: '700' },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    thumbWrap: {
      width: '100%',
      aspectRatio: 16 / 9,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumb: { width: '100%', height: '100%' },
    playBadge: {
      position: 'absolute',
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    playGlyph: { color: '#FFFFFF', fontSize: 20, marginLeft: 3 },
    cardBody: { padding: spacing.lg },
    title: { color: colors.text, fontSize: font.body, fontWeight: '800', lineHeight: 21 },
    note: { color: colors.textMuted, fontSize: font.small, marginTop: 4, lineHeight: 18 },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.md,
    },
    channel: { color: colors.textFaint, fontSize: font.tiny, fontWeight: '700' },
  });
