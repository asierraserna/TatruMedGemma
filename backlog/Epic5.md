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
- ✅ Device provider complete: offline inference works end‑to‑end with history trimming, speed modes (fast/balanced/quality), and UI integration.
- ✅ Multimodal image input in chat (camera/gallery attachment + render in transcript).
- ✅ MedSigLIP LAN configuration fields (enable flag + endpoint/model/path).
- ✅ MedASR LAN configuration fields (enable flag + endpoint/model/path).
- 🟡 MedSigLIP routing (partial): optional pre-analysis is wired and augments MedGemma prompt when endpoint is available; robust endpoint standardization remains pending.
- 🟡 MedASR routing (partial): configuration and architectural path are in place; audio capture/transcription UI flow remains pending.
- ✅ Guardrails data scaffold: SQLite schema + signed update manifest contract + TypeScript update service/types.
