# Privacy Policy for TatruMedGemma

This document describes the privacy practices for the TatruMedGemma
application and related components (mobile app, Flask API, notebooks). It
is intended to support app store listings and inform users about how
data is handled.

## No Remote Data Collection

- **Conversations** are stored only on the device. There is *no* backend
  server collecting, analyzing, or storing chat history by default.
- If the app is configured to connect to a LAN server (Flask/Ollama) or
  an online endpoint, the data transmitted is the conversation text and
  any images you explicitly send. Those external services are not under
  the control of this app and users should review their privacy terms.

## Models and Downloads

- Model files (GGUF, MMProj) are downloaded from URLs you configure
  (default: Hugging Face). The app only stores these files locally in
  the device’s storage for offline inference.
- No metadata about the downloads is shared with any third party by the
  app. Network requests are made solely to the host you specify.

## Local Storage

- Settings, guardrail configurations, and cached conversation history
  are stored using the device’s secure local storage mechanisms.
- You can clear all stored data from the app at any time using the
  provided "clear cache" options in settings.
- Uninstalling the app removes all stored conversations and downloaded
  models.

## Images and Media

- Images you upload for medical analysis remain on-device unless you
  choose to export or share them manually.
- The app does not access your camera, microphone, or photo library
  except when you explicitly permit it for image insertion or future
  voice features.

## Third‑Party Services

- The mobile client uses Expo and standard analytics may be enabled by
  them; however, the TatruMedGemma code does not send any analytics
  events or personal information.
- When using the Kaggle/Gradio online prototype, data goes through those
  platforms and is subject to their privacy policies.

## Future Features

- **Voice/audio input** will require microphone permission; recordings
  will be processed locally. No audio will be uploaded unless you
  explicitly send it through an external provider.

## Contact and Questions

For questions about this privacy policy or data handling, please
contact the project maintainers via the GitHub repository.

---

This policy is provided for informational purposes and may be updated as
features evolve. Always review the latest version before publishing to
an app store or sharing with users.