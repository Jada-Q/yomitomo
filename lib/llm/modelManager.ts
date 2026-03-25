import { Platform } from 'react-native';
import { Paths, File, Directory } from 'expo-file-system';

export type ModelStatus = 'not_downloaded' | 'downloading' | 'ready';

const MODEL_DIR_NAME = 'models';
const MODEL_FILENAME = 'qwen2.5-1.5b-instruct-q4_k_m.gguf';
const MODEL_URL =
  'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf';
const MODEL_SIZE_BYTES = 1_066_000_000; // ~1.04 GB

// Smaller model for older devices
const SMALL_MODEL_FILENAME = 'qwen2.5-0.5b-instruct-q4_k_m.gguf';
const SMALL_MODEL_URL =
  'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';
const SMALL_MODEL_SIZE_BYTES = 386_000_000; // ~368 MB

export type ModelVariant = 'standard' | 'small';

function getModelInfo(variant: ModelVariant) {
  if (variant === 'small') {
    return { filename: SMALL_MODEL_FILENAME, url: SMALL_MODEL_URL, size: SMALL_MODEL_SIZE_BYTES };
  }
  return { filename: MODEL_FILENAME, url: MODEL_URL, size: MODEL_SIZE_BYTES };
}

/**
 * Get the local file path (uri) of the downloaded model
 */
export function getModelPath(variant: ModelVariant = 'standard'): string {
  if (Platform.OS === 'web') return '';
  const { filename } = getModelInfo(variant);
  const file = new File(Paths.document, MODEL_DIR_NAME, filename);
  return file.uri;
}

/**
 * Get model size in human-readable format
 */
export function getModelSizeLabel(variant: ModelVariant = 'standard'): string {
  const { size } = getModelInfo(variant);
  return `${(size / 1_000_000_000).toFixed(1)}GB`;
}

/**
 * Check if model file exists locally
 */
export async function getModelStatus(variant: ModelVariant = 'standard'): Promise<ModelStatus> {
  if (Platform.OS === 'web') return 'not_downloaded';

  try {
    const { filename } = getModelInfo(variant);
    const file = new File(Paths.document, MODEL_DIR_NAME, filename);
    return file.exists ? 'ready' : 'not_downloaded';
  } catch {
    return 'not_downloaded';
  }
}

/**
 * Download model from HuggingFace with progress callback
 * Note: expo-file-system v18 (SDK 55) downloadFileAsync doesn't support progress callbacks.
 * We use fetch + write as a workaround for progress, or simple download without progress.
 */
export async function downloadModel(
  variant: ModelVariant = 'standard',
  onProgress?: (progress: number) => void,
): Promise<{ success: boolean; error?: string }> {
  if (Platform.OS === 'web') {
    return { success: false, error: 'Model download not supported on web' };
  }

  const { url, filename } = getModelInfo(variant);

  try {
    // Ensure directory exists
    const modelDir = new Directory(Paths.document, MODEL_DIR_NAME);
    if (!modelDir.exists) {
      modelDir.create({ idempotent: true });
    }

    const destFile = new File(Paths.document, MODEL_DIR_NAME, filename);

    // Download using File.downloadFileAsync
    onProgress?.(0.01); // Signal download started
    const result = await File.downloadFileAsync(url, destFile, { idempotent: true });
    onProgress?.(1.0);

    if (result && result.exists) {
      return { success: true };
    }
    return { success: false, error: 'Download returned no result' };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

/**
 * Delete downloaded model to free storage
 */
export async function deleteModel(variant: ModelVariant = 'standard'): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const { filename } = getModelInfo(variant);
    const file = new File(Paths.document, MODEL_DIR_NAME, filename);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Ignore errors on delete
  }
}
