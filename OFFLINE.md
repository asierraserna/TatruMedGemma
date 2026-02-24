# Offline On-Device LLM Plan (TatruMedGemma)

## Goal

Enable Android offline inference using GGUF + llama.cpp while keeping Expo app workflows and existing provider routing.

---

## Decisions (for speed)

1. Runtime: **llama.cpp**
2. RN binding for first implementation: **react-native-llama** (fastest path to first APK)
3. Packaging: **Expo prebuild (Bare Expo) + EAS Build**
4. Model source default: **Hugging Face direct resolve URL** (already configurable in app settings)

---

## Current Status (already done)

- On-device GGUF URL and mmproj URL are configurable and persisted in app settings.
- Default source points to Hugging Face direct links.
- Existing inference provider abstraction already includes `device` mode.

---

## Phase 1 — Prebuild Foundation (safe first step)

### 1) Create a working branch

```bash
git checkout -b feat/offline-llama-android
```

### 2) Sanity check Expo project

```bash
cd TatruMedGemmaApp
npx expo doctor
```

Fix critical issues only.

### 3) Generate native projects

```bash
npx expo prebuild
```

Expected output:

- `TatruMedGemmaApp/android/`
- `TatruMedGemmaApp/ios/`

### 4) Verify build still works before native LLM integration

```bash
npx expo run:android
```

If this fails, do not continue to llama integration until green.

---

## Phase 2 — Bring in llama.cpp via RN binding

### 5) Install binding

```bash
npm i react-native-llama
```

Then run prebuild sync again if needed:

```bash
npx expo prebuild
```

### 6) Android build test with binding linked

```bash
npx expo run:android
```

Goal: app launches with native binding present (even before model load).

---

## Phase 3 — Device Provider wiring (MVP)

### 7) Implement minimal `deviceProvider` flow

In `TatruMedGemmaApp/services/inference/providers/deviceProvider.ts`:

- initialize llama runtime
- load GGUF from local file path
- run text generation
- return full text response

Keep this first version text-only.

### 8) Add on-device model file manager service

Create service under `TatruMedGemmaApp/services/inference/` for:

- download from configured `ggufUrl`
- optional `mmprojUrl` download
- resumable download
- checksum hook (optional in MVP, required before production)
- local path resolution (`FileSystem.documentDirectory/...`)

### 9) Add UX states for offline model lifecycle

In settings/chat UX, surface:

- Not downloaded
- Downloading (progress)
- Ready
- Error

Also expose a **fast/balanced/quality** toggle for the device provider in Settings.  Note that “fast mode” only applies when the app is running offline with a local model – it has no effect on cloud/lan/kaggle inference and should be greyed‑out or hidden otherwise.  Include a brief explanatory line so users understand why the option exists and when it’s active.

---

## Phase 4 — Validate + ship criteria

## MVP acceptance criteria

- Device mode can download GGUF from default HF URL without login.
- Device mode loads model and returns text response offline.
- App remains functional in LAN/Cloud/Kaggle modes.
- No crashes during 3 consecutive prompt runs on target Android phone.

## Production-ready criteria (next)

- Resume-safe large downloads
- SHA256 verification
- cancellation and timeout handling
- memory-based fallback policy (disable vision on low RAM)

---

## Risks and mitigations

1. **Large model download failures**
	- Mitigation: resumable download + retry + clear user messaging.

2. **Device RAM limits**
	- Mitigation: default to Q4_K_S text path; gate vision by capability.

3. **Native build friction after prebuild**
	- Mitigation: verify plain prebuild app first, then add one native change at a time.

---

## Why llama.cpp here?

For your goal (quick offline prototype + Android deploy), llama.cpp is the most practical path:

- mature GGUF ecosystem
- mobile-focused quantized models
- straightforward JNI-backed RN bindings
- easiest route to fast iteration before deeper optimization

---

## Immediate next action

Run Phase 1 now (`expo doctor` → `expo prebuild` → `expo run:android`) and only then start Phase 2 integration.

