import { useState, useEffect, useCallback } from 'react';
import { fetchChapters } from '../../shared/youtube.js';
import { seekVideo }     from '../../shared/player.js';

/**
 * useTimeline — fetches YouTube chapters on mount for the given videoId.
 *
 * Now calls the YouTube Innertube API directly — no backend required.
 * Chapters come from the video's shortDescription, parsed client-side.
 *
 * @param {string|null} videoId
 * @returns {{
 *   chapters: Array<{startSeconds: number, title: string}>,
 *   loading:  boolean,
 *   error:    { code: string } | null,
 *   seekTo:   (startSeconds: number) => void,
 * }}
 */
export function useTimeline(videoId) {
  const [chapters, setChapters] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!videoId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setChapters([]);

      try {
        const chapters = await fetchChapters(videoId);
        if (!cancelled) setChapters(chapters);
      } catch (err) {
        if (!cancelled) {
          setError({ code: err.code ?? 'UNKNOWN_ERROR', message: err.message ?? 'Chapter fetch failed' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [videoId]);

  /**
   * Seek the YouTube player on the active tab to the given timestamp.
   */
  const seekTo = useCallback((startSeconds) => {
    seekVideo(startSeconds);
  }, []);

  return { chapters, loading, error, seekTo };
}
