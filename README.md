# TatruMedGemma

A multi‑connection medical assistant prototype created for the [Kaggle
MedGemma Impact Challenge](https://www.kaggle.com/competitions/med-gemma-impact-challenge/overview).
The codebase demonstrates on‑device, LAN and online inference with a
privacy‑focused UI.

## Key features

- Text-based conversation with a medical‑domain LLM.
- Analysis of medical images (X‑rays, MRIs) alongside text prompts.
- Text‑to‑speech support for model responses.
- Fully configurable guardrails and inference endpoints.
- Three operating modes: **Offline** (local GGUF model), **LAN**
  (Flask/Ollama), **Online** (Gradio demo).
- Conversations never leave the device unless explicitly exported — no
  backend storage.
- Configurable download URLs for models (Hugging Face default).
- Future roadmap: voice/audio input, enhanced download reliability.

## Distributed intelligence architecture

TatruMedGemma is built on a three‑tiered distributed design that lets
users choose the right balance of privacy, power, and availability.

### Tier 1: Privacy‑First Edge (On‑Device)
- **Model:** MedGemma 1.5 4B (quantized)
- **Engine:** Ollama Mobile Runtime
- **Scope:** Text‑only triage
- **Value:** Zero‑latency, 100 % offline. Ensures that basic medical
  guidance is available even in regions with no internet connectivity.

### Tier 2: Clinical Resource Layer (LAN)
- **Models:** MedGemma 1.5 4B & 27 B
- **Engines:** Ollama (text) & Flask/Transformers (multimodal)
- **Scope:** Enhanced text & image analysis
- **Value:** Leverages local high‑performance workstations within a
  hospital’s secure Wi‑Fi. Keeps sensitive patient imagery (X‑rays,
  dermoscopy) inside the institutional firewall while providing 27B
  reasoning power.

### Tier 3: Global Scale Layer (Public Cloud)
- **Models:** MedGemma 1.5 4B & 27 B (quantized NF4)
- **Engines:** Hugging Face Spaces / Kaggle API
- **Scope:** Full multimodal reasoning
- **Value:** Offers a highly‑available “brain” for remote practitioners.
  NF4 quantization delivers 27B performance on accessible cloud
  hardware, ensuring no doctor is limited by their local equipment.

## Why this project?
Designed as a rapid prototype for the Kaggle competition, TatruMedGemma
showcases a hybrid architecture that keeps sensitive data in the user’s
control while still allowing cloud‑based experimentation. It also
provides quantization notebooks, a Flask API, and an Expo‑based mobile
app with native prebuilds.



## Quick start

### 1. Clone repository
```sh
git clone https://github.com/<your-org>/TatruMedGemma.git
cd TatruMedGemma
```

### 2. Prerequisites
- **Conda environment (`medgemma2`)** with Python 3.10 (see
  `requirements-api.txt`).
- **Ollama** for LAN mode: `ollama pull MedAIBase/MedGemma1.5:4b-it`.
- Expo CLI and Android/iOS tooling for mobile front end.

### 3. Running the system

#### Offline device mode
1. In `TatruMedGemmaApp`, install npm packages and run the app
   (`npx expo start`).
2. In settings, download a GGUF model or supply your own URL.
3. Switch inference provider to **Device** and pick fast/balanced/quality
   mode.

#### LAN mode (Flask + Ollama)
```sh
cd MedGemmaFlaskAPI
LOCAL_MODEL_DIR=./quant-medgemma python api_stable.py
```
Point the mobile/web client at `http://<hostname>:5000`.

#### Online prototype
Open the Kaggle notebook linked above or run `MedGemmaFlaskAPI/api.py`
against an online model.

## Development notes
- Quantization workflow resides in
  `MedGemmaFlaskAPI/MedGemma v2.ipynb`.
- Mobile/native code is under `TatruMedGemmaApp`; the llama binding lives
  in `services/inference/providers/deviceProvider.ts`.
- Guardrail configuration helpers are located in
  `TatruMedGemmaApp/services/guardrails`.

## Privacy
All conversation data stays locally on the device; nothing is sent to any
For developer setup and the full Conda package list, see [CONDA_SETUP.md](CONDA_SETUP.md). For detailed privacy practices, see [PRIVACY.md](PRIVACY.md).