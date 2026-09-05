---
quick_id: 260905-pv4
phase: quick-260905-pv4-long-video-summarisation
plan: 01
subsystem: summary
tags: [chrome-extension, groq, structured-output, rate-limits, regression-testing]
requires:
  - quick-260905-o14: supported Groq summary model and truthful error codes
  - quick-260905-ovv: bounded retries and summary scheduling
provides:
  - One transcript-bearing Groq request returning Paragraph, Bullets, and TLDR
  - Deterministic regression coverage across the former transcript-size boundary
  - Clear rate-limit guidance without exposing provider response content
affects: [summary-panel, groq-integration, error-banners]
actuals:
  tokens: 5629
  tasks: 3
  commits: 2
tech-stack:
  added: []
  patterns: [single structured completion, JSON-schema response boundary, privacy-safe threshold sweep]
key-files:
  created: []
  modified:
    - skimd-extension/src/shared/groq.js
    - skimd-extension/src/features/summary/summaryScheduler.js
    - skimd-extension/src/shared/components/errorMessages.js
    - skimd-extension/test/groq-summary.test.js
    - skimd-extension/test/groq-reliability.test.js
key-decisions:
  - "Request all three summary formats in one strict structured completion so the transcript consumes Groq input tokens once per click."
  - "Keep the supported openai/gpt-oss-120b model and existing bounded retry/deadline classifications."
requirements-completed: []
duration: 69min
completed: 2026-09-05
status: complete
---

# Quick Task 260905-pv4: Long-video Groq Summarisation Summary

**Skimd now produces Paragraph, Bullets, and TLDR from one structured Groq completion, removing the repeated-transcript token pressure that made longer videos fail.**

## Root Cause

The apparent six-minute boundary was not a duration limit in Skimd and was not caused by the 30-second attempt timeout in the reproduced path. The shipping scheduler sent the entire transcript separately for Paragraph, Bullets, and TLDR. Groq documents an 8K token-per-minute free-plan limit for `openai/gpt-oss-120b`, so transcript growth multiplied input consumption by three and eventually produced HTTP 429 rate rejection.

A controlled privacy-safe sweep reproduced the boundary using only synthetic character counts. Inputs of 4,000 and 8,000 characters consumed approximately 3,000 and 6,000 cumulative tokens across three calls and passed. Inputs of 12,000 and 16,000 characters consumed approximately 9,000 and 12,000 cumulative tokens and failed immediately with `GROQ_RATE_LIMITED`. At the identical 16,000-character input, toggling to one request consumed approximately 4,000 tokens and passed; reverting to three requests restored the failure.

The immediate one-millisecond rejection excluded Skimd's 30-second attempt and 45-second request deadlines for this reproduced boundary. Groq's documented 131,072-token model context window excluded a per-request context rejection at the measured 3K-4K-token sizes. Controlled abort, 429, 4xx, 5xx, malformed, empty, and transport paths retained distinct local classifications.

## Accomplishments

- Added a red-first threshold regression covering 4K, 8K, 12K, and 16K synthetic transcripts with conservative character-to-token estimates.
- Replaced three full-transcript completions with one strict JSON-schema completion that returns the complete result set.
- Preserved Paragraph, Bullets, and TLDR display contracts and all-or-nothing caching.
- Added low reasoning effort and a bounded 1,024-token combined completion allowance.
- Updated rate-limit guidance to tell users the usage limit is temporary and may require up to a minute before retrying.

## Task Commits

1. **Task 1 RED: Reproduce long-transcript rate pressure** — `74d80da`
2. **Task 2 GREEN: Summarize long transcripts in one request** — `399a2bf`

Task 3 used and removed only temporary browser/debug artifacts, so it required no code commit.

## Verification

- RED gate: 17 tests ran; 15 passed and 2 failed. The scheduler made three transcript-bearing calls instead of one, and the combined completion export did not exist.
- GREEN gate: 22 tests passed, 0 failed.
- Production build passed with 43 modules transformed.
- Post-fix boundary regression: all four synthetic sizes used exactly one request and returned all three formats.
- Failure classes: HTTP 429, terminal 4xx, provider 5xx, client abort, transport failure, malformed JSON, and empty responses remained distinct.
- Safety scan found no API key pattern, credential value, transcript/summary payload, raw provider body, debug statement, or debug log in the scoped changes.

## Browser QA Limitation

The built production popup loaded with a synthetic 16,000-character transcript, enabled Summarise, and accepted the click. However, the automation browser did not retain the safe cross-origin fetch interceptor and could not access the user's installed-extension storage or saved key. Live Groq completion and Regenerate verification are therefore explicitly partial. No credential, request body, response body, transcript content, or generated summary content was captured.

## Deviations from Plan

- Browser/provider verification followed the plan's permitted partial-evidence path because the automation browser could not safely execute a live saved-key call.
- No transcript transformation or truncation was introduced because repeated token consumption—not the model context limit—was the confirmed cause.

## Known Stubs

None.

## Self-Check: PASSED

- All five scoped implementation/test files exist.
- Commits `74d80da` and `399a2bf` exist.
- The full suite and production build pass after cleanup.
- The debug journal, local exclude entry, temporary browser fixture, browser session, and preview server were removed.
- Unrelated pre-existing working-tree changes remain untouched.
