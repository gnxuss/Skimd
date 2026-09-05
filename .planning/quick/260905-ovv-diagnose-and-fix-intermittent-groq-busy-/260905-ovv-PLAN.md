---
quick_id: 260905-ovv
phase: quick-260905-ovv-groq-summary-reliability
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
files_modified:
  - skimd-extension/src/shared/groq.js
  - skimd-extension/src/features/summary/useSummary.js
  - skimd-extension/src/shared/components/errorMessages.js
  - skimd-extension/test/groq-summary.test.js
estimate:
  tokens: 30000
  raw_tokens: 30000
  tasks: 3
  confidence: low
must_haves:
  truths:
    - "With a valid saved key and an available transcript, repeated Summarise clicks reliably produce non-empty Paragraph, Bullets, and TLDR results instead of cycling among busy, unavailable, and timeout banners."
    - "The investigation establishes whether the observed messages are several classifications of one causal failure or evidence of multiple independent failures."
    - "Retries, timeouts, request scheduling, and provider response classification are bounded, deterministic, and truthful without duplicating successful work or amplifying provider load."
    - "Working API-key validation and YouTube transcript retrieval remain behaviorally unchanged and passing."
    - "No API key, Authorization header, transcript text, generated summary content, or raw provider response body is captured by diagnostics, tests, logs, or commits."
  artifacts:
    - path: "skimd-extension/src/shared/groq.js"
      provides: "Reliable, bounded Groq request execution with safe response classification"
    - path: "skimd-extension/src/features/summary/useSummary.js"
      provides: "Three-format summary orchestration with evidence-backed scheduling and failure behavior"
    - path: "skimd-extension/test/groq-summary.test.js"
      provides: "Failing-first regression coverage for the proven intermittent failure mechanism"
    - path: "skimd-extension/src/shared/components/errorMessages.js"
      provides: "Truthful stable guidance for retryable and terminal summary failures"
  key_links:
    - from: "skimd-extension/src/features/summary/useSummary.js"
      to: "skimd-extension/src/shared/groq.js"
      via: "three-format `summariseAll` orchestration"
      pattern: 'summarise\(\{ transcript, format, apiKey'
    - from: "skimd-extension/src/shared/groq.js"
      to: "https://api.groq.com/openai/v1/chat/completions"
      via: "bounded authenticated completion requests"
      pattern: 'fetchWithRetry\(GROQ_URL'
    - from: "skimd-extension/src/shared/groq.js"
      to: "skimd-extension/src/shared/components/errorMessages.js"
      via: "stable sanitized error codes rendered by the popup"
      pattern: "GROQ_(RATE_LIMITED|PROVIDER_ERROR|TIMEOUT|NETWORK_ERROR|REQUEST_ERROR)"
---

<objective>
Diagnose and fix intermittent Groq busy, unavailable, and timeout failures during summarisation without masking distinct provider or client failures.

Purpose: Summarisation is the product's core action, and the current combination of three parallel full-transcript requests, a shared retry/abort budget, and broad provider classifications may turn one underlying fault into several user-visible messages or may conceal multiple faults.
Output: Sanitized causal evidence, failing-first regressions, the smallest proven reliability correction, truthful failure guidance, and browser/runtime verification across all three formats.
</objective>

<execution_context>
@/Users/j/.codex/gsd-core/workflows/execute-plan.md
@/Users/j/.codex/plugins/cache/sisyphuslabs/omo/0.1.0/skills/debugging/SKILL.md
@/Users/j/.codex/plugins/cache/sisyphuslabs/omo/0.1.0/skills/programming/SKILL.md
@/Users/j/.agents/skills/agent-browser/SKILL.md
</execution_context>

