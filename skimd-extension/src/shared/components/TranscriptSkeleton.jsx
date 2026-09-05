import React from 'react';
import Skeleton from './Skeleton.jsx';

/**
 * TranscriptSkeleton — 8 subtitle rows, each with a timestamp badge placeholder
 * and a text line of varying width. Mirrors the real cue row structure.
 */
export default function TranscriptSkeleton() {
  // Each entry: [badgeWidth, textWidth]
  const rows = [
    ['w-10', 'w-9/12'],
    ['w-10', 'w-full'],
    ['w-12', 'w-10/12'],
    ['w-10', 'w-8/12'],
    ['w-10', 'w-full'],
    ['w-12', 'w-11/12'],
    ['w-10', 'w-7/12'],
    ['w-10', 'w-9/12'],
  ];

  return (
    <div
      className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 px-0"
      aria-label="Loading transcript…"
      aria-busy="true"
    >
      {rows.map(([badge, text], i) => (
        <div key={i} className="flex gap-3 px-4 py-3 items-center">
          {/* Timestamp badge placeholder */}
          <Skeleton className={`h-5 ${badge} shrink-0 !rounded`} />
          {/* Caption text placeholder */}
          <Skeleton className={`h-3.5 ${text}`} />
        </div>
      ))}
    </div>
  );
}
