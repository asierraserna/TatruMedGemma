import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { useInferenceStore } from '../../store/inferenceStore';

const MODELS_DIR_NAME = 'models';
const MANIFEST_FILE_NAME = 'download-manifest.json';
const DISK_SAFETY_BUFFER_BYTES = 512 * 1024 * 1024;

export interface DeviceModelPaths {
  directoryUri: string;
  ggufUri: string;
  mmprojUri?: string;
}

export interface DeviceModelState {
  status: 'not-downloaded' | 'ready';
  ggufUri: string;
  mmprojUri?: string;
  ggufExists: boolean;
  mmprojExists: boolean;
  mmprojConfigured: boolean;
}

export interface DeviceModelDownloadProgress {
  stage: 'gguf' | 'mmproj';
  bytesWritten: number;
  bytesTotal: number;
  percent?: number;
}

interface DeviceModelDownloadManifest {
  ggufUrl: string;
  mmprojUrl?: string;
  ggufUri: string;
  mmprojUri?: string;
  ggufSizeBytes: number;
  mmprojSizeBytes?: number;
  updatedAt: number;
}

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const getRemoteContentLength = async (url: string, signal?: AbortSignal) => {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal,
    });

    const rawLength = response.headers.get('content-length');
    const parsedLength = rawLength ? Number(rawLength) : NaN;
    return Number.isFinite(parsedLength) && parsedLength > 0 ? parsedLength : undefined;
  } catch {
    return undefined;
  }
};

const assertEnoughDiskSpaceForDownload = async (urls: string[], signal?: AbortSignal) => {
  if (typeof FileSystem.getFreeDiskStorageAsync !== 'function') {
    return;
  }

  const freeDiskBytes = await FileSystem.getFreeDiskStorageAsync();
  if (!Number.isFinite(freeDiskBytes) || freeDiskBytes <= 0) {
    return;
  }

  const sizeEstimates = await Promise.all(
    urls
      .filter((url) => !!url.trim())
      .map((url) => getRemoteContentLength(url, signal))
  );

  // reduce to a numeric total; explicitly type to avoid `undefined` warnings
  const estimatedDownloadBytes: number = sizeEstimates.reduce<number>(
    (sum, value) => sum + (value || 0),
    0
  );
  if (estimatedDownloadBytes <= 0) {
    return;
  }

  const requiredBytes = estimatedDownloadBytes + DISK_SAFETY_BUFFER_BYTES;
  if (freeDiskBytes < requiredBytes) {
    throw new Error(
      `Not enough free storage. Need about ${formatBytes(requiredBytes)} (download + safety buffer), but only ${formatBytes(freeDiskBytes)} is available.`
    );
  }
};

// Some runtimes (notably web) don't expose a persistent documentDirectory.
// All public APIs should check for availability before performing file operations.
const isDocumentDirectoryAvailable = () => !!FileSystem.documentDirectory;

const getModelsDirectoryUri = () => {
  if (!isDocumentDirectoryAvailable()) {
    throw new Error('Document directory is unavailable on this device runtime.');
  }

  return `${FileSystem.documentDirectory}${MODELS_DIR_NAME}/`;
};

const getManifestUri = () => `${getModelsDirectoryUri()}${MANIFEST_FILE_NAME}`;

const readDownloadManifest = async (): Promise<DeviceModelDownloadManifest | null> => {
  const manifestUri = getManifestUri();
  const info = await FileSystem.getInfoAsync(manifestUri);
  if (!info.exists) {
    return null;
  }

  try {
    const raw = await FileSystem.readAsStringAsync(manifestUri);
    return JSON.parse(raw) as DeviceModelDownloadManifest;
  } catch {
    return null;
  }
};

