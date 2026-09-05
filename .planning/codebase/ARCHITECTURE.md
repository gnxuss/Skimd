<!-- refreshed: 2026-09-05 -->
# Architecture

**Analysis Date:** 2026-09-05

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                  Chrome Manifest V3 extension                │
├──────────────────┬──────────────────┬───────────────────────┤
│ React popup UI   │ Popup feature    │ Background service     │
│ `src/popup/`     │ hooks/views      │ worker `src/background/`│
│                  │ `src/features/`  │                       │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Shared browser/provider adapters                             │
│ `src/shared/youtube.js`, `src/shared/player.js`, `groq.js`   │
└───────────────┬──────────────────────────┬──────────────────┘
                │                          │
                ▼                          ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│ YouTube tab MAIN world    │  │ Groq HTTPS API                │
│ executeScript + Innertube │  │ `api.groq.com`                │
└──────────────────────────┘  └──────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ Chrome storage: local API key, sync video/theme, session     │
│ summary cache and keyboard-shortcut handoff                  │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Popup bootstrap | Mounts React and global styles | `skimd-extension/src/popup/main.jsx` |
| Popup shell | Owns active tab, settings overlay, theme, shared transcript/timeline state, and shortcut trigger | `skimd-extension/src/popup/App.jsx` |
| Transcript feature | Resolves the current video, fetches transcript state, renders cues, tracks playback, and seeks | `skimd-extension/src/features/transcript/useTranscript.js`, `skimd-extension/src/features/transcript/TranscriptView.jsx` |
| Timeline feature | Fetches chapters and renders clickable chapter rows | `skimd-extension/src/features/timeline/useTimeline.js`, `skimd-extension/src/features/timeline/TimelineView.jsx` |
| Summary feature | Generates/caches three Groq formats and renders formatted output/export controls | `skimd-extension/src/features/summary/useSummary.js`, `skimd-extension/src/features/summary/SummaryPanel.jsx` |
| Settings feature | Validates, persists, and clears the user Groq key | `skimd-extension/src/features/settings/useApiKey.js`, `skimd-extension/src/features/settings/SettingsPanel.jsx` |
| YouTube adapter | Finds the active watch tab; injects transcript/chapter retrieval into YouTube MAIN world | `skimd-extension/src/shared/youtube.js` |
| Player adapter | Injects seek/current-time operations into the active tab | `skimd-extension/src/shared/player.js` |
| Groq adapter | Calls chat completions, retries 429s, maps provider failures to error codes | `skimd-extension/src/shared/groq.js` |
| Service worker | Handles command shortcut, keepalive alarm, tab video tracking, and session-cache cleanup | `skimd-extension/src/background/service-worker.js` |
| Content script | Declares the YouTube-page script entry; contains no active message/data logic | `skimd-extension/src/content/index.js` |

## Pattern Overview

**Overall:** Feature-oriented React composition with small shared browser/provider adapters inside a client-only MV3 extension.

**Key Characteristics:**
- `App` lifts transcript and timeline hooks so multiple views reuse one fetch per popup instance.
- Feature hooks own asynchronous state and expose data/actions to presentational views.
- Browser-only operations are isolated in `src/shared/` and use Chrome APIs or page-context injection.
- There is no Skimd backend or application database; credentials and transient state remain in Chrome storage.

## Layers

**Extension entry/configuration:**
- Purpose: Define Chrome entry points, permissions, popup shell, and Vite multi-entry output.
- Location: `skimd-extension/public/manifest.json`, `skimd-extension/popup.html`, `skimd-extension/vite.config.js`
- Contains: MV3 manifest, popup HTML/bootstrap, build inputs.
- Depends on: Chrome extension runtime and Vite.
- Used by: Chrome loading the unpacked/built extension.

**Popup composition/UI:**
- Purpose: Render the 400×560 popup and coordinate feature state.
- Location: `skimd-extension/src/popup/`, `skimd-extension/src/features/`, `skimd-extension/src/shared/components/`
- Contains: React components, feature hooks, loading/empty/error states.
- Depends on: Shared adapters and Chrome storage.
- Used by: `skimd-extension/src/popup/main.jsx`.

