import React, { useRef, useEffect, useState, useCallback } from 'react';
import TranscriptSkeleton from '../../shared/components/TranscriptSkeleton.jsx';
import ErrorBanner from '../../shared/components/ErrorBanner.jsx';
import { usePlaybackTime } from './usePlaybackTime.js';
import { seekVideo } from '../../shared/player.js';

/**
 * Format seconds (float) → "m:ss" or "h:mm:ss" label.
 * @param {number} seconds
 * @returns {string}
 */
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Find the index of the cue that is active at `currentTime`.
 */
function findActiveCueIndex(cues, currentTime) {
  if (currentTime === null || cues.length === 0) return -1;

  let best = -1;
  for (let i = 0; i < cues.length; i++) {
    const c = cues[i];
    if (c.start <= currentTime) {
      best = i;
    }
    if (c.start > currentTime) break;
  }
  return best;
}

/**
 * TranscriptView — displays the transcript as timestamped subtitle rows.
 * Auto-scrolls to the active cue. Click a row to seek the video.
 *
 * Props:
 *   cues        — Array<{start, dur, text}> from useTranscript
 *   hasCaptions — boolean | null
 *   loading     — boolean
 *   error       — { code } | null
 */
export default function TranscriptView({ cues = [], hasCaptions, loading, error }) {
  const currentTime   = usePlaybackTime(1000);
  const activeCueIdx  = findActiveCueIndex(cues, currentTime);

  const rowRefs       = useRef([]);
  const scrollRef     = useRef(null);

  const AUTO_SCROLL_COOLDOWN_MS = 3000;
  const [userScrolling, setUserScrolling] = useState(false);
  const cooldownTimer   = useRef(null);
  const lastScrolledIdx = useRef(-1);

  // Track which row is currently flashing (one at a time).
  const [flashIdx, setFlashIdx] = useState(-1);
  const flashTimer  = useRef(null);

  /**
   * handleCueClick — triggers the 150ms brand flash overlay, then seeks.
   * The flash class is removed after the animation completes (160ms buffer)
   * so re-clicks on the same row replay the animation correctly.
   */
  const handleCueClick = useCallback((cue, i) => {
    // Cancel any in-flight flash reset from a previous click.
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlashIdx(i);
    flashTimer.current = setTimeout(() => setFlashIdx(-1), 160);
    seekVideo(cue.start);
  }, []);

  const handleScroll = useCallback(() => {
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    setUserScrolling(true);
    cooldownTimer.current = setTimeout(() => {
      setUserScrolling(false);
    }, AUTO_SCROLL_COOLDOWN_MS);
  }, []);

  useEffect(() => {
    if (userScrolling) return;
    if (activeCueIdx < 0) return;
    if (activeCueIdx === lastScrolledIdx.current) return;

    const row = rowRefs.current[activeCueIdx];
    if (row) {
      row.scrollIntoView({ block: 'center', behavior: 'smooth' });
      lastScrolledIdx.current = activeCueIdx;
    }
  }, [activeCueIdx, userScrolling]);

  useEffect(() => () => {
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    if (flashTimer.current)    clearTimeout(flashTimer.current);
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* Loading — skeleton mirrors cue row structure */}
      {loading && <TranscriptSkeleton />}

      {/* Error */}
      {!loading && error && <ErrorBanner code={error.code} />}

      {/* No captions */}
      {!loading && !error && hasCaptions === false && (
        <ErrorBanner code="NO_CAPTIONS" />
      )}

      {/* Subtitle rows — scrollable with branded scrollbar */}
      {!loading && !error && hasCaptions === true && (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          id="transcript-output"
          className="scroll-panel"
        >
          {cues.length === 0 ? (
            <p className="px-4 py-3 text-base text-zinc-400 dark:text-zinc-500">
              No transcript text returned.
            </p>
          ) : (
            cues.map((cue, i) => {
              const isActive = i === activeCueIdx;
              return (
                <button
                  key={i}
                  ref={(el) => { rowRefs.current[i] = el; }}
                  id={`cue-${i}`}
                  onClick={() => handleCueClick(cue, i)}
                  className={[
                    'w-full flex gap-3 px-4 py-2.5 text-left',
                    'transition-all duration-150 will-change-transform',
                    'hover:scale-[1.01] active:scale-[0.99]',
                    // flash class re-triggers the ::before animation each click
                    flashIdx === i ? 'row-flash' : '',
                    isActive
                      ? 'bg-brand-primary/8 dark:bg-brand-primary/12'
                      : 'hover:bg-brand-light-surface dark:hover:bg-brand-dark-surface',
                  ].join(' ')}
                >
                  {/* Timestamp badge — colour transitions with the row highlight */}
                  <span className={`
                    shrink-0 text-xs font-mono font-semibold self-start mt-0.5
                    rounded px-1.5 py-0.5 leading-none
                    transition-colors duration-150
                    ${isActive
                      ? 'text-brand-primary bg-brand-primary/15 dark:bg-brand-primary/25'
                      : 'text-brand-accent bg-brand-primary/10 dark:bg-brand-primary/15'
                    }
                  `}>
                    {formatTime(cue.start)}
                  </span>

                  {/* Caption text — 13px per spec */}
                  <span className={`
                    text-[13px] leading-snug font-normal
                    ${isActive
                      ? 'text-zinc-900 dark:text-zinc-50 font-medium'
                      : 'text-zinc-600 dark:text-zinc-300'
                    }
                  `}>
                    {cue.text}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}
