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
}

export interface GuardrailsValidationResult {
  valid: boolean;
  errors: string[];
}