const writeDownloadManifest = async (manifest: DeviceModelDownloadManifest) => {
  await FileSystem.writeAsStringAsync(getManifestUri(), JSON.stringify(manifest));
};

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[?#].*$/, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');

const resolveFilenameFromUrl = (url: string, fallback: string) => {
  const trimmed = url.trim();
  if (!trimmed) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed);
    const candidate = parsed.pathname.split('/').filter(Boolean).pop();
    const cleaned = candidate ? sanitizeFileName(candidate) : '';
    return cleaned || fallback;
  } catch {
    const cleaned = sanitizeFileName(trimmed.split('/').filter(Boolean).pop() || '');
    return cleaned || fallback;
  }
};

export const resolveDeviceModelPaths = (): DeviceModelPaths => {
  // If there's no document directory, caller should not be trying to use on-device
  // storage. Return empty strings so consuming code can still destructure safely.
  if (!isDocumentDirectoryAvailable()) {
    return { directoryUri: '', ggufUri: '', mmprojUri: undefined };
  }

  const { device } = useInferenceStore.getState();
  const directoryUri = getModelsDirectoryUri();
  const ggufFileName = resolveFilenameFromUrl(device.ggufUrl || '', 'model.gguf');
  const mmprojConfigured = !!device.mmprojUrl?.trim();
  const mmprojFileName = mmprojConfigured
    ? resolveFilenameFromUrl(device.mmprojUrl || '', 'mmproj.gguf')
    : undefined;

  return {
    directoryUri,
    ggufUri: `${directoryUri}${ggufFileName}`,
    mmprojUri: mmprojFileName ? `${directoryUri}${mmprojFileName}` : undefined,
  };
};

export const ensureDeviceModelDirectory = async () => {
  if (!isDocumentDirectoryAvailable()) {
    // nothing to do on unsupported runtime
    return '';
  }

  const directoryUri = getModelsDirectoryUri();
  const info = await FileSystem.getInfoAsync(directoryUri);

  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
  }

  return directoryUri;
};

export const getDeviceModelState = async (): Promise<DeviceModelState> => {
  if (!isDocumentDirectoryAvailable()) {
    return {
      status: 'not-downloaded',
      ggufUri: '',
      mmprojUri: undefined,
      ggufExists: false,
      mmprojExists: false,
      mmprojConfigured: false,
    };
  }

  const { device } = useInferenceStore.getState();
  const { ggufUri, mmprojUri } = resolveDeviceModelPaths();
  const mmprojConfigured = !!mmprojUri;
  const manifest = await readDownloadManifest();

  // `FileInfo` doesn't advertise `size` but the native object includes it.
  const ggufInfo = (await FileSystem.getInfoAsync(ggufUri)) as any;
  const mmprojInfo = mmprojUri ? ((await FileSystem.getInfoAsync(mmprojUri)) as any) : null;

  const ggufExists = !!ggufInfo.exists && !!ggufInfo.size && ggufInfo.size > 0;
  const mmprojExists = mmprojConfigured
    ? !!mmprojInfo?.exists && !!mmprojInfo.size && mmprojInfo.size > 0
    : false;

  const manifestMatchesConfig =
    !!manifest &&
    manifest.ggufUrl === (device.ggufUrl?.trim() || '') &&
    (manifest.mmprojUrl || '') === (device.mmprojUrl?.trim() || '') &&
    manifest.ggufUri === ggufUri &&
    (manifest.mmprojUri || '') === (mmprojUri || '');

  const manifestMatchesFiles =
    !!manifest &&
    ggufExists &&
    (ggufInfo.size || 0) >= (manifest.ggufSizeBytes || 0) &&
    (!mmprojConfigured || !manifest.mmprojSizeBytes || (mmprojInfo?.size || 0) >= manifest.mmprojSizeBytes);

  const isReady = manifestMatchesConfig && manifestMatchesFiles;

  return {
    status: isReady ? 'ready' : 'not-downloaded',
    ggufUri,
    mmprojUri,
    ggufExists: isReady ? ggufExists : false,
    mmprojExists: isReady ? mmprojExists : false,
    mmprojConfigured,
  };
};

