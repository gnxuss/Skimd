# Codebase Concerns

**Analysis Date:** 2026-09-05

## Tech Debt

**Lint configuration does not recognize extension globals:**
- Issue: ESLint is configured with `globals.browser`, but Chrome extension APIs and the Node-style `__dirname` used by Vite are not declared. `npm --prefix skimd-extension run lint` exits with 40 `no-undef` errors across the source and `vite.config.js`.
- Files: `skimd-extension/eslint.config.js`, `skimd-extension/src/background/service-worker.js`, `skimd-extension/src/shared/youtube.js`, `skimd-extension/vite.config.js`
- Impact: CI or release checks cannot use the lint script as a quality gate, and genuine undefined-variable defects can be hidden among expected extension-global errors.
- Fix approach: Add explicit `chrome`/extension globals for extension files and a Node environment for Vite config (or migrate the config to `import.meta.dirname`), then make lint part of the build verification path.

**Duplicated tab/video resolution:**
- Issue: `useTranscript` resolves one tab/video, while `fetchTranscript` and `fetchChapters` independently query tabs again; player helpers independently query the active tab.
- Files: `skimd-extension/src/features/transcript/useTranscript.js`, `skimd-extension/src/shared/youtube.js`, `skimd-extension/src/shared/player.js`
- Impact: Switching tabs or navigating while the popup is open can fetch data from one video and seek/read time from another. The stored global `videoId` fallback can make the mismatch harder to detect.
- Fix approach: Resolve and retain a specific tab ID/video ID snapshot, pass it through transcript, chapter, and player operations, and invalidate requests when the tab URL/video changes.

**In-flight summary requests are not cancellable or versioned:**
- Issue: `summariseAll` starts three independent requests and always applies their result after completion. It does not abort on unmount/video change or check that the transcript/video still matches.
- Files: `skimd-extension/src/features/summary/useSummary.js`
- Impact: A slow response from a prior video can overwrite the newly selected video's UI; regeneration can also leave stale requests consuming quota and updating state after the relevant view has changed.
- Fix approach: Use an `AbortController`/request sequence token, capture the video/transcript identity, ignore stale completions, and cancel sibling requests when one fails.

**Content script is shipped but empty:**
- Issue: The manifest injects `content-script.js` on every `https://www.youtube.com/*` page, but `skimd-extension/src/content/index.js` contains only comments. The implementation uses popup `executeScript` instead.
- Files: `skimd-extension/public/manifest.json`, `skimd-extension/src/content/index.js`, `skimd-extension/vite.config.js`
- Impact: Unnecessary page injection and an unexplained build artifact increase maintenance and review surface.
- Fix approach: Remove the content-script entry and manifest declaration if no page-side listener is required, or implement and document a real responsibility there.

**Documentation/setup surface is incomplete:**
- Issue: `skimd-extension/README.md` is the unmodified React/Vite starter text and does not document extension loading, API-key handling, supported pages, or manual QA.
- Files: `skimd-extension/README.md`, `PRD.md`
- Impact: Contributors cannot reliably build, load, or verify the MV3 extension; product definition-of-done manual verification is difficult to reproduce.
- Fix approach: Replace the starter README with project-specific setup, build, load-unpacked, permissions, and realistic verification instructions owned by `SETUP.md`/README as appropriate.

## Known Bugs

**Settings errors render as generic unknown errors:**
- Symptoms: `SettingsPanel` passes `message={...}` to `ErrorBanner`, but `ErrorBanner` only accepts `code` and maps codes internally. API validation failures therefore render the fallback “Something went wrong” message instead of the specific invalid-key/network message.
- Files: `skimd-extension/src/features/settings/SettingsPanel.jsx`, `skimd-extension/src/shared/components/ErrorBanner.jsx`
- Trigger: Enter an invalid or unreachable Groq key and save it.
- Workaround: None in the UI; inspect the API/network behavior externally.

**YouTube SPA navigation is not observed while popup remains open:**
- Symptoms: `useTranscript` runs only once on mount and the background tracker listens only for `tabs.onUpdated` with `changeInfo.status === 'complete'`. YouTube client-side watch-to-watch navigation may not produce that event.
- Files: `skimd-extension/src/features/transcript/useTranscript.js`, `skimd-extension/src/background/service-worker.js`, `skimd-extension/src/content/index.js`
- Trigger: Open the popup, navigate to another video in the same YouTube tab, then use the already-open popup.
- Workaround: Close and reopen the popup.

