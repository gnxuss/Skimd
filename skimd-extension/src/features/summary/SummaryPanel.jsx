import React, { useState, useEffect } from 'react';
import ErrorBanner      from '../../shared/components/ErrorBanner.jsx';
import Button           from '../../shared/components/Button.jsx';
import SummarySkeleton  from '../../shared/components/SummarySkeleton.jsx';
import ExportControls   from '../export/ExportControls.jsx';
import { useSummary }    from './useSummary.js';
import { formatSummary } from './formatters.js';

/* ─── Format icon definitions ────────────────────────────────────────────────
 * Each icon is a 16×16 viewBox SVG path so they scale crisply at any density.
 * Keeping icons inline avoids a separate icon library dependency.
 */
const FORMAT_ICONS = {
  paragraph: {
    label: 'Paragraph',
    id:    'format-paragraph',
    icon: (
      /* Align-left — three horizontal lines, shortened last line signals prose */
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <line x1="1" y1="4"  x2="15" y2="4"  />
        <line x1="1" y1="8"  x2="15" y2="8"  />
        <line x1="1" y1="12" x2="10" y2="12" />
      </svg>
    ),
  },
  bullets: {
    label: 'Bullets',
    id:    'format-bullets',
    icon: (
      /* List — dot + dash × 3 */
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <circle cx="2.5" cy="4"  r="1" fill="currentColor" stroke="none" />
        <circle cx="2.5" cy="8"  r="1" fill="currentColor" stroke="none" />
        <circle cx="2.5" cy="12" r="1" fill="currentColor" stroke="none" />
        <line x1="5.5" y1="4"  x2="15" y2="4"  />
        <line x1="5.5" y1="8"  x2="15" y2="8"  />
        <line x1="5.5" y1="12" x2="13" y2="12" />
      </svg>
    ),
  },
  tldr: {
    label: 'TLDR',
    id:    'format-tldr',
    icon: (
      /* Lightning bolt — instant / compressed */
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9,1 5,9 8,9 7,15 11,7 8,7 9,1" />
      </svg>
    ),
  },
};

const FORMAT_KEYS = ['paragraph', 'bullets', 'tldr'];

/**
 * FormatIconButton — compact square icon button with a CSS-only tooltip.
 *
 * Touch target: 36×36px (p-2 on a w-9 h-9 container) — adequate for a
 * desktop extension popup where mouse precision is high. The tooltip appears
 * above on hover after a 200ms delay so it doesn't flash during fast scans.
 *
 * Active state: brand-primary stroke + soft brand tint background.
 * Inactive:     zinc-400 stroke, transparent → very faint tint on hover.
 */
