import { useState, useEffect } from 'react';
import { fetchTranscript } from '../../shared/youtube.js';

/**
 * Check if any YouTube watch tab exists.
 * Returns { isYouTubeVideo, videoId }.
 */
async function resolveVideoId() {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/watch*' });

    if (tabs.length === 0) {
      return { isYouTubeVideo: false, videoId: null };
    }

    const tab = tabs.find((t) => t.active) ?? tabs[0];
    const url = tab.url ?? tab.pendingUrl ?? '';

    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      if (videoId) return { isYouTubeVideo: true, videoId };
    }

    // Tab exists but URL not populated — try storage fallback.
    const stored = await chrome.storage.sync.get('videoId').catch(() => ({}));
    const storedId = stored?.videoId ?? null;
    if (storedId) return { isYouTubeVideo: true, videoId: storedId };

    return { isYouTubeVideo: true, videoId: null };
  } catch {
    return { isYouTubeVideo: false, videoId: null };
  }
}

/**
 * Fetches the transcript for the current YouTube video on mount.
 * Uses executeScript via shared/youtube.js — no service worker involved.
 */
export function useTranscript() {
  const [notYouTube, setNotYouTube] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [cues, setCues] = useState([]);
  const [hasCaptions, setHasCaptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setNotYouTube(false);

      // ── Step 1: Check if a YouTube video tab exists ────────────────────────
      const { isYouTubeVideo, videoId: vid } = await resolveVideoId();

      if (cancelled) return;

      if (!isYouTubeVideo) {
        setNotYouTube(true);
        setLoading(false);
        return;
      }

      if (!vid) {
        setHasCaptions(false);
        setTranscript('');
        setError({ code: 'NO_VIDEO', error: 'Could not determine the video ID.' });
        setLoading(false);
        return;
      }

      setVideoId(vid);

      // ── Step 2: Fetch transcript via executeScript (popup → YouTube tab) ──
      try {
        const data = await fetchTranscript(vid);
        if (!cancelled) {
          setTranscript(data.transcript ?? '');
          setCues(data.cues ?? []);
          setHasCaptions(data.hasCaptions ?? false);
        }
      } catch (err) {
        console.log('[Skimd] transcript error:', err.code, err.message);
        if (!cancelled) {
          setError({ code: err.code ?? 'TRANSCRIPT_ERROR', error: err.message });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { notYouTube, videoId, transcript, cues, hasCaptions, loading, error };
}
