---
quick_id: 260905-qph
phase: quick-260905-qph-auto-summarise-on-popup-open
plan: 01
subsystem: summary
tags: [chrome-extension, react, auto-start, cache, single-flight]
requires:
  - quick-260905-pv4: one structured Groq request returning all summary formats
provides:
  - Readiness-gated automatic summarisation when the popup opens
  - Popup-lifetime per-video request claims
  - Synchronous single-flight protection for automatic and manual triggers
affects: [popup, summary-panel, summary-cache]
tech-stack:
  added: []
  patterns: [pure readiness policy, popup-lifetime claims, request-boundary single-flight]
key-files:
  created:
    - skimd-extension/src/features/summary/autoSummarise.js
    - skimd-extension/test/auto-summarise.test.js
  modified:
    - skimd-extension/src/popup/App.jsx
    - skimd-extension/src/features/summary/SummaryPanel.jsx
    - skimd-extension/src/features/summary/useSummary.js
key-decisions:
  - "Wait for valid key, transcript completion, and summary-cache hydration before starting automatically."
  - "Consume one popup-lifetime claim per video before invoking Groq so effect replay and tab remounts cannot duplicate requests."
  - "Keep automatic, keyboard, manual retry, and Regenerate actions behind the same synchronous single-flight request boundary."
requirements-completed: []
coverage:
  - deliverable: Automatic summary starts once after popup data is ready
    verification:
      - kind: test
        ref: skimd-extension/test/auto-summarise.test.js
        status: pass
      - kind: browser
        ref: built-popup synthetic harness request-count observation
        status: pass
    human_judgment: false
  - deliverable: Complete cache restoration and UI navigation do not request again
    verification:
      - kind: browser
        ref: built-popup synthetic harness cached reload and tab navigation
        status: pass
    human_judgment: false
  - deliverable: Manual retry and Regenerate remain explicit single requests
    verification:
      - kind: browser
        ref: built-popup synthetic harness forced failure and action counts
        status: pass
    human_judgment: false
duration: 18min
completed: 2026-09-05
status: complete
---

# Quick Task 260905-qph: Automatic Popup Summarisation Summary

**Opening Skimd on an uncached captioned video now begins one summary request as soon as the saved key, transcript, and cache state are ready.**

## Accomplishments

- Added a pure readiness policy that excludes missing keys, missing videos, captionless videos, transcript errors, empty transcripts, unresolved hydration, active requests, and complete cached results.
- Added popup-lifetime per-video claims that survive Summary tab remounts and prevent duplicate automatic attempts from React effect replay or UI navigation.
- Added synchronous single-flight protection at the summary request boundary while retaining manual retry, Regenerate, keyboard activation, complete-set caching, and the one-request Groq flow.
- Added seven failing-first lifecycle regressions covering readiness transitions, malformed cache data, repeat claims, new videos, and manual retry after automatic failure.

## Task Commits

1. **Task 1 RED: Add failing auto-summary lifecycle coverage** — `c6fa238`
2. **Task 1 GREEN: Automatically start video summaries** — `2030a9d`

Task 2 exercised the production build with a temporary synthetic browser harness and required no code commit.

## Verification

- RED gate failed because `autoSummarise.js` did not exist in the manual-only implementation.
- Full suite passed: 29 tests, 0 failures.
- Production build passed with 44 modules transformed.
- Built-popup browser QA observed one automatic request and a rendered complete result without clicking Summarise.
- Reloading with the cached complete set retained the request count at one.
- Changing summary formats and switching among Summary, Transcript, and Timeline retained the request count at one.
- Regenerate increased the request count by exactly one.
- A forced terminal failure made one automatic request, did not loop, and one manual Summarise click made exactly one successful retry.
- Missing-key, captionless, and transcript-error harness states each made zero summary requests.
- The privacy scan found no key pattern, authorization value, debug statement, or retained diagnostic payload in scoped changes.

## Browser QA Limitation

Browser QA used the built production popup with synthetic in-memory Chrome APIs and deterministic request interception because the automation browser could not safely access the user's installed extension storage or Groq credential. Popup lifecycle, caching, navigation, failure, and exact request counts are verified; live saved-key/provider evidence is explicitly partial. The temporary harness, preview server, and browser sessions were removed.

## Deviations from Plan

- Browser/provider verification followed the plan's permitted synthetic-harness path; no live credential or provider payload was accessed.
- Existing lint configuration still reports the known Chrome-global and Vite `__dirname` errors plus one pre-existing transcript-test lint error. No new rule category was introduced by this task.

## Known Stubs

None.

## Self-Check: PASSED

- All five planned implementation and test files exist.
- Commits `c6fa238` and `2030a9d` exist.
- Tests, production build, privacy scan, runtime request counts, and cleanup checks passed.
- No temporary QA artifact remains, and unrelated working-tree files were not modified.
