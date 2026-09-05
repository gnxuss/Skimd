import { useState, useEffect } from 'react';
import { getVideoTime } from '../../shared/player.js';

/**
 * usePlaybackTime — polls the active tab's YouTube video.currentTime every
 * `intervalMs` milliseconds via chrome.scripting.executeScript.
 *
 * Uses executeScript rather than a content-script message listener so that it
 * works reliably across all Chromium-based browsers (Chrome, Arc, Brave, Edge).
 *
 * Returns:
 *   currentTime {number|null}  — current playback position in seconds,
 *                                or null if the video / tab is unavailable.
 *
 * Automatically stops polling when the component unmounts.
 * Gracefully no-ops if chrome.scripting is unavailable (local dev).
 */
export function usePlaybackTime(intervalMs = 1000) {
  const [currentTime, setCurrentTime] = useState(null);

  useEffect(() => {
    let timer = null;
    let active = true; // guard against setState after unmount

    async function poll() {
      const t = await getVideoTime();
      if (active && typeof t === 'number') setCurrentTime(t);
    }

    // Fire immediately then on each interval tick.
    poll();
    timer = setInterval(poll, intervalMs);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [intervalMs]);

  return currentTime;
}
