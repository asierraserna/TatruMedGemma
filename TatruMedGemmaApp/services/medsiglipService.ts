import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { useInferenceStore } from '../store/inferenceStore';

interface MedsiglipAnalysisResponse {
  summary?: string;
  caption?: string;
  findings?: string[];
  description?: string;
  result?: string;
  text?: string;
  error?: string;
}

const joinBaseUrlAndPath = (baseUrl: string, path: string) => {
  const safeBase = baseUrl.replace(/\/$/, '');
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${safeBase}${safePath}`;
};

const createTimeoutController = (timeoutMs: number, upstreamSignal?: AbortSignal) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  upstreamSignal?.addEventListener('abort', onAbort, { once: true });

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeout);
      upstreamSignal?.removeEventListener('abort', onAbort);
    },
  };
};

const dataUrlToBase64 = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('data:')) {
    return undefined;
  }

  const commaIndex = trimmed.indexOf(',');
  if (commaIndex < 0) {
    return undefined;
  }

  const encoded = trimmed.slice(commaIndex + 1).trim();
  return encoded || undefined;
};

const blobToBase64 = async (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const parsed = dataUrlToBase64(result);

      if (parsed) {
        resolve(parsed);
        return;
      }

      reject(new Error('Unable to convert blob to base64 data URL.'));
    };

    reader.onerror = () => {
      reject(new Error('Unable to read blob with FileReader.'));
    };

    reader.readAsDataURL(blob);
  });
};

const resolveImageBase64 = async (imageUri: string) => {
  const fromDataUrl = dataUrlToBase64(imageUri);
  if (fromDataUrl) {
    return fromDataUrl;
  }

  if (Platform.OS === 'web') {
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Unable to fetch image URI: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    return blobToBase64(blob);
  }

  const base64Encoding = 'base64' as const;
  return FileSystem.readAsStringAsync(imageUri, {
    encoding: base64Encoding,
  });
};

export const analyzeImageWithMedsiglip = async (
  imageUri: string,
  userPrompt: string,
  signal?: AbortSignal
) => {
  const { medsiglip } = useInferenceStore.getState();

  if (!medsiglip.enabled) {
    return '';
  }

  if (!medsiglip.baseUrl.trim()) {
    throw new Error('MedSigLIP base URL is missing.');
  }

  if (!medsiglip.analyzePath.trim()) {
    throw new Error('MedSigLIP analyze path is missing.');
  }

  const imageBase64 = await resolveImageBase64(imageUri);

  const timeoutController = createTimeoutController(8000, signal);

  let response: Response;
  try {
    response = await fetch(joinBaseUrlAndPath(medsiglip.baseUrl, medsiglip.analyzePath), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: medsiglip.model,
        image_base64: imageBase64,
        imageBase64,
        prompt: userPrompt,
      }),
      signal: timeoutController.signal,
    });
  } finally {
    timeoutController.cleanup();
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Could not read error response');
    throw new Error(`MedSigLIP API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const payload = (await response.json()) as MedsiglipAnalysisResponse;

  if (payload.error?.trim()) {
    throw new Error(payload.error.trim());
  }

  if (payload.description?.trim()) {
    return payload.description.trim();
  }

  if (payload.summary?.trim()) {
    return payload.summary.trim();
  }

  if (payload.caption?.trim()) {
    return payload.caption.trim();
  }

  if (Array.isArray(payload.findings) && payload.findings.length > 0) {
    return payload.findings.join('; ').trim();
  }

  if (payload.result?.trim()) {
    return payload.result.trim();
  }

  if (payload.text?.trim()) {
    return payload.text.trim();
  }

  return '';
};