**Global synced video ID races across tabs:**
- Symptoms: `service-worker.js` writes a single `videoId` key to `chrome.storage.sync`; fallback readers use that key when URL parsing is unavailable. Any completed YouTube tab can replace it.
- Files: `skimd-extension/src/background/service-worker.js`, `skimd-extension/src/shared/youtube.js`, `skimd-extension/src/features/transcript/useTranscript.js`
- Trigger: Have multiple YouTube watch tabs, especially while one tab is discarded/loading.
- Workaround: Activate the desired tab and reopen the popup.

**Settings save confirmation can be set after a failed save:**
- Symptoms: `handleSave` sets `saved` to true after awaiting `onSave` regardless of whether validation succeeded. Rendering currently masks it when `isValid` is false, but this couples feedback correctness to asynchronous React state timing.
- Files: `skimd-extension/src/features/settings/SettingsPanel.jsx`, `skimd-extension/src/features/settings/useApiKey.js`
- Trigger: Save a key that fails validation while a prior valid state or render is present.
- Workaround: None; rely on the error banner.

## Security Considerations

**API key is exposed to extension runtime and provider requests:**
- Risk: The Groq key is held in React state and sent as a bearer token from `skimd-extension/src/shared/groq.js`; any future content-script or bundle compromise could expose it. The settings copy says it “never leaves your device,” which is inaccurate because it intentionally leaves the device to Groq.
- Files: `skimd-extension/src/features/settings/useApiKey.js`, `skimd-extension/src/features/settings/SettingsPanel.jsx`, `skimd-extension/src/shared/groq.js`
- Current mitigation: Key is stored in `chrome.storage.local`, input is password-hidden by default, and no key value is logged.
- Recommendations: Correct the disclosure to state that the key is sent directly to Groq, minimize its lifetime in component state, avoid logging request objects, and document provider-side handling and revocation.

**Overbroad host and extension permissions:**
- Risk: `tabs`, `activeTab`, `scripting`, `storage`, `alarms`, all YouTube host paths, and Groq host access expand the privileges available to the extension. `executeScript` runs serialized code in YouTube `MAIN` world.
- Files: `skimd-extension/public/manifest.json`, `skimd-extension/src/shared/youtube.js`, `skimd-extension/src/shared/player.js`
- Current mitigation: Injected functions are self-contained and use fixed YouTube endpoints; UI output is rendered as React text rather than HTML.
- Recommendations: Remove unused permissions/host patterns, restrict URL matching to required watch pages where possible, and review every `MAIN`-world operation as a privileged boundary.

**Video IDs are stored in sync storage:**
- Risk: A single watched video identifier and theme preference are written to `chrome.storage.sync`, which can sync viewing metadata beyond the local device and conflicts with a strictly local privacy expectation.
- Files: `skimd-extension/src/background/service-worker.js`, `skimd-extension/src/shared/youtube.js`, `skimd-extension/src/shared/hooks/useTheme.js`
- Current mitigation: No transcript or summary is written to sync storage; summaries use session storage.
- Recommendations: Keep transient video identity in memory/session storage or key it per tab, and explicitly disclose any sync behavior.

## Performance Bottlenecks

**Every summary generates three Groq requests:**
- Problem: `FORMATS.map(...); Promise.all(...)` requests paragraph, bullets, and TLDR simultaneously, including formats the user may never view.
- Files: `skimd-extension/src/features/summary/useSummary.js`, `skimd-extension/src/shared/groq.js`
- Cause: The UI precomputes all formats for instant tab switching.
- Improvement path: Generate the selected format first and lazily fill others, or make the three-request tradeoff explicit; add concurrency/rate-limit handling and user cancellation.

**Unbounded transcript is sent in each request:**
- Problem: Full parsed transcript is interpolated into the prompt with no character/token limit or chunking.
- Files: `skimd-extension/src/shared/youtube.js`, `skimd-extension/src/shared/groq.js`
- Cause: Caption length is controlled by arbitrary video duration and may exceed provider context/rate limits.
- Improvement path: Estimate token size, truncate or chunk with a deterministic reduction strategy, and surface a clear long-video state.

**Playback polling injects a script every second:**
- Problem: Transcript view calls `getVideoTime()` once immediately and every 1,000 ms; each poll performs `chrome.scripting.executeScript` in the page.
- Files: `skimd-extension/src/features/transcript/usePlaybackTime.js`, `skimd-extension/src/shared/player.js`
- Cause: Cross-context polling is used instead of a persistent page event/listener.
- Improvement path: Use a content-script/player event channel if needed, throttle only while visible/playing, and stop polling when the popup is hidden or the tab is no longer the target.

**Service-worker keepalive alarm is wasteful and ineffective as a guarantee:**
- Problem: An alarm runs every 0.4 minutes with an empty handler.
- Files: `skimd-extension/src/background/service-worker.js`, `skimd-extension/public/manifest.json`
- Cause: The worker is being artificially tickled despite no long-running worker operation.
- Improvement path: Remove `alarms` and the keepalive code unless a measured, supported lifecycle need exists; design event handlers to tolerate worker suspension.

