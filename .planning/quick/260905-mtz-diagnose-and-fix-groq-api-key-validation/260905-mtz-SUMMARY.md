---
quick_id: 260905-mtz
phase: quick-260905-mtz-groq-key-validation
plan: 01
subsystem: extension-settings
tags: [groq, validation, settings, error-handling, node-test]
status: complete
requires: []
provides:
  - Provider-compatible credential validation through the Groq models endpoint
  - Stable invalid-key versus provider/network error guidance
  - Explicit validate-before-persist save result contract
affects: [extension-popup, groq-client]
tech-stack:
  added: [node:test]
  patterns: [pure error-message resolver, explicit boolean save result]
key-files:
  created:
    - skimd-extension/src/shared/components/errorMessages.js
    - skimd-extension/test/groq-settings.test.js
  modified:
    - skimd-extension/package.json
    - skimd-extension/src/shared/groq.js
    - skimd-extension/src/features/settings/useApiKey.js
    - skimd-extension/src/features/settings/SettingsPanel.jsx
    - skimd-extension/src/shared/components/ErrorBanner.jsx
    - skimd-extension/src/popup/App.jsx
decisions:
  - Validate credentials with GET /openai/v1/models so validation is independent of completion model and payload compatibility.
  - Treat both 401 and 403 as INVALID_KEY; classify provider and transport failures as GROQ_UNAVAILABLE.
  - Return true only after persistence succeeds and false for every handled validation failure.
metrics:
  tasks: 3
  commits: 2
  completed: 2026-09-05
---

# Quick Task 260905-mtz: Groq Key Validation Summary

Groq credentials are now validated through the provider's credential-only models endpoint, with explicit save outcomes, validate-before-persist ordering, and specific settings guidance for rejected credentials versus connectivity/provider failures.

## Root Cause

The settings flow combined three causal faults:

1. Validation used a chat-completion request, coupling credential acceptance to a specific model and completion payload rather than a provider-valid credential check.
2. `SettingsPanel` passed a `message` prop to `ErrorBanner`, while `ErrorBanner` accepted only `code`, producing the unknown-error fallback.
3. `saveKey` swallowed validation failures and returned `undefined`, while `handleSave` unconditionally marked the operation saved after awaiting it. The parent popup wrapper also discarded the new result until corrected.

Runtime toggles confirmed the mechanisms: schema-gated mocked fetch rejected the completion contract and accepted the models contract; temporarily restoring the old endpoint made the focused regression fail; the pure error/save contract toggled unknown/misleading UI behavior to the intended messages and explicit success state.

## Commits

- `b7afd00` — `test(quick-260905-mtz): add failing Groq settings regression tests`
- `85dd851` — `fix(quick-260905-mtz): repair Groq key validation feedback`

## Verification

- RED observed: `npm --prefix skimd-extension test` failed before production edits.
- Causal toggle observed: changing validation back to the chat-completions URL failed the focused URL contract test; restoring `/models` passed it.
- `npm --prefix skimd-extension test`: 5/5 passing.
- `npm --prefix skimd-extension run build`: passing with Vite 8.0.2.
- `npm --prefix skimd-extension run lint`: executed; the known baseline remains at 40 `no-undef` errors for Chrome globals and `__dirname`. No scoped resolver/test lint error was introduced.
- Final credential/debug scan passed; no credential-like literals, bearer values, debug statements, logs, traces, screenshots, or temporary instrumentation remain.

## Browser QA

Chromium was driven with `agent-browser` against the production-built popup surface, using a temporary Chrome API shim and an in-memory synthetic candidate only.

- Network abort: connectivity guidance rendered; storage writes `0`; stored-key presence `false`.
- Provider 401: rejected-key guidance rendered; storage writes `0`; stored-key presence `false`.
- Browser console/page errors: none reported during the working surface runs.

Limitation: the installed Chromium/agent-browser build accepted the unpacked-extension launch flag but exposed no unpacked item in `chrome://extensions`; direct popup navigation returned `ERR_FILE_NOT_FOUND`. Its response-body route also did not intercept the cross-origin provider request, so mocked-success persistence could not be demonstrated in the browser. Success and exactly-once persistence are proven by the dependency-free runtime regression; no live-account validation is claimed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Preserved the explicit save result through the popup boundary**

- **Found during:** Task 2 browser-flow preparation
- **Issue:** `App.jsx` wrapped `saveKey` without returning its boolean result, preventing `SettingsPanel` from observing success.
- **Fix:** Passed `saveKey` directly as `onSave`.
- **Files modified:** `skimd-extension/src/popup/App.jsx`
- **Commit:** `85dd851`

## Cleanup

The debug journal, local exclude entry, temporary Chrome shim, browser sessions, and preview process were removed. Final status matches the starting unrelated dirty-worktree snapshot; `skimd-extension/src/.DS_Store` remains the user's pre-existing modification and was not staged or changed by this task.

## Self-Check: PASSED

- All production and regression files exist.
- Both task commits exist.
- Required test/build verification passes after cleanup.
- Summary status is complete and no debug artifact remains.
