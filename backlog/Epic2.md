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
