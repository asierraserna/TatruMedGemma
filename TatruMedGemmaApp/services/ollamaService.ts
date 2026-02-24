import { GEMMA_MODEL, OLLAMA_BASE_URL, OLLAMA_SYSTEM_PROMPT } from '../constants/Config';
import { Message, Role } from '../types';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

interface OllamaRuntimeConfig {
  baseUrl?: string;
  model?: string;
  systemPrompt?: string;
}

interface OllamaStreamResponse {
  model: string;
  created_at: string;
  message: {
    role: Role;
    content: string;
    images?: string[];
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface GenerateResponseOptions {
  onStream?: (partialText: string, chunk: string) => void;
  signal?: AbortSignal;
  systemPrompt?: string;
  baseUrl?: string;
  model?: string;
}

interface PullModelResponse {
  status?: string;
  digest?: string;
  total?: number;
  completed?: number;
  error?: string;
}

interface PullModelOptions {
  baseUrl?: string;
  model?: string;
  signal?: AbortSignal;
  onProgress?: (progress: {
    status: string;
    completed?: number;
    total?: number;
    percent?: number;
  }) => void;
}

interface OllamaTagsResponse {
  models?: Array<{
    name?: string;
    model?: string;
  }>;
}

const resolveOllamaConfig = (config?: OllamaRuntimeConfig) => ({
  baseUrl: config?.baseUrl?.trim() || OLLAMA_BASE_URL,
  model: config?.model?.trim() || GEMMA_MODEL,
  systemPrompt: config?.systemPrompt?.trim() || OLLAMA_SYSTEM_PROMPT,
});

export const checkOllamaConnection = async (
  timeoutMs = 3000,
  config?: Pick<OllamaRuntimeConfig, 'baseUrl'>
): Promise<boolean> => {
  const resolved = resolveOllamaConfig(config);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${resolved.baseUrl}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

export const fetchOllamaModelTags = async (
  timeoutMs = 4000,
  config?: Pick<OllamaRuntimeConfig, 'baseUrl'>
): Promise<string[]> => {
  const resolved = resolveOllamaConfig(config);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${resolved.baseUrl}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama tags error: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as OllamaTagsResponse;
    const models = payload.models || [];

    return models
      .map((entry) => (entry.name || entry.model || '').trim())
      .filter((entry) => !!entry)
      .sort((a, b) => a.localeCompare(b));
  } finally {
    clearTimeout(timeout);
  }
};

const sanitizeHistory = (messages: Message[]) => {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: message.content,
      imageUri: message.imageUri,
    }));
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

