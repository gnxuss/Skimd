# Skimd Project Truth

> Temporary migration document.
>
> This file exists to help an agent understand the historical project before mapping the actual codebase.
>
> The codebase must be inspected and treated as the final authority for what currently exists.
>
> Once GSD has mapped the repository and incorporated the relevant information into `.planning/`, retire this file.

## 1. Product

Skimd is a Manifest V3 Chrome extension for understanding YouTube videos without watching them in full.

Its existing product capabilities are intended to include:

- AI video summaries
- Paragraph, bullet, and TLDR summary formats
- Full video transcripts
- Timestamped transcript cues
- Click-to-seek transcript navigation
- Video chapter/timeline navigation
- Copy/export functionality
- Light and dark appearance
- User-provided AI API credentials

The project was migrated away from a hosted backend.

The intended current architecture is fully client-side.

## 2. Known Current Stack

Historically documented current stack:

- React
- Vite
- Tailwind CSS
- Chrome Manifest V3
- Groq API
- YouTube Innertube
- Chrome extension storage APIs
- `chrome.scripting.executeScript`

GSD must verify exact dependency versions and configuration from the repository.

## 3. Major Architecture

### No Skimd backend

The old Express/Railway backend was removed.

Transcript retrieval, chapter retrieval, AI requests, state, and UI are handled by the Chrome extension.

Any remaining backend references should be treated as potentially obsolete and investigated.

### YouTube data execution

Transcript and chapter retrieval was moved to popup-triggered:

`chrome.scripting.executeScript(..., { world: "MAIN" })`

The injected operation executes in the YouTube page context.

This architecture replaced an earlier design where the service worker acted as the middleman.

Do not move YouTube fetching back into the service worker without first understanding the historical failures described below.

### Service worker

The intended service worker is minimal.

Known responsibilities historically include:

- YouTube tab/video tracking
- Keyboard shortcut handling
- Minimal lifecycle/support behaviour

Transcript and chapter fetching should not depend on service-worker message passing.

GSD must verify the current implementation.

## 4. Important Historical Findings

These findings resulted from actual debugging and should not be casually discarded.

### Innertube client

The project switched transcript/chapter retrieval from the WEB Innertube client to the ANDROID client.

The WEB approach previously encountered:

- Missing caption tracks without required session context
- Timed-text behaviour returning unusable responses
- Parsing problems caused by Trusted Types restrictions in the YouTube page context

The ANDROID client successfully returned the required caption information without the same session requirements.

Treat the current Android-client approach as intentional unless new evidence justifies replacing it.

### Popup-direct executeScript

YouTube data retrieval was moved away from:

`popup → service worker → executeScript`

toward:

`popup → executeScript`

Reasons encountered in the previous implementation included:

- Manifest V3 service-worker lifecycle issues
- Runtime message ports closing during asynchronous work
- Discarded-tab behaviour after browser restarts
- YouTube requests from the `chrome-extension://` origin returning HTTP 403

Executing the retrieval code in the YouTube page's MAIN world avoided the extension-origin problem and removed the service worker from the critical path.

### Transcript parsing

`DOMParser.parseFromString()` previously conflicted with YouTube's Trusted Types policy in the injected MAIN-world environment.

The implementation was changed to a CSP-safe parsing approach.

Do not casually replace the current parser with `DOMParser` without testing it inside the actual extension execution environment.

### Groq model and rate limiting

The project previously moved away from:

`llama-3.3-70b-versatile`

to:

`meta-llama/llama-4-scout-17b-16e-instruct`

because of recurring free-tier HTTP 429 behaviour.

Retry behaviour with exponential backoff was also added.

GSD must inspect the current implementation before treating either model name or retry parameters as canonical.

The exact AI model is not product scope and may be changed independently of the PRD.

## 5. Historically Implemented Features

The previous project state reported the following as implemented.

GSD must verify these against the repository rather than automatically trusting this list.

### Settings

- API key input
- Show/hide key
- Key validation
- Save key locally
- Clear key
- Error and success feedback

### Main application