<context>
@AGENTS.md
@PRD.md
@.planning/STATE.md
@.planning/codebase/INTEGRATIONS.md
@.planning/codebase/TESTING.md
@.planning/codebase/CONVENTIONS.md
@.planning/quick/260905-o14-diagnose-and-fix-the-summarise-action-fa/260905-o14-SUMMARY.md
@skimd-extension/package.json
@skimd-extension/src/shared/groq.js
@skimd-extension/src/features/summary/useSummary.js
@skimd-extension/src/features/summary/SummaryPanel.jsx
@skimd-extension/src/shared/components/errorMessages.js
@skimd-extension/test/groq-summary.test.js
@skimd-extension/test/groq-settings.test.js
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Reproduce and causally classify the intermittent summary failure</name>
  <files>skimd-extension/test/groq-summary.test.js</files>
  <behavior>
    - Repeated three-format runs produce a sanitized attempt timeline containing only format, request ordinal, input length, status/error code, retry count, elapsed milliseconds, and output length.
    - A deterministic regression reproduces the confirmed failure mechanism under controlled concurrency, transcript length/latency, retry timing, or provider response classes.
    - The evidence explicitly concludes either one root failure with several downstream classifications or multiple independently reproduced failures.
  </behavior>
  <action>Before production edits, follow the debugging skill end to end. Create a project-root `.debug-journal.md`, add only that exact path to `.git/info/exclude`, and record the starting `git status --short` so unrelated dirty files are preserved. Form and investigate at least these three distinct hypotheses at the real `summariseAll`/`summarise` boundary: H1 the three simultaneous format requests create request concurrency, rate-limit amplification, or partial-batch failure; H2 long transcript payloads approach model/context limits or cause model latency beyond the configured deadline; H3 the retry/timeout policy or provider response classes cause a single 429/5xx/slow response to be re-expressed as timeout, provider unavailable, or network failure. Add other hypotheses only when evidence warrants them, such as stale popup requests or malformed successful responses. Reproduce each observed class at least twice where feasible, compare one-format versus three-format execution, short versus boundary-sized synthetic input, and immediate versus delayed/429/5xx responses. Use causal toggles that change only one dimension at a time, then revert the toggle to restore the failure. Capture no credentials, Authorization values, request bodies, transcript text, response bodies, or generated text; store only lengths, counts, sanitized local/provider codes, status, and timing. Write deterministic failing tests before changing production code, and observe them fail for the same causal reason as the runtime evidence. Do not alter API-key validation, transcript retrieval, or production behavior in this task.</action>
  <verify>
    <automated>npm --prefix skimd-extension test</automated>
  </verify>
  <done>At least three hypotheses have sanitized evidence, causal toggle-and-revert proof identifies the responsible mechanism or mechanisms, the one-root-versus-multiple-root conclusion is explicit, and a deterministic regression is observed failing before production edits.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement the proven bounded reliability correction</name>
  <files>skimd-extension/src/shared/groq.js, skimd-extension/src/features/summary/useSummary.js, skimd-extension/src/shared/components/errorMessages.js, skimd-extension/test/groq-summary.test.js</files>
  <behavior>
    - Paragraph, Bullets, and TLDR all complete under the proven safe request policy, including the transcript-size and latency cases established by Task 1.
    - Retryable 429 and transient 5xx responses follow a bounded policy that respects a capped `Retry-After`; terminal 4xx responses are not retried; time budgets cannot silently expire during an unbounded retry sleep.
    - If request scheduling caused the failure, the three formats use the evidence-backed concurrency limit without duplicate calls; if payload size caused it, input is bounded or reduced using a deterministic transcript-preserving policy proven by tests.
    - A failed batch does not cache incomplete results, and its final stable code reflects the terminal cause rather than a misleading connectivity fallback.
  </behavior>
  <action>Implement only the corrections proven by Task 1. Keep the supported `openai/gpt-oss-120b` contract unless live evidence proves that provider support changed. If concurrency is causal, replace the unconditional `Promise.all` fan-out with the smallest deterministic scheduling or bounded-concurrency policy and test exact request counts. If transcript size/model latency is causal, introduce a deterministic input-budget policy based on measured characters/tokens and preserve representative coverage across the transcript rather than silently truncating only the ending. If retry/deadline interaction is causal, make attempt and total deadlines explicit, bound delay and retry counts, stop immediately on terminal response classes, and ensure aborts are classified from their actual cause. Handle multiple confirmed causes independently instead of collapsing them into one patch. Keep stable safe error codes and update guidance only where classification changes; never surface raw provider data. Remove the existing Groq retry console log or replace it only with privacy-safe diagnostics that contain no user content or secrets. Preserve validate-before-save key behavior, transcript retrieval, tab/video cache scoping, all-or-nothing cache writes, and all three summary formats. Make the failing tests green and add coverage for exact calls, delays/deadlines, terminal classification, and absence of partial cacheable output where applicable.</action>
  <verify>
    <automated>npm --prefix skimd-extension test && npm --prefix skimd-extension run build</automated>
  </verify>
  <done>The causal regressions pass, repeated three-format runs complete under controlled short/long and transient-failure cases, retries and timeouts are bounded without request amplification, terminal messages are truthful, and existing settings/transcript tests plus the production build pass.</done>
