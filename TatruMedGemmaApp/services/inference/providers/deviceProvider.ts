import { Message } from '../../../types';
import { useInferenceStore } from '../../../store/inferenceStore';
import { AIProvider, GenerateResponseOptions } from '../types';

const DEVICE_NOT_READY_MESSAGE =
  'On-device MedGemma is not configured yet. Use LAN or Cloud mode, or integrate a native runtime (Expo dev client + llama.cpp bindings).';

export const deviceProvider: AIProvider = {
  generate: async (_messages: Message[], _options?: GenerateResponseOptions) => {
    const modelId = useInferenceStore.getState().device.modelId;
    throw new Error(`${DEVICE_NOT_READY_MESSAGE} Selected model: ${modelId}.`);
  },
  healthCheck: async () => false,
};
