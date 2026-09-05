# Codebase Structure

**Analysis Date:** 2026-09-05

## Directory Layout

```text
Skimd-V2/
├── AGENTS.md                         # Repository operating instructions
├── PRD.md                            # Product scope and requirements
├── PROJECT_TRUTH.md                  # Migration/context notes
├── DECISIONS.md                      # Architectural decision log (currently empty)
└── skimd-extension/
    ├── package.json                  # Scripts and React/Vite/Tailwind dependencies
    ├── package-lock.json             # npm lockfile
    ├── vite.config.js                # MV3 multi-entry build
    ├── eslint.config.js              # ESLint flat config
    ├── popup.html                    # Vite popup entry HTML
    ├── public/
    │   ├── manifest.json             # Chrome MV3 manifest and permissions
    │   └── icons/                    # Extension icons
    ├── src/
    │   ├── popup/                    # React root and popup shell
    │   ├── features/
    │   │   ├── summary/              # Summary generation and presentation
    │   │   ├── transcript/            # Transcript retrieval, playback, view
    │   │   ├── timeline/              # Chapter retrieval and view
    │   │   ├── settings/              # API-key settings
    │   │   └── export/                # Copy/plain-text export controls
    │   ├── shared/                    # Shared React primitives and adapters
    │   │   ├── components/            # Buttons, toggles, banners, skeletons
    │   │   ├── hooks/                 # Cross-feature hooks such as theme
    │   │   ├── groq.js                # Groq provider adapter
    │   │   ├── player.js              # YouTube player adapter
    │   │   └── youtube.js             # Transcript/chapter adapter
    │   └── styles/                    # Tailwind import, tokens, layout, motion
    │   ├── background/                # MV3 service worker
    │   └── content/                   # YouTube content-script entry
    ├── dist/                          # Generated Vite build output; ignored by ESLint
    └── README.md                      # Extension-specific usage/build notes
```

## Directory Purposes

**`skimd-extension/src/popup/`:**
- Purpose: Popup composition and React mount point.
- Contains: `main.jsx`, `App.jsx`, and an unused/secondary `index.html` bootstrap artifact.
- Key files: `skimd-extension/src/popup/main.jsx`, `skimd-extension/src/popup/App.jsx`.

**`skimd-extension/src/features/`:**
- Purpose: Organize user-facing capabilities by vertical slice.
- Contains: Each feature's view, hook, and feature-specific formatting/control logic.
- Key files: `summary/SummaryPanel.jsx`, `transcript/TranscriptView.jsx`, `timeline/TimelineView.jsx`, `settings/SettingsPanel.jsx`, `export/ExportControls.jsx`.

**`skimd-extension/src/shared/`:**
- Purpose: Cross-feature browser/provider integrations and reusable UI.
- Contains: `youtube.js`, `groq.js`, `player.js`, `hooks/useTheme.js`, and `components/` primitives/skeletons.
- Key files: `skimd-extension/src/shared/youtube.js`, `skimd-extension/src/shared/groq.js`, `skimd-extension/src/shared/player.js`.

**`skimd-extension/src/background/`:**
- Purpose: Chrome MV3 service-worker event handlers.
- Contains: `service-worker.js`.
- Key files: `skimd-extension/src/background/service-worker.js`.

**`skimd-extension/src/content/`:**
- Purpose: Scripts declared for matching YouTube pages.
- Contains: `index.js`, currently an intentionally empty entry with explanatory comments.
- Key files: `skimd-extension/src/content/index.js`.

**`skimd-extension/public/`:**
- Purpose: Static assets copied unchanged into the build.
- Contains: `manifest.json`, favicon/icon SVGs, and raster extension icons.
- Key files: `skimd-extension/public/manifest.json`, `skimd-extension/public/icons/`.

**`skimd-extension/src/styles/`:**
- Purpose: Global popup CSS and Tailwind v4 design tokens.
- Contains: `global.css` with palette, typography, fixed shell, scrollbar, animations, and reduced-motion rules.
- Key files: `skimd-extension/src/styles/global.css`.

