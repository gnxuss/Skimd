---
quick_id: 260905-njj
phase: quick-260905-njj-transcript-fetching
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
files_modified:
  - skimd-extension/src/shared/youtube.js
  - skimd-extension/src/features/transcript/useTranscript.js
  - skimd-extension/test/youtube-transcript.test.js
estimate:
  tokens: 28000
  raw_tokens: 28000
  tasks: 3
  confidence: low
must_haves:
  truths:
    - "A supported YouTube watch video with an available caption track returns non-empty transcript text and timestamped cues."
    - "The Summarise button becomes enabled after transcript retrieval settles successfully."
    - "A genuinely captionless video remains a distinct no-captions state, while malformed, empty, or failed caption responses surface a retrieval error rather than silent success."
    - "Diagnosis and QA do not record a user's transcript content, cookies, authorization data, or Groq key."
  artifacts:
    - skimd-extension/src/shared/youtube.js
    - skimd-extension/test/youtube-transcript.test.js
  key_links:
    - "The caption track URL selected inside transcriptInjected must produce a response format that the same injected function parses into cues."
    - "fetchTranscript must reject semantic retrieval failures instead of returning hasCaptions true with an empty transcript."
    - "useTranscript must expose non-empty transcript state to SummaryPanel, whose existing button contract enables only when transcript text exists."
---

<objective>
Diagnose and fix the YouTube transcript retrieval path so captioned videos yield usable text and the Summarise action becomes available.

Purpose: The extension cannot deliver its core summarisation flow while caption-track retrieval settles as an empty silent success.
Output: Runtime-confirmed root-cause fix, failing-first regression coverage, real-browser evidence, and removal of all debugging artifacts.
</objective>

<execution_context>
@/Users/j/.codex/gsd-core/workflows/execute-plan.md
@/Users/j/.codex/plugins/cache/sisyphuslabs/omo/0.1.0/skills/debugging/SKILL.md
@/Users/j/.agents/skills/agent-browser/SKILL.md
</execution_context>

