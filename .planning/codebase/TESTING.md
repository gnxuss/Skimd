# Testing Patterns

**Analysis Date:** 2026-09-05

## Test Framework

**Runner:**
- Not detected. `skimd-extension/package.json` has no test script and no Jest, Vitest, Cypress, Playwright, or Testing Library dependency.
- No test configuration file is present under `skimd-extension/`.

**Assertion Library:**
- Not detected.

**Run Commands:**
```bash
npm run lint       # ESLint static check
npm run build      # Production Vite build
npm run dev        # Vite build watch mode
```

There is no automated test, watch-test, or coverage command in `skimd-extension/package.json`.

## Test File Organization

**Location:**
- No test files are present in the repository. Source is organized under `skimd-extension/src/` by popup, feature, and shared modules.

**Naming:**
- Not applicable; no `*.test.*` or `*.spec.*` files detected.

**Structure:**
```
skimd-extension/src/                    # implementation only
skimd-extension/package.json             # lint/build/dev scripts; no test script
```

## Test Structure

**Suite Organization:**
- Not detected. There are no `describe`, `it`, or `test` suites in the repository.

**Patterns:**
- No setup or teardown helpers are defined.
- Current validation is manual extension usage plus lint/build checks, consistent with the definition of done in `PRD.md`.
- For future tests, preserve the feature boundaries used by `skimd-extension/src/features/` and isolate browser/API adapters in `skimd-extension/src/shared/`.

## Mocking

**Framework:** Not detected.

**Patterns:**
- No mocks or test doubles are present.
- Browser APIs (`chrome.tabs`, `chrome.storage`, `chrome.scripting`) are called directly by `skimd-extension/src/shared/youtube.js`, `skimd-extension/src/shared/player.js`, and feature hooks; these will require injected fakes or module mocks in automated tests.
- Network calls use global `fetch` in `skimd-extension/src/shared/groq.js` and injected functions in `skimd-extension/src/shared/youtube.js`; mock responses should cover success, non-OK responses, malformed JSON, timeout, retry, and missing-data branches.

**What to Mock:**
- Mock `chrome.*` APIs, `fetch`, timers, `navigator.clipboard`, and DOM video elements when testing hooks/utilities (`skimd-extension/src/features/export/ExportControls.jsx`, `skimd-extension/src/shared/player.js`).

**What NOT to Mock:**
- Keep pure transformations such as `formatSummary` in `skimd-extension/src/features/summary/formatters.js` as direct unit tests without browser or network mocks.
- Prefer component-level interaction tests against rendered loading/empty/error branches rather than mocking the component under test.

## Fixtures and Factories

**Test Data:**
```javascript
// No fixture or factory pattern exists in the current repository.
// Candidate domain shapes are documented by JSDoc in:
// - skimd-extension/src/shared/youtube.js (cue/chapter results)
// - skimd-extension/src/features/timeline/useTimeline.js (chapter state)
// - skimd-extension/src/features/transcript/useTranscript.js (transcript state)
```

**Location:**
- No fixture directory is present. If tests are introduced, colocate small feature fixtures under a test directory adjacent to the owning feature or under a clearly named `skimd-extension/src/test/` directory.

## Coverage

**Requirements:** None enforced. `skimd-extension/package.json` has no coverage dependency, threshold, or script.

**View Coverage:**
```bash
# Not available until a test runner and coverage provider are added.
```

## Test Types

**Unit Tests:**
- Not currently used. Highest-value pure-unit targets are `formatSummary` in `skimd-extension/src/features/summary/formatters.js` and parsing/formatting helpers in `skimd-extension/src/shared/youtube.js` and `skimd-extension/src/features/transcript/TranscriptView.jsx`.

**Integration Tests:**
- Not currently used. The main integration boundary is React hooks coordinating storage, browser tabs, injected YouTube scripts, and Groq (`skimd-extension/src/features/summary/useSummary.js`, `skimd-extension/src/features/transcript/useTranscript.js`, `skimd-extension/src/features/settings/useApiKey.js`).

**E2E Tests:**
- Not used. Realistic verification currently requires loading the built extension and manually exercising YouTube, captions/chapters, API-key, theme, seek, and export flows, as required by `PRD.md`.

## Common Patterns

**Async Testing:**
```javascript
// No async test helper pattern exists. Production async state follows:
// try { await operation(); } catch (err) { setError(...); } finally { setLoading(false); }
// See skimd-extension/src/features/timeline/useTimeline.js.
```

**Error Testing:**
```javascript
// No error-test pattern exists. Production errors are asserted/rendered by code:
// Error objects carry `code`, and UI maps it through ErrorBanner.
// See skimd-extension/src/shared/groq.js and skimd-extension/src/shared/components/ErrorBanner.jsx.
```

Current verification evidence: `npm run build` succeeds in `skimd-extension/`; `npm run lint` executes but fails with 40 `no-undef` errors because Chrome globals and Vite `__dirname` are absent from `skimd-extension/eslint.config.js`.

---

*Testing analysis: 2026-09-05*
