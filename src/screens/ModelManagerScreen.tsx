import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Screen, Card, AppButton, Body, Pill, SectionHeader } from '../components/ui';
import { spacing, font, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { AVAILABLE_MODELS, humanSize } from '../data/models';
import {
  isDownloaded,
  startDownload,
  deleteModel,
  DownloadController,
} from '../llm/modelManager';
import { geminiSupported, geminiAvailable } from '../llm/geminiEngine';
import { localLitertModels } from '../llm/litertEngine';
import { useStore } from '../store/useStore';
import { useLLM, localLitertModelInfo } from '../llm/LLMProvider';
import { LLMModelInfo } from '../types';

interface ModelState {
  downloaded: boolean;
  downloading: boolean;
  progress: number;
}

export default function ModelManagerScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const activeModelId = useStore((s) => s.settings.activeModelId);
  const setActiveModel = useStore((s) => s.setActiveModel);
  const llm = useLLM();

  const [states, setStates] = useState<Record<string, ModelState>>({});
  const [geminiOk, setGeminiOk] = useState<boolean | null>(null);
  const [localModels, setLocalModels] = useState<string[]>([]);
  const controllers = useRef<Record<string, DownloadController>>({});

  useEffect(() => {
    (async () => {
      const next: Record<string, ModelState> = {};
      for (const m of AVAILABLE_MODELS) {
        if (m.builtIn) continue;
        next[m.id] = {
          downloaded: await isDownloaded(m),
          downloading: false,
          progress: 0,
        };
      }
      setStates(next);
    })();
    (async () => {
      setGeminiOk(geminiSupported() ? await geminiAvailable() : false);
    })();
    setLocalModels(localLitertModels());
  }, []);

  const patch = (id: string, p: Partial<ModelState>) =>
    setStates((s) => ({ ...s, [id]: { ...s[id], ...p } }));

  const activate = async (m: LLMModelInfo) => {
    setActiveModel(m.id);
    if (llm.loadedModelId && llm.loadedModelId !== m.id) await llm.unload();
  };

  const download = async (m: LLMModelInfo) => {
    patch(m.id, { downloading: true, progress: 0 });
    const ctrl = startDownload(m, (frac) => patch(m.id, { progress: frac }));
    controllers.current[m.id] = ctrl;
    try {
      const ok = await ctrl.promise;
      patch(m.id, { downloading: false, downloaded: ok, progress: ok ? 1 : 0 });
      if (ok && !activeModelId) setActiveModel(m.id);
    } catch (e: any) {
      patch(m.id, { downloading: false });
      Alert.alert('Download failed', e?.message ?? 'Could not download the model.');
    }
  };

  const cancel = async (m: LLMModelInfo) => {
    const ctrl = controllers.current[m.id];
    if (ctrl) await ctrl.cancel();
    patch(m.id, { downloading: false, downloaded: false, progress: 0 });
  };

  const remove = async (m: LLMModelInfo) => {
    Alert.alert('Delete model?', `Free up ${humanSize(m.sizeMB)} by deleting ${m.name}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (activeModelId === m.id) {
            await llm.unload();
            setActiveModel(null);
          }
          await deleteModel(m);
          patch(m.id, { downloaded: false, progress: 0 });
        },
      },
    ]);
  };

  const renderBuiltIn = (m: LLMModelInfo) => {
    const isActive = activeModelId === m.id;
    const statusText =
      geminiOk === null
        ? 'Checking this device…'
        : geminiOk
        ? '✓ Available on this device'
        : '✗ Not available on this device';
    const statusColor =
      geminiOk === null ? colors.textMuted : geminiOk ? colors.success : colors.danger;
    return (
      <Card key={m.id} accent={isActive ? colors.accent : geminiOk ? colors.success : undefined}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{m.name}</Text>
            <Text style={styles.meta}>On-device · system model · no download</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Pill label="BUILT-IN" color={colors.accent} bg={`${colors.accent}22`} />
            {isActive && (
              <View style={{ marginTop: 4 }}>
                <Pill label="ACTIVE" color={colors.success} bg={`${colors.success}22`} />
              </View>
            )}
          </View>
        </View>
        <Body muted style={{ marginTop: spacing.sm }}>
          {m.description}
        </Body>
        <Text style={[styles.status, { color: statusColor }]}>{statusText}</Text>
        {geminiOk === false && (
          <Body muted style={{ marginTop: spacing.xs, fontSize: font.small }}>
            Your device has AICore, but it hasn’t granted Gemini Nano access to this
            app (Google gates the on-device model API). Download a model below to use
            the AI tutor now.
          </Body>
        )}
        <View style={styles.actions}>
          {isActive ? (
            <AppButton title="Active ✓" variant="secondary" style={{ flex: 1 }} />
          ) : (
            <AppButton
              title={geminiOk === false ? 'Not supported here' : 'Set active'}
              variant="primary"
              disabled={geminiOk === false}
              style={{ flex: 1 }}
              onPress={() => activate(m)}
            />
          )}
        </View>
      </Card>
    );
  };

  const renderGguf = (m: LLMModelInfo) => {
    const st = states[m.id] ?? { downloaded: false, downloading: false, progress: 0 };
    const isActive = activeModelId === m.id;
    return (
      <Card key={m.id} accent={isActive ? colors.accent : undefined}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{m.name}</Text>
            <Text style={styles.meta}>
              {m.params} · {m.quant} · {humanSize(m.sizeMB)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {m.recommended && <Pill label="RECOMMENDED" color={colors.accent} bg={`${colors.accent}22`} />}
            {isActive && (
              <View style={{ marginTop: 4 }}>
                <Pill label="ACTIVE" color={colors.success} bg={`${colors.success}22`} />
              </View>
            )}
          </View>
        </View>

        <Body muted style={{ marginTop: spacing.sm }}>
          {m.description}
        </Body>

        {st.downloading && (
          <View style={styles.progressWrap}>
            <View style={styles.track}>
              <View
                style={{
                  width: `${Math.round(st.progress * 100)}%`,
                  height: 6,
                  backgroundColor: colors.primary,
                  borderRadius: 6,
                }}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(st.progress * 100)}%</Text>
          </View>
        )}

        <View style={styles.actions}>
          {!st.downloaded && !st.downloading && (
            <AppButton title={`Download (${humanSize(m.sizeMB)})`} icon="⬇" onPress={() => download(m)} style={{ flex: 1 }} />
          )}
          {st.downloading && (
            <AppButton title="Cancel" variant="danger" onPress={() => cancel(m)} style={{ flex: 1 }} />
          )}
          {st.downloaded && !isActive && (
            <AppButton title="Set active" variant="primary" onPress={() => activate(m)} style={{ flex: 1 }} />
          )}
          {st.downloaded && isActive && llm.available && llm.status !== 'ready' && (
            <AppButton
              title="Load"
              variant="primary"
              loading={llm.status === 'loading'}
              onPress={() => llm.loadModel(m.id)}
              style={{ flex: 1 }}
            />
          )}
          {st.downloaded && isActive && llm.status === 'ready' && (
            <AppButton title="Loaded ✓" variant="secondary" style={{ flex: 1 }} />
          )}
          {st.downloaded && (
            <>
              <View style={{ width: spacing.sm }} />
              <AppButton title="Delete" variant="ghost" onPress={() => remove(m)} />
            </>
          )}
        </View>
      </Card>
    );
  };

  const renderLocalLitert = (fileName: string) => {
    const m = localLitertModelInfo(fileName);
    const isActive = activeModelId === m.id;
    return (
      <Card key={m.id} accent={isActive ? colors.accent : colors.success}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{m.name}</Text>
            <Text style={styles.meta}>On-device · LiteRT-LM · GPU</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Pill label="ON DEVICE" color={colors.success} bg={`${colors.success}22`} />
            {isActive && (
              <View style={{ marginTop: 4 }}>
                <Pill label="ACTIVE" color={colors.success} bg={`${colors.success}22`} />
              </View>
            )}
          </View>
        </View>
        <Body muted style={{ marginTop: spacing.sm, fontSize: font.small }}>
          Imported LiteRT-LM model, run on the GPU (same engine as Google’s AI Edge Gallery).
        </Body>
        <View style={styles.actions}>
          {isActive && llm.status === 'ready' ? (
            <AppButton title="Loaded ✓" variant="secondary" style={{ flex: 1 }} />
          ) : isActive ? (
            <AppButton
              title="Load on GPU"
              variant="primary"
              loading={llm.status === 'loading'}
              onPress={() => llm.loadModel(m.id)}
              style={{ flex: 1 }}
            />
          ) : (
            <AppButton title="Set active" variant="primary" onPress={() => activate(m)} style={{ flex: 1 }} />
          )}
        </View>
      </Card>
    );
  };

  return (
    <Screen>
      <Text style={styles.h1}>AI models</Text>
      <Body muted style={{ marginBottom: spacing.md }}>
        Use the model built into your device, or download a small model to run locally.
        All inference happens on-device.
      </Body>

      {!llm.available && (
        <Card>
          <Text style={styles.warn}>
            On-device inference isn’t available in this build (e.g. Expo Go). Use a
            development build.
          </Text>
        </Card>
      )}

      {(() => {
        const builtIns = AVAILABLE_MODELS.filter((m) => m.builtIn);
        const downloaded = AVAILABLE_MODELS.filter(
          (m) => !m.builtIn && states[m.id]?.downloaded
        );
        const toDownload = AVAILABLE_MODELS.filter(
          (m) => !m.builtIn && !states[m.id]?.downloaded
        );
        return (
          <>
            <SectionHeader title="On this device" />
            {builtIns.map((m) => renderBuiltIn(m))}
            {localModels.map((f) => renderLocalLitert(f))}
            {downloaded.map((m) => renderGguf(m))}
            {downloaded.length === 0 && localModels.length === 0 && (
              <Body muted style={{ fontSize: font.small, marginBottom: spacing.md }}>
                {geminiOk
                  ? 'Gemini Nano is ready. Download a model below to add another on-device option.'
                  : 'No downloaded models yet. Add one below to use the AI tutor.'}
              </Body>
            )}

            {toDownload.length > 0 && (
              <>
                <SectionHeader title="Download to add" />
                {toDownload.map((m) => renderGguf(m))}
              </>
            )}
          </>
        );
      })()}

      <Body muted style={{ marginTop: spacing.md, fontSize: font.small }}>
        Gemini Nano runs through your device’s system AI (AICore) on supported Pixel
        phones. Downloadable models are hosted on Hugging Face; sizes are approximate.
      </Body>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  h1: { fontSize: font.h1, fontWeight: '800', color: colors.text, marginTop: spacing.sm, marginBottom: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { color: colors.text, fontSize: font.body, fontWeight: '800' },
  meta: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  status: { fontSize: font.small, fontWeight: '700', marginTop: spacing.sm },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  progressWrap: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  track: { flex: 1, height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 6, overflow: 'hidden', marginRight: spacing.sm },
  progressText: { color: colors.textMuted, fontSize: font.small, fontWeight: '700', minWidth: 40, textAlign: 'right' },
  warn: { color: colors.warn, fontSize: font.small, lineHeight: 18 },
});
