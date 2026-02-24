import { Message } from '../../../types';
import { useInferenceStore } from '../../../store/inferenceStore';
import { AIProvider, GenerateResponseOptions } from '../types';
import { getDeviceModelState } from '../deviceModelService';

const DEVICE_NOT_READY_MESSAGE =
  'On-device MedGemma is not ready yet. Download the GGUF model first from the Home screen.';
const MAX_RECENT_TURNS = 8;
const DEVICE_N_CTX = 1024;
const DEVICE_N_PREDICT = 384;

type LlamaContext = {
  completion: (
    input: Record<string, unknown>,
    onToken?: (data: { token?: string; content?: string }) => void
  ) => Promise<{ text?: string }>;
  release?: () => Promise<void>;
};

let activeContext: LlamaContext | null = null;
let activeModelUri = '';

const mapMessagesForLlama = (messages: Message[], systemPrompt?: string) => {
  const promptMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  if (systemPrompt?.trim()) {
    promptMessages.push({
      role: 'system',
      content: systemPrompt.trim(),
    });
  }

  const chatTurns: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const message of messages) {
    if ((message.role !== 'user' && message.role !== 'assistant') || !message.content?.trim()) {
      continue;
    }

    const role = message.role;
    const content = message.content.trim();
    const previous = chatTurns[chatTurns.length - 1];

    if (previous && previous.role === role) {
      previous.content = `${previous.content}\n\n${content}`;
      continue;
    }

    chatTurns.push({ role, content });
  }

  while (chatTurns.length > 0 && chatTurns[0].role !== 'user') {
    chatTurns.shift();
  }

  const limitedTurns =
    chatTurns.length > MAX_RECENT_TURNS ? chatTurns.slice(chatTurns.length - MAX_RECENT_TURNS) : chatTurns;

  while (limitedTurns.length > 0 && limitedTurns[0].role !== 'user') {
    limitedTurns.shift();
  }

  for (const turn of limitedTurns) {
    promptMessages.push(turn);
  }

  return promptMessages;
};

const ensureLlamaContext = async (modelUri: string): Promise<LlamaContext> => {
  if (activeContext && activeModelUri === modelUri) {
    return activeContext;
  }

  if (activeContext?.release) {
    await activeContext.release();
  }

  const llamaModule = (await import('llama.rn')) as {
    initLlama: (config: Record<string, unknown>) => Promise<LlamaContext>;
  };

  const context = await llamaModule.initLlama({
    model: modelUri,
    n_ctx: DEVICE_N_CTX,
    n_predict: DEVICE_N_PREDICT,
    n_batch: 256,
    n_gpu_layers: 0,
    use_mlock: true,
  });

  activeContext = context;
  activeModelUri = modelUri;

  return context;
};

export const deviceProvider: AIProvider = {
  generate: async (messages: Message[], options?: GenerateResponseOptions) => {
    if (messages.some((message) => !!message.imageUri)) {
      throw new Error('On-device MVP currently supports text-only prompts. Remove image input and try again.');
    }

    const { modelId, ggufUrl } = useInferenceStore.getState().device;
    const state = await getDeviceModelState();

    if (!state.ggufExists) {
      throw new Error(
        `${DEVICE_NOT_READY_MESSAGE} Selected model: ${modelId}. GGUF source: ${ggufUrl || 'not set'}.`
      );
    }

    const context = await ensureLlamaContext(state.ggufUri);
    const llamaMessages = mapMessagesForLlama(messages, options?.systemPrompt);
    let streamedText = '';

    const result = await context.completion(
      {
        messages: llamaMessages,
        temperature: 0.2,
        n_predict: DEVICE_N_PREDICT,
      },
      (partial) => {
        const chunk = partial?.token || partial?.content || '';
        if (!chunk) {
          return;
        }

        streamedText += chunk;
        options?.onStream?.(streamedText, chunk);
      }
    );

    const finalText = (result?.text || streamedText || '').trim();
    if (!finalText) {
      throw new Error('On-device model returned an empty response.');
    }

    return finalText;
  },
  healthCheck: async () => {
    const state = await getDeviceModelState();
    return state.ggufExists;
  },
};
