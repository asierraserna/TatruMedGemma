# Epic 4: Medical Integration & Emergency Services

## Overview
Features for escalating care, sharing information with doctors, and accessing emergency services.

## User Stories

### US4.1: Generate Medical Summary
**As a** user,
**I want** to generate a concise summary of my chat and symptoms,
**So that** I can easily share it with my doctor or specialist.

### US4.2: Local Emergency Services Database
**As a** user,
**I want** the app to display contact information for local emergency services based on my location,
**So that** I can quickly call for help.

### US4.3: Share Geolocation
**As a** user,
**I want** my precise location coordinates to be available,
**So that** I can provide them to emergency responders if needed.

### US4.4: Text-to-Speech Assist (Advanced)
**As a** user,
**I want** the app to read chat/LLM responses aloud,
**So that** I can listen to advice instead of reading it (useful when multitasking or impaired).

## Progress

- ⬜ US4.1: Summary generator UI not yet built; server-side snippet exists.
- ⬜ US4.2: No local database integrated yet.
- ⬜ US4.3: Geolocation permission and retrieval code available in utility module but not surfaced.
- 🟡 US4.4: Basic TTS button implemented in chat bubbles; integration tested. Further polish (pause/stop, settings) still pending.

*These features are planned for a later milestone once core chat/offline is solid.*

