# Roadmap: Skimd

## Overview

Skimd's v1 roadmap turns an existing but incompletely verified extension into a dependable release. It first establishes a trustworthy YouTube target and private credential flow, then validates transcript and timeline navigation, completes AI summary and export workflows, and finishes with consistent interface states and realistic release verification.

## Phases

- [ ] **Phase 1: Trusted Extension Foundation** - Establish reliable supported-page targeting, client-only operation, and private user credentials.
- [ ] **Phase 2: Transcript Navigation** - Deliver a complete timestamped transcript tied to the correct active video.
- [ ] **Phase 3: Chapter Navigation and Missing-Data Recovery** - Deliver chapter seeking and clear outcomes when YouTube data is absent.
- [ ] **Phase 4: Summaries and Export** - Deliver all summary formats and portable content output.
- [ ] **Phase 5: Interface Quality and Release Verification** - Make all states, themes, accessibility behavior, and regressions release-ready.

## Phase Details

### Phase 1: Trusted Extension Foundation
**Goal**: Users can safely open Skimd in the right YouTube context and manage the credential required for direct AI access.
**Depends on**: Nothing (first phase)
**Requirements**: PLAT-01, PLAT-02, CRED-01, CRED-02
**Success Criteria** (what must be TRUE):
  1. User opening Skimd on a supported YouTube watch page sees the extension bound to that active video's identity.
  2. User opening Skimd outside a supported video page receives clear guidance instead of stale content or a broken workflow.
  3. User can validate, save, replace, and clear an AI API key with accurate success or failure feedback.
  4. User's key is stored locally and network inspection shows it sent only in direct requests to the AI provider, with no Skimd backend involved.
**Plans**: TBD
**UI hint**: yes

### Phase 2: Transcript Navigation
**Goal**: Users can read and navigate the active video's available transcript with accurate playback linkage.
**Depends on**: Phase 1
**Requirements**: TRAN-01, TRAN-02
**Success Criteria** (what must be TRUE):
  1. User can view the active video's complete available transcript as readable timestamped cues.
  2. User can select any transcript cue and the same active video seeks to the corresponding moment.
  3. As playback advances, the transcript indicates the current cue without switching to data from another tab or video.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Chapter Navigation and Missing-Data Recovery
**Goal**: Users can navigate available chapters and understand when captions or chapter data is unavailable.
**Depends on**: Phase 2
**Requirements**: TIME-01, RESL-01
**Success Criteria** (what must be TRUE):
  1. User can view the active video's available chapters in timestamp order.
  2. User can select a chapter and the same active video seeks to that chapter's start time.
  3. A video without chapters shows a clear empty state while other available features remain usable.
  4. A video without captions clearly explains that transcript-dependent features are unavailable rather than failing indefinitely or showing stale data.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Summaries and Export
**Goal**: Users can turn the active video's transcript into useful summaries and take the result elsewhere.
**Depends on**: Phase 3
**Requirements**: SUMM-01, SUMM-02, EXPT-01
**Success Criteria** (what must be TRUE):
  1. User with a valid API key can generate an AI summary for the active video's transcript.
  2. User can switch among complete Paragraph, Bullets, and TLDR representations without results from another video replacing the current output.
  3. User can copy useful content to the clipboard and download a readable plain-text file.
  4. Long, failed, rate-limited, or superseded summary requests resolve to clear feedback and do not leave the interface stuck or overwrite newer work.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Interface Quality and Release Verification
**Goal**: Users experience a coherent, accessible, and regression-free extension across real operating conditions.
**Depends on**: Phase 4
**Requirements**: APPR-01, UX-01, QUAL-01
**Success Criteria** (what must be TRUE):
  1. User can select light or dark mode and every primary screen remains legible and visually consistent after reopening the popup.
  2. Each asynchronous workflow exposes an appropriate loading state and resolves to useful content, an empty state, or an actionable error state.
  3. User can navigate and operate core controls by keyboard, visible focus is preserved, and reduced-motion preference is respected.
  4. The production build loads as an unpacked MV3 extension and the complete core, error, theme, and accessibility verification matrix passes without blocking console errors.
  5. Previously working summary, transcript, timeline, settings, seeking, shortcut, theme, copy, and export flows still work after final changes.
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Trusted Extension Foundation | 0/TBD | Not started | - |
| 2. Transcript Navigation | 0/TBD | Not started | - |
| 3. Chapter Navigation and Missing-Data Recovery | 0/TBD | Not started | - |
| 4. Summaries and Export | 0/TBD | Not started | - |
| 5. Interface Quality and Release Verification | 0/TBD | Not started | - |
