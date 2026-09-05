import React, { useState, useRef, useCallback } from 'react';
import TimelineSkeleton from '../../shared/components/TimelineSkeleton.jsx';
import ErrorBanner from '../../shared/components/ErrorBanner.jsx';

/**
 * Format seconds → "m:ss" or "h:mm:ss" for display.
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * TimelineView — displays YouTube chapters extracted from the video description.
 * Each chapter row shows: [timestamp badge]  [chapter title]
 * Clicking a row seeks the video to that timestamp.
 *
 * Props:
 *   chapters  — Array<{startSeconds: number, title: string}>
 *   loading   — boolean
 *   error     — { code: string } | null
 *   onSeek    — (startSeconds: number) => void
 */
export default function TimelineView({ chapters = [], loading, error, onSeek }) {
  // Track which row is currently showing the 150ms brand-colour flash.
  const [flashIdx, setFlashIdx]  = useState(-1);
  const flashTimer               = useRef(null);

  /**
   * handleChapterClick — shows 150ms background flash (brand primary overlay)
   * then seeks the video.  Flash class is removed after animation completes
   * so re-clicking the same row always replays the animation.
   */
  const handleChapterClick = useCallback((chapter, i) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlashIdx(i);
    flashTimer.current = setTimeout(() => setFlashIdx(-1), 160);
    onSeek(chapter.startSeconds);
  }, [onSeek]);
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* Loading — skeleton mirrors chapter row structure */}
      {loading && <TimelineSkeleton />}

      {/* Error (network / innertube) */}
      {!loading && error && <ErrorBanner code={error.code} />}

      {/* Chapter list — scrollable with branded scrollbar */}
      {!loading && !error && chapters.length > 0 && (
        <div
          id="timeline-output"
          className="scroll-panel divide-y divide-zinc-100 dark:divide-zinc-800"
        >
          {chapters.map((chapter, i) => (
            <button
              key={i}
              id={`timeline-chapter-${i}`}
              onClick={() => handleChapterClick(chapter, i)}
              className={[
                'w-full flex items-center gap-3 px-4 py-3.5 text-left',
                'transition-all duration-150 will-change-transform',
                'hover:scale-[1.01] active:scale-[0.99]',
                'hover:bg-brand-light-surface dark:hover:bg-brand-dark-surface',
                flashIdx === i ? 'row-flash' : '',
                'group',
              ].join(' ')}
            >
              {/* Timestamp badge */}
              <span className="shrink-0 text-xs font-mono font-semibold
                text-brand-primary bg-brand-primary/10 dark:bg-brand-primary/15
                rounded px-1.5 py-0.5 leading-none
                group-hover:bg-brand-primary group-hover:text-white transition-colors">
                {formatTime(chapter.startSeconds)}
              </span>

              {/* Chapter title — 13px / font-medium per spec */}
              <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-100
                group-hover:text-brand-primary dark:group-hover:text-brand-accent
                transition-colors">
                {chapter.title}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No chapters found */}
      {!loading && !error && chapters.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6 text-center min-h-[300px]">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className="text-brand-primary/25">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <p className="text-base font-semibold text-zinc-600 dark:text-zinc-300">
            No chapters found
          </p>
          <p className="text-sm font-normal text-zinc-400 dark:text-zinc-500">
            The creator hasn&apos;t added chapter timestamps to the description.
          </p>
        </div>
      )}

    </div>
  );
}
