---
quick_id: 260905-mtz
phase: quick-260905-mtz-groq-key-validation
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
files_modified:
  - skimd-extension/package.json
  - skimd-extension/src/shared/groq.js
  - skimd-extension/src/features/settings/useApiKey.js
  - skimd-extension/src/features/settings/SettingsPanel.jsx
  - skimd-extension/src/shared/components/ErrorBanner.jsx
  - skimd-extension/src/shared/components/errorMessages.js
  - skimd-extension/test/groq-settings.test.js
must_haves:
  truths:
    - Saving a syntactically non-empty Groq key uses a provider-valid validation request and persists the key only after a successful response.
    - A rejected key shows the specific invalid-key guidance, while network/provider failures show distinct actionable guidance instead of the unknown-error fallback.
    - Failed validation never displays a saved confirmation and never writes the candidate key to local storage.
    - No real API key is requested, printed, recorded, or committed during diagnosis, tests, or browser QA.
  artifacts:
    - skimd-extension/test/groq-settings.test.js
    - skimd-extension/src/shared/groq.js
    - skimd-extension/src/shared/components/ErrorBanner.jsx
  key_links:
    - validateKey maps observed Groq HTTP/network outcomes to stable error codes consumed by useApiKey.
    - useApiKey returns an explicit save result that SettingsPanel uses to display success only after persistence.
    - SettingsPanel passes either the stable code or an explicitly supported message contract to ErrorBanner, and ErrorBanner renders the intended text.
---

<objective>
Diagnose the observable Groq-key save failure, confirm its runtime mechanism, and minimally repair both key validation and settings feedback without handling a real secret.

Purpose: Users must be able to save a working Groq key and understand rejected-key or connectivity failures without misleading success or generic fallback UI.
Output: A regression-tested validation/error contract, a minimal root-cause fix, and runtime/browser QA evidence with all temporary debug artifacts removed.
</objective>

<execution_context>
@/Users/j/.codex/gsd-core/workflows/execute-plan.md
@/Users/j/.codex/plugins/cache/sisyphuslabs/omo/0.1.0/skills/debugging/SKILL.md
</execution_context>

<context>
@AGENTS.md
@PRD.md
@.planning/STATE.md
@.planning/codebase/CONCERNS.md
@.planning/codebase/TESTING.md
@skimd-extension/package.json
@skimd-extension/src/shared/groq.js
@skimd-extension/src/features/settings/useApiKey.js
@skimd-extension/src/features/settings/SettingsPanel.jsx
@skimd-extension/src/shared/components/ErrorBanner.jsx
@skimd-extension/src/popup/App.jsx
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Reproduce and isolate the Groq settings failure with sanitized runtime evidence</name>
  <files>skimd-extension/package.json, skimd-extension/test/groq-settings.test.js</files>
  <behavior>
    - A mocked successful Groq response makes validation resolve without exposing the bearer value.
    - A mocked authentication rejection maps to INVALID_KEY; transport failure and non-auth provider failure map to GROQ_UNAVAILABLE.
    - The settings error-rendering contract resolves INVALID_KEY and GROQ_UNAVAILABLE to their specific user-facing messages rather than the unknown fallback.
    - A failed save result cannot be interpreted as success by the settings flow.
  </behavior>
  <action>Before creating any test or instrumentation artifact, create project-root `.debug-journal.md`, add it to `.git/info/exclude`, record the starting `git status --short`, every temporary file/process/port, and exact cleanup commands. Never inspect, print, request, paste, or journal a real API key; use a clearly synthetic value and ensure captured request evidence redacts the Authorization header and body. Establish at least three falsifiable hypotheses: (H1) the live validation payload/model/endpoint is rejected even for an otherwise accepted credential, (H2) response classification loses an authentication/provider/network distinction, and (H3) SettingsPanel's `message` prop is ignored because ErrorBanner accepts only `code` (also track the existing unconditional post-await saved state as a linked UI-state hypothesis). Reproduce twice with a deterministic runtime harness that calls the real `validateKey` code using mocked `fetch`, recording sanitized URL, status, request field names, thrown code/message, and storage side effects; when feasible, compare the request schema against a browser DevTools/Playwright mocked-response run, never against a real secret. Obtain toggle proof for each confirmed mechanism; do not select a fix from source inspection alone. Add a dependency-free Node built-in test script to `package.json` and a focused `node:test` regression file. Write the tests before production edits and capture the failing output in the journal. If JSX prevents direct component testing, test an extracted pure error-message resolver that ErrorBanner will consume in Task 2; do not add a test framework solely for this bug.</action>
  <verify>
    <automated>npm --prefix skimd-extension test</automated>
  </verify>
  <done>The journal contains two sanitized reproductions, evidence for/refutation of all hypotheses, a causal root-cause statement with toggle proof, and a failing-first regression command whose failure represents the validation/error-rendering bug without any credential material.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Apply the minimal validation and settings-feedback fix, then prove the user flow</name>
  <files>skimd-extension/src/shared/groq.js, skimd-extension/src/features/settings/useApiKey.js, skimd-extension/src/features/settings/SettingsPanel.jsx, skimd-extension/src/shared/components/ErrorBanner.jsx, skimd-extension/src/shared/components/errorMessages.js, skimd-extension/test/groq-settings.test.js</files>
  <behavior>
    - The confirmed provider-compatible validation request succeeds under the mocked success contract and preserves INVALID_KEY versus GROQ_UNAVAILABLE classification.
    - INVALID_KEY renders the rejected-key guidance and GROQ_UNAVAILABLE renders connectivity/provider guidance.
    - SettingsPanel shows Key saved only when saveKey reports successful validation and persistence.
    - Empty, rejected, network-failed, and provider-failed attempts do not mutate stored key state.
  </behavior>
  <action>Implement only the mechanisms confirmed in Task 1. Adjust `validateKey`'s endpoint/payload/model/status handling only as runtime evidence requires, keeping `AbortController`, bounded timeout/retry behavior, and stable error codes; do not log request options, headers, bodies, or key values. Make the save contract explicit (success/failure return or thrown failure) so `handleSave` sets confirmation only after successful persistence. Consolidate settings error text through a small pure resolver only if needed for the dependency-free test seam, and update ErrorBanner to accept the contract actually supplied by SettingsPanel while preserving existing code-based callers in transcript, timeline, and summary views. Run the new regression red, apply the smallest production change, then run it green; verify the test fails again when the causal fix is temporarily toggled off and passes when restored. Do not address unrelated Groq retry, transcript, permission, privacy-copy, or lint-configuration concerns.</action>
  <verify>
    <automated>npm --prefix skimd-extension test && npm --prefix skimd-extension run build && npm --prefix skimd-extension run lint</automated>
    <human-check>Build/load the unpacked extension in Chromium and exercise the popup settings save flow with a synthetic key while intercepting Groq responses: mocked 401 shows rejected-key guidance and no success/storage write; mocked network failure shows connectivity guidance; mocked success shows Key saved and a storage write. Prefer Playwright with a persistent Chromium extension context when available without adding dependencies; otherwise record the exact feasibility blocker and perform the closest real-browser extension check manually. Capture DOM text, sanitized response status, console/page errors, and storage outcome without capturing request headers/body or the synthetic key.</human-check>
  </verify>
  <done>The exact original settings interaction produces specific error text, successful validation alone produces save confirmation and persistence, the regression suite and production build pass, lint is run and any pre-existing baseline failures are separated from new failures, and no real or synthetic key value appears in logs/screenshots/journal.</done>
