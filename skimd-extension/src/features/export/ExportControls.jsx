import React, { useState, useCallback } from 'react';

/**
 * ExportControls — appears below the summary when a result is available.
 *
 * Design tokens applied:
 *   rounded-lg  — container corner radius
 *   font-medium — label weight (not semibold — these are secondary actions)
 *   shadow-sm   — card-level elevation on the wrapper strip
 *   duration-150 + press-scale — consistent interactive feel
 *
 * @param {{ summary: string, filename?: string }} props
 */
export default function ExportControls({ summary, filename = 'skimd-summary' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some extension contexts; silently no-op.
    }
  }, [summary]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${filename}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [summary, filename]);

  return (
    <div
      id="export-controls"
      className="flex gap-2 px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 shrink-0"
    >
      {/* Copy button */}
      <button
        id="btn-copy"
        onClick={handleCopy}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
          text-xs font-medium
          transition-all duration-150 will-change-transform
          hover:scale-[1.02] active:scale-[0.98]
          ${copied
            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
            : 'bg-brand-light-surface dark:bg-brand-dark-surface text-zinc-600 dark:text-zinc-400 hover:bg-brand-primary/10 hover:text-brand-primary dark:hover:text-brand-accent'
          }`}
      >
        {copied ? (
          <>
            <CheckIcon />
            Copied!
          </>
        ) : (
          <>
            <CopyIcon />
            Copy
          </>
        )}
      </button>

      {/* Download button */}
      <button
        id="btn-download"
        onClick={handleDownload}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
          text-xs font-medium
          bg-brand-light-surface dark:bg-brand-dark-surface
          text-zinc-600 dark:text-zinc-400
          hover:bg-brand-primary/10 hover:text-brand-primary dark:hover:text-brand-accent
          transition-all duration-150 will-change-transform
          hover:scale-[1.02] active:scale-[0.98]"
      >
        <DownloadIcon />
        Download .txt
      </button>
    </div>
  );
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
