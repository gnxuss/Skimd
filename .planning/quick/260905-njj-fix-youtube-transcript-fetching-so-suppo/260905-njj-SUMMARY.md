---
quick_id: 260905-njj
phase: quick-260905-njj-transcript-fetching
plan: 01
subsystem: transcript
tags: [chrome-extension, youtube, captions, xml, regression-testing]
requires: []
provides:
  - Fresh-track fallback for stale page-embedded YouTube caption URLs
  - Truthful separation of captionless and caption-retrieval failure states
  - Regression coverage across the serialized executeScript boundary
affects: [summary-button, transcript-view, youtube-integration]
actuals:
  tokens: 2583
  tasks: 3
  commits: 3
tech-stack:
  added: []
  patterns: [retry stale native caption tracks through fresh Android player metadata]
key-files:
  created: [skimd-extension/test/youtube-transcript.test.js]
  modified: [skimd-extension/src/shared/youtube.js]
key-decisions:
  - "Retain the page-native fast path, but refresh Android player metadata once when it yields zero cues."
  - "Treat an advertised track with a final empty or unsupported payload as retrieval failure, not successful captions."
requirements-completed: []
coverage:
  - id: D1
    description: Captioned videos recover from stale page-native track URLs and produce non-empty cues and transcript text.
    verification:
      - kind: integration
        ref: skimd-extension/test/youtube-transcript.test.js#advertised native caption track with an empty body retries a fresh player track
        status: pass
      - kind: manual_procedural
        ref: Real YouTube page-world probe returned 61 structural cues and non-zero text length
        status: pass
    human_judgment: false
  - id: D2
    description: Captionless and failed caption responses remain distinct and cannot enable summarisation.
    verification:
      - kind: integration
        ref: skimd-extension/test/youtube-transcript.test.js#captionless and failure-state tests
        status: pass
    human_judgment: false
  - id: D3
    description: The real installed extension popup shows timestamped rows and an enabled Summarise button.
    verification:
      - kind: automated_ui
        ref: agent-browser unpacked-extension attempt
        status: unknown
    human_judgment: true
    rationale: The available Chromium process ignored the unpacked-extension load flag, so the popup itself requires user-side confirmation.
duration: 17min
completed: 2026-09-05
status: complete
---

# Quick Task 260905-njj: YouTube Transcript Fetching Summary

**Stale page-embedded caption URLs now fall back to fresh YouTube player metadata, restoring non-empty transcript cues without weakening the Summarise button guard.**

## Performance

- **Duration:** 17 min
- **Completed:** 2026-09-05T16:09:55Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Confirmed twice in a real YouTube page that an advertised native caption URL returned HTTP 200 with an empty body while a fresh Android player track returned non-empty XML.
- Added a one-time fresh-track fallback and converted final zero-cue responses into explicit retrieval errors.
- Added six transcript-path tests covering stale-track recovery, captionless videos, HTTP failure, empty and malformed payloads, and the existing Summarise-button contract.

## Root Cause

`transcriptInjected` preferred `window.ytInitialPlayerResponse` and treated its advertised caption URL as authoritative. The observed native URL returned HTTP 200 with an empty body, so XML parsing produced no cues while the adapter still returned `hasCaptions: true`. The React hook preserved that empty transcript, and `SummaryPanel` correctly disabled summarisation through its existing `!transcript` guard.

Toggle evidence showed the same native URL returning an empty body twice, while a track obtained from fresh Android player metadata returned HTTP 200 XML with 61 structural cues and non-zero text length. Reverting to the native URL restored the empty response.

## Task Commits

1. **Task 1 RED: Add failing stale-track regression** — `84f7f80`
2. **Task 1 GREEN: Refresh stale YouTube caption tracks** — `017100d`
3. **Task 2: Cover transcript outcome states** — `f2d3409`

Task 3 removed runtime diagnostics and browser sessions without changing tracked production files, so it required no additional commit.

## Files Created/Modified

- `skimd-extension/src/shared/youtube.js` — retries a zero-cue native track with fresh player metadata and rejects final semantic empty success.
- `skimd-extension/test/youtube-transcript.test.js` — exercises the actual serialized injected function through a mocked Chrome scripting boundary.

## Verification

- Failing-first regression: failed before the production edit with `0 !== 1`; passed afterward.
- Focused transcript tests: 6 passed, 0 failed.
- Full suite: 11 passed, 0 failed.
- Production build: passed; 42 modules transformed.
- Real page-world evidence: fresh Android player HTTP 200, 6 tracks; timed-text HTTP 200 `text/xml`, body length 3877, 61 structural cues, non-zero text length.
- Failure controls: genuine no-caption metadata returns `hasCaptions: false`; HTTP, empty, and malformed advertised payloads reject with `TRANSCRIPT_ERROR`.
- Secret scan: no transcript contents, cookies, authorization values, or Groq-key-like strings were retained.

## Browser QA Limitation

Agent-browser was run both headless and headed with the unpacked production build. The installed Chromium accepted the launch command but did not list or expose the extension, so the real popup could not be opened in this environment. This is partial runtime evidence: the real YouTube response path was verified in Chromium and the production injected function/button contract was verified through the execution boundary, but the final popup visual should still be confirmed after reloading the extension locally.

## Deviations from Plan

None — the plan anticipated partial browser evidence when extension loading was technically unavailable.

## Known Stubs

None.

## Self-Check: PASSED

- Both implementation files exist.
- Commits `84f7f80`, `017100d`, and `f2d3409` exist.
- Debug journal, browser sessions, and the local exclude entry were removed.
- Unrelated pre-existing working-tree changes remain untouched.
