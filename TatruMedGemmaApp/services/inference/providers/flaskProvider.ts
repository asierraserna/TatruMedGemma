import { AIProvider, GenerateResponseOptions } from '../types';
import { Message } from '../../../types';
import { useInferenceStore } from '../../../store/inferenceStore';
import { Platform } from 'react-native';
import { logSystemPrompt, logRequest } from '../../logger';

// ---------------------------------------------------------------------------
// SSE helpers
// ---------------------------------------------------------------------------

/** Parse all complete SSE events out of a buffer; return leftover fragment. */
function drainSSEBuffer(
  buffer: string,
  onToken: (token: string) => void,
): string {
  const events = buffer.split('\n\n');
  const remaining = events.pop() ?? '';

  for (const event of events) {
    const dataLines = event
      .split('\n')
      .filter((l) => l.startsWith('data: '))
      .map((l) => l.slice(6));

    if (dataLines.length === 0) continue;
    const token = dataLines.join('\n');
    if (token) onToken(token);
  }

  return remaining;
}

/**
 * XHR-based SSE reader for React Native (iOS/Android).
 * fetch() on RN buffers the whole body; XHR onprogress fires incrementally.
 */
function streamViaXHR(
  url: string,
  init: RequestInit,
  onProgress: (fullText: string, token: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    // Copy headers — skip Content-Type for FormData (XHR sets it + boundary).
    const isFormData = init.body instanceof FormData;
    if (!isFormData && init.headers) {
      const headers = init.headers as Record<string, string>;
      for (const [k, v] of Object.entries(headers)) {
        xhr.setRequestHeader(k, v);
      }
    }

    let processedLen = 0;
    let sseBuffer = '';
    let fullText = '';

    xhr.onprogress = () => {
      const newText = xhr.responseText.slice(processedLen);
      processedLen = xhr.responseText.length;
      sseBuffer += newText;

      sseBuffer = drainSSEBuffer(sseBuffer, (token) => {
        if (token.startsWith('[stream_error]')) {
          reject(new Error(token));
          return;
        }
        fullText += token;
        onProgress(fullText, token);
      });
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Flush any leftover SSE data after stream closes.
        drainSSEBuffer(sseBuffer + '\n\n', (token) => {
          if (!token.startsWith('[stream_error]')) {
            fullText += token;
            onProgress(fullText, token);
          }
        });
        resolve(fullText);
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error('XHR network error'));
    xhr.ontimeout = () => reject(new Error('XHR timeout'));

    signal?.addEventListener('abort', () => {
      xhr.abort();
      reject(new DOMException('Aborted', 'AbortError'));
    });

    xhr.send(init.body as XMLHttpRequestBodyInit);
  });
}

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

