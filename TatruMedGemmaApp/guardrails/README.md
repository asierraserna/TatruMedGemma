# Guardrails Data Layer (Offline-First)

This folder defines a practical baseline for local medical guardrails in the app.

## Included in this scaffold

- `schema.sql`: SQLite schema for triage guardrails, topic boundaries, and medication safety.
- `manifest.example.json`: versioned and signed update contract for pulling DB bundles from your own server.
- `../types/guardrails.ts`: TypeScript types for update manifests.
- `../services/guardrails/updateService.ts`: fetch + validate + update-planning service scaffold.

## Why this structure

The schema is designed around safety layers:

1. **Scope control**
   - `allowed_topics` (`is_allowed` allow/deny flag), `topic_condition_links`
2. **Medical grounding**
   - `conditions`, `symptoms`, `condition_symptom_links`, `guidance_snippets`
3. **High-risk checks**
   - `red_flags`, `triage_rules`
4. **Medication guardrails**
   - `drugs`, `drug_warnings`, `contraindications`
5. **Source traceability**
   - `sources`, `update_history`

## Recommended source policy

- Prefer structured/public-health sources with clear terms and attribution.
- Store source metadata and checksums in `sources`.
- Treat web/general-content sources as lower trust and never as sole basis for urgent guidance.

## Update pipeline (server-controlled)

1. Build new `guardrails.db` offline from ETL jobs.
2. Compute SHA-256 for all bundles.
3. Produce `manifest.json` (same shape as `manifest.example.json`).
4. Sign manifest payload digest (`signature`).
5. Host `manifest.json` + bundles on your server.
6. App calls `planGuardrailsUpdate(manifestUrl)` and verifies before applying.

## Next implementation steps

1. Add persistent config key for `guardrailsManifestUrl` in app settings.
2. Add `Check for updates` button to trigger `planGuardrailsUpdate`.
3. Add bundle download + hash verification + atomic DB swap.
4. Add runtime guardrail evaluator:
   - Topic gate
   - Red-flag escalation
   - Triage rule evaluation
   - Medication contraindication checks
