import { InferenceMode } from '../../constants/Config';
import { Message } from '../../types';

export interface GenerateResponseOptions {
  onStream?: (partialText: string, chunk: string) => void;
  signal?: AbortSignal;
  systemPrompt?: string;
}

export interface AIProvider {
  generate: (messages: Message[], options?: GenerateResponseOptions) => Promise<string>;
  healthCheck: (timeoutMs?: number) => Promise<boolean>;
}

export interface ProviderStatus {
  mode: InferenceMode;
  label: string;
  connected: boolean | null;
}
