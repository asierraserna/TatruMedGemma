# Epic 5: Multi-Tier AI Services (Device, LAN, Cloud)

## Overview
Implement a three-level inference architecture so users can run MedGemma on-device (future native runtime), via LAN Ollama, or via a cloud endpoint, with clear mode selection and connectivity status.

## User Stories

### US5.1: Select Inference Mode
**As a** user,
**I want** to choose between On-device, LAN, and Cloud modes,
**So that** I can balance privacy, speed, and capability.

### US5.2: Route Chat Through Active Provider
**As a** user,
**I want** chat responses to use my selected mode automatically,
**So that** I get consistent behavior without manual endpoint switching.

### US5.3: Persist Provider Settings
**As a** user,
**I want** my provider settings (LAN URL/model, cloud endpoint/model/key, device model metadata) to persist,
**So that** I do not reconfigure the app every time.

### US5.4: Provider Health Visibility
**As a** user,
**I want** a connection status indicator for the active provider,
**So that** I know whether the selected service is currently reachable.

### US5.5: On-Device Runtime Foundation
**As a** developer,
**I want** an explicit on-device provider abstraction and fallback behavior,
**So that** native inference integration can be added safely without rewriting chat flows.

(Fulfilled – local provider now loads GGUF files, performs textgen via llama.rn, and is selectable alongside LAN/Cloud.)

### US5.6: Curated MedGemma Catalog
**As a** user,
**I want** to browse supported MedGemma variants with size and compatibility metadata,
**So that** I can pick a model my phone can handle.

### US5.7: Model Download and Verification
**As a** user,
**I want** resumable model downloads with integrity checks,
**So that** local model setup is reliable and safe.

(Basic resumable download & manifest logic now implemented; checksum verification remains for production.)

### US5.8: Cloud Failover Policy
**As a** user,
**I want** optional fallback from Device/LAN to Cloud when local inference is unavailable,
**So that** I can still receive responses during interruptions.

### US5.9: Bug Fix
**As a** user,
**I want** the app to handle errors related to OOM (Out of Memory) on LLM inference  gracefully
**So that** I can continue using the app without crashes.
Link to issue: https://github.com/asierraserna/TatruMedGemma/issues/5
#### Technical notes (OOM mitigation)
On‑device runtime is sensitive to available RAM; when the llama context is
created the native library may allocate hundreds of megabytes and the
kernel will kill the process if the device is low on memory.  To prevent
silent crashes the provider now applies conservative defaults and checks
for insufficient memory before initialisation.

A new client-side warning appears in Settings and when switching to device
mode if `NativeModules.PlatformConstants.totalMemory` reports under the
minimum threshold.  This alerts users on smaller phones (typically <3 GB)
that on-device inference may not work reliably and suggests LAN/cloud as
alternatives.

```ts
// tuned parameters (now exposed as editable values in Settings; formerly just fast/balanced/quality presets)
const DEVICE_N_CTX = 768;
const DEVICE_N_PREDICT = 384;
const context = await llamaModule.initLlama({
  model: modelUri,
  n_ctx: DEVICE_N_CTX,
  n_predict: DEVICE_N_PREDICT,
  n_batch: 64,           // lower working set from original 256
  n_gpu_layers: 0,
  use_mlock: false,      // disable page locking (often causes OOM)
});
```

A pre‑flight memory probe uses `NativeModules.PlatformConstants.totalMemory`
(if available) plus an experimental `/proc/meminfo` lookup to get the
*available* RAM.  The threshold was raised to 5 GB and the error path now
fires if either total or free memory is below that number.  This helps
catch cases where the OS has already consumed most of the physical RAM.
## Initial Delivery Scope (MVP)
- Provider abstraction and router.
- LAN provider (Ollama) integration.
- Cloud provider (OpenAI-compatible API) integration.
- Device provider placeholder with clear runtime-required message.
- Persisted inference mode and provider settings.
- Active-provider status shown on home screen.

## Progress Snapshot
- ✅ US5.1 Select Inference Mode (implemented with in-app settings).
- ✅ US5.2 Route Chat Through Active Provider (implemented).
- ✅ US5.3 Persist Provider Settings (implemented with editable runtime UI).
- ✅ US5.4 Provider Health Visibility (implemented).
- 🟢 US5.7 Model Download and Verification (partial → mostly done): on-device GGUF/`mmproj` downloads now support resumable progress, space checking, manifest validation, **cancel (AbortController)**, and **clear files (with confirmation)**; only SHA256 check is pending.
- ✅ Device provider complete: offline inference works end‑to‑end with history trimming, speed modes (fast/balanced/quality), and UI integration (user can now tweak n_ctx, n_batch and mlock flag in settings).  Memory pre‑flight now checks for ≥5 GB free RAM using `/proc/meminfo` and the download flow warns about OOM risk.
- ✅ Chat screen expo issue #6 resolved: input area now sits above the keyboard on both iOS and Android. Separate KeyboardAvoidingView wraps the composer, and message list has bottom padding so the keyboard can slide without covering text.
- ✅ Multimodal image input in chat (camera/gallery attachment + render in transcript).
- ✅ MedSigLIP LAN configuration fields (enable flag + endpoint/model/path).
- ✅ MedASR LAN configuration fields (enable flag + endpoint/model/path).
- 🟡 MedSigLIP routing (partial): optional pre-analysis is wired and augments MedGemma prompt when endpoint is available; robust endpoint standardization remains pending.
- 🟡 MedASR routing (partial): configuration and architectural path are in place; audio capture/transcription UI flow remains pending.
- ✅ Guardrails data scaffold: SQLite schema + signed update manifest contract + TypeScript update service/types.
