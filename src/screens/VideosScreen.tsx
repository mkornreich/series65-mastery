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
import { useStore } from '../store/useStore';
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
type WatchedFilter = 'all' | 'unwatched';

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
  const [watchedFilter, setWatchedFilter] = useState<WatchedFilter>('all');

  const watchedList = useStore((s) => s.progress.watchedVideos);
  const toggleWatched = useStore((s) => s.toggleWatchedVideo);
  // `?? []` guards installs whose persisted progress predates watchedVideos.
  const watched = useMemo(() => new Set(watchedList ?? []), [watchedList]);

  // Videos in the chosen topic (drives both the All/Unwatched counts and list).
  const inTopic = useMemo(
    () => VIDEOS.filter((v) => filter === 'all' || v.topic === filter),
    [filter],
  );
  const unwatchedCount = useMemo(
    () => inTopic.filter((v) => !watched.has(v.id)).length,
    [inTopic, watched],
  );
  const visible = useMemo(
    () => (watchedFilter === 'all' ? inTopic : inTopic.filter((v) => !watched.has(v.id))),
    [inTopic, watchedFilter, watched],
  );

  const open = (v: Video) => openVideo(videoUrl(v.id));

  const chips: Filter[] = ['all', ...VIDEO_TOPICS.map((t) => t.id)];
  const watchedFilters: { id: WatchedFilter; label: string }[] = [
    { id: 'all', label: `All (${inTopic.length})` },
    { id: 'unwatched', label: `Unwatched (${unwatchedCount})` },
  ];

  return (
    <Screen topInset settingsGear>
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

      <View style={styles.segment}>
        {watchedFilters.map((w) => {
          const active = watchedFilter === w.id;
          return (
            <Pressable
              key={w.id}
              onPress={() => setWatchedFilter(w.id)}
              style={[styles.segmentBtn, active ? { backgroundColor: colors.primary } : null]}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: active ? colors.onBright : colors.textMuted },
                ]}
              >
                {w.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {visible.map((v) => {
        const tint = topicColor(colors, v.topic);
        const isWatched = watched.has(v.id);
        return (
          <Pressable
            key={v.id}
            onPress={() => open(v)}
            style={({ pressed }) => [styles.card, pressed ? { opacity: 0.85 } : null]}
          >
            <View style={styles.thumbWrap}>
              <Image
                source={{ uri: videoThumb(v.id) }}
                style={[styles.thumb, isWatched ? { opacity: 0.5 } : null]}
                resizeMode="cover"
              />
              <View style={styles.playBadge}>
                <Text style={styles.playGlyph}>▶</Text>
              </View>
              {isWatched ? (
                <View style={styles.watchedBadge}>
                  <Text style={styles.watchedBadgeText}>✓</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.title}>{v.title}</Text>
              {v.note ? <Text style={styles.note}>{v.note}</Text> : null}
              <View style={styles.metaRow}>
                <Pill label={TOPIC_LABEL[v.topic]} color={tint} bg={`${tint}22`} />
                <Text style={styles.channel}>{v.channel}</Text>
              </View>
              <Pressable
                onPress={() => toggleWatched(v.id)}
                hitSlop={8}
                style={[
                  styles.watchBtn,
                  isWatched
                    ? { borderColor: colors.success, backgroundColor: `${colors.success}18` }
                    : { borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.watchBtnText,
                    { color: isWatched ? colors.success : colors.textMuted },
                  ]}
                >
                  {isWatched ? '✓ Watched' : 'Mark as watched'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        );
      })}

      {visible.length === 0 ? (
        <Text style={styles.empty}>
          {watchedFilter === 'unwatched'
            ? 'You’ve watched everything here. 🎉'
            : 'No videos in this topic yet.'}
        </Text>
      ) : null}
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    h1: { fontSize: font.h1, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
    sub: { fontSize: font.small, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 19 },
    chipRow: { marginBottom: spacing.sm, marginHorizontal: -spacing.lg },
    chipRowContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
    chip: {
      borderRadius: radius.pill,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: 7,
    },
    chipText: { fontSize: font.small, fontWeight: '700' },
    segment: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.pill,
      padding: 3,
      marginBottom: spacing.md,
    },
    segmentBtn: {
      paddingHorizontal: spacing.lg,
      paddingVertical: 7,
      borderRadius: radius.pill,
    },
    segmentText: { fontSize: font.small, fontWeight: '700' },
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
    watchedBadge: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.success,
      alignItems: 'center',
      justifyContent: 'center',
    },
    watchedBadgeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
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
    watchBtn: {
      alignSelf: 'flex-start',
      marginTop: spacing.md,
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 7,
    },
    watchBtnText: { fontSize: font.small, fontWeight: '700' },
    empty: { color: colors.textMuted, fontSize: font.body, textAlign: 'center', marginTop: spacing.xl },
  });