function FormatIconButton({ formatKey, activeFormat, onSelect }) {
  const { label, id, icon } = FORMAT_ICONS[formatKey];
  const isActive = activeFormat === formatKey;

  return (
    /*
     * `group` enables the tooltip child to react to the button's hover state.
     * `relative` + `isolate` so the tooltip z-index stays local.
     */
    <div className="relative group isolate">
      <button
        id={id}
        aria-label={label}
        aria-pressed={isActive}
        onClick={() => onSelect(formatKey)}
        className={[
          'flex items-center justify-center w-9 h-9 rounded-lg',
          'transition-all duration-100 will-change-transform',
          'hover:scale-[1.04] active:scale-[0.96]',
          isActive
            ? 'bg-brand-primary/12 text-brand-primary'
            : 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300',
        ].join(' ')}
      >
        {icon}
      </button>

      {/*
       * CSS-only tooltip — appears above the button.
       * opacity + translate on group-hover with a slight delay so casual
       * mouse-overs don't flash the label.
       */}
      <span
        aria-hidden="true"
        className={[
          'pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5',
          'rounded-md text-[10px] font-medium whitespace-nowrap',
          'bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900',
          'opacity-0 -translate-y-1',
          'group-hover:opacity-100 group-hover:translate-y-0',
          'transition-all duration-150 delay-200',
          'z-20',
        ].join(' ')}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * SummaryPanel — generates all three formats in one bounded batch, then lets
 * the user switch between subtabs instantly from cached state.
 *
 * Props:
 *   transcriptState  — shared state from useTranscript(), lifted in App.jsx.
 *                      Must include { videoId, transcript, hasCaptions, loading, error }.
 *   triggerSummarise — when true, auto-fires handleSummarise (used by keyboard shortcut).
 *   onTriggerConsumed — called after the auto-fire so App resets the flag.
 */
export default function SummaryPanel({ transcriptState, apiKey = '', triggerSummarise = false, onTriggerConsumed, onSummaryReady }) {
  const [activeFormat, setActiveFormat] = useState('bullets');

  const {
    videoId,
    transcript,
    hasCaptions,
    loading: transcriptLoading,
    error:   transcriptError,
  } = transcriptState;

  // Pass videoId + apiKey into the hook so caching is scoped to the current video.
  const {
    summariseAll,
    summaries,
    loading:  summaryLoading,
    error:    summaryError,
    hydrated,
  } = useSummary(videoId, apiKey);

  // Combined loading: spinner shows while transcript fetches OR during cache check OR API batch.
  const loading = transcriptLoading || summaryLoading;
  const error   = summaryError ?? transcriptError;

  // True once at least one format has been populated (from cache or fresh fetch).
  const hasSummaries = Object.values(summaries).some(Boolean);

  // No-captions guard settled — surface once transcript has resolved.
  const noCaptions = !transcriptLoading && hasCaptions === false;

  // Raw string for the active subtab — used by formatter and export controls.
  const rawActive = summaries[activeFormat] ?? null;
  const formatted  = rawActive ? formatSummary(rawActive, activeFormat) : null;

  async function handleSummarise() {
    if (!transcript || loading) return;
    summariseAll({ transcript });
  }

  // ── Auto-summarise (keyboard shortcut) ──────────────────────────────
  useEffect(() => {
    if (!triggerSummarise) return;
    // Wait until data is ready — effect will re-fire automatically when
    // transcriptLoading, transcript, or loading change (all in deps).
    if (transcriptLoading || !transcript || loading) return;
    // Commit to a decision and consume the trigger so the next press cycles cleanly.
    onTriggerConsumed?.();
    if (hasSummaries) return; // cached summary already shown — shortcut just opened the panel
    handleSummarise();
  }, [triggerSummarise, transcriptLoading, transcript, loading, hasSummaries]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent the first time a summary lands (for the tab dot indicator).
  useEffect(() => {
    if (hasSummaries) onSummaryReady?.();
  }, [hasSummaries]); // eslint-disable-line react-hooks/exhaustive-deps

  const showPlaceholder = hydrated && !loading && !error && !noCaptions && !hasSummaries;

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/*
       * ── Action row ───────────────────────────────────────────────────
       * Three compact icon buttons (format picker) + Summarise/Regenerate
       * button (flex-1) in a single horizontally-centred row.
       *
       * The icon buttons sit to the LEFT of the main CTA so the primary
       * action retains the most visual weight on the right.
       *
       * py-3 on the row gives the icons breathing room to hit the ~44px
       * recommended touch-target height (icon button is h-9 = 36px,
       * but row padding adds the rest).
       */}
      <div className="flex items-center gap-2 px-4 py-3">

        {/* Format icon buttons */}
        {FORMAT_KEYS.map(key => (
          <FormatIconButton
            key={key}
            formatKey={key}
            activeFormat={activeFormat}
            onSelect={setActiveFormat}
          />
        ))}

        {/* Summarise / Regenerate — takes remaining width */}
        <Button
          id="btn-summarise"
          disabled={loading || noCaptions || !transcript}
          className="flex-1 flex items-center justify-center gap-2"
          onClick={handleSummarise}
        >
          {summaryLoading ? (
            <svg
              className="animate-spin w-3.5 h-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
              <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : hasSummaries ? (
            /* Regenerate icon — only appears in the post-summary state */
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true" className="shrink-0 -ml-0.5"
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          ) : null}
          {transcriptLoading
            ? 'Loading video…'
            : summaryLoading
            ? 'Summarising…'
            : hasSummaries
            ? 'Regenerate'
            : 'Summarise'}
        </Button>
      </div>

      {/* ── Feedback states ── */}
      {/* transcriptLoading: show nothing yet — the button label already says "Loading video…" */}
      {summaryLoading && <SummarySkeleton />}
      {error          && <ErrorBanner code={error.code} message={error.message} />}

      {/* ── No-captions notice ── */}
      {noCaptions && !error && (
        <p className="mx-4 text-base text-zinc-500 dark:text-zinc-400">
          This video has no captions — summary unavailable.
        </p>
      )}

      {/* ── Output area — scrollable, branded scrollbar ── */}
      <div
        id="summary-output"
        className="scroll-panel px-4 py-2 pb-4 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300"
      >
        {formatted ? (
          /*
           * key combines activeFormat + first 20 chars of summary so:
           *   - switching format tabs fades the new content in
           *   - a newly generated summary also fades in (key changes when content arrives)
           */
          <div
            key={`${activeFormat}-${(summaries[activeFormat] ?? '').slice(0, 20)}`}
            className="anim-fade-in-200"
          >
            {Array.isArray(formatted) ? (
              <ul className="space-y-2.5">
                {formatted.map((line, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-brand-primary shrink-0 mt-0.5">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{formatted}</p>
            )}
          </div>
        ) : showPlaceholder ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className="text-brand-primary/30">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <p className="text-base text-zinc-400 dark:text-zinc-500">
              Click <span className="font-semibold text-brand-primary">Summarise</span> to generate a summary.
            </p>
          </div>
        ) : null}
      </div>

      {/* ── Export controls — only when a result is visible ── */}
      {rawActive && (
        <ExportControls summary={rawActive} />
      )}
    </div>
  );
}
