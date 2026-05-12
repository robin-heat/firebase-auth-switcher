# Firebase Auth Switcher

A Chrome extension for switching between users in the [Firebase Auth Emulator](https://firebase.google.com/docs/emulator-suite/connect_auth) with one click — no code changes to your app needed.

![Extension popup showing user list](docs/screenshot.png)

## What it does

- Lists all users in your local Firebase Auth Emulator
- Switches the active session to any user by writing auth state directly to IndexedDB
- Shows which user is currently logged in, with a one-click logout
- Searches users by email, display name, or UID

## Prerequisites

- A web app running with the Firebase Auth Emulator (`connectAuthEmulator` must be called)
- The emulator running locally (default: `localhost:9099`)
- Chrome with Developer Mode enabled

## Installation

1. Clone this repo and install dependencies:
   ```bash
   git clone <repo-url>
   cd firebase-auth-switcher
   npm install
   ```

2. Build the extension:
   ```bash
   npm run build
   ```

3. Load in Chrome:
   - Open `chrome://extensions`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked** → select the `dist/` folder

## Configuration

Click the ⚙ icon in the popup to open Settings:

| Field | Description | Example |
|-------|-------------|---------|
| Host | Emulator host | `localhost` |
| Port | Emulator auth port | `9099` |
| Project ID | Firebase project ID used by the emulator | `demo-my-project` |
| Firebase API Key | The `apiKey` from your app's `firebaseConfig` | `demo-api-key` |

The **Firebase API Key** must match `apiKey` in your app's `initializeApp()` call — this is how Firebase identifies the auth state in IndexedDB. For emulator-only projects it's often a placeholder like `demo-api-key`.

## Usage

1. Start your Firebase Auth Emulator and web app
2. Open the extension popup from the Chrome toolbar
3. Select a user and click **Switch** — the page reloads with that user logged in
4. Click **Logout** on the highlighted current user to sign out

## How it works

The Firebase JS SDK persists auth state in IndexedDB (`firebaseLocalStorageDb`) under the key `firebase:authUser:{apiKey}:[DEFAULT]`. This extension:

1. Fetches users from the emulator's REST API (`accounts:batchGet`)
2. Forges a custom token JWT (the emulator doesn't validate signatures)
3. Exchanges it for a real ID token via `accounts:signInWithCustomToken`
4. Writes the auth state to the page's IndexedDB via `chrome.scripting.executeScript`
5. Reloads the page — Firebase picks up the new state on init

No changes to your app's code are required.

## Development

```bash
npm test          # run tests
npm run build     # build to dist/
npm run dev       # watch mode (rebuilds on save)
```

Tests use Vitest + Testing Library + fake-indexeddb. The Chrome API is mocked in `src/__mocks__/chrome.ts`.

## Project structure

```
src/
  lib/
    types.ts            — shared interfaces (Config, EmulatorUser, AuthState)
    storage.ts          — chrome.storage.local wrapper
    token-forge.ts      — fake custom token JWT
    emulator-client.ts  — listUsers, getIdToken via emulator REST
    indexeddb.ts        — read/write/clear Firebase auth state
  background/
    service-worker.ts   — handles SWITCH_USER, GET_CURRENT_USER, SIGN_OUT
  content/
    auth-injector.ts    — injected functions for IndexedDB access
  popup/
    App.tsx             — main popup UI
    components/         — Header, UserBanner, UserList, UserRow, SearchInput
  settings/
    Settings.tsx        — host/port/projectId/apiKey configuration form
```