## Fragile Areas

**YouTube Innertube scraping contract:**
- Files: `skimd-extension/src/shared/youtube.js`
- Why fragile: It depends on undocumented `ytInitialPlayerResponse`, Android client version `20.10.38`, caption XML shapes, and a fixed description regex. YouTube changes can silently remove tracks, alter XML/JSON, or reject the client.
- Safe modification: Keep parsing and fetching isolated, add fixture tests for native/Android responses and caption formats, and verify against videos with English, non-English, auto-generated, absent, and very long captions.
- Test coverage: No test files or test runner are present in `skimd-extension/package.json`.

**Cross-context `executeScript` operations:**
- Files: `skimd-extension/src/shared/youtube.js`, `skimd-extension/src/shared/player.js`
- Why fragile: Calls fail during navigation, on restricted tabs, discarded tabs, browser differences, and popup closure; most failures are swallowed or reduced to generic messages.
- Safe modification: Centralize target-tab resolution, validate URL/video identity immediately before injection, preserve structured error codes, and manually test Chrome/Chromium variants and navigation races.
- Test coverage: No automated coverage; `seekVideo` and `getVideoTime` errors are silently ignored.

**Summary state and cache lifecycle:**
- Files: `skimd-extension/src/features/summary/useSummary.js`, `skimd-extension/src/background/service-worker.js`
- Why fragile: Cache keys combine tab ID/video ID and are best-effort; tab ID reuse, global video tracking, request races, and session-storage eviction can all produce missing or stale summaries.
- Safe modification: Add a state-machine/request-generation test suite and make cache reads/writes identity-aware.
- Test coverage: No automated tests; only manual UI behavior is possible.

## Scaling Limits

**Provider quota and long-video input:**
- Current capacity: Three parallel requests per user action, each with `max_tokens: 512`, a 30-second timeout, and up to three retries on 429.
- Limit: Long transcripts and free-tier Groq quotas can produce repeated 429s, long waits, or context failures; retries multiply load.
- Scaling path: Bound prompt size, request one format at a time or queue requests, honor cancellation, and expose retry-after/backoff state to the user.

## Dependencies at Risk

**Undocumented YouTube and client-version dependencies:**
- Risk: The Android Innertube client and caption endpoints are not stable public APIs, and the hard-coded client version may be rejected as it ages.
- Impact: Transcript and chapter features can fail independently of extension code changes.
- Migration plan: Isolate provider adapters behind typed/validated result contracts, maintain response fixtures, and monitor endpoint failures before changing the intentional Android-client approach.

## Missing Critical Features

**Automated regression suite:**
- Problem: There is no test script, test runner config, or `*.test.*`/`*.spec.*` file.
- Blocks: Safe changes to parsing, storage races, summary formatting, error states, and extension APIs cannot be regression-tested.

**Reliable runtime validation/manual QA harness:**
- Problem: `PRD.md` requires realistic extension verification and no blocking console errors, but no documented repeatable QA checklist or browser automation exists; lint itself fails.
- Blocks: Confidence in captions, chapters, invalid keys, long videos, SPA navigation, discarded tabs, keyboard shortcut behavior, and reduced-motion/accessibility states.

## Test Coverage Gaps

**Transcript/chapter parser behavior:**
- What's not tested: XML entity decoding, `<p>`/`<text>` variants, malformed cues, duplicate chapters, invalid timestamps, missing captions, and YouTube response changes.
- Files: `skimd-extension/src/shared/youtube.js`
- Risk: A provider response change can yield empty or incorrect output without detection.
- Priority: High

**Storage and navigation races:**
- What's not tested: Multiple tabs, tab removal/reuse, SPA navigation, discarded tabs, popup close during requests, and cache isolation.
- Files: `skimd-extension/src/background/service-worker.js`, `skimd-extension/src/features/transcript/useTranscript.js`, `skimd-extension/src/features/summary/useSummary.js`
- Risk: Wrong-video summaries/transcripts or stale UI are likely to be intermittent and hard to reproduce.
- Priority: High

**Error and security disclosures:**
- What's not tested: Invalid-key messaging, network/timeouts/429 retries, clipboard failure, restricted-tab script failures, and key removal persistence.
- Files: `skimd-extension/src/shared/groq.js`, `skimd-extension/src/features/settings/SettingsPanel.jsx`, `skimd-extension/src/shared/components/ErrorBanner.jsx`, `skimd-extension/src/features/export/ExportControls.jsx`
- Risk: Users receive misleading generic feedback or believe privacy guarantees that the implementation does not provide.
- Priority: Medium

---

*Concerns audit: 2026-09-05*
