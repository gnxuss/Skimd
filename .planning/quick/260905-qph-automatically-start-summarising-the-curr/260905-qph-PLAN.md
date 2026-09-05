---
quick_id: 260905-qph
phase: quick-260905-qph-auto-summarise-on-popup-open
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
files_modified:
  - skimd-extension/src/popup/App.jsx
  - skimd-extension/src/features/summary/SummaryPanel.jsx
  - skimd-extension/src/features/summary/useSummary.js
  - skimd-extension/src/features/summary/autoSummarise.js
  - skimd-extension/test/auto-summarise.test.js
must_haves:
  truths:
    - "Opening Skimd on a captioned YouTube video with a valid saved Groq key automatically begins one summary request after transcript and cache hydration finish."
    - "A cached complete Paragraph, Bullets, and TLDR set for the same tab and video is displayed without an automatic provider request."
    - "Rerenders, React StrictMode effect replay, format changes, and summary/transcript/timeline tab changes do not duplicate the automatic request for the current video."
    - "Missing keys, captionless videos, transcript failures, empty transcripts, and unresolved cache state never start an automatic request."
    - "After an automatic failure, the user can click Summarise to retry; after success, Regenerate remains an explicit fresh request."
    - "The one-request structured Groq completion, bounded reliability behavior, tab/video cache scoping, and all-or-nothing cache writes remain unchanged."
  artifacts:
    - path: "skimd-extension/src/features/summary/autoSummarise.js"
      provides: "Pure readiness and per-video claim policy for deterministic behavioral tests"
    - path: "skimd-extension/src/popup/App.jsx"
      provides: "Popup-lifetime ownership of automatic-summary claims across summary-tab remounts"
    - path: "skimd-extension/src/features/summary/SummaryPanel.jsx"
      provides: "Readiness-driven automatic invocation while retaining manual controls"
    - path: "skimd-extension/src/features/summary/useSummary.js"
      provides: "Synchronous single-flight protection at the summary request boundary"
    - path: "skimd-extension/test/auto-summarise.test.js"
      provides: "Failing-first lifecycle, deduplication, cache, failure, and manual-action regressions"
  key_links:
    - from: "skimd-extension/src/popup/App.jsx"
      to: "skimd-extension/src/features/summary/SummaryPanel.jsx"
      via: "popup-lifetime claim callback keyed by current videoId"
      pattern: "claim.*Summaris|videoId"
    - from: "skimd-extension/src/features/summary/SummaryPanel.jsx"
      to: "skimd-extension/src/features/summary/useSummary.js"
      via: "hydrated readiness effect calling the same summariseAll action as the manual button"
      pattern: "hydrated|summariseAll"
    - from: "skimd-extension/src/features/summary/useSummary.js"
      to: "skimd-extension/src/features/summary/summaryScheduler.js"
      via: "single-flight guarded structured summary request"
      pattern: "summariseFormats"
---

<objective>
Automatically begin summarising the current supported YouTube video when the Skimd popup opens.

Purpose: Remove the redundant Summarise click while preserving cache restoration, explicit retries, Regenerate, and all recent Groq reliability guarantees.
Output: A readiness-gated, per-video, single-flight auto-start path with failing-first lifecycle tests and extension QA.
</objective>

<execution_context>
@/Users/j/.codex/gsd-core/workflows/execute-plan.md
@/Users/j/.codex/plugins/cache/sisyphuslabs/omo/0.1.0/skills/programming/SKILL.md
@/Users/j/.agents/skills/agent-browser/SKILL.md
</execution_context>

