import { Message } from '../../../types';
import * as FileSystem from 'expo-file-system';
import { useInferenceStore } from '../../../store/inferenceStore';
import type { DeviceProviderSettings } from '../../../store/inferenceStore';
import { AIProvider, GenerateResponseOptions } from '../types';
import { getDeviceModelState } from '../deviceModelService';
import { NativeModules } from 'react-native';

const DEVICE_NOT_READY_MESSAGE =
  'On-device MedGemma is not ready yet. Download the GGUF model first from the Home screen.';
const MAX_RECENT_TURNS = 8;
const DEVICE_N_CTX = 768;
const DEVICE_N_PREDICT = 384;

// require at least 5 GB of *total* RAM before attempting to initialise llama.
// (free‑memory probes aren't available via PlatformConstants, so this is
// only a rough heuristic.  The value was bumped because lower‑RAM phones
// consistently trigger OOM kills when the context is created.)
export const MIN_FREE_MEMORY_BYTES = 5 * 1024 * 1024 * 1024;

type LlamaContext = {
  completion: (
    input: Record<string, unknown>,
    onToken?: (data: { token?: string; content?: string }) => void
  ) => Promise<{ text?: string }>;
  release?: () => Promise<void>;
};

let activeContext: LlamaContext | null = null;
// Instead of just model URI, keep a key incorporating tuning parameters so changes
// will trigger a new llama context.
let activeContextKey = '';

const mapMessagesForLlama = (messages: Message[], systemPrompt?: string) => {
  const promptMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];

  if (systemPrompt?.trim()) {
    promptMessages.push({
      role: 'system',
      content: systemPrompt.trim(),
    });
  }

  const chatTurns: { role: 'user' | 'assistant'; content: string }[] = [];

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

// read available memory from /proc/meminfo (Android only). returns bytes or null
async function getFreeMemoryBytes(): Promise<number | null> {
  try {
    const text = await FileSystem.readAsStringAsync('/proc/meminfo');
    const m = text.match(/^MemAvailable:\s+(\d+)\s+kB/m);
    if (m) {
      return parseInt(m[1], 10) * 1024;
    }
  } catch {
    // ignore
  }
  return null;
}

const ensureLlamaContext = async (modelUri: string): Promise<LlamaContext> => {
  // grab current device tuning settings; fall back to constants if not set.
  // cast explicitly because TS may have cached the earlier shape of the store
  const {
    nCtx = DEVICE_N_CTX,
    nBatch = 64,
    useMlock = false,
  } = useInferenceStore.getState().device as DeviceProviderSettings;

  const contextKey = `${modelUri}|nctx=${nCtx}|nbatch=${nBatch}|mlock=${useMlock}`;
  if (activeContext && activeContextKey === contextKey) {
    return activeContext;
  }

  if (activeContext?.release) {
    await activeContext.release();
  }

  // pre-flight memory checks: both total RAM and (if available) free RAM
  try {
    const totalMem = (NativeModules as any)?.PlatformConstants?.totalMemory;
    if (typeof totalMem === 'number' && totalMem < MIN_FREE_MEMORY_BYTES) {
      throw new Error('insufficient memory');
    }

    const freeMem = await getFreeMemoryBytes();
    if (typeof freeMem === 'number' && freeMem < MIN_FREE_MEMORY_BYTES) {
      // available memory too low even if total is high
      throw new Error('insufficient memory');
    }
  } catch {
    // failed to query or memory too low, propagate later in caller
  }

  const llamaModule = (await import('llama.rn')) as {
    initLlama: (config: Record<string, unknown>) => Promise<LlamaContext>;
  };

  const context = await llamaModule.initLlama({
    model: modelUri,
    n_ctx: nCtx,
    n_predict: DEVICE_N_PREDICT,
    n_batch: nBatch,
    n_gpu_layers: 0,
    use_mlock: useMlock,
  });

  activeContext = context;
  activeContextKey = contextKey;

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

    let context: LlamaContext;
    try {
      context = await ensureLlamaContext(state.ggufUri);
    } catch (err) {
      // propagate memory-specific errors with clearer user message
      const msg = (err as Error).message || '';
      if (msg.toLowerCase().includes('memory')) {
        throw new Error(
          'On-device model could not start due to low device memory. ' +
            'Try a smaller model or free up RAM.'
        );
      }
      throw err;
    }
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
