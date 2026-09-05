import React from 'react';

// Icon-only toggle button — used for theme switching in Phase 6.
export default function Toggle({ onToggle, label = 'Toggle' }) {
  return (
    <button
      onClick={onToggle}
      aria-label={label}
      className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
    >
      ☀
    </button>
  );
}
