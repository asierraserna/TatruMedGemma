/**
 * Kaggle Spaces / Gradio 5.x provider
 *
 * Gradio 5.x uses a queue-based API with prefix `/gradio_api`:
 *
 *   Step 1 – Submit:
 *     POST /gradio_api/call/predict
 *     { "data": ["<text>", <FileData|null>] }
 *     → { "event_id": "<id>" }
 *
 *   Step 2 – Poll result:
 *     GET /gradio_api/call/predict/<event_id>
 *     SSE stream – read until `process_completed` event
 *
 * Image format for Gradio 5.x FileData:
 *   { "url": "data:<mime>;base64,<data>" }   ← base64 data-URL works as url
 *   null                                       ← no image
 *
 * The Space function signature expected:
 *   fn(text: str, image: Image | None) -> str
 */

import { AIProvider, GenerateResponseOptions } from '../types';
import { Message } from '../../../types';
import { useInferenceStore } from '../../../store/inferenceStore';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { logSystemPrompt, logRequest } from '../../logger';

// ---------------------------------------------------------------------------
// Gradio 5.x FileData shape
// ---------------------------------------------------------------------------

interface GradioFileData {
  url?: string | null;
  path?: string | null;
  orig_name?: string | null;
  mime_type?: string | null;
  is_stream?: boolean;
  meta?: { _type: string };
}

// ---------------------------------------------------------------------------
// Image helpers
// ---------------------------------------------------------------------------

const blobToDataUrl = async (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result.startsWith('data:')) {
        resolve(result);
      } else {
        reject(new Error('Unable to convert blob to data URL.'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error.'));
    reader.readAsDataURL(blob);
  });

const resolveImageFileData = async (
  imageUri?: string
): Promise<GradioFileData | null> => {
  if (!imageUri) return null;
  const trimmed = imageUri.trim();

  if (trimmed.startsWith('data:')) {
    return { url: trimmed, is_stream: false, meta: { _type: 'gradio.FileData' } };
  }

  try {
    if (Platform.OS === 'web') {
      const res = await fetch(trimmed);
      if (!res.ok) return null;
      const dataUrl = await blobToDataUrl(await res.blob());
      return { url: dataUrl, is_stream: false, meta: { _type: 'gradio.FileData' } };
    }

    const base64 = await FileSystem.readAsStringAsync(trimmed, {
      encoding: 'base64' as const,
    });
    if (!base64) return null;
    return {
      url: `data:image/jpeg;base64,${base64}`,
      is_stream: false,
      meta: { _type: 'gradio.FileData' },
    };
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// SSE reader
// ---------------------------------------------------------------------------

const readGradioSse = async (
  stream: ReadableStream<Uint8Array>,
  signal?: AbortSignal
): Promise<unknown[]> => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent = '';

  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          const dataStr = line.slice(5).trim();
          if (currentEvent === 'error') {
            throw new Error(`Gradio SSE error: ${dataStr}`);
          }
          // Gradio 5.x emits 'complete' with a raw JSON array: ["text"]
          // Older Gradio emits 'process_completed' with { output: { data: [...] } }
          if (currentEvent === 'complete') {
            const arr = JSON.parse(dataStr) as unknown[];
            return arr;
          }
          if (currentEvent === 'process_completed') {
            const payload = JSON.parse(dataStr) as {
              output?: { data?: unknown[] };
              error?: string;
            };
            if (payload.error) throw new Error(payload.error);
            return payload.output?.data ?? [];
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  throw new Error('Gradio SSE stream ended without a completion event.');
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const normalizeGradioUrl = (url: string) => url.replace(/\/$/, '');

const GRADIO_API_PREFIX = '/gradio_api';
const PREDICT_ENDPOINT = '/call/predict';

export const kaggleProvider: AIProvider = {
  generate: async (messages: Message[], options: GenerateResponseOptions = {}) => {
    const { kaggle } = useInferenceStore.getState();
    const baseUrl = normalizeGradioUrl(kaggle.gradioUrl || '');

    if (!baseUrl) {
      throw new Error(
        'Kaggle provider: Gradio URL is not configured. Set it in Settings → Kaggle Space URL.'
      );
    }

    const systemPrompt = options.systemPrompt?.trim() || '';
    logSystemPrompt('Kaggle', systemPrompt);

    const latestUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const userText = latestUserMessage?.content?.trim() || '';

    const fullText = systemPrompt
      ? `[System]\n${systemPrompt}\n\n[User]\n${userText}`
      : userText;

    const latestWithImage = [...messages].reverse().find((m) => m.role === 'user' && !!m.imageUri);
    const imageFileData = await resolveImageFileData(latestWithImage?.imageUri);

    const submitUrl = `${baseUrl}${GRADIO_API_PREFIX}${PREDICT_ENDPOINT}`;

    logRequest('Kaggle', {
      messageCount: messages.length,
      hasImage: !!imageFileData,
      hasSystemPrompt: !!systemPrompt,
      endpoint: submitUrl,
    });

    // Step 1: Submit to Gradio queue
    const submitRes = await fetch(submitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [fullText, imageFileData] }),
      signal: options.signal,
    });

    if (!submitRes.ok) {
      const body = await submitRes.text().catch(() => submitRes.statusText);
      throw new Error(`Kaggle Gradio submit failed (${submitRes.status}): ${body}`);
    }

    const submitJson = (await submitRes.json()) as { event_id?: string; error?: string };

    if (submitJson.error) {
      throw new Error(`Kaggle Gradio submit error: ${submitJson.error}`);
    }

    const eventId = submitJson.event_id;
    if (!eventId) {
      throw new Error('Kaggle Gradio did not return an event_id.');
    }

    // Step 2: Stream SSE result
    const pollUrl = `${baseUrl}${GRADIO_API_PREFIX}${PREDICT_ENDPOINT}/${eventId}`;
    const pollRes = await fetch(pollUrl, {
      method: 'GET',
      headers: { Accept: 'text/event-stream' },
      signal: options.signal,
    });

    if (!pollRes.ok) {
      const body = await pollRes.text().catch(() => pollRes.statusText);
      throw new Error(`Kaggle Gradio poll failed (${pollRes.status}): ${body}`);
    }

    if (!pollRes.body) {
      throw new Error('Kaggle Gradio poll response has no body.');
    }

    const resultData = await readGradioSse(pollRes.body, options.signal);
    const text =
      typeof resultData[0] === 'string'
        ? (resultData[0] as string).trim()
        : JSON.stringify(resultData[0] ?? '');

    if (!text) {
      throw new Error('Kaggle Gradio returned an empty response.');
    }

    options.onStream?.(text, text);
    return text;
  },

  healthCheck: async (timeoutMs = 6000) => {
    const { kaggle } = useInferenceStore.getState();
    const baseUrl = normalizeGradioUrl(kaggle.gradioUrl || '');
    if (!baseUrl) return false;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // /gradio_api/info is canonical for Gradio 5.x; fall back to /config
      for (const path of [`${GRADIO_API_PREFIX}/info`, '/config']) {
        try {
          const res = await fetch(`${baseUrl}${path}`, {
            method: 'GET',
            signal: controller.signal,
          });
          if (res.status < 500) return true;
        } catch {
          // try next
        }
      }
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
