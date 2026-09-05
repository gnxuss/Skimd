import { useState, useEffect, useRef } from 'react';
import { summariseFormats } from './summaryScheduler.js';

const NULL_SUMMARIES = { paragraph: null, bullets: null, tldr: null };

/**
 * Build the tab-and-video-scoped session storage key.
 */
function cacheKey(tabId, videoId) {
  return `summary_${tabId}_${videoId}`;
}

/**
 * Resolve the tabId of the currently active tab in the current window.
 */
async function resolveTabId() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id ?? null;
  } catch {
    return null;
  }
}

async function saveSummaries(tabId, videoId, summaries) {
  if (!tabId || !videoId) return;
  try {
    await chrome.storage.session.set({ [cacheKey(tabId, videoId)]: summaries });
  } catch { /* best-effort */ }
}

async function loadSummaries(tabId, videoId) {
  if (!tabId || !videoId) return null;
  try {
    const key = cacheKey(tabId, videoId);
    const result = await chrome.storage.session.get(key);
    return result[key] ?? null;
  } catch {
    return null;
  }
}

/**
 * Hook that fetches all three summary formats in a bounded batch.
 *
 * Results are cached in chrome.storage.session, scoped to tab + video, so
 * switching tabs or re-opening the popup restores summaries instantly.
 *
 * @param {string|null} videoId
 * @param {string}      apiKey   — Groq API key (read from useApiKey)
 *
 * Usage:
 *   const { summariseAll, summaries, loading, error, hydrated } = useSummary(videoId, apiKey);
 *   summariseAll({ transcript });
 */
export function useSummary(videoId, apiKey) {
  const [summaries, setSummaries] = useState(NULL_SUMMARIES);
  const [loading,   setLoading]   = useState(true);   // true during initial cache check
  const [error,     setError]     = useState(null);
  const [hydrated,  setHydrated]  = useState(false);

  const videoIdRef = useRef(videoId);
  const apiKeyRef  = useRef(apiKey);
  const tabIdRef   = useRef(null);
  const requestInFlightRef = useRef(false);
  useEffect(() => { videoIdRef.current = videoId; }, [videoId]);
  useEffect(() => { apiKeyRef.current  = apiKey;  }, [apiKey]);

  // On mount (or videoId change): resolve tabId and restore from cache.
  useEffect(() => {
    if (!videoId) {
      setLoading(false);
      setHydrated(true);
      return;
    }

    let cancelled = false;

    async function hydrate() {
      setLoading(true);
      setHydrated(false);
      setError(null);
      setSummaries(NULL_SUMMARIES);

      const tabId = await resolveTabId();
      if (cancelled) return;

      tabIdRef.current = tabId;

      const cached = await loadSummaries(tabId, videoId);
      if (cancelled) return;

      if (cached) setSummaries(cached);

      setLoading(false);
      setHydrated(true);
    }

    hydrate();
    return () => { cancelled = true; };
  }, [videoId]);

  /**
   * Fetch all three formats through the bounded scheduler.
   *
   * @param {{ transcript: string }} params
   */
  async function summariseAll({ transcript }) {
    if (requestInFlightRef.current) return false;
    requestInFlightRef.current = true;

    const vid   = videoIdRef.current;
    const key   = apiKeyRef.current;
    const tabId = tabIdRef.current;

    setLoading(true);
    setError(null);
    setSummaries(NULL_SUMMARIES);

    try {
      const fresh = await summariseFormats({ transcript, apiKey: key });

      setSummaries(fresh);
      await saveSummaries(tabId, vid, fresh);
      return true;
    } catch (err) {
      setError({ code: err.code ?? 'GROQ_UNAVAILABLE', message: err.message });
      return false;
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
    }
  }

  return { summariseAll, summaries, loading, error, hydrated };
}
