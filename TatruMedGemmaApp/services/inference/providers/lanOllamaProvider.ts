import { generateResponse, checkOllamaConnection } from '../../ollamaService';
import { Message } from '../../../types';
import { getActiveGuardrailsPrompt, useInferenceStore } from '../../../store/inferenceStore';
import { AIProvider, GenerateResponseOptions } from '../types';
import { logSystemPrompt, logRequest } from '../../logger';

export const lanOllamaProvider: AIProvider = {
  generate: async (messages: Message[], options: GenerateResponseOptions = {}) => {
    const { lan } = useInferenceStore.getState();
    // options.systemPrompt is already resolved by the router (guardrails template).
    // Fall back to local guardrails helper → provider default for direct calls.
    const activeGuardrailsPrompt = getActiveGuardrailsPrompt();
    const resolvedSystemPrompt =
      options.systemPrompt || activeGuardrailsPrompt || lan.systemPrompt;

    logSystemPrompt('LAN', resolvedSystemPrompt);
    logRequest('LAN', {
      model: lan.model,
      messageCount: messages.length,
      hasImage: messages.some((m) => !!m.imageUri),
      hasSystemPrompt: !!resolvedSystemPrompt,
      endpoint: `${lan.baseUrl}/api/chat`,
    });

    return generateResponse(messages, {
      ...options,
      baseUrl: lan.baseUrl,
      model: lan.model,
      systemPrompt: resolvedSystemPrompt,
    });
  },
  healthCheck: async (timeoutMs = 3000) => {
    const { lan } = useInferenceStore.getState();
    return checkOllamaConnection(timeoutMs, { baseUrl: lan.baseUrl });
  },
};
