import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Screen, Card, AppButton, Body, SectionHeader } from '../components/ui';
import { spacing, font, radius, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useStore, ThemeMode } from '../store/useStore';
import { useLLM, isLocalId, localFileName, localLitertModelInfo } from '../llm/LLMProvider';
import { MODEL_BY_ID } from '../data/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function Row({
  label,
  desc,
  right,
}: {
  label: string;
  desc?: string;
  right: React.ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {desc ? <Text style={styles.rowDesc}>{desc}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function Stepper({
  value,
  onChange,
  step,
  min,
  max,
  fmt,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
  fmt?: (v: number) => string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - step))}>
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>
      <Text style={styles.stepVal}>{fmt ? fmt(value) : value}</Text>
      <Pressable style={styles.stepBtn} onPress={() => onChange(Math.min(max, value + step))}>
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

function ThemeSelector() {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const options: { key: ThemeMode; label: string }[] = [
    { key: 'system', label: 'System' },
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
  ];
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const active = mode === o.key;
        return (
          <Pressable
            key={o.key}
            onPress={() => setMode(o.key)}
            style={[
              styles.segmentItem,
              active && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: active ? colors.onBright : colors.textMuted },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const llm = useLLM();
  const settings = useStore((s) => s.settings);
  const setSetting = useStore((s) => s.setSetting);
  const setGenParams = useStore((s) => s.setGenParams);
  const resetProgress = useStore((s) => s.resetProgress);

  // Imported LiteRT-LM models use "local:<file>" ids that aren't in MODEL_BY_ID,
  // so resolve those separately — otherwise Settings shows "No model selected"
  // and hides the load/unload controls while such a model is active.
  const activeModel = settings.activeModelId
    ? isLocalId(settings.activeModelId)
      ? localLitertModelInfo(localFileName(settings.activeModelId))
      : MODEL_BY_ID[settings.activeModelId] ?? null
    : null;

  const statusText = !llm.available
    ? 'Unavailable in this build'
    : llm.status === 'ready'
    ? `Loaded: ${activeModel?.name ?? ''}${
        llm.activeBackend ? ` · running on ${llm.activeBackend.toUpperCase()}` : ''
      }`
    : llm.status === 'loading'
    ? `Loading… ${llm.loadProgress}%`
    : activeModel
    ? `Selected: ${activeModel.name}`
    : 'No model selected';

  const statusColor = !llm.available
    ? colors.textFaint
    : llm.status === 'ready'
    ? colors.success
    : activeModel
    ? colors.primary
    : colors.warn;

  // Only surface generation/advanced controls that actually affect the selected
  // model's engine. LiteRT-LM runs on the GPU automatically and caps output by
  // context size, so it ignores "GPU layers" and "Max response length"; Gemini
  // Nano has a fixed context, so it ignores "GPU layers" and "Context size".
  const kind = llm.activeKind;
  const showMaxTokens = kind === 'aicore' || kind === 'gguf';
  const showGpuLayers = kind === 'gguf';
  const showContext = kind === 'litertlm' || kind === 'gguf';

  return (
    <Screen topInset>
      <Text style={styles.h1}>Settings</Text>

      <SectionHeader title="Appearance" />
      <Card>
        <Row label="Theme" desc="Follow the system setting, or force light or dark." right={null as any} />
        <ThemeSelector />
      </Card>

      <SectionHeader title="On-device AI" />
      <Card>
        <Row
          label="AI model"
          desc={statusText}
          right={<View style={[styles.dot, { backgroundColor: statusColor }]} />}
        />
        <Body muted style={{ marginTop: spacing.xs }}>
          The tutor and question generator run fully on your device — Gemini Nano on
          supported Pixels, or a small model you download.
        </Body>
        <AppButton
          title="Choose / manage models"
          variant="secondary"
          icon="⬇"
          style={{ marginTop: spacing.md }}
          onPress={() => navigation.navigate('ModelManager')}
        />
        {!llm.available && (
          <Text style={styles.warn}>
            On-device inference needs a development build (it isn’t available in Expo Go).
          </Text>
        )}
      </Card>

      {activeModel && (
        <Card>
          <Row
            label="Load model on launch"
            desc="Warm up the model automatically when the app opens."
            right={
              <Switch
                value={settings.autoLoadModel}
                onValueChange={(v) => setSetting('autoLoadModel', v)}
                trackColor={{ true: colors.primary }}
              />
            }
          />
          {llm.status === 'ready' ? (
            <AppButton title="Unload model (free memory)" variant="ghost" onPress={() => llm.unload()} style={{ marginTop: spacing.sm }} />
          ) : activeModel.kind !== 'aicore' ? (
            <AppButton
              title="Load model now"
              variant="ghost"
              loading={llm.status === 'loading'}
              onPress={() => llm.loadModel(activeModel.id)}
              style={{ marginTop: spacing.sm }}
            />
          ) : null}
        </Card>
      )}

      <SectionHeader title="AI behavior" />
      <Card>
        <Row
          label="AI explanations"
          desc="Offer an AI tutor explanation after answering a question."
          right={
            <Switch
              value={settings.aiExplanations}
              onValueChange={(v) => setSetting('aiExplanations', v)}
              trackColor={{ true: colors.primary }}
            />
          }
        />
        <View style={styles.divider} />
        <Row
          label="Creativity (temperature)"
          desc={
            settings.genParams.temperature <= 0.3
              ? 'Precise'
              : settings.genParams.temperature <= 0.5
              ? 'Balanced'
              : 'Creative'
          }
          right={
            <Stepper
              value={settings.genParams.temperature}
              onChange={(v) => setGenParams({ temperature: Math.round(v * 10) / 10 })}
              step={0.1}
              min={0}
              max={1}
              fmt={(v) => v.toFixed(1)}
            />
          }
        />
        {showMaxTokens && (
          <>
            <View style={styles.divider} />
            <Row
              label="Max response length"
              desc="Tokens the model may generate per answer."
              right={
                <Stepper
                  value={settings.genParams.maxTokens}
                  onChange={(v) => setGenParams({ maxTokens: v })}
                  step={128}
                  min={128}
                  max={1536}
                />
              }
            />
          </>
        )}
      </Card>

      {(showGpuLayers || showContext) && (
        <>
          <SectionHeader title="Advanced" />
          <Card>
            {showGpuLayers && (
              <Row
                label="GPU layers"
                desc="0 = CPU only (most compatible). Raise on capable devices for speed."
                right={
                  <Stepper
                    value={settings.nGpuLayers}
                    onChange={(v) => setSetting('nGpuLayers', v)}
                    step={8}
                    min={0}
                    max={99}
                  />
                }
              />
            )}
            {showGpuLayers && showContext && <View style={styles.divider} />}
            {showContext && (
              <Row
                label="Context size"
                desc="Tokens of context the model keeps. Larger uses more RAM."
                right={
                  <Stepper
                    value={settings.nCtx}
                    onChange={(v) => setSetting('nCtx', v)}
                    step={512}
                    min={1024}
                    max={8192}
                  />
                }
              />
            )}
          </Card>
        </>
      )}

      <SectionHeader title="App" />
      <Card>
        <AppButton
          title="About Series 65 Mastery"
          variant="ghost"
          onPress={() => navigation.navigate('About')}
        />
        <View style={{ height: spacing.sm }} />
        <AppButton
          title="Reset all progress"
          variant="danger"
          onPress={() =>
            Alert.alert('Reset progress?', 'This erases mastery, review history, and exam results. Settings and downloaded models are kept.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: () => resetProgress() },
            ])
          }
        />
      </Card>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    h1: { fontSize: font.h1, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowLabel: { color: colors.text, fontSize: font.body, fontWeight: '700' },
    rowDesc: { color: colors.textMuted, fontSize: font.small, marginTop: 2, lineHeight: 17 },
    dot: { width: 12, height: 12, borderRadius: 6 },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
    warn: { color: colors.warn, fontSize: font.small, marginTop: spacing.md, lineHeight: 18 },
    stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.md },
    stepBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    stepBtnText: { color: colors.text, fontSize: font.h3, fontWeight: '800' },
    stepVal: { color: colors.text, fontSize: font.small, fontWeight: '700', minWidth: 44, textAlign: 'center' },
    segment: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.md,
      padding: 3,
      marginTop: spacing.md,
    },
    segmentItem: {
      flex: 1,
      paddingVertical: 9,
      alignItems: 'center',
      borderRadius: radius.sm,
    },
    segmentText: { fontSize: font.small, fontWeight: '700' },
  });
