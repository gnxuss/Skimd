---
quick_id: 260905-ovv
phase: quick-260905-ovv-groq-summary-reliability
plan: 01
subsystem: summary
tags: [chrome-extension, groq, retries, scheduling, regression-testing]
requires:
  - quick-260905-o14: supported Groq summary model and safe error codes
provides:
  - Serialized three-format summary scheduling without sibling request amplification
  - Bounded retries for rate limits and transient provider failures
  - Privacy-safe reliability regressions for terminal and retryable failures
affects: [summary-panel, groq-integration, error-banners]
actuals:
  tokens: 3731
  tasks: 3
  commits: 2
tech-stack:
  added: []
  patterns: [sequential batch scheduling, bounded retry deadline, stable local error codes]
key-files:
  created:
    - skimd-extension/src/features/summary/summaryScheduler.js
    - skimd-extension/test/groq-reliability.test.js
  modified:
    - skimd-extension/src/shared/groq.js
    - skimd-extension/src/features/summary/useSummary.js
    - skimd-extension/src/features/summary/SummaryPanel.jsx
    - skimd-extension/src/shared/components/errorMessages.js
    - skimd-extension/test/groq-summary.test.js
key-decisions:
  - "Run Paragraph, Bullets, and TLDR sequentially so one click cannot amplify provider load or leave sibling work running after failure."
  - "Retry 429 and transient 5xx responses at most twice within explicit attempt and total deadlines, while never retrying terminal 4xx responses."
requirements-completed: []
coverage:
  - id: D1
    description: Three-format summarisation uses bounded concurrency and exact request counts.
    verification:
      - kind: integration
        ref: skimd-extension/test/groq-reliability.test.js#three-format scheduler bounds concurrency and preserves result order
        status: pass
    human_judgment: false
  - id: D2
    description: Transient provider failures recover with bounded retries while terminal failures do not amplify calls.
    verification:
      - kind: integration
        ref: skimd-extension/test/groq-reliability.test.js
        status: pass
    human_judgment: false
  - id: D3
    description: The locally installed extension completes repeated real summaries with the user's saved key.
    verification:
      - kind: automated_ui
        ref: agent-browser unpacked-extension attempt
        status: unknown
    human_judgment: true
    rationale: Automation Chromium did not load the unpacked extension or expose the user's local extension storage.
duration: 22min
completed: 2026-09-05
status: complete
---

# Quick Task 260905-ovv: Groq Summary Reliability Summary

**Skimd now avoids provider-load amplification by scheduling the three summary formats sequentially and recovering from bounded transient Groq failures.**

## Performance

- **Duration:** 22 min
- **Completed:** 2026-09-05
- **Tasks:** 3
- **Commits:** 2

## Accomplishments

- Replaced the unconditional three-request fan-out with a deterministic scheduler that makes each format request exactly once and stops before starting later formats after a terminal failure.
- Added explicit 30-second attempt and 45-second total request budgets, two bounded retries, a five-second Retry-After cap, and transient 5xx recovery.
- Removed retry console output and retained only sanitized local error classifications and user guidance.
- Added failing-first regressions covering transient recovery, maximum concurrency, sibling suppression, result order, and terminal no-retry behavior.

## Root Cause

Multiple independent mechanisms were reproduced. First, one click started Paragraph, Bullets, and TLDR simultaneously. Any request could independently retry up to three times, so one user action could create as many as twelve provider attempts, while `Promise.all` rejected on the first failure without cancelling already-running siblings. Second, 429 responses retried but equivalent transient 5xx responses failed immediately, producing different banners for temporary provider-load conditions. Retry delay also consumed the original abort window, allowing a delayed retry to be re-expressed as a timeout.

Payload size was investigated separately but was not confirmed as an independent defect: both short and boundary-sized synthetic inputs retained the complete input at the request boundary. Long-input latency remains a provider-load factor handled by the bounded deadline, not a proven truncation requirement.

The causal toggle reduced maximum batch concurrency from three to one; reverting restored three. Adding transient 5xx retry changed one controlled 503 followed by success from a provider failure into a successful two-attempt result; reverting restored the failure.

## Task Commits

1. **Task 1 RED: Add failing reliability regressions** — `c409908`
2. **Task 2 GREEN: Bound Groq summary requests** — `96584db`

Task 3 created and removed only temporary diagnostic/browser artifacts, so it required no code commit.

## Verification

- Failing-first gate: 20 tests ran before production edits; 17 passed and 3 failed for the reproduced mechanisms.
- Green gate after cleanup: 20 passed, 0 failed, including Groq key validation and YouTube transcript regressions.
- Production build: passed with 43 modules transformed.
- Controlled request boundary: one 503 followed by success used exactly two attempts.
- Controlled batch: all three non-empty formats completed in order at maximum concurrency one; a second-format terminal failure prevented the third request.
- Safety cleanup: the debug journal, local exclude entry, synthetic init fixture, preview process, and scoped browser session were removed. No key pattern, bearer value, user content, provider body, debug statement, or retry console log was added.

## Browser QA Limitation

Agent-browser opened `chrome://extensions` with the production unpacked-extension path, but Chromium listed no loaded extension item. The automation profile therefore could not access Skimd's popup or the user's locally stored key. A built-popup synthetic-state attempt was also blocked by the shared browser daemon ignoring the new launch init script. Browser/provider verification is explicitly partial; the production request boundary and built bundle were exercised deterministically, but the user should reload the installed extension and confirm repeated Summarise and Regenerate clicks with the saved key.

## Deviations from Plan

- The plan allowed explicitly labeled partial evidence when the automation browser could not load the unpacked extension or access the user's saved key; that path was used.
- `summaryScheduler.js` was added as a focused pure module so request scheduling could be tested without mounting React or exceeding module responsibility boundaries.

## Known Stubs

None.

## Self-Check: PASSED

- All seven scoped implementation/test files exist.
- Commits `c409908` and `96584db` exist.
- Full tests and production build pass after cleanup.
- Temporary diagnostics and sensitive-content fixtures are absent.
- Unrelated pre-existing working-tree changes remain untouched.