</task>

<task type="auto">
  <name>Task 3: Exercise the production click path and scrub diagnostics</name>
  <files>.debug-journal.md</files>
  <action>Build and load the unpacked production extension, open a public captioned YouTube video, and exercise the actual `#btn-summarise` path repeatedly. Verify Paragraph, Bullets, and TLDR render non-empty results, regeneration completes, the button does not remain stuck in `Summarising...`, and no blocking console errors occur. Include at least one longer captioned video and one controlled non-secret retryable provider response to confirm the corrected scheduling/deadline behavior and final user guidance. Record only video duration or transcript character/cue counts, attempt counts, sanitized codes, elapsed duration, and output lengths. Never record the API key, Authorization header, transcript text, generated summary text, or raw provider response. If the automation browser cannot load the unpacked extension or access the user's saved key, document the exact blocker and combine a sanitized direct request-boundary probe with deterministic built-popup state; label this partial evidence rather than claiming live-extension success. Use the debug journal ledger to stop and remove every temporary process, interception, fixture, trace, screenshot, probe, and instrumentation change. Remove `.debug-journal.md` and only its exact git-exclude entry. Compare final status with the starting snapshot, retaining all unrelated user changes. Scan the scoped diff for secrets, user/provider content, raw bodies, debug statements, and temporary markers, then rerun the full tests and production build after cleanup.</action>
  <verify>
    <automated>test ! -e .debug-journal.md && ! git diff -- skimd-extension/src/shared/groq.js skimd-extension/src/features/summary/useSummary.js skimd-extension/src/shared/components/errorMessages.js skimd-extension/test/groq-summary.test.js | rg -n "Authorization: Bearer [^$]|gsk_[A-Za-z0-9]|TRANSCRIPT:\\n[^$]|console\\.(log|debug)\\(|debugger;|\\[DEBUG\\]" && npm --prefix skimd-extension test && npm --prefix skimd-extension run build</automated>
    <human-check>In the reloaded unpacked extension on captioned short and long YouTube videos, click Summarise and Regenerate; confirm all formats render, the button settles, and retryable or terminal failures show one truthful final message. If extension/key access is unavailable, record the exact limitation and label the substitute evidence partial.</human-check>
  </verify>
  <done>Actual browser behavior or explicitly labeled partial evidence covers the reported flow, no diagnostic or sensitive artifact remains, unrelated worktree state is preserved, and all tests/build checks pass after cleanup.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Popup to Groq API | A locally stored credential and untrusted transcript leave the extension through authenticated HTTPS requests. |
