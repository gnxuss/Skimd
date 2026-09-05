/**
 * shared/player.js — YouTube player control utilities.
 *
 * Uses chrome.scripting.executeScript to inject functions directly into the
 * active tab's page context. This is more reliable than chrome.tabs.sendMessage
 * → content-script message listeners across all Chromium-based browsers
 * (Chrome, Arc, Brave, Edge, etc.) because it does not depend on the content
 * script being installed or its message channel being open.
 *
 * Requires: "scripting" and "activeTab" permissions in manifest.json.
 * Both are already declared.
 */

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Resolve the active tab ID in the current window.
 * Returns null if chrome.tabs is unavailable (local dev) or no tab found.
 *
 * @returns {Promise<number|null>}
 */
async function getActiveTabId() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id ?? null;
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Seek the YouTube player to `startSeconds`.
 *
 * Injects directly into the page — no content-script message channel needed.
 * Does NOT force-play; respects the user's paused/playing state.
 *
 * @param {number} startSeconds
 * @returns {Promise<void>}
 */
export async function seekVideo(startSeconds) {
  if (typeof startSeconds !== 'number' || startSeconds < 0) return;

  const tabId = await getActiveTabId();
  if (!tabId) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      // This function runs inside the page's JS context.
      func: (seconds) => {
        const video = document.querySelector('video');
        if (video) video.currentTime = seconds;
      },
      args: [startSeconds],
    });
  } catch {
    // Silently ignore — executeScript can fail if the tab is navigating,
    // is a restricted URL, or the extension has no access.
  }
}

/**
 * Read the current playback position of the YouTube player.
 *
 * Injects directly into the page context and returns `video.currentTime`.
 * Returns `null` if no video element is found or the tab is unavailable.
 *
 * @returns {Promise<number|null>}
 */
export async function getVideoTime() {
  const tabId = await getActiveTabId();
  if (!tabId) return null;

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const video = document.querySelector('video');
        return video ? video.currentTime : null;
      },
    });
    const value = results?.[0]?.result;
    return typeof value === 'number' ? value : null;
  } catch {
    return null;
  }
}
