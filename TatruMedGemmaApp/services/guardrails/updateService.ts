import { GuardrailsManifest, GuardrailsValidationResult } from '../../types/guardrails';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const validateGuardrailsManifest = (
  manifest: GuardrailsManifest
): GuardrailsValidationResult => {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest payload is invalid.'] };
  }

  if (typeof manifest.manifestVersion !== 'number') {
    errors.push('manifestVersion must be a number.');
  }

  if (!isNonEmptyString(manifest.project)) {
    errors.push('project is required.');
  }

  if (!isNonEmptyString(manifest.dbVersion)) {
    errors.push('dbVersion is required.');
  }

  if (!Array.isArray(manifest.bundles) || manifest.bundles.length === 0) {
    errors.push('bundles must include at least one entry.');
  } else {
    manifest.bundles.forEach((bundle, index) => {
      if (!isNonEmptyString(bundle.name)) {
        errors.push(`bundles[${index}].name is required.`);
      }
      if (!isNonEmptyString(bundle.url)) {
        errors.push(`bundles[${index}].url is required.`);
      }
      if (typeof bundle.sizeBytes !== 'number' || bundle.sizeBytes <= 0) {
        errors.push(`bundles[${index}].sizeBytes must be > 0.`);
      }
      if (!isNonEmptyString(bundle.sha256)) {
        errors.push(`bundles[${index}].sha256 is required.`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const fetchGuardrailsManifest = async (
  manifestUrl: string,
  signal?: AbortSignal
): Promise<GuardrailsManifest> => {
  const response = await fetch(manifestUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Guardrails manifest fetch failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as GuardrailsManifest;
  const validation = validateGuardrailsManifest(payload);

  if (!validation.valid) {
    throw new Error(`Invalid guardrails manifest: ${validation.errors.join(' ')}`);
  }

  return payload;
};

export const planGuardrailsUpdate = async (manifestUrl: string, signal?: AbortSignal) => {
  const manifest = await fetchGuardrailsManifest(manifestUrl, signal);

  const requiredBundles = manifest.bundles.filter((bundle) => bundle.required);

  return {
    manifest,
    requiredBundles,
    recommendedPrimaryDbBundle:
      manifest.bundles.find((bundle) => bundle.name.endsWith('.db')) || requiredBundles[0] || null,
  };
};
