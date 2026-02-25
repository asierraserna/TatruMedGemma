export interface GuardrailsBundleEntry {
  name: string;
  url: string;
  sizeBytes: number;
  sha256: string;
  required: boolean;
}

export interface GuardrailsSignature {
  algorithm: 'ed25519' | string;
  publicKeyId: string;
  payloadDigestSha256: string;
  value: string;
}

export interface GuardrailsPolicyRule {
  /** unique identifier for the rule, used as a topic id when converted */
  id: string;
  description: string;
  matchTopics: string[];
  decision: string;
  exampleResponse?: string;
}

export interface GuardrailsPolicy {
  version: string;
  defaultDecision: string;
  rules: GuardrailsPolicyRule[];
}

export interface UserPromptExample {
  id: string;
  user: string;
  assistant: string;
}

export interface PromptPackInline {
  templateKey: string;
  systemPrompt: string;
  userPromptExamples: UserPromptExample[];
}

export interface GuardrailsManifest {
  manifestVersion: number;
  project: string;
  dbVersion: string;
  releasedAt: string;
  minAppVersion?: string;
  locale?: string;
  notes?: string;
  bundles: GuardrailsBundleEntry[];
  contentSummary?: Record<string, number>;
  license?: {
    id: string;
    attributionUrl?: string;
  };
  signature?: GuardrailsSignature;

  // new optional guardrails metadata that can accompany an update manifest
  policy?: GuardrailsPolicy;
  promptPackInline?: PromptPackInline;
}

export interface GuardrailsValidationResult {
  valid: boolean;
  errors: string[];
}