</task>

<task type="auto">
  <name>Task 3: Remove debug artifacts and preserve the user's unrelated worktree changes</name>
  <files>.debug-journal.md</files>
  <action>Walk every entry in the journal's artifact ledger: stop inspector/browser/dev processes started for this task, remove temporary scripts, traces, screenshots, instrumentation, and generated debug output, then remove `.debug-journal.md` and its exact `.git/info/exclude` entry. Compare final `git status --short` and `git diff --stat` with the starting snapshot; preserve all unrelated pre-existing changes and never use broad checkout/reset/clean commands. Scan only this task's diff for debugger statements, debug logging, credential-like synthetic literals, Authorization values, request bodies, trace files, and stale markers. Retain only the production fix, regression test, and intentional package script change.</action>
  <verify>
    <automated>test ! -e .debug-journal.md && ! git diff -- skimd-extension | rg -n "debugger;|\[DEBUG\]|gsk_[A-Za-z0-9]|Authorization: Bearer" && npm --prefix skimd-extension test && npm --prefix skimd-extension run build</automated>
  </verify>
  <done>All journaled debug artifacts are removed, the final diff contains only the scoped fix/test changes, unrelated dirty-worktree changes remain untouched, and final red-to-green, suite/build, browser-flow, and cleanup evidence is ready for the completion summary.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Settings UI to extension state/storage | User-supplied credential crosses into React state and `chrome.storage.local`; failed validation must not persist it. |
| Extension to Groq API | Credential is sent as a bearer secret over HTTPS; diagnostics must never expose it. |
| Mock/browser evidence to journal | Runtime evidence may contain requests; only sanitized metadata and response outcomes may be recorded. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-260905-mtz-01 | Information Disclosure | Groq request diagnostics | high | mitigate | Prohibit logging/capturing headers, bodies, or key values; use synthetic credentials and scan the final diff/artifacts. |
| T-260905-mtz-02 | Tampering | `chrome.storage.local` key persistence | medium | mitigate | Test that storage writes occur only after confirmed validation success and never on rejected/network/provider failures. |
| T-260905-mtz-03 | Spoofing | Mocked Groq responses | low | accept | Mocks prove deterministic client behavior but not possession of a live credential; browser QA records this limitation and does not claim live-account validation. |
</threat_model>

<verification>
1. The regression test is observed failing before the fix and passing after it, with toggle proof recorded.
2. `npm --prefix skimd-extension test` and `npm --prefix skimd-extension run build` pass.
3. `npm --prefix skimd-extension run lint` is executed; no new lint errors are introduced, and the documented existing Chrome-global/Vite-config failures are reported separately if still present.
4. A real Chromium extension popup is exercised with intercepted, sanitized success/401/network responses when feasible without installing new dependencies or using a real key.
5. Final status/diff comparison proves all debug artifacts are gone and unrelated user changes were preserved.
</verification>

<success_criteria>
- A valid provider response allows the key-save path to complete and persist exactly once.
- Invalid credentials and availability failures show distinct, specific messages rather than `Something went wrong`.
- Failed saves never show `Key saved` and never overwrite local storage.
- Verification evidence contains no key values or sensitive request data.
</success_criteria>

<output>
Create `.planning/quick/260905-mtz-diagnose-and-fix-groq-api-key-validation/260905-mtz-SUMMARY.md` when done.
</output>