const downloadToUri = async (
  sourceUrl: string,
  targetUri: string,
  stage: 'gguf' | 'mmproj',
  options?: {
    signal?: AbortSignal;
    onProgress?: (progress: DeviceModelDownloadProgress) => void;
  }
) => {
  const trimmedUrl = sourceUrl.trim();
  if (!trimmedUrl) {
    throw new Error(`${stage.toUpperCase()} URL is missing.`);
  }

  const partialUri = `${targetUri}.part`;
  await FileSystem.deleteAsync(partialUri, { idempotent: true });

  const resumable = FileSystem.createDownloadResumable(
    trimmedUrl,
    partialUri,
    {},
    (progress) => {
      const bytesTotal = progress.totalBytesExpectedToWrite || 0;
      const bytesWritten = progress.totalBytesWritten || 0;
      const percent = bytesTotal > 0 ? Math.round((bytesWritten / bytesTotal) * 100) : undefined;

      options?.onProgress?.({
        stage,
        bytesWritten,
        bytesTotal,
        percent,
      });
    }
  );

  if (options?.signal?.aborted) {
    throw new Error('Download cancelled.');
  }

  const onAbort = () => {
    void resumable.pauseAsync();
  };

  options?.signal?.addEventListener('abort', onAbort);

  try {
    const result = await resumable.downloadAsync();
    if (!result?.uri) {
      throw new Error(`Failed to download ${stage.toUpperCase()} model file.`);
    }

    const partialInfo = await FileSystem.getInfoAsync(partialUri);
    if (!partialInfo.exists || !partialInfo.size || partialInfo.size <= 0) {
      throw new Error(`Downloaded ${stage.toUpperCase()} file is incomplete.`);
    }

    await FileSystem.deleteAsync(targetUri, { idempotent: true });
    await FileSystem.moveAsync({ from: partialUri, to: targetUri });
  } catch (error) {
    if (options?.signal?.aborted) {
      throw new Error('Download cancelled.');
    }

    throw error;
  } finally {
    options?.signal?.removeEventListener('abort', onAbort);
  }
};

export const downloadDeviceModel = async (options?: {
  signal?: AbortSignal;
  onProgress?: (progress: DeviceModelDownloadProgress) => void;
}) => {
  const { device } = useInferenceStore.getState();
  const ggufUrl = device.ggufUrl?.trim();
  const mmprojUrl = device.mmprojUrl?.trim();

  if (!ggufUrl) {
    throw new Error('On-device GGUF URL is not configured. Update it in Settings > On-device.');
  }

  await assertEnoughDiskSpaceForDownload(
    [ggufUrl, mmprojUrl || ''],
    options?.signal
  );

  await ensureDeviceModelDirectory();

  const { ggufUri, mmprojUri } = resolveDeviceModelPaths();

  await downloadToUri(ggufUrl, ggufUri, 'gguf', options);

  if (mmprojUrl && mmprojUri) {
    await downloadToUri(mmprojUrl, mmprojUri, 'mmproj', options);
  }

  // cast to any so we can read `.size`
  const ggufInfo = (await FileSystem.getInfoAsync(ggufUri)) as any;
  const mmprojInfo = mmprojUri ? ((await FileSystem.getInfoAsync(mmprojUri)) as any) : null;

  await writeDownloadManifest({
    ggufUrl,
    mmprojUrl,
    ggufUri,
    mmprojUri,
    ggufSizeBytes: ggufInfo.size || 0,
    mmprojSizeBytes: mmprojInfo?.size,
    updatedAt: Date.now(),
  });

  return getDeviceModelState();
};

export const clearDeviceModelFiles = async () => {
  if (!isDocumentDirectoryAvailable()) {
    // nothing to clean up
    return;
  }

  const { ggufUri, mmprojUri } = resolveDeviceModelPaths();
  const targets = [
    ggufUri,
    `${ggufUri}.part`,
    mmprojUri,
    mmprojUri ? `${mmprojUri}.part` : undefined,
    getManifestUri(),
  ].filter((item): item is string => !!item);

  for (const targetUri of targets) {
    const info = await FileSystem.getInfoAsync(targetUri);
    if (info.exists) {
      await FileSystem.deleteAsync(targetUri, { idempotent: true });
    }
  }
};
