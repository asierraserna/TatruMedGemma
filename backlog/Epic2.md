# Epic 2: Core Chat & Offline AI Integration

## Overview
Develop the primary chat interface and integrate a local LLM (e.g., quantized MedGemma) for offline-first capabilities.

## User Stories

### US2.1: Implement Chat UI
**As a** user,
**I want** a chat interface where I can type messages and receive responses,
**So that** I can communicate my symptoms clearly.

### US2.2: Integrate Local LLM (Edge AI)
**As a** user,
**I want** the app to process my text locally using a lightweight MedGemma model,
**So that** I can get immediate advice without an internet connection.

### US2.3: Manage Chat Sessions/History
**As a** user,
**I want** to view a list of my past chat sessions and resume them,
**So that** I can track the progression of my symptoms.

### US2.4: Implement Cloud Fallback Logic
**As a** user,
**I want** the option to escalate my query to a more powerful online model if the local one is unsure,
**So that** I get the most accurate medical advice possible.

### US2.5: Quantization & Model Packaging
**As a** developer,
**I want** a reproducible notebook/workflow that produces a quantized MedGemma model suitable for mobile inference,
**So that** the offline mode uses a small, fast model and can be bundled with the app or downloaded at runtime.

## Progress

- ✅ US2.1 Chat UI implemented in React Native; messages render and user input is stored.
- ✅ US2.2 Local LLM wired through provider abstraction; current prototype uses LAN Ollama service with the quantized model and offline flag handled in settings.
- ✅ US2.3 Chat history persists using local storage (async/SQLite) and can be resumed.
- ✅ US2.4 Cloud fallback logic exists in the inference router; switching happens automatically when LAN is unreachable.
- 🟡 US2.5 Quantization notebook (`MedGemma v2.ipynb`) produces `quant-medgemma/` artifacts; need to bundle model and add verification in app.

**Next steps:**
1. Surface an explicit “offline” inference mode that loads a model packaged with the app or downloaded via Wi‑Fi.
2. Add integrity checks and size metadata for the quantized model.  
3. Update documentation/README with offline build instructions (already begun above).

