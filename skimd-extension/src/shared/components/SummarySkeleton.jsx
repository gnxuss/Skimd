import React from 'react';
import Skeleton from './Skeleton.jsx';

/* ─── Individual column shapes ──────────────────────────────────────────────── */

/**
 * ParagraphSkeleton — 6 lines of varying width, mimicking a prose block.
 * Last line is narrow to look like a natural paragraph end.
 */
function ParagraphSkeleton() {
  const widths = ['w-full', 'w-11/12', 'w-full', 'w-10/12', 'w-full', 'w-7/12'];
  return (
    <div className="flex flex-col gap-2.5">
      {widths.map((w, i) => (
        <Skeleton key={i} className={`h-3.5 ${w}`} />
      ))}
    </div>
  );
}

/**
 * BulletsSkeleton — 5 bullet rows (small dot + text line), varying widths.
 */
function BulletsSkeleton() {
  const widths = ['w-10/12', 'w-full', 'w-9/12', 'w-11/12', 'w-8/12'];
  return (
    <div className="flex flex-col gap-3">
      {widths.map((w, i) => (
        <div key={i} className="flex gap-2.5 items-center">
          {/* Bullet dot */}
          <Skeleton className="w-2 h-2 shrink-0 !rounded-full" />
          <Skeleton className={`h-3.5 ${w}`} />
        </div>
      ))}
    </div>
  );
}

/**
 * TldrSkeleton — 2 short lines, mimicking a terse summary sentence.
 */
function TldrSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-8/12" />
    </div>
  );
}

/* ─── Combined panel: all three formats simultaneously ───────────────────────── */

/**
 * SummarySkeleton — shown inside <SummaryPanel> while the summary batch is
 * in-flight. Renders skeleton columns for all three formats stacked with
 * section headers, so the user can see all three are loading.
 */
export default function SummarySkeleton() {
  return (
    <div
      className="px-4 py-3 flex flex-col gap-6"
      aria-label="Generating summary…"
      aria-busy="true"
    >
      {/* Paragraph section */}
      <section>
        <Skeleton className="h-3 w-20 mb-3" />
        <ParagraphSkeleton />
      </section>

      {/* Bullets section */}
      <section>
        <Skeleton className="h-3 w-14 mb-3" />
        <BulletsSkeleton />
      </section>

      {/* TLDR section */}
      <section>
        <Skeleton className="h-3 w-10 mb-3" />
        <TldrSkeleton />
      </section>
    </div>
  );
}
