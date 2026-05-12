# Privacy Policy

**Firebase Auth Switcher** is a developer tool for use with the Firebase Auth Emulator. It does not collect, store, transmit, or share any personal data.

## Data handled locally

- **Emulator configuration** (host, port, project ID, Firebase API key) is stored locally in Chrome's `chrome.storage.local` and never leaves your device.
- **Auth tokens** obtained from the local Firebase Auth Emulator are written directly into the active tab's IndexedDB. They are not logged, transmitted, or retained by the extension.

## No external communication

The extension communicates only with the Firebase Auth Emulator running on your local machine (`localhost` / `127.0.0.1`). No data is sent to any remote server.

## No analytics or tracking

This extension contains no analytics, crash reporting, or tracking of any kind.

## Contact

For questions, open an issue at https://github.com/robin-heat/firebase-auth-switcher
