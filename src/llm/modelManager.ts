import * as FileSystem from 'expo-file-system/legacy';
import { LLMModelInfo } from '../types';

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

export async function isDownloaded(m: LLMModelInfo): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(modelPath(m));
  // A partial/aborted file will be small; require a sane minimum size.
  return !!info.exists && (info.size ?? 0) > 10 * 1024 * 1024;
}

export async function downloadedBytes(m: LLMModelInfo): Promise<number> {
  const info = await FileSystem.getInfoAsync(modelPath(m));
  return info.exists ? info.size ?? 0 : 0;
}

export async function deleteModel(m: LLMModelInfo): Promise<void> {
  await FileSystem.deleteAsync(modelPath(m), { idempotent: true });
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
      const total = p.totalBytesExpectedToWrite || m.sizeMB * 1024 * 1024;
      const frac = total > 0 ? p.totalBytesWritten / total : 0;
      onProgress(Math.min(1, frac), p.totalBytesWritten, total);
    }
  );

  const promise = (async () => {
    await ensureModelsDir();
    const res = await resumable.downloadAsync();
    return !!res && (await isDownloaded(m));
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