<context>
@AGENTS.md
@PRD.md
@.planning/STATE.md
@.planning/codebase/INTEGRATIONS.md
@.planning/codebase/TESTING.md
@.planning/codebase/CONCERNS.md
@skimd-extension/package.json
@skimd-extension/public/manifest.json
@skimd-extension/src/shared/youtube.js
@skimd-extension/src/features/transcript/useTranscript.js
@skimd-extension/src/features/summary/SummaryPanel.jsx
@skimd-extension/src/features/transcript/TranscriptView.jsx
@skimd-extension/test/groq-settings.test.js
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Confirm the empty-caption mechanism and restore one captioned-video path</name>
  <files>skimd-extension/src/shared/youtube.js, skimd-extension/src/features/transcript/useTranscript.js, skimd-extension/test/youtube-transcript.test.js</files>
  <behavior>
    - A representative caption response observed from a supported video is parsed into at least one cue and non-empty joined transcript text.
    - A caption track with an empty or structurally unsupported payload cannot return `{ hasCaptions: true, cues: [], transcript: '' }` as a successful result.
    - The public `fetchTranscript(videoId)` path preserves the selected tab/video identity and returns the parsed transcript contract used by `useTranscript`.
  </behavior>
  <action>Follow the debugging skill phase loop before choosing a fix. Create a project-root `.debug-journal.md`, exclude it locally, record the starting `git status --short`, and journal every temporary script, browser process, trace, screenshot, fixture, and cleanup command before creation. Form and test at least three falsifiable hypotheses with sanitized runtime evidence: H1 the selected caption `baseUrl` returns a format or body shape that `parseXmlCues` does not understand; H2 request construction or page-context/session behavior produces an empty/non-caption payload despite an advertised track; H3 parsing succeeds but the result contract or hook state loses cues/text before `SummaryPanel` receives it. Include the currently observed semantic contradiction—caption track present plus `hasCaptions: true` plus empty cues/text—as a failure condition, not a no-captions result. Reproduce twice using the real injected function captured through a mocked `chrome.scripting.executeScript` boundary and, where browser access permits, record only response status, content type, body length, top-level shape, cue count, and text length from a known public captioned video; never record caption text, cookies, request headers, authorization material, or a Groq key. Confirm the cause only when changing the suspected request/format/parser behavior toggles empty versus populated cues and reverting restores the failure. Then create `youtube-transcript.test.js` with Node's built-in test runner, run it red against the current code, and implement the smallest production correction supported by the toggle evidence. Keep injected code fully self-contained because Chrome serializes `func`; do not extract helpers into outer module scope unless the injected function receives or recreates them. Modify `useTranscript.js` only if runtime evidence proves it participates in the loss or needs to reject the semantic empty-success state; otherwise leave it untouched.</action>
  <verify>
    <automated>npm --prefix skimd-extension test</automated>
  </verify>
  <done>The journal contains two sanitized reproductions, evidence for or against every hypothesis, a causal root-cause statement with toggle proof, a regression observed red before production edits and green afterward, and one captioned-video data path now yields non-empty cues and transcript text.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Lock failure-state distinctions and verify the real popup behavior</name>
  <files>skimd-extension/src/shared/youtube.js, skimd-extension/src/features/transcript/useTranscript.js, skimd-extension/test/youtube-transcript.test.js</files>
  <behavior>
    - A captionless player response returns `hasCaptions: false` with no cues or transcript.
    - An advertised caption track followed by an HTTP failure, empty body, malformed payload, or zero parsed cues produces a stable transcript retrieval error rather than a no-captions or successful state.
    - A successful caption response produces text that makes the existing `disabled={loading || noCaptions || !transcript}` condition false after loading.
  </behavior>
  <action>Expand the failing-first regression file around the confirmed response format and public adapter boundary. Cover a real caption payload shape, a genuinely missing `captionTracks` collection, and the empty/malformed/non-OK response cases implicated by runtime evidence. Preserve the existing user-facing distinction between no captions and retrieval failure and keep the fix within the transcript adapter/hook; do not change `SummaryPanel` merely to force-enable the button, bypass the `!transcript` safety guard, add a third-party transcript package, alter Groq behavior, or address tab-navigation races. Run focused and full tests plus the production build. Then build and load the unpacked extension and use a real browser on one public captioned watch page: open the popup, wait for transcript loading to settle, confirm the Transcript tab has timestamped rows and the Summarise button is enabled before clicking it. Also exercise a captionless control or an intercepted empty caption response to confirm the button stays disabled with the correct no-caption/error state. Use agent-browser or the debugging skill's Playwright workflow where the installed browser exposes extension pages; if extension loading is technically unavailable, record the exact blocker and combine a real YouTube page-world caption probe with the built popup's deterministic browser state, explicitly labeling this as partial runtime evidence. Capture DOM state, cue/text counts, status/content type/body length, and console errors only; redact transcript text and all session or credential data.</action>
  <verify>
    <automated>npm --prefix skimd-extension test && npm --prefix skimd-extension run build</automated>
    <human-check>In a real Chromium extension popup on a public captioned YouTube video, observe loading settle, timestamped transcript rows appear, and `#btn-summarise` become enabled; then verify the captionless or empty-response control stays disabled with the correct state. Record sanitized browser evidence and any feasibility limitation.</human-check>
  </verify>
  <done>Caption success, genuine no-caption, and retrieval-failure states are regression-covered; all tests and the production build pass; and browser evidence demonstrates the original disabled-button scenario now resolves correctly or clearly documents the closest defensible partial-runtime result.</done>
</task>