- API-key-gated interface
- Summary tab
- Transcript tab
- Timeline tab
- Settings access
- Theme toggle
- Keyboard-triggered summarisation

### Summary

- AI summarisation
- Multiple summary formats
- Loading state
- Error handling
- Summary skeleton/loading UI

### Transcript

- Transcript retrieval
- Caption detection
- Timestamped cues
- Active cue tracking
- Automatic cue scrolling
- Click-to-seek behaviour
- Transcript loading skeleton

### Timeline

- Chapter retrieval
- Timestamped chapters
- Click-to-seek
- Empty state
- Loading skeleton

### Export

- Copy to clipboard
- Plain-text download

### Appearance

- Light mode
- Dark mode
- System preference detection
- UI micro-animations
- Reduced-motion handling

## 6. Historically Unverified or Incomplete

At the last trustworthy project snapshot, substantial implementation existed but manual QA had not been completed.

Areas specifically reported as unfinished or unverified included:

### Summary QA

- Multiple summary formats
- Performance on longer videos
- No-caption behaviour
- Invalid API key behaviour
- Groq failure behaviour
- Console-error check

### Transcript QA

- Full transcript rendering
- Short-video behaviour
- No-caption behaviour
- Active cue highlighting
- Click-to-seek accuracy
- Console-error check

### Timeline QA

- Videos with chapters
- Click-to-seek accuracy
- Videos without chapters
- Console-error check

### Edge cases

Historically planned but not confirmed:

- Non-YouTube pages
- YouTube pages without an active video
- Network failure
- AI timeout
- Duplicate requests while loading
- API key cleared during an active session

### Final cleanup

Historically outstanding:

- Debug `console.log` removal
- Complete end-to-end QA
- Browser compatibility checks
- Placeholder extension assets/icons
- Setup documentation
- Automated testing
- Final distribution/release work

Do not assume this list still accurately represents the repository.

Use it as a checklist of areas worth inspecting during recovery.

## 7. Known Documentation Conflicts

The legacy documentation contains contradictions caused by implementation evolving faster than documentation.

Known examples include:

### Groq model

Older PRD/architecture documentation references `llama-3.3-70b-versatile`.

Later implementation records switched to `meta-llama/llama-4-scout-17b-16e-instruct`.

Inspect the code.

### videoId storage

Legacy documents disagree about whether the current video ID belongs in `chrome.storage.local` or `chrome.storage.sync`.

Inspect the code and evaluate the intended behaviour before changing it.

### Service-worker responsibilities

Older documentation describes transcript/chapter logic inside the service worker.

Later implementation moved that functionality to popup-direct `executeScript`.

The later architecture is believed to be intentional.

Verify the code.

### Distribution

Legacy product documentation treated Chrome Web Store publication as out of scope, while later task planning included Chrome Web Store release work.

Treat publication as a release-planning decision rather than evidence about current product architecture.

## 8. Recovery Instructions

When mapping this repository:

1. Inspect the actual codebase before accepting this document as fact.
2. Reconstruct the current architecture from implementation.
3. Identify dead or obsolete code left from previous architectures.
4. Compare implemented behaviour against `PRD.md`.
5. Identify partially implemented or unverified features.
6. Preserve the architectural lessons documented above unless evidence supports changing them.
7. Build the new GSD roadmap from the actual repository state.
8. Do not recreate the old manual `TASKS.md`, `STATE.md`, `CHANGELOG.md`, or `BUGS.md` workflow.

## 9. Decisions Worth Considering for Permanent Preservation

The following may deserve migration into a permanent `DECISIONS.md` after repository mapping confirms they are still applicable:

1. YouTube transcript/chapter retrieval executes through popup-direct `chrome.scripting.executeScript` in the YouTube MAIN world.
2. The Android Innertube client is used because the previously tested WEB approach failed for caption retrieval in this environment.
3. Transcript parsing avoids `DOMParser` in the injected MAIN-world path because of Trusted Types restrictions.
4. Skimd currently operates without a Skimd-hosted backend.

Do not migrate these automatically.

First verify that the current code still implements and depends on them.