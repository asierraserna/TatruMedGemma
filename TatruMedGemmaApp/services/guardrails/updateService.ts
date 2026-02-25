import { GuardrailsManifest, GuardrailsValidationResult, GuardrailsBundleEntry } from '../../types/guardrails';

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

  // optional guardrails metadata
  if (manifest.policy) {
    if (!isNonEmptyString(manifest.policy.version)) {
      errors.push('policy.version is required when policy is provided.');
    }
    if (!isNonEmptyString(manifest.policy.defaultDecision)) {
      errors.push('policy.defaultDecision is required when policy is provided.');
    }
    if (!Array.isArray(manifest.policy.rules) || manifest.policy.rules.length === 0) {
      errors.push('policy.rules must be a non-empty array when policy is provided.');
    } else {
      manifest.policy.rules.forEach((rule, idx) => {
        if (!isNonEmptyString(rule.id)) {
          errors.push(`policy.rules[${idx}].id is required.`);
        }
        if (!isNonEmptyString(rule.description)) {
          errors.push(`policy.rules[${idx}].description is required.`);
        }
        if (!Array.isArray(rule.matchTopics)) {
          errors.push(`policy.rules[${idx}].matchTopics must be an array.`);
        }
        if (!isNonEmptyString(rule.decision)) {
          errors.push(`policy.rules[${idx}].decision is required.`);
        }
      });
    }
  }

  if (manifest.promptPackInline) {
    if (!isNonEmptyString(manifest.promptPackInline.templateKey)) {
      errors.push('promptPackInline.templateKey is required.');
    }
    if (!isNonEmptyString(manifest.promptPackInline.systemPrompt)) {
      errors.push('promptPackInline.systemPrompt is required.');
    }
    if (!Array.isArray(manifest.promptPackInline.userPromptExamples)) {
      errors.push('promptPackInline.userPromptExamples must be an array.');
    } else {
      manifest.promptPackInline.userPromptExamples.forEach((ex, idx) => {
        if (!isNonEmptyString(ex.id)) {
          errors.push(`promptPackInline.userPromptExamples[${idx}].id is required.`);
        }
        if (!isNonEmptyString(ex.user)) {
          errors.push(`promptPackInline.userPromptExamples[${idx}].user is required.`);
        }
        if (!isNonEmptyString(ex.assistant)) {
          errors.push(`promptPackInline.userPromptExamples[${idx}].assistant is required.`);
        }
      });
    }
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

/**
 * Converts manifest-level guardrails metadata into a patch suitable for
 * storing in the app's GuardrailsSettings.  This is intentionally simple
 * – policies are transformed into a small topic list and the inline prompt
 * is turned into a template that becomes active immediately.
 */
export const manifestToGuardrailsPatch = (
  manifest: GuardrailsManifest
): Partial<import('../../store/inferenceStore').GuardrailsSettings> => {
  const patch: Partial<import('../../store/inferenceStore').GuardrailsSettings> = {};

  if (manifest.policy) {
    patch.allowedTopics = manifest.policy.rules.map((rule) => ({
      id: rule.id,
      topicName: rule.description,
      isAllowed: rule.decision !== 'deny',
      enabled: true,
      updatedAt: Date.now(),
    }));
    // also keep raw policy for reference
    patch.policy = manifest.policy;
  }

  if (manifest.promptPackInline) {
    const tplId = manifest.promptPackInline.templateKey;
    const template = {
      id: tplId,
      version: manifest.policy?.version || '1.0.0',
      label: tplId,
      prompt: manifest.promptPackInline.systemPrompt,
      createdAt: Date.now(),
    } as import('../../store/inferenceStore').GuardrailsPromptTemplate;

    patch.promptTemplates = [template];
    patch.activePromptTemplateId = tplId;
    patch.promptPackInline = manifest.promptPackInline;
  }

  return patch;
};

export interface GuardrailsPlan {
  manifest: GuardrailsManifest;
  requiredBundles: GuardrailsBundleEntry[];
  recommendedPrimaryDbBundle: GuardrailsBundleEntry | null;
  guardrailsPatch: Partial<import('../../store/inferenceStore').GuardrailsSettings>;
}

export const planGuardrailsUpdate = async (
  manifestUrl: string,
  signal?: AbortSignal
): Promise<GuardrailsPlan> => {
  const manifest = await fetchGuardrailsManifest(manifestUrl, signal);

  const requiredBundles = manifest.bundles.filter((bundle) => bundle.required);

  return {
    manifest,
    requiredBundles,
    recommendedPrimaryDbBundle:
      manifest.bundles.find((bundle) => bundle.name.endsWith('.db')) || requiredBundles[0] || null,
    guardrailsPatch: manifestToGuardrailsPatch(manifest),
  };
};