## Key File Locations

**Entry Points:**
- `skimd-extension/popup.html`: Vite HTML entry loaded by the manifest popup.
- `skimd-extension/src/popup/main.jsx`: Calls `createRoot` and mounts `App`.
- `skimd-extension/src/background/service-worker.js`: MV3 background entry.
- `skimd-extension/src/content/index.js`: YouTube content-script entry.

**Configuration:**
- `skimd-extension/package.json`: npm scripts and dependencies.
- `skimd-extension/vite.config.js`: React/Tailwind plugins, `dist` output, and three JS entries.
- `skimd-extension/eslint.config.js`: JavaScript/JSX lint rules.
- `skimd-extension/public/manifest.json`: permissions, host matches, action, command, and worker.

**Core Logic:**
- `skimd-extension/src/popup/App.jsx`: Top-level UI/data composition.
- `skimd-extension/src/shared/youtube.js`: Transcript/chapter acquisition and parsing.
- `skimd-extension/src/shared/groq.js`: Summary provider boundary.
- `skimd-extension/src/features/summary/useSummary.js`: Parallel generation and session cache.
- `skimd-extension/src/shared/player.js`: Seek/playback page interaction.

**Testing:**
- No test directory or `*.test.*`/`*.spec.*` files are present.
- Verification currently relies on `npm run lint`, `npm run build`, and manual extension use described by `PRD.md`.

## Naming Conventions

**Files:**
- React components use PascalCase JSX names, e.g. `SummaryPanel.jsx`, `TimelineView.jsx`, `ErrorBanner.jsx`.
- Hooks and utilities use camelCase, e.g. `useTranscript.js`, `usePlaybackTime.js`, `formatters.js`.
- Chrome entry is kebab-case, `service-worker.js`, matching the manifest/build output.

**Directories:**
- Feature directories use lowercase capability names: `summary`, `transcript`, `timeline`, `settings`, `export`.
- Shared concerns are grouped under `shared/components` and `shared/hooks`; runtime contexts under `background`, `content`, and `popup`.

## Where to Add New Code

**New Feature:**
- Primary code: Add a lowercase vertical slice under `skimd-extension/src/features/<feature>/`, with a PascalCase view and `use<Feature>.js` hook where asynchronous state is needed.
- Wiring: Import and compose it in `skimd-extension/src/popup/App.jsx` only when it belongs in the popup's top-level navigation/state.
- Tests: No established test location; if tests are introduced, co-locate them beside the feature files and add a package script/config deliberately.

**New Component/Module:**
- Reusable UI: `skimd-extension/src/shared/components/`.
- Provider/browser boundary: `skimd-extension/src/shared/` (keep page injection self-contained in `youtube.js` or a similarly dedicated adapter).
- Popup-specific composition: `skimd-extension/src/popup/`.

**Utilities:**
- Shared helpers: `skimd-extension/src/shared/` or a feature's own directory when not reused.
- Formatting that only serves summaries belongs in `skimd-extension/src/features/summary/formatters.js` or the corresponding feature directory.

## Special Directories

**`skimd-extension/dist/`:**
- Purpose: Vite-generated extension bundle (`popup.js`, `content-script.js`, `service-worker.js`, copied manifest/assets).
- Generated: Yes.
- Committed: No; it is ignored by `skimd-extension/.gitignore`. Treat source/config as authoritative and do not hand-edit build output.

**`skimd-extension/node_modules/`:**
- Purpose: npm-installed dependencies when installed locally.
- Generated: Yes.
- Committed: No (not present in the tracked source listing).

**`skimd-extension/public/icons/`:**
- Purpose: Static Chrome action/extension icons referenced by `manifest.json` and popup UI.
- Generated: No.
- Committed: Yes.

---

*Structure analysis: 2026-09-05*
