# External Integrations

**Analysis Date:** 2026-09-05

## APIs & External Services

**AI summarisation:**
- Groq OpenAI-compatible Chat Completions API - validates a user key and generates paragraph, bullets, and TLDR summaries from the fetched transcript.
  - SDK/Client: Native `fetch`; endpoint and model are defined in `skimd-extension/src/shared/groq.js`.
  - Auth: Runtime `Authorization: Bearer ${apiKey}` header from `chrome.storage.local` key `groq_api_key`; no environment key is read (`skimd-extension/src/features/settings/useApiKey.js`).
  - Model: `meta-llama/llama-4-scout-17b-16e-instruct`; requests use temperature `0.4`, max tokens `512`, a 30-second abort timeout, and up to three retries for HTTP 429 (`skimd-extension/src/shared/groq.js`).

**YouTube data:**
- YouTube Innertube Player API - obtains player metadata and caption tracks using the ANDROID client context from code injected into the YouTube page (`skimd-extension/src/shared/youtube.js`).
  - SDK/Client: Native `fetch` inside `chrome.scripting.executeScript({ world: 'MAIN' })`; URL is `https://www.youtube.com/youtubei/v1/player?prettyPrint=false`.
  - Auth: The request runs in the `youtube.com` page context and relies on the user's YouTube session/page state; no API key or OAuth client is configured.
- YouTube timed-text caption endpoint - fetched from each selected caption track's `baseUrl`, parsed with a CSP-safe XML/string parser into timestamped cues (`skimd-extension/src/shared/youtube.js`).
- YouTube page metadata - first uses `window.ytInitialPlayerResponse` when available, then falls back to Innertube; chapter timestamps are parsed from `videoDetails.shortDescription` (`skimd-extension/src/shared/youtube.js`).

## Data Storage

**Databases:**
- None. There is no server database or persistence service; browser storage is used instead.

**File Storage:**
- Local browser download only: summaries are exported as `text/plain` `.txt` blobs using `Blob`, object URLs, and an anchor click in `skimd-extension/src/features/export/ExportControls.jsx`.

**Caching:**
- Chrome session storage (`chrome.storage.session`) caches summaries under `summary_{tabId}_{videoId}` and carries the keyboard-triggered `autoSummarise` flag (`skimd-extension/src/features/summary/useSummary.js`, `skimd-extension/src/popup/App.jsx`, `skimd-extension/src/background/service-worker.js`).

## Authentication & Identity

**Auth Provider:**
- No user-account provider. The extension is client-side and gates the popup on a user-provided Groq API key.
  - Implementation: `skimd-extension/src/features/settings/useApiKey.js` reads/writes `chrome.storage.local`, calls `validateKey()` against Groq before saving, and supports clearing the key. The key is sent directly to Groq from `skimd-extension/src/shared/groq.js`.
- YouTube identity is implicit browser session access in the YouTube tab; no Skimd identity or token exchange is implemented (`skimd-extension/src/shared/youtube.js`).

## Monitoring & Observability

**Error Tracking:**
- None detected. Errors are surfaced through React state and UI banners; there is no Sentry or remote telemetry dependency (`skimd-extension/src/shared/groq.js`, `skimd-extension/src/features/transcript/useTranscript.js`).

**Logs:**
- Browser console logging only, primarily prefixed `[Skimd]` for Groq rate-limit retries, script failures, transcript/chapter responses, and transcript errors (`skimd-extension/src/shared/groq.js`, `skimd-extension/src/shared/youtube.js`, `skimd-extension/src/shared/player.js`, `skimd-extension/src/features/transcript/useTranscript.js`).

## CI/CD & Deployment

**Hosting:**
- No application hosting or Skimd backend. The deliverable is the static `skimd-extension/dist/` browser-extension bundle produced by Vite.

**CI Pipeline:**
- None detected. Local commands are defined in `skimd-extension/package.json`; no workflow or deployment configuration is present in the repository.

## Environment Configuration

**Required env vars:**
- None detected for runtime operation. The user must enter a Groq API key in the extension UI; it is stored locally as `groq_api_key` (`skimd-extension/src/features/settings/useApiKey.js`).
- `.env`, `.env.development`, and `.env.production` exist under `skimd-extension/`; values were not inspected because they are forbidden secret/config files.

**Secrets location:**
- User Groq API key: Chrome local extension storage, key `groq_api_key`; it is not committed as source and is removed by the settings clear action (`skimd-extension/src/features/settings/useApiKey.js`).

## Webhooks & Callbacks

**Incoming:**
- None. No HTTP server or webhook endpoint exists.

**Outgoing:**
- HTTPS POST to Groq Chat Completions (`skimd-extension/src/shared/groq.js`).
- HTTPS POST to YouTube Innertube Player and HTTPS GET to caption `baseUrl` values, both issued from the YouTube page context (`skimd-extension/src/shared/youtube.js`).
- Browser-internal callbacks/events: Manifest command `summarise`, tab update/removal, lifecycle, and alarms in `skimd-extension/src/background/service-worker.js`; storage change listener in `skimd-extension/src/popup/App.jsx`.

---

*Integration audit: 2026-09-05*
