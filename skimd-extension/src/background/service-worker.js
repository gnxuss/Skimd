// ── Keyboard shortcut: "summarise" ───────────────────────────────────────────
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'summarise') return;
  await chrome.storage.session.set({ autoSummarise: true });
  try {
    await chrome.action.openPopup();
  } catch {
    // openPopup() throws on Arc, Brave, Edge, Chrome <116, or if already opening.
  }
});

// ── Keepalive ─────────────────────────────────────────────────────────────────
chrome.alarms.get('keepAlive', (existing) => {
  if (!existing) chrome.alarms.create('keepAlive', { periodInMinutes: 0.4 });
});
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('keepAlive', { periodInMinutes: 0.4 });
});
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('keepAlive', { periodInMinutes: 0.4 });
});
chrome.alarms.onAlarm.addListener(() => { });

// ── Tab navigation tracking ───────────────────────────────────────────────────
const lastVideoIds = new Map();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!tab.url || !tab.url.includes('youtube.com/watch')) return;

  const url = new URL(tab.url);
  const videoId = url.searchParams.get('v');
  if (!videoId) return;

  chrome.storage.sync.set({ videoId });

  const prevVideoId = lastVideoIds.get(tabId);
  if (prevVideoId && prevVideoId !== videoId) {
    chrome.storage.session.remove(`summary_${tabId}_${prevVideoId}`).catch(() => { });
  }
  lastVideoIds.set(tabId, videoId);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  lastVideoIds.delete(tabId);
});

// ── NOTE ──────────────────────────────────────────────────────────────────────
// Transcript and chapter fetching is handled directly by the popup via
// chrome.scripting.executeScript (see shared/youtube.js). The service worker
// no longer proxies those requests. This avoids service-worker lifecycle issues
// (worker sleeping, message port drops) and keeps transcript fetching working
// reliably after browser restarts.