# Technology Stack

**Analysis Date:** 2026-09-05

## Languages

**Primary:**
- JavaScript (ES modules, ES2020+ browser APIs) - extension logic, service worker, YouTube page-context functions, hooks, and utilities in `skimd-extension/src/**/*.js`
- JSX - React popup UI components in `skimd-extension/src/**/*.jsx`

**Secondary:**
- CSS - Tailwind directives, custom design tokens, animations, and popup styles in `skimd-extension/src/styles/global.css`
- JSON - Chrome manifest and npm metadata in `skimd-extension/public/manifest.json` and `skimd-extension/package.json`
- HTML - popup shell and early theme bootstrap in `skimd-extension/popup.html` and `skimd-extension/src/popup/index.html`

## Runtime

**Environment:**
- Chromium browser extension runtime using Manifest V3; popup React code, a module service worker, and a YouTube content-script entry are declared in `skimd-extension/public/manifest.json`
- Node.js 20.19+ or 22.12+ for the Vite 8 toolchain (Vite's installed engine declaration in `skimd-extension/package-lock.json`)

**Package Manager:**
- npm
- Lockfile: present (`skimd-extension/package-lock.json`, lockfile version 3)

## Frameworks

**Core:**
- React 19.2.4 - popup application and feature components (`skimd-extension/src/popup/App.jsx`)
- Chrome Extensions Manifest V3 - packaging, permissions, popup, content script, service worker, and command registration (`skimd-extension/public/manifest.json`)

**Testing:**
- Not detected. `skimd-extension/package.json` has no test runner or test script.

**Build/Dev:**
- Vite 8.0.2 - multi-entry production/watch builds (`skimd-extension/vite.config.js`)
- `@vitejs/plugin-react` 6.0.1 - React JSX transform and Vite integration (`skimd-extension/vite.config.js`)
- Tailwind CSS 4.2.2 with `@tailwindcss/vite` 4.2.2 - utility styling and Vite plugin (`skimd-extension/src/styles/global.css`, `skimd-extension/vite.config.js`)
- ESLint 9.39.4 with `@eslint/js`, `eslint-plugin-react-hooks` 7.0.1, and `eslint-plugin-react-refresh` 0.5.2 - JavaScript/JSX linting (`skimd-extension/eslint.config.js`)

## Key Dependencies

**Critical:**
- `react` 19.2.4 and `react-dom` 19.2.4 - render the popup UI (`skimd-extension/src/popup/main.jsx`)
- `@types/chrome` 0.1.38 - Chrome API development types; no TypeScript source is present (`skimd-extension/package.json`)

**Infrastructure:**
- `vite` 8.0.2 - bundles `popup.html`, `src/content/index.js`, and `src/background/service-worker.js` to `skimd-extension/dist/`
- `tailwindcss` 4.2.2 - CSS utility generation from `skimd-extension/src/styles/global.css`
- No runtime HTTP, database, ORM, auth, analytics, or state-management package is installed; network access uses the browser's native `fetch` in `skimd-extension/src/shared/groq.js` and `skimd-extension/src/shared/youtube.js`.

## Configuration

**Environment:**
- Build configuration is in `skimd-extension/vite.config.js`; lint configuration is in `skimd-extension/eslint.config.js`; extension permissions and entry points are in `skimd-extension/public/manifest.json`.
- `.env`, `.env.development`, and `.env.production` exist under `skimd-extension/` and must be treated as environment configuration; their contents are not part of this map.
- The Groq key is deliberately runtime/user supplied and is read from `chrome.storage.local` by `skimd-extension/src/features/settings/useApiKey.js`; `skimd-extension/src/shared/groq.js` does not read environment variables.

**Build:**
- `skimd-extension/vite.config.js` uses `base: './'`, output directory `dist`, flat entry names (`popup.js`, `content-script.js`, `service-worker.js`), and copies static files from `public/`.
- Root `skimd-extension/popup.html` is the popup entry; `skimd-extension/src/popup/index.html` is a source-side HTML/theme bootstrap artifact and is not a Vite rollup input.
- npm scripts: `npm run dev` (Vite development watch build), `npm run build` (production build), `npm run lint`, and `npm run preview` (`skimd-extension/package.json`).

## Platform Requirements

**Development:**
- Node.js satisfying Vite 8's engine requirement and npm; install from `skimd-extension/` using `skimd-extension/package-lock.json`.
- A Chromium browser capable of Manifest V3, `chrome.scripting.executeScript`, popup commands, storage areas, and active-tab access.

**Production:**
- Load/package `skimd-extension/dist/` as an unpacked Chrome/Chromium extension or publish as a Manifest V3 extension. A hosted Skimd server is not required.
- Users need access to YouTube and Groq endpoints and must provide their own Groq API key through the popup settings.

---

*Stack analysis: 2026-09-05*
