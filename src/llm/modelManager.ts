import * as FileSystem from 'expo-file-system/legacy';
import { LLMModelInfo } from '../types';
import { copyAsset } from '../../modules/app-intents';

// Downloaded GGUF models live under the app's document directory.
const MODELS_DIR = (FileSystem.documentDirectory ?? '') + 'models/';

export async function ensureModelsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MODELS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
  }
}

export function modelPath(m: LLMModelInfo): string {
  return MODELS_DIR + m.fileName;
}

// Written only after a download fully completes, so an interrupted transfer
// (which leaves a large-but-partial file on disk) is not mistaken for a
// finished model.
function completeMarker(m: LLMModelInfo): string {
  return modelPath(m) + '.complete';
}

export async function isDownloaded(m: LLMModelInfo): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(modelPath(m));
  if (!info.exists || (info.size ?? 0) < 10 * 1024 * 1024) return false;
  // Prefer the explicit completion marker written after a successful download.
  const marker = await FileSystem.getInfoAsync(completeMarker(m));
  if (marker.exists) return true;
  // Fallback for files already on disk before markers existed: require most of
  // the expected size so a truncated partial download isn't treated as complete.
  return (info.size ?? 0) >= m.sizeMB * 1024 * 1024 * 0.9;
}

export async function downloadedBytes(m: LLMModelInfo): Promise<number> {
  const info = await FileSystem.getInfoAsync(modelPath(m));
  return info.exists ? info.size ?? 0 : 0;
}

/**
 * Copy a model that ships bundled inside the APK out of assets and into the
 * models dir on first launch, so it's ready with no download. No-op if the
 * model is already present. Returns true if the model is available afterwards.
 */
export async function preloadBundledModel(m: LLMModelInfo): Promise<boolean> {
  if (!m.bundled || !m.bundledAsset) return false;
  if (await isDownloaded(m)) return true;
  await ensureModelsDir();
  // copyAsset needs a plain filesystem path; documentDirectory carries a
  // file:// scheme that the native File API won't accept.
  const dest = modelPath(m).replace(/^file:\/\//, '');
  const ok = copyAsset(m.bundledAsset, dest);
  if (ok) {
    await FileSystem.writeAsStringAsync(completeMarker(m), '1').catch(() => {});
  }
  return ok && (await isDownloaded(m));
}

export async function deleteModel(m: LLMModelInfo): Promise<void> {
  await FileSystem.deleteAsync(modelPath(m), { idempotent: true });
  await FileSystem.deleteAsync(completeMarker(m), { idempotent: true });
}

export interface DownloadController {
  promise: Promise<boolean>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  cancel: () => Promise<void>;
}

export type ProgressFn = (
  fraction: number,
  written: number,
  total: number
) => void;

/**
 * Begin (or resume) a resumable download of a model file. Returns a controller
 * whose `promise` resolves true on success. Progress is reported as a fraction
 * 0..1 plus raw byte counts.
 */
export function startDownload(
  m: LLMModelInfo,
  onProgress: ProgressFn
): DownloadController {
  const resumable = FileSystem.createDownloadResumable(
    m.url,
    modelPath(m),
    {},
    (p) => {
      // A missing Content-Length is reported as -1 (truthy!), which would defeat
      // a `||` fallback and freeze the bar at 0%. Only trust a positive total.
      const reported = p.totalBytesExpectedToWrite;
      const total = reported > 0 ? reported : m.sizeMB * 1024 * 1024;
      const frac = total > 0 ? p.totalBytesWritten / total : 0;
      onProgress(Math.min(1, frac), p.totalBytesWritten, total);
    }
  );

  const promise = (async () => {
    await ensureModelsDir();
    const res = await resumable.downloadAsync();
    if (!res) return false; // paused/aborted -> not complete
    // downloadAsync only resolves truthy on a completed transfer; record it.
    await FileSystem.writeAsStringAsync(completeMarker(m), '1').catch(() => {});
    return await isDownloaded(m);
  })();

  return {
    promise,
    pause: async () => {
      try {
        await resumable.pauseAsync();
      } catch {
        /* ignore */
      }
    },
    resume: async () => {
      try {
        await resumable.resumeAsync();
      } catch {
        /* ignore */
      }
    },
    cancel: async () => {
      try {
        await resumable.pauseAsync();
      } catch {
        /* ignore */
      }
      await deleteModel(m);
    },
  };
}