<context>
@AGENTS.md
@.planning/STATE.md
@.planning/codebase/TESTING.md
@.planning/codebase/CONVENTIONS.md
@.planning/quick/260905-pv4-diagnose-and-fix-groq-summarisation-fail/260905-pv4-SUMMARY.md
@skimd-extension/package.json
@skimd-extension/src/popup/App.jsx
@skimd-extension/src/popup/main.jsx
@skimd-extension/src/features/settings/useApiKey.js
@skimd-extension/src/features/transcript/useTranscript.js
@skimd-extension/src/features/summary/SummaryPanel.jsx
@skimd-extension/src/features/summary/useSummary.js
@skimd-extension/src/features/summary/summaryScheduler.js
@skimd-extension/test/groq-reliability.test.js
@skimd-extension/test/groq-summary.test.js
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Auto-start one summary when popup data becomes ready</name>
  <files>skimd-extension/src/features/summary/autoSummarise.js, skimd-extension/src/popup/App.jsx, skimd-extension/src/features/summary/SummaryPanel.jsx, skimd-extension/src/features/summary/useSummary.js, skimd-extension/test/auto-summarise.test.js</files>
  <behavior>
    - Starting from key hydration, transcript loading, and summary-cache hydration, exactly one request becomes eligible only when the key is valid, videoId exists, transcript is non-empty, captions are available, neither transcript nor summary is loading, no transcript error exists, and cache hydration is complete.
    - A complete cached set containing non-empty paragraph, bullets, and tldr suppresses auto-start; partial or malformed cache data is not treated as a complete successful result.
    - The same video cannot be auto-claimed twice during popup rerenders, StrictMode effect replay, format selection, or leaving and returning to the Summary tab.
    - A different videoId can be auto-claimed once when its own transcript and cache state become ready.
    - The request boundary rejects concurrent duplicate calls synchronously before React state propagation can race.
    - An automatic failure consumes only the automatic attempt; the manual Summarise button can retry, and a successful result still exposes Regenerate for an explicit fresh call.
  </behavior>
  <action>First create `test/auto-summarise.test.js` using the existing Node test runner and make it fail against the current manual-only lifecycle. Extract a small pure policy/claim helper in `autoSummarise.js` so the transition sequence can be tested without adding a DOM-test dependency: exercise loading-to-ready, cached-complete, missing-key, no-captions, transcript-error, empty-transcript, StrictMode-style repeated evaluation, format/tab remount simulation, failure followed by manual retry, and new-video cases. In `App.jsx`, keep automatic-attempt ownership for the popup lifetime in a ref keyed by videoId and pass a synchronous claim callback into `SummaryPanel`; this ownership must survive SummaryPanel unmount/remount when the user changes tabs. In `SummaryPanel.jsx`, add an effect that waits for transcript completion and `useSummary` cache hydration, evaluates the pure readiness policy, synchronously claims the current video, and then invokes the same `summariseAll({ transcript })` path used by the button. Consume/claim before the promise starts so effect replay cannot race, but do not claim while prerequisites are missing. Treat cached success as complete only when all three expected formats are non-empty. Preserve the keyboard shortcut trigger and ensure it shares the request boundary without causing a second call. In `useSummary.js`, add a ref-based single-flight guard around `summariseAll` because React loading state alone is asynchronous; release it in `finally`, retain existing error clearing, complete-set caching, and the one structured Groq request. Automatic failure must not loop because the popup claim remains consumed, while subsequent manual Summarise and Regenerate clicks remain allowed after the in-flight guard releases. Do not auto-run from the settings screen or weaken the valid-key guard already enforced by `App`.</action>
  <verify>
    <automated>npm --prefix skimd-extension test && npm --prefix skimd-extension run build</automated>
  </verify>
  <done>The red test is observed before production edits; opening the popup produces one readiness-gated request per uncached supported video; every suppression/deduplication case passes; manual retry and Regenerate remain available; and the full suite plus production build pass.</done>
</task>

<task type="auto">
  <name>Task 2: Exercise popup auto-start, cache restoration, and explicit retries</name>
  <files>skimd-extension/src/popup/App.jsx, skimd-extension/src/features/summary/SummaryPanel.jsx, skimd-extension/src/features/summary/useSummary.js, skimd-extension/src/features/summary/autoSummarise.js, skimd-extension/test/auto-summarise.test.js</files>
  <action>Build and reload the unpacked extension, then use the browser to open a captioned YouTube video with a valid saved key and click Skimd without touching Summarise. Confirm the popup progresses from video loading to Summarising and renders Paragraph, Bullets, and TLDR from one Groq request. Close and reopen the popup on the same video and confirm the complete cached set appears without another provider call. Change format tabs and switch among Summary, Transcript, and Timeline, confirming no new automatic request. Exercise Regenerate once and confirm it creates exactly one explicit fresh request. On a controlled failing request, confirm one error appears, automatic retry does not loop, and clicking Summarise manually makes one retry. Also verify a missing-key state opens settings without a request, a captionless video does not request, and a transcript retrieval failure does not request. Inspect popup/service-worker console and request counts without logging or capturing the API key, Authorization header, transcript, provider body, or generated summaries. If browser automation cannot load the unpacked extension, access saved extension storage, or safely observe the live provider boundary, document the exact limitation and use a built-popup harness with synthetic transcript/key values plus deterministic request interception; label provider/account evidence partial rather than claiming full live success. Preserve unrelated dirty files and rerun tests/build after removing any temporary fixture, interceptor, server, trace, or screenshot.</action>
  <verify>
    <automated>npm --prefix skimd-extension test && npm --prefix skimd-extension run build && ! git diff -- skimd-extension/src/popup/App.jsx skimd-extension/src/features/summary/SummaryPanel.jsx skimd-extension/src/features/summary/useSummary.js skimd-extension/src/features/summary/autoSummarise.js skimd-extension/test/auto-summarise.test.js | rg -n "gsk_[A-Za-z0-9]|Authorization: Bearer [^$]|console\.(log|debug)\(|debugger;|\[DEBUG\]"</automated>
    <human-check>Reload Skimd, open a captioned YouTube video, and click the extension icon. Confirm summarisation starts without clicking Summarise; reopening shows cached results without a new request; Regenerate makes one fresh request; and after a forced failure the manual Summarise button retries once.</human-check>
  </verify>
  <done>Runtime evidence confirms the no-click happy path, cached reopen, tab/format deduplication, one explicit Regenerate, and manual retry after failure, or any blocked browser/provider portion is precisely labeled partial; no secret, content payload, diagnostic artifact, or unrelated worktree mutation remains.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Popup lifecycle to Groq request | Asynchronous key, transcript, cache, and React lifecycle state determine whether a paid/rate-limited third-party request starts. |
