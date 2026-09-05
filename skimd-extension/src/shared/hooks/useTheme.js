import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'themeOverride'; // 'light' | 'dark' | null (null = system)

/**
 * useTheme — Phase 6.
 *
 * Resolution order:
 *   1. Manual override stored in chrome.storage.sync (set by toggleTheme).
 *   2. System preference via prefers-color-scheme.
 *
 * Applies/removes the `dark` class on the document root so every
 * `dark:` Tailwind variant in the popup responds correctly.
 *
 * @returns {{ theme: 'light' | 'dark', toggleTheme: () => void }}
 */
export function useTheme() {
  // Resolve the active theme string from system preference.
  function systemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // override: 'light' | 'dark' | null (null means "follow system")
  const [override, setOverride] = useState(null);
  const [system,   setSystem]   = useState(systemTheme);

  const theme = override ?? system;

  // ── Apply class to root on every theme change ───────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // ── Load stored override on mount ───────────────────────────────────────
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    chrome.storage.sync.get(STORAGE_KEY, (result) => {
      const stored = result?.[STORAGE_KEY];
      if (stored === 'light' || stored === 'dark') {
        setOverride(stored);
      }
    });
  }, []);

  // ── Listen for system preference changes ────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function handleChange(e) {
      setSystem(e.matches ? 'dark' : 'light');
    }
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // ── Toggle: flip the override and persist it ────────────────────────────
  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setOverride(next);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ [STORAGE_KEY]: next });
    }
  }, [theme]);

  return { theme, toggleTheme };
}
