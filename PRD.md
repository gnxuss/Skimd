# Skimd

## Product

Skimd is a Chrome extension that helps users understand YouTube videos without watching them in full.

It lets users:

- Generate AI summaries
- Read video transcripts
- Navigate timestamped chapters
- Jump to relevant moments
- Copy or export useful content

## Target User

People who use YouTube for learning, research, or work and want to quickly decide whether a video is worth their time.

## Core Features

- AI video summaries
- Paragraph, Bullets, and TLDR formats
- Full transcript with timestamps
- Click-to-seek transcript cues
- Chapter/timeline navigation
- Copy and plain-text export
- Light and dark mode
- User-provided AI API key
- Fully client-side operation with no Skimd-hosted backend

## Requirements

- Work on supported YouTube video pages
- Clearly handle videos without captions or chapters
- Show useful loading, empty, and error states
- Keep user API credentials local except when sent directly to the AI provider
- Preserve previously working features when changes are made

## Out of Scope

Unless explicitly added later:

- User accounts
- Cloud history or sync
- Multiple AI providers
- Notes-app integrations
- Prompt customisation
- PDF export
- Mobile apps

## Definition of Done

A feature is done when:

1. The intended user flow works in the actual extension.
2. Relevant loading, empty, and error states work.
3. There are no blocking console errors.
4. Existing functionality still works.
5. The feature has been manually verified in realistic usage.