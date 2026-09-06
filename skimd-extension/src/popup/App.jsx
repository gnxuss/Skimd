import React, { useCallback, useRef, useState } from 'react';

import SummaryPanel   from '../features/summary/SummaryPanel.jsx';
import TranscriptView from '../features/transcript/TranscriptView.jsx';
import TimelineView   from '../features/timeline/TimelineView.jsx';
import SettingsPanel  from '../features/settings/SettingsPanel.jsx';
import { useTranscript } from '../features/transcript/useTranscript.js';
import { useTimeline }   from '../features/timeline/useTimeline.js';
import { useApiKey }     from '../features/settings/useApiKey.js';
import { useTheme }      from '../shared/hooks/useTheme.js';
import { createAutoSummariseClaims } from '../features/summary/autoSummarise.js';

// Tab definitions — order determines display order.
const TABS = [
  { key: 'summary',    label: 'Summary' },
  { key: 'transcript', label: 'Transcript' },
  { key: 'timeline',   label: 'Timeline' },
];

/**
 * Root popup component.
 * Width: 400px (set in global.css).
 * Min-height: 500px (set in global.css) — expands with content, never clips.
 *
 * useTranscript is lifted here so Summary and Transcript tabs share one fetch.
 * useTimeline is also lifted here — auto-fetches based on videoId as soon as
 * the transcript resolves (no user interaction required).
 * useApiKey manages the Groq key lifecycle (read, validate, persist).
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('summary');
  const { theme, toggleTheme } = useTheme();
  const autoSummariseClaims = useRef(createAutoSummariseClaims());
  const claimAutoSummarise = useCallback(
    (videoId) => autoSummariseClaims.current.claim(videoId),
    [],
  );

  // ── API key ─────────────────────────────────────────────────────────────────
  const {
    apiKey,
    isValid:   keyIsValid,
    loading:   keyLoading,
    error:     keyError,
    saveKey,
    clearKey,
  } = useApiKey();

  // When the user clicks the settings cog in the header.
  const [showSettings, setShowSettings] = useState(false);

  // Shared transcript state — single fetch used by Summary + Transcript tabs.
  const transcriptState = useTranscript();

  // Timeline state — auto-fetches chapters once videoId is known.
  const {
    chapters,
    loading:  timelineLoading,
    error:    timelineError,
    seekTo,
  } = useTimeline(transcriptState.videoId);

  const showNotYouTube = transcriptState.notYouTube;

  // While the key is loading we show nothing (it's instant from storage).
  if (keyLoading) return null;

  // ── Key guard + settings overlay ────────────────────────────────────────────
  // Show settings when: no valid key yet  OR  user opened settings manually.
  const showSettingsPanel = !keyIsValid || showSettings;

  if (showSettingsPanel) {
    return (
      <div className="flex flex-col flex-1 min-h-0 h-full bg-brand-light-bg dark:bg-brand-dark-bg text-brand-light-text dark:text-brand-dark-text">

        {/* ── Header ── */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/icons/icon16.png" alt="" aria-hidden="true" width="20" height="20" className="shrink-0" />
            <span className="font-semibold text-base tracking-tight text-brand-light-text dark:text-brand-dark-text">
              Skimd
            </span>
          </div>
          <button
            id="toggle-theme"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-brand-primary"
          >
            {theme === 'dark' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </header>

        {/* ── Settings panel (takes the rest of the height) ── */}
        <main className="flex-1 min-h-0 flex flex-col">
          <SettingsPanel
            apiKey={apiKey}
            isValid={keyIsValid}
            loading={keyLoading}
            error={keyError}
            onSave={saveKey}
            onClear={clearKey}
            onClose={keyIsValid ? () => setShowSettings(false) : undefined}
          />
        </main>

      </div>
    );
  }

  // ── Normal popup UI ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 min-h-0 h-full bg-brand-light-bg dark:bg-brand-dark-bg text-brand-light-text dark:text-brand-dark-text">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        {/* Logo + wordmark */}
        <div className="flex items-center gap-2.5">
          <img
            src="/icons/icon16.png"
            alt=""
            aria-hidden="true"
            width="20"
            height="20"
            className="shrink-0"
          />
          <span className="font-semibold text-base tracking-tight text-brand-light-text dark:text-brand-dark-text">
            Skimd
          </span>
        </div>

        {/* Right side: subtitle + settings icon */}
        <div className="flex items-center gap-1">
          <span className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">
            YouTube Summariser
          </span>
          {/* Settings cog */}
          <button
            id="open-settings"
            onClick={() => setShowSettings(true)}
            aria-label="Open settings"
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-brand-primary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Tab bar — hidden when not on a video page ─── */}
      {!showNotYouTube && (
        <nav className="flex border-b border-zinc-200 dark:border-zinc-800 shrink-0" role="tablist">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              id={`tab-${key}`}
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className={`relative flex-1 py-2.5 text-sm font-medium
                transition-all duration-100
                hover:scale-[1.02] active:scale-95 will-change-transform
                ${activeTab === key
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-brand-accent dark:hover:text-brand-accent'
                }`}
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      {/* ── Main content ──────────────────────── */}
      <main className="flex-1 min-h-0 flex flex-col">

        {/* Not a YouTube video page */}
        {showNotYouTube && (
          <div id="empty-not-youtube" className="flex flex-col items-center justify-center flex-1 gap-3 p-4 text-center">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className="text-brand-primary/40">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
            </svg>
            <p className="text-base font-semibold text-zinc-600 dark:text-zinc-300">
              Open a YouTube video to use Skimd.
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              Navigate to a YouTube video page, then click this icon.
            </p>
          </div>
        )}

        {/* Normal tab content */}
        {!showNotYouTube && (
          <div key={activeTab} className="anim-fade-in flex flex-col flex-1 min-h-0">
            {activeTab === 'summary' && (
              <SummaryPanel
                transcriptState={transcriptState}
                apiKey={apiKey}
                claimAutoSummarise={claimAutoSummarise}
              />
            )}
            {activeTab === 'transcript' && (
              <TranscriptView
                cues={transcriptState.cues}
                hasCaptions={transcriptState.hasCaptions}
                loading={transcriptState.loading}
                error={transcriptState.error}
              />
            )}
            {activeTab === 'timeline' && (
              <TimelineView
                chapters={chapters}
                loading={timelineLoading}
                error={timelineError}
                onSeek={seekTo}
              />
            )}
          </div>
        )}

      </main>

      {/* ── Footer ────────────────────────────── */}
      <footer className="flex items-center justify-between px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 shrink-0">
        <span className="text-zinc-400 dark:text-zinc-500">Skimd v2.0</span>
        <button
          id="toggle-theme"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-brand-primary"
        >
          {theme === 'dark' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </footer>
    </div>
  );
}