export const flaskProvider: AIProvider = {
  generate: async (messages: Message[], options: GenerateResponseOptions = {}) => {
    const { flask } = useInferenceStore.getState();

    // options.systemPrompt is injected by the router from the active guardrails
    // template. Passed as `system_prompt` in the JSON body — the Flask API must
    // read this field to apply it (see MedGemmaAPI/api.py).
    const resolvedSystemPrompt = options.systemPrompt?.trim() || '';

    logSystemPrompt('Flask', resolvedSystemPrompt);
    logRequest('Flask', {
      messageCount: messages.length,
      hasImage: messages.some((m) => !!m.imageUri),
      hasSystemPrompt: !!resolvedSystemPrompt,
      endpoint: `${flask.baseUrl}/analyze_stream`,
    });

    // Find the latest user message with an image
    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === 'user' && !!message.imageUri);

    const prompt = messages[messages.length - 1]?.content || 'Describe this X-ray';

    const imageUri = latestUserMessage?.imageUri?.trim();

    const createRequestInit = async (): Promise<RequestInit> => {
      if (!imageUri) {
        return {
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            ...(resolvedSystemPrompt && { system_prompt: resolvedSystemPrompt }),
          }),
        };
      }

      const base64FromDataUrl = dataUrlToBase64(imageUri);
      if (base64FromDataUrl) {
        return {
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_base64: base64FromDataUrl,
            prompt,
            ...(resolvedSystemPrompt && { system_prompt: resolvedSystemPrompt }),
          }),
        };
      }

      if (Platform.OS === 'web') {
        const imageResponse = await fetch(imageUri, { signal: options.signal });
        if (!imageResponse.ok) {
          throw new Error(`Unable to fetch selected image: ${imageResponse.status} ${imageResponse.statusText}`);
        }

        const blob = await imageResponse.blob();
        const formData = new FormData();
        formData.append('prompt', prompt);
        if (resolvedSystemPrompt) formData.append('system_prompt', resolvedSystemPrompt);
        formData.append('image', blob, 'image.jpg');
        return { body: formData };
      }

      const formData = new FormData();
      formData.append('prompt', prompt);
      if (resolvedSystemPrompt) formData.append('system_prompt', resolvedSystemPrompt);
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);
      return { body: formData };
    };

    const postToPath = async (path: '/analyze_stream' | '/analyze') => {
      const init = await createRequestInit();
      return fetch(`${flask.baseUrl}${path}`, {
        ...init,
        method: 'POST',
        signal: options.signal,
      });
    };

    try {
      // -----------------------------------------------------------------------
      // Native (iOS / Android): XHR onprogress fires per chunk; fetch buffers.
      // -----------------------------------------------------------------------
      if (Platform.OS !== 'web') {
        const init = await createRequestInit();
        try {
          return await streamViaXHR(
            `${flask.baseUrl}/analyze_stream`,
            { ...init, method: 'POST' },
            (fullText, token) => options.onStream?.(fullText, token),
            options.signal ?? undefined,
          );
        } catch (xhrErr) {
          // Fall back to /analyze (non-streaming JSON response).
          console.warn('Flask stream XHR failed, falling back to /analyze:', xhrErr);
          const fallback = await postToPath('/analyze');
          if (!fallback.ok) {
            throw new Error(`Flask /analyze error: ${fallback.status} ${fallback.statusText}`);
          }
          const payload = (await fallback.json()) as { description?: string };
          const description = (payload.description || '').trim();
          if (!description) throw new Error('Flask /analyze returned no description.');
          options.onStream?.(description, description);
          return description;
        }
      }

      // -----------------------------------------------------------------------
      // Web: fetch ReadableStream works correctly.
      // -----------------------------------------------------------------------
      let response = await postToPath('/analyze_stream');

      if (!response.ok) {
        const streamErrorText = await response.text().catch(() => 'Unable to read error response');

        response = await postToPath('/analyze');
        if (!response.ok) {
          const analyzeErrorText = await response.text().catch(() => 'Unable to read error response');
          throw new Error(
            `Flask API error: stream(${streamErrorText}) analyze(${response.status} ${response.statusText} - ${analyzeErrorText})`
          );
        }

        const payload = (await response.json()) as { description?: string };
        const description = (payload.description || '').trim();
        if (description) {
          options.onStream?.(description, description);
          return description;
        }

        throw new Error('Flask /analyze returned no description.');
      }

      if (!response.body || typeof response.body.getReader !== 'function') {
        // Should not normally reach here on web, but guard anyway.
        const fallbackResponse = await postToPath('/analyze');
        if (!fallbackResponse.ok) {
          throw new Error(`Flask fallback error: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
        }
        const fallbackPayload = (await fallbackResponse.json()) as { description?: string };
        const fallbackDescription = (fallbackPayload.description || '').trim();
        if (!fallbackDescription) throw new Error('Flask returned an empty response.');
        options.onStream?.(fallbackDescription, fallbackDescription);
        return fallbackDescription;
      }

      let fullText = '';
      let sseBuffer = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });

        sseBuffer = drainSSEBuffer(sseBuffer, (token) => {
          if (token.startsWith('[stream_error]')) {
            throw new Error(token);
          }
          fullText += token;
          options.onStream?.(fullText, token);
        });
      }

      return fullText;
    } catch (error) {
      console.error('Flask provider error:', error);
      throw error;
    }
  },
  healthCheck: async (timeoutMs = 3000) => {
    const { flask } = useInferenceStore.getState();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${flask.baseUrl}/health`, {
        signal: controller.signal,
      });

      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
