import { Message } from '../../../types';
import { useInferenceStore } from '../../../store/inferenceStore';
import { AIProvider, GenerateResponseOptions } from '../types';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { logSystemPrompt, logRequest } from '../../logger';

interface CloudChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

type CloudMessageContent =
  | string
  | Array<
      | {
          type: 'text';
          text: string;
        }
      | {
          type: 'image_url';
          image_url: {
            url: string;
          };
        }
    >;

interface CloudPayloadMessage {
  role: 'system' | 'user' | 'assistant';
  content: CloudMessageContent;
}

const sanitizeHistory = (messages: Message[]) =>
  messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: message.content,
      imageUri: message.imageUri,
    }));

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

const blobToDataUrl = async (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result.startsWith('data:')) {
        resolve(result);
        return;
      }

      reject(new Error('Unable to convert blob to data URL.'));
    };

    reader.onerror = () => {
      reject(new Error('Unable to read blob with FileReader.'));
    };

    reader.readAsDataURL(blob);
  });
};

const toDataUrlImage = async (imageUri?: string) => {
  if (!imageUri) {
    return undefined;
  }

  if (imageUri.trim().startsWith('data:')) {
    return imageUri.trim();
  }

  try {
    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`Unable to fetch image URI: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      return await blobToDataUrl(blob);
    }

    const base64Encoding = 'base64' as const;
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: base64Encoding,
    });

    if (!base64) {
      return undefined;
    }

    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.warn('Unable to prepare cloud image payload:', error);
    return undefined;
  }
};

const buildPayloadMessages = async (messages: Message[], systemPrompt: string) => {
  const history = sanitizeHistory(messages);
  const prompt = systemPrompt.trim();

  const cloudHistory: CloudPayloadMessage[] = [];
  for (const message of history) {
    const imageDataUrl = await toDataUrlImage(message.imageUri);

    if (imageDataUrl && message.role === 'user') {
      cloudHistory.push({
        role: message.role,
        content: [
          {
            type: 'text',
            text: message.content || '',
          },
          {
            type: 'image_url',
            image_url: { url: imageDataUrl },
          },
        ],
      });
      continue;
    }

    cloudHistory.push({
      role: message.role,
      content: message.content,
    });
  }

  if (!prompt) {
    return cloudHistory;
  }

  return [{ role: 'system' as const, content: prompt }, ...cloudHistory];
};

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/$/, '');

export const cloudProvider: AIProvider = {
  generate: async (messages: Message[], options: GenerateResponseOptions = {}) => {
    const { cloud } = useInferenceStore.getState();
    const baseUrl = normalizeBaseUrl(cloud.baseUrl || '');

    if (!baseUrl) {
      throw new Error('Cloud provider base URL is missing.');
    }

    if (!cloud.apiKey.trim()) {
      throw new Error('Cloud provider API key is missing.');
    }

    // options.systemPrompt is injected by the router from the active guardrails
    // template. Fall back to the per-provider default when called directly.
    const resolvedSystemPrompt = options.systemPrompt || cloud.systemPrompt;

    logSystemPrompt('Cloud', resolvedSystemPrompt);
    logRequest('Cloud', {
      model: cloud.model,
      messageCount: messages.length,
      hasImage: messages.some((m) => !!m.imageUri),
      hasSystemPrompt: !!resolvedSystemPrompt,
      endpoint: `${baseUrl}/chat/completions`,
    });

    const payload = await buildPayloadMessages(messages, resolvedSystemPrompt);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cloud.apiKey}`,
      },
      body: JSON.stringify({
        model: cloud.model,
        messages: payload,
        stream: false,
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error(`Cloud API Error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as CloudChatCompletionResponse;
    const text = data.choices?.[0]?.message?.content?.trim() || '';
    if (text) {
      options.onStream?.(text, text);
    }
    return text;
  },
  healthCheck: async (timeoutMs = 4000) => {
    const { cloud } = useInferenceStore.getState();
    const baseUrl = normalizeBaseUrl(cloud.baseUrl || '');

    if (!baseUrl || !cloud.apiKey.trim()) {
      return false;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${cloud.apiKey}`,
        },
        signal: controller.signal,
      });

      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  },
};
