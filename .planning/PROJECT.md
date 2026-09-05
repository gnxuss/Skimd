# Skimd

## What This Is

Skimd is a Chrome Manifest V3 extension for people who use YouTube for learning, research, or work and want to understand a video without watching it in full. It provides AI summaries, timestamped transcripts, chapter navigation, seeking, and export directly from supported YouTube video pages.

## Core Value

Users can quickly understand and navigate a YouTube video without watching it in full.

## Requirements

### Validated

(None yet — substantial functionality exists, but the PRD definition of done has not been verified in realistic extension use.)

### Active

- [ ] Work reliably on supported YouTube video pages.
- [ ] Generate AI summaries in Paragraph, Bullets, and TLDR formats.
- [ ] Show a complete timestamped transcript and seek the video from transcript cues.
- [ ] Show chapter/timeline navigation and seek the video from chapters.
- [ ] Copy useful content and export it as plain text.
- [ ] Support light and dark appearance.
- [ ] Let the user validate, save, and clear their own AI API key.
- [ ] Operate entirely client-side with no Skimd-hosted backend and keep credentials local except for direct provider requests.
- [ ] Clearly handle missing captions or chapters and useful loading, empty, and error states.
- [ ] Preserve working behavior while the release is hardened and verified.

### Out of Scope

- User accounts — personal local extension use does not require identity infrastructure.
- Cloud history or sync — no Skimd-hosted backend is permitted for v1.
- Multiple AI providers — v1 supports the existing single-provider workflow.
- Notes-app integrations — copying and plain-text export cover the committed export scope.
- Prompt customisation — summary formats are fixed in v1.
- PDF export — plain-text export is the committed portable format.
- Mobile apps — the target runtime is a Chrome Manifest V3 extension.

## Context

- This is a brownfield extension with most product surfaces already implemented in React, Vite, Tailwind CSS, Chrome APIs, YouTube Innertube, and Groq.
- The current implementation has not yet satisfied the PRD definition of done through realistic manual extension verification.
- Known release blockers include a noisy failing lint gate, stale tab/video races, uncancelled summary requests, generic settings errors, and incomplete setup/verification guidance.
- YouTube retrieval currently runs from the popup through `chrome.scripting.executeScript` in the page MAIN world; the service worker is intentionally outside this critical path.
- Transcript parsing avoids `DOMParser` because YouTube Trusted Types previously broke that approach in the injected page context.

## Constraints

- **Runtime**: Chrome Manifest V3 extension on supported YouTube video pages — this is the product delivery target.
- **Architecture**: No Skimd-hosted backend — transcript, chapter, AI, state, and UI flows remain client-side.
- **Credentials**: The user API key may be stored only in local extension storage and sent only directly to the configured AI provider — this is the PRD privacy boundary.
- **YouTube execution**: Keep YouTube retrieval in popup-triggered MAIN-world injection unless verified evidence supports a change — this avoids prior MV3 worker lifecycle and extension-origin failures.
- **Parsing**: Do not replace the CSP-safe caption parser with `DOMParser` without in-extension verification — YouTube Trusted Types previously rejected it.
- **Compatibility**: Preserve the manifest's flat Vite output names and Chrome entry points — the built extension depends on them.
- **Verification**: Completion requires a successful production build plus realistic manual checks of core, error, theme, accessibility, and regression states — source inspection alone is insufficient.

## Key Decisions

No ADR-locked decisions were provided.

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep v1 fully client-side with no Skimd backend | Product scope and privacy model require direct browser-to-provider operation | — Pending |
| Preserve popup-direct MAIN-world YouTube retrieval | Existing architecture avoids documented service-worker lifecycle and extension-origin failures | — Pending |
| Treat existing features as unvalidated until realistic extension QA passes | Historical implementation exists, but the PRD definition of done is not yet evidenced | — Pending |

---
*Last updated: 2026-09-05 after project initialization from PRD ingest*