**Provider/browser adapters:**
- Purpose: Encapsulate YouTube, Groq, player, storage, and theme side effects.
- Location: `skimd-extension/src/shared/`
- Contains: `youtube.js`, `groq.js`, `player.js`, and `hooks/useTheme.js`.
- Depends on: `chrome.*`, `fetch`, and active YouTube page DOM/context.
- Used by: Feature hooks and views.

**Background lifecycle:**
- Purpose: Process events that outlive the popup, without proxying transcript requests.
- Location: `skimd-extension/src/background/service-worker.js`
- Contains: command, alarm, tab update/removal listeners.
- Depends on: `chrome.commands`, `chrome.storage`, `chrome.action`, `chrome.tabs`, and `chrome.alarms`.
- Used by: Chrome event dispatch.

## Data Flow

### Primary Request Path

1. Chrome opens `skimd-extension/popup.html`, which mounts `App` through `skimd-extension/src/popup/main.jsx`.
2. `useTranscript` resolves a YouTube watch tab and video ID (`skimd-extension/src/features/transcript/useTranscript.js`).
3. `fetchTranscript` resolves the tab and calls `chrome.scripting.executeScript` with `world: 'MAIN'` (`skimd-extension/src/shared/youtube.js`).
4. The injected function reads `ytInitialPlayerResponse` or calls YouTube Innertube using the ANDROID client, fetches timed text, and parses XML-like cues without DOMParser.
5. Transcript state is lifted in `App` and supplied to `SummaryPanel` and `TranscriptView`.
6. `SummaryPanel` calls `useSummary`; three Groq requests run in parallel through `skimd-extension/src/shared/groq.js`, then results are cached in `chrome.storage.session` under tab/video-specific keys.

### Chapter and Playback Flow

1. `useTimeline(transcriptState.videoId)` invokes `fetchChapters` after video resolution (`skimd-extension/src/features/timeline/useTimeline.js`).
2. `chaptersInjected` extracts timestamp lines from `shortDescription`, deduplicates, and sorts chapters in `skimd-extension/src/shared/youtube.js`.
3. `TimelineView` calls `seekTo`; transcript rows call `seekVideo` directly (`skimd-extension/src/features/transcript/TranscriptView.jsx`).
4. `player.js` injects a function into the active tab to set `video.currentTime`; `usePlaybackTime` polls `getVideoTime` for active-cue highlighting.

### Settings and Shortcut Flow

1. `useApiKey` reads `groq_api_key` from `chrome.storage.local`, validates new values with `validateKey`, and persists only validated keys.
2. `useTheme` reads/writes `themeOverride` in `chrome.storage.sync` and toggles the root `dark` class; popup HTML also bootstraps paint colors before React mounts.
3. The service worker stores `autoSummarise` in session storage on the `summarise` command and attempts `chrome.action.openPopup` (`skimd-extension/src/background/service-worker.js`).
4. `App` consumes that flag/listens for the session change, selects Summary, and `SummaryPanel` auto-generates once transcript data is ready.

**State Management:**
- React `useState`, `useEffect`, `useRef`, and `useCallback` hold popup-local state.
- `chrome.storage.local` stores the API key; `sync` stores current video/theme; `session` stores shortcut handoff and summary cache.
- Async hooks use cancellation flags to avoid setting state after cleanup.

## Key Abstractions

**Injected page operation:**
- Purpose: Run network/DOM work from YouTube origin, avoiding extension-origin restrictions.
- Examples: `transcriptInjected` and `chaptersInjected` in `skimd-extension/src/shared/youtube.js`.
- Pattern: Self-contained functions passed to `chrome.scripting.executeScript`; do not rely on outer-scope variables.

