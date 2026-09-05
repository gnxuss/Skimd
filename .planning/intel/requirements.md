# Requirements

## REQ-ai-video-summaries
- source: PRD.md
- description: AI video summaries
- acceptance:
- scope: Core Features

## REQ-summary-formats
- source: PRD.md
- description: Paragraph, Bullets, and TLDR formats
- acceptance:
- scope: Core Features

## REQ-full-transcript
- source: PRD.md
- description: Full transcript with timestamps
- acceptance:
- scope: Core Features

## REQ-click-to-seek
- source: PRD.md
- description: Click-to-seek transcript cues
- acceptance:
- scope: Core Features

## REQ-chapter-navigation
- source: PRD.md
- description: Chapter/timeline navigation
- acceptance:
- scope: Core Features

## REQ-copy-export
- source: PRD.md
- description: Copy and plain-text export
- acceptance:
- scope: Core Features

## REQ-light-dark-mode
- source: PRD.md
- description: Light and dark mode
- acceptance:
- scope: Core Features

## REQ-user-api-key
- source: PRD.md
- description: User-provided AI API key
- acceptance:
- scope: Core Features

## REQ-client-side-operation
- source: PRD.md
- description: Fully client-side operation with no Skimd-hosted backend
- acceptance:
- scope: Core Features

## REQ-supported-youtube-pages
- source: PRD.md
- description: Work on supported YouTube video pages
- acceptance:
- scope: Requirements

## REQ-missing-captions-chapters
- source: PRD.md
- description: Clearly handle videos without captions or chapters
- acceptance:
- scope: Requirements

## REQ-interface-states
- source: PRD.md
- description: Show useful loading, empty, and error states
- acceptance:
- scope: Requirements

## REQ-local-api-credentials
- source: PRD.md
- description: Keep user API credentials local except when sent directly to the AI provider
- acceptance:
- scope: Requirements

## REQ-preserve-features
- source: PRD.md
- description: Preserve previously working features when changes are made
- acceptance:
- scope: Requirements

## REQ-out-of-scope
- source: PRD.md
- description: Unless explicitly added later:
- acceptance: User accounts; Cloud history or sync; Multiple AI providers; Notes-app integrations; Prompt customisation; PDF export; Mobile apps
- scope: Out of Scope

## REQ-feature-definition-of-done
- source: PRD.md
- description: A feature is done when:
- acceptance: The intended user flow works in the actual extension; Relevant loading, empty, and error states work; There are no blocking console errors; Existing functionality still works; The feature has been manually verified in realistic usage
- scope: Definition of Done
