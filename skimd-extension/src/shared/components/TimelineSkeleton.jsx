import React from 'react';
import Skeleton from './Skeleton.jsx';

/**
 * TimelineSkeleton — 6 chapter rows, each with a timestamp badge placeholder
 * and a title text line of varying width. Mirrors the real chapter row layout.
 */
export default function TimelineSkeleton() {
  // Each entry: [badgeWidth, titleWidth]
  const rows = [
    ['w-10', 'w-8/12'],
    ['w-12', 'w-full'],
    ['w-10', 'w-10/12'],
    ['w-12', 'w-7/12'],
    ['w-10', 'w-11/12'],
    ['w-12', 'w-9/12'],
  ];

  return (
    <div
      className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800"
      aria-label="Loading chapters…"
      aria-busy="true"
    >
      {rows.map(([badge, title], i) => (
        <div key={i} className="flex gap-3 px-4 py-3.5 items-center">
          {/* Timestamp badge placeholder */}
          <Skeleton className={`h-5 ${badge} shrink-0 !rounded`} />
          {/* Chapter title placeholder */}
          <Skeleton className={`h-3.5 ${title}`} />
        </div>
      ))}
    </div>
  );
}
