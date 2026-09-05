# Requirements: Skimd

**Defined:** 2026-09-05
**Core Value:** Users can quickly understand and navigate a YouTube video without watching it in full.

## v1 Requirements

### Platform and Privacy

- [ ] **PLAT-01**: User can use Skimd on a supported YouTube video page and receives clear guidance elsewhere.
- [ ] **PLAT-02**: User can complete Skimd workflows without a Skimd-hosted backend.
- [ ] **CRED-01**: User can validate, save, and clear their own AI API key in the extension.
- [ ] **CRED-02**: User's AI API key remains in local extension storage except when sent directly to the AI provider.

### Transcript

- [ ] **TRAN-01**: User can read the video's full available transcript as timestamped cues.
- [ ] **TRAN-02**: User can select a transcript cue to seek the active video to that moment.

### Timeline

- [ ] **TIME-01**: User can view available video chapters with timestamps and select one to seek the active video.

### Summaries

- [ ] **SUMM-01**: User can generate an AI summary from the active video's transcript.
- [ ] **SUMM-02**: User can view the generated summary in Paragraph, Bullets, and TLDR formats.

### Export and Appearance

- [ ] **EXPT-01**: User can copy useful generated content and download it as plain text.
- [ ] **APPR-01**: User can use the extension in light or dark mode with a legible, consistent interface.

### Resilience and Quality

- [ ] **RESL-01**: User receives a clear, actionable state when a video has no captions or no chapters.
- [ ] **UX-01**: User sees useful loading, empty, and error states for asynchronous extension workflows.
- [ ] **QUAL-01**: Existing working features remain usable after changes and the full v1 workflow has no blocking console errors.

## v2 Requirements

None defined.

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts | Local single-user operation does not require accounts |
| Cloud history or sync | Conflicts with the client-only v1 boundary |
| Multiple AI providers | v1 retains the existing single-provider workflow |
| Notes-app integrations | Copy and plain-text export cover v1 |
| Prompt customisation | Fixed summary formats cover v1 |
| PDF export | Plain-text export is the committed format |
| Mobile apps | Chrome Manifest V3 is the target runtime |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 1 | Pending |
| PLAT-02 | Phase 1 | Pending |
| CRED-01 | Phase 1 | Pending |
| CRED-02 | Phase 1 | Pending |
| TRAN-01 | Phase 2 | Pending |
| TRAN-02 | Phase 2 | Pending |
| TIME-01 | Phase 3 | Pending |
| RESL-01 | Phase 3 | Pending |
| SUMM-01 | Phase 4 | Pending |
| SUMM-02 | Phase 4 | Pending |
| EXPT-01 | Phase 4 | Pending |
| APPR-01 | Phase 5 | Pending |
| UX-01 | Phase 5 | Pending |
| QUAL-01 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-05*
*Last updated: 2026-09-05 after initial roadmap creation*
