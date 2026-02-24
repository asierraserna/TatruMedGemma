# Copilot Instructions for GemmaMed-Help

## Project Overview
This project is a React Native mobile application built with Expo for the "MedGemma Impact Challenge". The app, tentatively named "GemmaMed-Help", is designed to be a first-step triage tool for users unsure if their symptoms warrant a doctor's visit, thereby reducing congestion in healthcare systems.

## Core Technologies
- **Framework:** React Native with Expo (Managed Workflow preferred).
- **Language:** TypeScript.
- **AI/ML:** 
    - **Local/Edge AI:** Integration of smaller, quantized versions of MedGemma (or similar HAI-DEF models) for offline-first capabilities.
    - **Cloud AI:** Fallback to larger, server-side MedGemma models for complex cases when online.
- **Navigation:** React Navigation (Stack/Tabs).
- **State Management:** (To be decided, e.g., Zustand/Redux Toolkit/Context API - default to Context/Zustand for simplicity initially).
- **Storage:** Local storage for chat history/images (e.g., MMKV, AsyncStorage, or SQLite).
- **Media:** Expo Camera, Expo Image Picker, Expo AV (Audio).

## Key Features & Requirements
1.  **Chat Interface:** A conversational UI similar to standard messaging apps.
    -   Support for text input.
    -   Support for voice input (Speech-to-Text).
    -   Support for image input (Camera/Gallery).
    -   Historical chat tracking (locally stored/retrievable).
2.  **Offline-First Architecture:** The app must function initially without internet, using an on-device LLM.
3.  **Medical Triage/Advice:**
    -   Analyze inputs (symptoms, images) to provide "pre-diagnostic" guidance.
    -   Advice on whether to visit a doctor, urgent care, or ER.
    -   Capability to generate a summary/report for sharing with healthcare providers.
4.  **Emergency Features:**
    -   Quick access to local emergency services.
    -   Geolocation (GPS) sharing for emergency response.
    -   Text-to-Speech (TTS) for making emergency calls on behalf of the user (Advanced/Future Scope).

## Coding Standards
-   Use functional components and Hooks.
-   Follow TypeScript best practices (strict typing).
-   Use Expo libraries whenever possible.
-   Prioritize accessibility and clear UI/UX for potentially distressed users.
-   Ensure privacy and data security (local-first data handling).

## Competition Specifics
-   Target Track: **The Edge AI Prize** (running effectively on local devices).
-   Must use **MedGemma** or **HAI-DEF** models.
-   No notebook submission required (app code + writeup + video).

## Workflow
-   Development is organized by Epics in the `backlog/` folder.
-   Each Epic contains specific User Stories.
-   Focus on MVP features first: Text chat, Offline Local LLM.
