import { useInferenceStore, getActiveGuardrailsPrompt } from '../../store/inferenceStore';
import { InferenceMode } from '../../constants/Config';
import { Message } from '../../types';
import { analyzeImageWithMedsiglip } from '../medsiglipService';
import { pullModel } from '../ollamaService';
import { cloudProvider } from './providers/cloudProvider';
import { deviceProvider } from './providers/deviceProvider';
import { lanOllamaProvider } from './providers/lanOllamaProvider';
import { flaskProvider } from './providers/flaskProvider';
import { kaggleProvider } from './providers/kaggleProvider';
import { AIProvider, GenerateResponseOptions, ProviderStatus } from './types';
import { logSystemPrompt, logGuardrails, logRequest } from '../logger';

const getProvider = (mode: InferenceMode): AIProvider => {
  if (mode === 'device') {
    return deviceProvider;
  }

  if (mode === 'cloud') {
    return cloudProvider;
  }

  if (mode === 'flask') {
    return flaskProvider;
  }

  if (mode === 'kaggle') {
    return kaggleProvider;
  }

  return lanOllamaProvider;
};

export const getInferenceModeLabel = (mode: InferenceMode) => {
  if (mode === 'device') {
    return 'On-device';
  }

  if (mode === 'cloud') {
    return 'Cloud';
  }

  if (mode === 'flask') {
    return 'Flask API';
  }

  if (mode === 'kaggle') {
    return 'Kaggle Space';
  }

  return 'LAN Ollama';
};

export const generateResponseForActiveMode = async (
  messages: Message[],
  options: GenerateResponseOptions = {}
) => {
  const state = useInferenceStore.getState();
  const mode = state.mode;
  const provider = getProvider(mode);
  const providerLabel = getInferenceModeLabel(mode);

  // ------------------------------------------------------------------
  // Resolve system prompt: caller-supplied > active guardrails template
  // > provider default.  Inject so every provider gets it automatically.
  // ------------------------------------------------------------------
  const activeGuardrailsPrompt = getActiveGuardrailsPrompt();
  const resolvedSystemPrompt = options.systemPrompt?.trim() || activeGuardrailsPrompt || undefined;

  const routedOptions: GenerateResponseOptions = {
    ...options,
    systemPrompt: resolvedSystemPrompt,
  };

  // Log system prompt and guardrails state for every request.
  logSystemPrompt(providerLabel, resolvedSystemPrompt);
  logGuardrails(state.guardrails.allowedTopics || []);

  let routedMessages = messages;
  let imageAnalysis = '';
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'user' && !!message.imageUri);

  if (mode === 'lan' && latestUserMessage?.imageUri && state.medsiglip.enabled) {
    try {
      const analysis = await analyzeImageWithMedsiglip(
        latestUserMessage.imageUri,
        latestUserMessage.content,
        routedOptions.signal
      );

      if (analysis) {
        imageAnalysis = analysis;
        routedMessages = messages.map((message) => {
          if (message.id !== latestUserMessage.id) {
            return message;
          }

          return {
            ...message,
            content: `${message.content}\n\n[MedSigLIP image findings]\n${analysis}`,
            imageUri: undefined,
          };
        });
      }
    } catch (error) {
      console.warn('MedSigLIP analysis unavailable, continuing with MedGemma direct image input.', error);
    }
  }

  logRequest(providerLabel, {
    messageCount: routedMessages.length,
    hasImage: !!latestUserMessage?.imageUri,
    hasSystemPrompt: !!resolvedSystemPrompt,
  });

  try {
    return await provider.generate(routedMessages, routedOptions);
  } catch (error) {
    if (latestUserMessage?.imageUri && imageAnalysis.trim()) {
      const fallback = `${imageAnalysis.trim()}\n\n[Fallback note] Upstream text generation provider was unavailable, so this response comes from the image analyzer service.`;
      routedOptions.onStream?.(fallback, fallback);
      return fallback;
    }

    throw error;
  }
};

export const checkActiveProviderConnection = async (timeoutMs = 3000): Promise<ProviderStatus> => {
  const mode = useInferenceStore.getState().mode;
  const provider = getProvider(mode);

  try {
    const connected = await provider.healthCheck(timeoutMs);
    return {
      mode,
      label: getInferenceModeLabel(mode),
      connected,
    };
  } catch {
    return {
      mode,
      label: getInferenceModeLabel(mode),
      connected: false,
    };
  }
};

export const pullLanModelOnDemand = async (options?: {
  signal?: AbortSignal;
  onProgress?: (progress: {
    status: string;
    completed?: number;
    total?: number;
    percent?: number;
  }) => void;
}) => {
  const { lan } = useInferenceStore.getState();

  await pullModel({
    baseUrl: lan.baseUrl,
    model: lan.model,
    signal: options?.signal,
    onProgress: options?.onProgress,
  });
};