const toBase64Image = async (imageUri?: string) => {
  if (!imageUri) {
    return undefined;
  }

  try {
    const fromDataUrl = dataUrlToBase64(imageUri);
    if (fromDataUrl) {
      return [fromDataUrl];
    }

    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`Unable to fetch image URI: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const base64 = await blobToBase64(blob);
      return base64 ? [base64] : undefined;
    }

    const base64Encoding = 'base64' as const;
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: base64Encoding,
    });

    return base64 ? [base64] : undefined;
  } catch (error) {
    console.warn('Unable to read image for Ollama message payload:', error);
    return undefined;
  }
};

const buildPayloadMessages = async (messages: Message[], systemPrompt?: string) => {
  const history = sanitizeHistory(messages);
  const resolvedPrompt = (systemPrompt || OLLAMA_SYSTEM_PROMPT).trim();

  const payloadHistory = await Promise.all(
    history.map(async (message) => ({
      role: message.role,
      content: message.content,
      images: await toBase64Image(message.imageUri),
    }))
  );

  if (!resolvedPrompt) {
    return payloadHistory;
  }

  return [{ role: 'system' as const, content: resolvedPrompt }, ...payloadHistory];
};

const extractJsonObjects = (buffer: string) => {
  const objects: string[] = [];
  let startIndex = -1;
  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let index = 0; index < buffer.length; index += 1) {
    const char = buffer[index];

    if (startIndex === -1) {
      if (char === '{') {
        startIndex = index;
        depth = 1;
      }
      continue;
    }

    if (inString) {
      if (escaping) {
        escaping = false;
      } else if (char === '\\') {
        escaping = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        objects.push(buffer.slice(startIndex, index + 1));
        startIndex = -1;
      }
    }
  }

  const pending = startIndex === -1 ? '' : buffer.slice(startIndex);
  return { objects, pending };
};

const parseChunkObjects = (
  chunkBuffer: string,
  onParsed: (parsed: OllamaStreamResponse) => void
) => {
  const { objects, pending } = extractJsonObjects(chunkBuffer);

  for (const objectText of objects) {
    try {
      const parsed = JSON.parse(objectText) as OllamaStreamResponse;
      onParsed(parsed);
    } catch (error) {
      console.warn('Skipping malformed Ollama stream object:', error);
    }
  }

  return pending;
};

const parseRawOllamaText = (rawText: string, onParsed: (parsed: OllamaStreamResponse) => void) => {
  const { objects } = extractJsonObjects(rawText);

  if (objects.length > 0) {
    for (const objectText of objects) {
      try {
        onParsed(JSON.parse(objectText) as OllamaStreamResponse);
      } catch (error) {
        console.warn('Skipping malformed Ollama raw object:', error);
      }
    }
    return;
  }

  const trimmed = rawText.trim();
  if (!trimmed) {
    return;
  }

  try {
    onParsed(JSON.parse(trimmed) as OllamaStreamResponse);
  } catch (error) {
    console.warn('Unable to parse Ollama raw response text:', error);
  }
};

const parseRawPullText = (rawText: string, onParsed: (parsed: PullModelResponse) => void) => {
  const { objects } = extractJsonObjects(rawText);

  if (objects.length > 0) {
    for (const objectText of objects) {
      try {
        onParsed(JSON.parse(objectText) as PullModelResponse);
      } catch (error) {
        console.warn('Skipping malformed Ollama pull object:', error);
      }
    }
    return;
  }

  const trimmed = rawText.trim();
  if (!trimmed) {
    return;
  }

  try {
    onParsed(JSON.parse(trimmed) as PullModelResponse);
  } catch (error) {
    console.warn('Unable to parse Ollama pull response text:', error);
  }
};

const hasImagePayload = (
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    images?: string[];
  }>
) => messages.some((message) => Array.isArray(message.images) && message.images.length > 0);

const stripImagesFromPayload = (payload: {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
    images?: string[];
  }[];
  stream: boolean;
}) => ({
  ...payload,
  messages: payload.messages.map(({ images: _images, ...message }) => message),
});

const isMissingVisionSupportError = (errorText: string) => {
  const normalized = errorText.toLowerCase();
  return (
    normalized.includes('missing data required for image input') ||
    normalized.includes('failed to process inputs')
  );
};

const consumeWebChatResponse = async (
  response: Response,
  options: GenerateResponseOptions
): Promise<string> => {
  if (!response.body) {
    const rawText = await response.text();
    let fullText = '';

    parseRawOllamaText(rawText, (parsed) => {
      const nextChunk = parsed.message?.content || '';
      if (!nextChunk) {
        return;
      }

      fullText += nextChunk;
      options.onStream?.(fullText, nextChunk);
    });

    return fullText;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let pending = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    pending += decoder.decode(value, { stream: true });
    pending = parseChunkObjects(pending, (parsed) => {
      const nextChunk = parsed.message?.content || '';
      if (!nextChunk) {
        return;
      }

      fullText += nextChunk;
      options.onStream?.(fullText, nextChunk);
    });
  }

  pending += decoder.decode();
  pending = parseChunkObjects(pending, (parsed) => {
    const nextChunk = parsed.message?.content || '';
    if (!nextChunk) {
      return;
    }

    fullText += nextChunk;
    options.onStream?.(fullText, nextChunk);
  });

  return fullText;
};

const streamWithXmlHttpRequest = (
  payload: {
    model: string;
    messages: {
      role: 'system' | 'user' | 'assistant';
      content: string;
      images?: string[];
    }[];
    stream: boolean;
  },
  options: GenerateResponseOptions,
  baseUrl: string
) => {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let pending = '';
    let fullText = '';
    let processedLength = 0;

    const onParsedChunk = (parsed: OllamaStreamResponse) => {
      const nextChunk = parsed.message?.content || '';
      if (!nextChunk) {
        return;
      }

      fullText += nextChunk;
      options.onStream?.(fullText, nextChunk);
    };

    const processIncoming = () => {
      const responseText = xhr.responseText || '';
      if (responseText.length <= processedLength) {
        return;
      }

      const incoming = responseText.slice(processedLength);
      processedLength = responseText.length;
      pending += incoming;
      pending = parseChunkObjects(pending, onParsedChunk);
    };

    const abortListener = () => {
      xhr.abort();
    };

    if (options.signal) {
      if (options.signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }

      options.signal.addEventListener('abort', abortListener, { once: true });
    }

    xhr.open('POST', `${baseUrl}/api/chat`);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onprogress = processIncoming;

    xhr.onload = () => {
      processIncoming();

      if (xhr.status < 200 || xhr.status >= 300) {
        options.signal?.removeEventListener('abort', abortListener);
        reject(new Error(`Ollama API Error: ${xhr.status} ${xhr.statusText}`));
        return;
      }

      if (pending.trim()) {
        parseRawOllamaText(pending, onParsedChunk);
      }

      options.signal?.removeEventListener('abort', abortListener);
      resolve(fullText);
    };

    xhr.onerror = () => {
      options.signal?.removeEventListener('abort', abortListener);
      reject(new Error('Network error while streaming from Ollama'));
    };

    xhr.onabort = () => {
      options.signal?.removeEventListener('abort', abortListener);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    xhr.send(JSON.stringify(payload));
  });
};

export const generateResponse = async (
  messages: Message[],
  options: GenerateResponseOptions = {}
): Promise<string> => {
  const resolved = resolveOllamaConfig(options);
  const payloadMessages = await buildPayloadMessages(messages, options.systemPrompt || resolved.systemPrompt);
  const payload = {
    model: resolved.model,
    messages: payloadMessages,
    stream: true,
  };

  if (Platform.OS !== 'web') {
    try {
      return await streamWithXmlHttpRequest(payload, options, resolved.baseUrl);
    } catch (error) {
      const errorMessage = (error as Error)?.message || '';
      if (!hasImagePayload(payload.messages) || !errorMessage.includes('500')) {
        throw error;
      }

      console.warn(
        'Ollama rejected image input for the selected model. Retrying without image payload.'
      );
      const fallbackPayload = stripImagesFromPayload(payload);
      return streamWithXmlHttpRequest(fallbackPayload, options, resolved.baseUrl);
    }
  }

  const postChat = (bodyPayload: typeof payload) =>
    fetch(`${resolved.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
      signal: options.signal,
    });

  let response = await postChat(payload);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Could not read error response');
    console.error('Ollama API Error Response:', errorText);

    if (hasImagePayload(payload.messages) && isMissingVisionSupportError(errorText)) {
      console.warn(
        'Selected Ollama model appears not vision-ready in this runtime. Retrying request without images.'
      );
      const fallbackPayload = stripImagesFromPayload(payload);
      response = await postChat(fallbackPayload);

      if (!response.ok) {
        const fallbackErrorText = await response
          .text()
          .catch(() => 'Could not read fallback error response');
        console.error('Ollama fallback API Error Response:', fallbackErrorText);
        throw new Error(
          `Ollama API Error: ${response.status} ${response.statusText} - ${fallbackErrorText}`
        );
      }
    } else {
      throw new Error(`Ollama API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }

  return consumeWebChatResponse(response, options);
};

export const pullModel = async (options: PullModelOptions = {}): Promise<void> => {
  const resolved = resolveOllamaConfig(options);
  const model = options.model?.trim() || resolved.model;

  if (!model) {
    throw new Error('Model name is required to pull from Ollama.');
  }

  if (Platform.OS !== 'web') {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let pending = '';
      let processedLength = 0;

      const onParsedChunk = (parsed: PullModelResponse) => {
        if (parsed.error) {
          reject(new Error(parsed.error));
          return;
        }

        const completed = parsed.completed;
        const total = parsed.total;
        const percent =
          typeof completed === 'number' && typeof total === 'number' && total > 0
            ? Math.min(100, Math.round((completed / total) * 100))
            : undefined;

        options.onProgress?.({
          status: parsed.status || 'Pulling model',
          completed,
          total,
          percent,
        });
      };

      const processIncoming = () => {
        const responseText = xhr.responseText || '';
        if (responseText.length <= processedLength) {
          return;
        }

        const incoming = responseText.slice(processedLength);
        processedLength = responseText.length;
        pending += incoming;

        const { objects, pending: nextPending } = extractJsonObjects(pending);
        pending = nextPending;

        for (const objectText of objects) {
          try {
            onParsedChunk(JSON.parse(objectText) as PullModelResponse);
          } catch (error) {
            console.warn('Skipping malformed Ollama pull stream object:', error);
          }
        }
      };

      const abortListener = () => {
        xhr.abort();
      };

      if (options.signal) {
        if (options.signal.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }

        options.signal.addEventListener('abort', abortListener, { once: true });
      }

      xhr.open('POST', `${resolved.baseUrl}/api/pull`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onprogress = processIncoming;

      xhr.onload = () => {
        processIncoming();

        if (xhr.status < 200 || xhr.status >= 300) {
          options.signal?.removeEventListener('abort', abortListener);
          reject(new Error(`Ollama Pull Error: ${xhr.status} ${xhr.statusText}`));
          return;
        }

        if (pending.trim()) {
          parseRawPullText(pending, onParsedChunk);
        }

        options.signal?.removeEventListener('abort', abortListener);
        resolve();
      };

      xhr.onerror = () => {
        options.signal?.removeEventListener('abort', abortListener);
        reject(new Error('Network error while pulling model from Ollama'));
      };

      xhr.onabort = () => {
        options.signal?.removeEventListener('abort', abortListener);
        reject(new DOMException('Aborted', 'AbortError'));
      };

      xhr.send(
        JSON.stringify({
          name: model,
          stream: true,
        })
      );
    });
  }

  const response = await fetch(`${resolved.baseUrl}/api/pull`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: model,
      stream: true,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Ollama Pull Error: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    const rawText = await response.text();
    parseRawPullText(rawText, (parsed) => {
      if (parsed.error) {
        throw new Error(parsed.error);
      }

      const completed = parsed.completed;
      const total = parsed.total;
      const percent =
        typeof completed === 'number' && typeof total === 'number' && total > 0
          ? Math.min(100, Math.round((completed / total) * 100))
          : undefined;

      options.onProgress?.({
        status: parsed.status || 'Pulling model',
        completed,
        total,
        percent,
      });
    });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    pending += decoder.decode(value, { stream: true });
    const { objects, pending: nextPending } = extractJsonObjects(pending);
    pending = nextPending;

    for (const objectText of objects) {
      const parsed = JSON.parse(objectText) as PullModelResponse;
      if (parsed.error) {
        throw new Error(parsed.error);
      }

      const completed = parsed.completed;
      const total = parsed.total;
      const percent =
        typeof completed === 'number' && typeof total === 'number' && total > 0
          ? Math.min(100, Math.round((completed / total) * 100))
          : undefined;

      options.onProgress?.({
        status: parsed.status || 'Pulling model',
        completed,
        total,
        percent,
      });
    }
  }

  pending += decoder.decode();
  if (pending.trim()) {
    parseRawPullText(pending, (parsed) => {
      if (parsed.error) {
        throw new Error(parsed.error);
      }
    });
  }
};