<task type="auto">
  <name>Task 3: Remove diagnostics and preserve unrelated worktree changes</name>
  <files>.debug-journal.md</files>
  <action>Walk the journal artifact ledger and stop/remove every temporary browser process, fixture, trace, screenshot, instrumentation edit, and generated debug output. Remove `.debug-journal.md` and only its exact `.git/info/exclude` entry. Compare final `git status --short` and `git diff --stat` against the starting snapshot; preserve all unrelated pre-existing modifications and untracked files, and never use broad reset, checkout, restore, or clean commands. Scan the scoped diff for transcript text, cookies, authorization values, Groq-key-like strings, debug statements, temporary logs, and stale markers. Retain only the confirmed transcript fix and its regression test, then rerun the full test/build gates.</action>
  <verify>
    <automated>test ! -e .debug-journal.md && ! git diff -- skimd-extension/src/shared/youtube.js skimd-extension/src/features/transcript/useTranscript.js skimd-extension/test/youtube-transcript.test.js | rg -n "debugger;|\[DEBUG\]|Authorization|Cookie:|gsk_[A-Za-z0-9]" && npm --prefix skimd-extension test && npm --prefix skimd-extension run build</automated>
  </verify>
  <done>All debug artifacts and sensitive runtime content are absent, the final scoped diff contains only the causal fix and regression coverage, unrelated user changes remain untouched, and red-to-green, suite/build, browser, and cleanup evidence is ready for the summary.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Popup to YouTube MAIN world | Privileged extension scripting executes inside an untrusted, mutable YouTube page and returns structured caption data. |
| YouTube player metadata to timed-text endpoint | Track URLs and response payloads are external data that may be absent, malformed, or change format. |
| Browser diagnostics to local journal | Network and page evidence can expose viewing content or session data unless collection is deliberately minimized. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-260905-njj-01 | Information Disclosure | Browser/network diagnostics | high | mitigate | Record only status, content type, body length, structural keys, and counts; prohibit transcript text, cookies, headers, and credentials; scrub artifacts before completion. |
| T-260905-njj-02 | Tampering | Caption track URL and response parsing | medium | mitigate | Treat track metadata and response bodies as untrusted, require successful supported parsing, and convert semantic empty-success responses into explicit errors. |
| T-260905-njj-03 | Denial of Service | Caption fetch/parse path | low | accept | This task preserves the existing bounded single-track retrieval behavior; broader timeout/cancellation work is outside the reported failure. |
</threat_model>

<verification>
1. The new regression is observed failing on the pre-fix implementation and passing after the causal change; reverting the causal change reproduces the failure.
2. `npm --prefix skimd-extension test` and `npm --prefix skimd-extension run build` pass after the final implementation and again after cleanup.
3. Browser QA exercises the exact popup flow on a public captioned video and checks transcript rows plus the enabled Summarise button, with a captionless/empty-response control.
4. Final status and diff comparison proves no debug artifact, transcript content, session material, credential, or unrelated worktree change was added or removed.
</verification>

<success_criteria>
- Supported captioned videos return non-empty transcript text and timestamped cues through the production transcript adapter.
- The existing Summarise button becomes enabled after successful transcript loading without weakening its safety guard.
- Captionless videos and failed/empty caption retrieval remain truthful, distinct UI states.
- The causal fix is protected by failing-first tests and demonstrated through the closest feasible real extension/browser scenario.
</success_criteria>

<source_audit>
| Source | ID | Item | Plan | Status | Notes |
|--------|----|------|------|--------|-------|
| GOAL | — | Captioned YouTube videos return transcript text and enable summarisation | 01 | COVERED | Tasks 1-2 prove the adapter-to-popup path. |
| REQ | — | No phase requirement IDs are assigned to this quick task | — | COVERED | Quick task is tracked outside ROADMAP phase requirements. |
| RESEARCH | — | No research artifact was requested | — | COVERED | Runtime diagnosis is performed during execution. |
| CONTEXT | — | No quick-task CONTEXT.md decisions exist | — | COVERED | User request defines the scope. |
</source_audit>

<output>
Create `.planning/quick/260905-njj-fix-youtube-transcript-fetching-so-suppo/260905-njj-SUMMARY.md` when done.
</output>