| Session cache to automatic policy | Stored summary data is untrusted and must be complete before it suppresses generation. |
| React effects to request boundary | Effect replay and remounts can amplify requests unless claims and in-flight state are synchronous. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-260905-qph-01 | Denial of Service | Summary auto-start effect | high | mitigate | Gate on all prerequisites, claim once per video at popup scope, and add a request-boundary single-flight ref with exact-count tests. |
| T-260905-qph-02 | Tampering | Cached summary object | medium | mitigate | Require all three known non-empty formats before treating cache as complete; never let malformed/partial cache masquerade as success. |
| T-260905-qph-03 | Information Disclosure | Browser QA and diagnostics | high | mitigate | Observe only state transitions and request counts; prohibit keys, headers, transcript content, provider bodies, and summary content from artifacts or logs. |
| T-260905-qph-04 | Repudiation | Automatic versus manual request origin | low | mitigate | Behavioral tests separately assert auto claim, manual retry, and Regenerate request counts. |
</threat_model>

<verification>
1. A failing-first Node behavioral test proves the current popup does not auto-start, then passes for the complete readiness transition.
2. Deterministic lifecycle tests prove exactly one automatic request through repeated evaluations, StrictMode-style replay, format changes, and Summary tab remounts.
3. Missing key, captionless, transcript error, empty transcript, unresolved hydration, and complete-cache scenarios produce zero automatic calls.
4. Automatic failure does not loop; manual Summarise retries once; successful state retains one-request Regenerate.
5. Existing Groq summary, reliability, settings, and YouTube transcript tests pass unchanged, and the production bundle builds.
6. Browser QA validates real popup-open behavior and cache restoration where technically feasible, with limitations stated rather than overstated.
</verification>

<success_criteria>
- A user with a valid saved key can open Skimd on a supported video and receive all three summaries without clicking Summarise.
- Automatic generation occurs no more than once per uncached video during a popup session and never runs when prerequisites fail.
- Cached results, keyboard activation, manual retry, Regenerate, structured single-request generation, retry limits, and cache behavior remain intact.
- Tests, production build, privacy scan, and feasible popup/browser QA pass without disturbing unrelated worktree changes.
</success_criteria>

<source_audit>
| Source | ID | Item | Plan | Status | Notes |
|--------|----|------|------|--------|-------|
| GOAL | - | Automatically start summarising the current YouTube video when the popup opens | 01 | COVERED | Task 1 wires readiness through request and Task 2 verifies popup behavior. |
| REQ | - | No ROADMAP phase requirement IDs are assigned to this quick task | - | COVERED | Quick work is tracked outside phase requirements. |
| RESEARCH | - | No separate research artifact was requested | - | COVERED | Existing popup, key, transcript, summary, cache, and test patterns fully determine the change. |
| CONTEXT | - | Start only after valid saved key and non-empty transcript are ready | 01 | COVERED | Readiness policy includes key, video, captions, transcript, loading, error, and hydration gates. |
| CONTEXT | - | Prevent duplicates from rerenders, StrictMode, cached reopen, format changes, and tab changes | 01 | COVERED | Popup-scope claims, complete-cache suppression, and request single-flight protection are tested. |
| CONTEXT | - | Preserve manual retry and explicit Regenerate | 01 | COVERED | Both behaviors use the shared guarded request path after the automatic claim. |
| CONTEXT | - | Never request for missing key, captions unavailable, transcript failure, empty transcript, or complete cache | 01 | COVERED | Zero-call cases are explicit behavioral tests and browser checks. |
| CONTEXT | - | Preserve Groq reliability, one-request summaries, transcript, key, and cache behavior | 01 | COVERED | Existing suite remains required and production service/scheduler contracts are unchanged. |
| CONTEXT | - | Require failing-first tests, build, and feasible popup/browser QA | 01 | COVERED | Task 1 mandates red-first proof; both tasks run suite/build; Task 2 performs browser QA with an honest fallback. |
</source_audit>

<output>
Create `.planning/quick/260905-qph-automatically-start-summarising-the-curr/260905-qph-SUMMARY.md` when done.
</output>
