# Coding Conventions

**Analysis Date:** 2026-09-05

## Naming Patterns

**Files:**
- React components use PascalCase `.jsx` names, for example `skimd-extension/src/features/summary/SummaryPanel.jsx` and `skimd-extension/src/shared/components/ErrorBanner.jsx`.
- Hooks use the `useX` camelCase convention in `.js` files, for example `skimd-extension/src/features/transcript/useTranscript.js` and `skimd-extension/src/shared/hooks/useTheme.js`.
- Plain shared modules use lower camelCase names such as `skimd-extension/src/shared/youtube.js`, `skimd-extension/src/shared/player.js`, and `skimd-extension/src/features/summary/formatters.js`.

**Functions:**
- Functions and handlers use camelCase (`fetchTranscript`, `handleCueClick`, `summariseAll`).
- React components are PascalCase and are generally default exports (`SummaryPanel`, `TimelineView`).
- Small injected/helper functions are named descriptively (`parseXmlCues`, `resolveYouTubeTab`, `findActiveCueIndex`).

**Variables:**
- Local variables and state setters use camelCase (`videoId`, `setHasCaptions`, `activeCueIdx`).
- Constants use uppercase snake case for configuration and fixed values (`GROQ_URL`, `REQUEST_TIMEOUT_MS`, `MAX_RETRIES`, `STORAGE_KEY`).
- Object keys representing feature state use stable lower-case names (`paragraph`, `bullets`, `tldr`, `loading`, `error`).

**Types:**
- The codebase is JavaScript/JSX without TypeScript types. Public functions and component props use JSDoc object annotations, for example in `skimd-extension/src/shared/groq.js`, `skimd-extension/src/shared/player.js`, and `skimd-extension/src/features/settings/useApiKey.js`.
- Error objects conventionally carry a string `code` property alongside `message`; preserve this shape when adding error paths.

## Code Style

**Formatting:**
- ESLint 9 flat config is defined in `skimd-extension/eslint.config.js`; it targets `**/*.{js,jsx}`, uses the recommended JavaScript rules, React Hooks rules, and React Refresh rules.
- Existing source uses two-space indentation, semicolons, single-quoted JavaScript strings, trailing commas in multiline literals, and JSX with parentheses around multiline returns. `skimd-extension/vite.config.js` follows the same broad style but uses semicolons consistently.
- JSX styling is predominantly Tailwind utility classes, with shared design tokens and custom CSS in `skimd-extension/src/styles/global.css`.

**Linting:**
- Run `npm run lint` from `skimd-extension/`.
- The current config enforces `no-unused-vars` as an error, ignoring variables matching `^[A-Z_]`, and enables `react-hooks`/`react-refresh` recommended rules.
- Chrome extension globals are not declared in `skimd-extension/eslint.config.js`, so current lint reports `no-undef` for `chrome` throughout extension modules. `__dirname` is likewise not declared for `skimd-extension/vite.config.js`.

## Import Organization

**Order:**
1. React and React hooks (`import React, { ... } from 'react'`).
2. Relative feature/shared components and hooks.
3. Relative utility/API modules.

Imports are grouped at the top of each module; there is no automated import sorter. See `skimd-extension/src/popup/App.jsx` and `skimd-extension/src/features/transcript/TranscriptView.jsx`.

**Path Aliases:**
- Not detected. Modules use explicit relative paths such as `../../shared/player.js` and include file extensions for local imports.

## Error Handling

**Patterns:**
- Async operations use `try/catch/finally`, clear loading state in `finally`, and expose structured state through hooks (`skimd-extension/src/features/summary/useSummary.js`, `skimd-extension/src/features/timeline/useTimeline.js`).
- Shared API functions throw `Error` instances with a custom `code` (`INVALID_KEY`, `GROQ_UNAVAILABLE`, `TRANSCRIPT_ERROR`) so UI components can map failures to user-facing states; follow `skimd-extension/src/shared/groq.js` and `skimd-extension/src/shared/youtube.js`.
- Best-effort storage and browser API cleanup intentionally catches and ignores failures (`skimd-extension/src/features/settings/useApiKey.js`, `skimd-extension/src/features/summary/useSummary.js`, `skimd-extension/src/shared/player.js`).
- UI renders loading, empty, and error branches explicitly, commonly using `ErrorBanner` from `skimd-extension/src/shared/components/ErrorBanner.jsx`.

## Logging

**Framework:** `console.log`; no dedicated logging package is configured.

**Patterns:**
- Logs are prefixed with `[Skimd]` and are used for retry/debug information in `skimd-extension/src/shared/groq.js`, `skimd-extension/src/shared/youtube.js`, and `skimd-extension/src/features/transcript/useTranscript.js`.
- Do not log API keys or full sensitive payloads. Existing transcript/chapter response logs in `skimd-extension/src/shared/youtube.js` should be treated as debug-only output when modifying observability.

## Comments

**When to Comment:**
- Comment non-obvious browser-extension constraints, injected-script boundaries, lifecycle behavior, and layout decisions. Examples are the extensive rationale in `skimd-extension/src/shared/youtube.js`, `skimd-extension/src/shared/player.js`, and `skimd-extension/src/styles/global.css`.
- Use section separators (`// ── ... ──`) for major regions in larger modules such as `skimd-extension/src/popup/App.jsx` and `skimd-extension/src/background/service-worker.js`.

**JSDoc/TSDoc:**
- JSDoc is common for exported functions, hooks, component props, return values, and parsing helpers. Follow the examples in `skimd-extension/src/shared/groq.js` and `skimd-extension/src/features/timeline/useTimeline.js`.
- Comments document current behavior and assumptions; keep prop contracts close to component declarations.

## Function Design

**Size:** Keep UI components focused on rendering and local interaction; extract asynchronous stateful behavior into hooks (`skimd-extension/src/features/summary/useSummary.js`, `skimd-extension/src/features/transcript/useTranscript.js`). Some current components are large, especially `skimd-extension/src/features/summary/SummaryPanel.jsx` (316 lines) and `skimd-extension/src/popup/App.jsx` (291 lines), so additions should prefer extracting reusable sections/helpers.

**Parameters:** Use a single destructured object for service calls with multiple values, as in `summarise({ transcript, format, apiKey })` in `skimd-extension/src/shared/groq.js`; use destructured props for components.

**Return Values:** Hooks return a stable object of state and callbacks. Async service functions return parsed domain data or throw coded errors. Defensive helpers return `null`, empty arrays, or no-op when browser context is unavailable, as in `skimd-extension/src/shared/player.js`.

## Module Design

**Exports:** Feature hooks and shared utilities use named exports; React view components use default exports. Match the local module’s existing export style.

**Barrel Files:** Not detected. Import concrete modules directly, including `.js`/`.jsx` extensions.

---

*Convention analysis: 2026-09-05*