**Feature hook state boundary:**
- Purpose: Keep loading/error/data transitions out of view components.
- Examples: `skimd-extension/src/features/transcript/useTranscript.js`, `skimd-extension/src/features/timeline/useTimeline.js`, `skimd-extension/src/features/summary/useSummary.js`.
- Pattern: Return plain state plus action callbacks; views render loading, empty, and error branches.

**Shared presentational primitives:**
- Purpose: Reuse controls and skeleton/error states.
- Examples: `skimd-extension/src/shared/components/Button.jsx`, `ErrorBanner.jsx`, and `*Skeleton.jsx`.
- Pattern: Small default-export React components styled with Tailwind utility classes.

## Entry Points

**Popup:**
- Location: `skimd-extension/popup.html` → `skimd-extension/src/popup/main.jsx`
- Triggers: User clicks the extension action or shortcut opens the popup.
- Responsibilities: Render the full interactive UI and invoke feature adapters.

**Service worker:**
- Location: `skimd-extension/src/background/service-worker.js`
- Triggers: MV3 background load, command, install/startup, alarm, tab update/removal events.
- Responsibilities: Shortcut handoff, keepalive alarm, video ID sync, summary cache cleanup.

**Content script:**
- Location: `skimd-extension/src/content/index.js`
- Triggers: `https://www.youtube.com/*` content-script match in `skimd-extension/public/manifest.json`.
- Responsibilities: Currently no runtime behavior; YouTube retrieval is popup-driven.

## Architectural Constraints

- **Threading:** Event-driven browser contexts; popup React runs in its own short-lived document and service worker is lifecycle-managed by Chrome.
- **Global state:** Module-level `lastVideoIds` exists only in `skimd-extension/src/background/service-worker.js`; durable coordination uses Chrome storage.
- **Circular imports:** No circular dependency chain detected; feature views depend downward on hooks/shared adapters.
- **Page origin:** YouTube Innertube/timed-text calls must stay inside `world: 'MAIN'` injection in `skimd-extension/src/shared/youtube.js`.
- **Build shape:** `skimd-extension/vite.config.js` emits flat `popup.js`, `content-script.js`, and `service-worker.js` entries expected by the manifest.

## Anti-Patterns

### Service worker as YouTube proxy

**What happens:** Routing transcript/chapter retrieval through worker message passing would add a lifecycle-sensitive middle hop.
**Why it's wrong:** The current design explicitly avoids sleeping-worker/message-port failures and extension-origin 403s.
**Do this instead:** Call `fetchTranscript`/`fetchChapters` from popup feature hooks; keep injected functions in `skimd-extension/src/shared/youtube.js`.

### External state inside injected functions

**What happens:** An injected function references popup module variables or imports.
**Why it's wrong:** Chrome serializes the function into the page and cannot provide its closure/import graph.
**Do this instead:** Keep injected helpers self-contained and pass values through `args`, following `transcriptInjected` in `skimd-extension/src/shared/youtube.js`.

## Error Handling

**Strategy:** Adapters throw coded `Error` objects; hooks convert them into `{ code, message/error }`; views render `ErrorBanner` or purpose-specific empty states.

**Patterns:**
- `youtube.js` maps injection failures to `TRANSCRIPT_ERROR` and returns explicit no-caption/no-chapter data.
- `groq.js` distinguishes `INVALID_KEY` from `GROQ_UNAVAILABLE`, retries HTTP 429 with bounded exponential backoff, and times out requests.
- UI components render skeletons while loading and explicit not-YouTube, no-caption, no-chapter, and provider-error branches.

## Cross-Cutting Concerns

**Logging:** Development-oriented `console.log` diagnostics in `skimd-extension/src/shared/youtube.js`, `groq.js`, and transcript hook; no logging framework.
**Validation:** Video/tab resolution and provider response checks live in adapters; API key validation is a live minimal Groq request in `skimd-extension/src/shared/groq.js`.
**Authentication:** The user supplies a Groq key stored locally; it is sent directly as a Bearer token to `api.groq.com`, with no Skimd backend.

---

*Architecture analysis: 2026-09-05*
