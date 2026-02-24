/**
 * Dev-only structured logger for the inference pipeline.
 *
 * Usage:
 *   import { inferenceLogger } from './logger';
 *   inferenceLogger.systemPrompt('LAN', 'You are a medical assistant…');
 *   inferenceLogger.request('Cloud', { model, messages: 3 });
 *   inferenceLogger.response('Cloud', 'Response received', 200);
 *
 * All output is suppressed in production builds (__DEV__ === false).
 */

declare const __DEV__: boolean;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const PREFIX = '[GemmaMed]';

const timestamp = () => new Date().toISOString();

const fmt = (level: LogLevel, tag: string, message: string) =>
  `${PREFIX} [${timestamp()}] [${level.toUpperCase()}] [${tag}] ${message}`;

const isDev = () => {
  try {
    return typeof __DEV__ !== 'undefined' ? __DEV__ : true;
  } catch {
    return true;
  }
};

export const logger = {
  debug: (tag: string, message: string, data?: unknown): void => {
    if (!isDev()) return;
    if (data !== undefined) {
      console.log(fmt('debug', tag, message), data);
    } else {
      console.log(fmt('debug', tag, message));
    }
  },

  info: (tag: string, message: string, data?: unknown): void => {
    if (!isDev()) return;
    if (data !== undefined) {
      console.info(fmt('info', tag, message), data);
    } else {
      console.info(fmt('info', tag, message));
    }
  },

  warn: (tag: string, message: string, data?: unknown): void => {
    if (data !== undefined) {
      console.warn(fmt('warn', tag, message), data);
    } else {
      console.warn(fmt('warn', tag, message));
    }
  },

  error: (tag: string, message: string, data?: unknown): void => {
    if (data !== undefined) {
      console.error(fmt('error', tag, message), data);
    } else {
      console.error(fmt('error', tag, message));
    }
  },
};

// ---------------------------------------------------------------------------
// Convenience helpers scoped to the inference pipeline
// ---------------------------------------------------------------------------

/**
 * Log the resolved system prompt before it is sent to the model.
 * Prints character count + full text so you can verify guardrails content.
 */
export const logSystemPrompt = (provider: string, prompt: string | undefined): void => {
  if (!isDev()) return;

  if (!prompt || !prompt.trim()) {
    console.warn(
      fmt('warn', provider, 'System prompt is EMPTY — no guardrails/prompt template applied.')
    );
    return;
  }

  console.group?.(fmt('info', provider, `System prompt (${prompt.length} chars)`));
  console.log(prompt);
  console.groupEnd?.();
};

/**
 * Log a summary of the outgoing request (no secrets like API keys).
 */
export const logRequest = (
  provider: string,
  summary: {
    model?: string;
    messageCount: number;
    hasImage?: boolean;
    hasSystemPrompt: boolean;
    endpoint?: string;
  }
): void => {
  if (!isDev()) return;
  console.info(fmt('info', provider, 'Outgoing request'), summary);
};

/**
 * Log guardrails topics that are active for the current request.
 */
export const logGuardrails = (
  allowedTopics: { topicName: string; isAllowed: boolean; enabled: boolean }[]
): void => {
  if (!isDev()) return;

  const enabled = allowedTopics.filter((t) => t.enabled);
  const allowed = enabled.filter((t) => t.isAllowed).map((t) => t.topicName);
  const denied = enabled.filter((t) => !t.isAllowed).map((t) => t.topicName);

  console.info(fmt('info', 'Guardrails', `Topics — allowed: [${allowed.join(', ')}] | denied: [${denied.join(', ')}]`));
};
