import React, { useState } from 'react';
import Spinner     from '../../shared/components/Spinner.jsx';
import ErrorBanner from '../../shared/components/ErrorBanner.jsx';
import { resolveErrorMessage, saveSucceeded } from '../../shared/components/errorMessages.js';

/**
 * SettingsPanel — displayed on first install (no key) and via the settings icon.
 *
 * Props:
 *   apiKey     — current stored key (may be empty string)
 *   isValid    — whether a valid key is already stored
 *   loading    — true while validation / storage operation is in flight
 *   error      — { code, message } | null
 *   onSave     — (key: string) => void
 *   onClear    — () => void
 *   onClose    — () => void  (only rendered when isValid — lets user go back)
 */
export default function SettingsPanel({ apiKey, isValid, loading, error, onSave, onClear, onClose }) {
  const [inputValue, setInputValue] = useState(apiKey || '');
  const [showKey,    setShowKey]    = useState(false);
  const [saved,      setSaved]      = useState(false);

  async function handleSave() {
    setSaved(false);
    const result = await onSave(inputValue);
    setSaved(saveSucceeded(result));
  }

  // Clear saved confirmation after 2s.
  React.useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  const errorMessage = resolveErrorMessage(error);

  return (
    <div className="flex flex-col flex-1 min-h-0 p-5 gap-5 overflow-y-auto">

      {/* ── Wordmark ─────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1 pt-2">
        <span className="font-bold text-2xl tracking-tight text-brand-light-text dark:text-brand-dark-text">
          Skimd
        </span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
          YouTube AI Summariser
        </span>
      </div>

      {/* ── Onboarding copy ──────────────────────────────────── */}
      <p className="text-sm text-zinc-600 dark:text-zinc-300 text-center leading-relaxed">
        Enter your Groq API key to get started. Your key is stored locally and
        never&nbsp;leaves&nbsp;your&nbsp;device.
      </p>

      {/* ── Key input group ───────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="groq-api-key"
          className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide"
        >
          Groq API Key
        </label>

        <div className="relative flex items-center">
          <input
            id="groq-api-key"
            type={showKey ? 'text' : 'password'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="gsk_••••••••••••••••••••••"
            autoComplete="off"
            spellCheck={false}
            disabled={loading}
            className="
              w-full pr-10 pl-3 py-2 rounded-lg border text-sm font-mono
              bg-white dark:bg-zinc-900
              border-zinc-300 dark:border-zinc-700
              text-brand-light-text dark:text-brand-dark-text
              placeholder:text-zinc-400 dark:placeholder:text-zinc-600
              focus:outline-none focus:ring-2 focus:ring-brand-primary/40
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          />
          {/* Show / hide toggle */}
          <button
            type="button"
            aria-label={showKey ? 'Hide API key' : 'Show API key'}
            onClick={() => setShowKey((v) => !v)}
            disabled={loading}
            className="
              absolute right-2.5 text-zinc-400 hover:text-zinc-600
              dark:hover:text-zinc-300 transition-colors disabled:opacity-50
            "
          >
            {showKey ? (
              // Eye-off icon
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              // Eye icon
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Error banner ──────────────────────────────────────── */}
      {errorMessage && <ErrorBanner message={errorMessage} />}

      {/* ── Save button ───────────────────────────────────────── */}
      <button
        id="save-api-key"
        onClick={handleSave}
        disabled={loading || !inputValue.trim()}
        className="
          flex items-center justify-center gap-2
          py-2.5 rounded-lg text-sm font-semibold
          bg-brand-primary text-white
          hover:bg-brand-primary/90
          active:scale-95 will-change-transform transition-all duration-100
          disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        "
      >
        {loading ? (
          <><Spinner size="sm" /> Validating…</>
        ) : saved && isValid ? (
          <>
            {/* Check icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Key saved
          </>
        ) : (
          'Save Key'
        )}
      </button>

      {/* ── Get a free key link ───────────────────────────────── */}
      <a
        href="https://console.groq.com"
        target="_blank"
        rel="noreferrer"
        className="
          text-center text-sm text-brand-primary hover:text-brand-primary/80
          transition-colors underline-offset-2 hover:underline
        "
      >
        Get a free Groq key →
      </a>

      {/* ── Clear / back link — only shown when a valid key exists ── */}
      {isValid && (
        <div className="flex flex-col gap-2 mt-auto">
          {onClose && (
            <button
              id="settings-back"
              onClick={onClose}
              className="
                py-2 rounded-lg text-sm font-medium
                text-zinc-600 dark:text-zinc-300
                hover:bg-zinc-100 dark:hover:bg-zinc-800
                transition-colors
              "
            >
              ← Back
            </button>
          )}
          <button
            id="clear-api-key"
            onClick={onClear}
            className="
              py-1.5 text-xs text-zinc-400 hover:text-red-500
              dark:hover:text-red-400 transition-colors
            "
          >
            Remove saved key
          </button>
        </div>
      )}

    </div>
  );
}
