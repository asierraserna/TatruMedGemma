declare module 'llama.rn' {
  export function initLlama(config: Record<string, unknown>): Promise<{
    completion: (
      input: Record<string, unknown>,
      onToken?: (data: { token?: string; content?: string }) => void
    ) => Promise<{ text?: string }>;
    release?: () => Promise<void>;
  }>;
}