| Groq response to retry/orchestration logic | Untrusted statuses, headers, timing, and JSON determine retry, timeout, error, and cache behavior. |
| Runtime investigation to local artifacts | Diagnostic evidence can expose secrets, watched-video content, generated content, or provider payloads unless strictly minimized. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-260905-ovv-01 | Information Disclosure | Groq requests and debug journal | high | mitigate | Permit only lengths, counts, elapsed time, response status, and sanitized codes; prohibit credentials, headers, bodies, transcript text, summary text, and raw provider content; scrub artifacts before completion. |
| T-260905-ovv-02 | Denial of Service | Three-format orchestration and retries | high | mitigate | Prove safe concurrency, exact request counts, bounded retries, capped delay, and explicit total/attempt deadlines with deterministic tests. |
| T-260905-ovv-03 | Tampering | Provider status, Retry-After, and JSON handling | medium | mitigate | Treat responses as untrusted, clamp retry delay, accept only expected response shapes, and expose stable local codes rather than raw provider values. |
| T-260905-ovv-04 | Repudiation | Intermittent failure classification | medium | mitigate | Preserve a sanitized per-attempt causal timeline in tests/journal and explicitly distinguish one causal chain from independently reproducible failures. |
| T-260905-ovv-05 | Spoofing | Credential rejection | medium | mitigate | Preserve the HTTPS Groq endpoint and distinguish 401/403 from provider load, request rejection, timeout, and transport failures without logging the credential. |
</threat_model>

<verification>
1. Sanitized runtime evidence tests request concurrency, transcript size/model latency, and retry/timeout/provider classification as separate hypotheses with causal toggle-and-revert proof.
2. The conclusion states whether several banners arose from one root failure or from multiple independently reproduced causes.
3. The regression is observed failing before production edits and passing after the smallest evidence-backed correction.
4. Controlled short/long inputs and transient/terminal responses prove exact request counts, bounded time, stable classification, and all three summary formats.
5. Full tests and production build pass, including API-key validation and YouTube transcript regressions.
6. Real unpacked-extension QA covers repeated Summarise/Regenerate behavior where feasible; any substitute evidence is labeled partial with the exact blocker.
7. Final scans and status comparison show no secret/content/debug artifact and no mutation of unrelated dirty worktree files.
</verification>

<success_criteria>
- Repeated summarisation no longer fails because Skimd amplifies load, exceeds its own retry/deadline budget, or mishandles transcript size under the conditions proven by the investigation.
- Genuine Groq rate limiting, provider failure, timeout, request rejection, and transport failure end in a single truthful stable message.
- Paragraph, Bullets, and TLDR work and cache together only after the requested set succeeds.
- API-key validation and transcript retrieval remain working and unchanged.
- Privacy-safe failing-first tests and runtime evidence protect the confirmed root cause or causes.
</success_criteria>

<source_audit>
| Source | ID | Item | Plan | Status | Notes |
|--------|----|------|------|--------|-------|
| GOAL | — | Diagnose and fix intermittent Groq busy, unavailable, and timeout failures | 01 | COVERED | Tasks 1-3 cover diagnosis, correction, and production-path QA. |
| REQ | — | No ROADMAP phase requirement IDs are assigned to this quick task | — | COVERED | Quick work is tracked outside phase requirements. |
| RESEARCH | — | No research artifact was requested | — | COVERED | Task 1 performs evidence-led runtime investigation before selecting a correction. |
| CONTEXT | — | Test concurrency, long-input latency, and retry/timeout/provider classes | 01 | COVERED | Task 1 requires all three hypotheses and causal toggles. |
| CONTEXT | — | Determine one root failure versus multiple independent failures | 01 | COVERED | Task 1 requires an explicit evidence-backed conclusion. |
| CONTEXT | — | Preserve key validation, transcripts, privacy, dirty worktree, and all formats | 01 | COVERED | Tasks 1-3 explicitly protect and verify these constraints. |
</source_audit>

<output>
Create `.planning/quick/260905-ovv-diagnose-and-fix-intermittent-groq-busy-/260905-ovv-SUMMARY.md` when done.
</output>
