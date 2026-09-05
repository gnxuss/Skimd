// YouTube transcript & chapters — fetched via executeScript from the popup.
//
// Why executeScript and not a direct fetch?
// YouTube returns 403 when the Innertube API is called from a chrome-extension://
// origin. The fetch must come from the youtube.com origin. executeScript with
// world:'MAIN' runs code inside the YouTube tab's JS context, so the fetch
// goes out from youtube.com — no 403.
//
// Why from the popup and not the service worker?
// The popup calls executeScript directly. This avoids:
//   - Service worker message passing (can fail if worker is asleep)
//   - Service worker lifecycle issues after browser restart
//   - Extra indirection (popup → worker → tab → worker → popup)
//
// The popup has access to chrome.scripting.executeScript via the "scripting"
// permission and host_permissions for youtube.com.

/**
 * Resolve the YouTube tab and its videoId.
 * Returns { tabId, videoId } or throws.
 */
async function resolveYouTubeTab() {
  const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/watch*' });

  if (tabs.length === 0) {
    const err = new Error('No YouTube video tab found. Open a YouTube video and try again.');
    err.code = 'NO_TAB';
    throw err;
  }

  const tab = tabs.find((t) => t.active) ?? tabs[0];

  // After browser restart, Chrome restores tabs lazily. The tab has a URL in
  // Chrome's internal registry but the page hasn't loaded yet.
  if (tab.discarded) {
    const err = new Error('Click on the YouTube tab to load it, then try again.');
    err.code = 'TAB_NOT_LOADED';
    throw err;
  }

  const url = tab.url ?? tab.pendingUrl ?? '';
  let videoId = null;

  if (url.includes('youtube.com/watch')) {
    videoId = new URL(url).searchParams.get('v');
  }

  // Fallback to storage if URL parsing failed.
  if (!videoId) {
    const stored = await chrome.storage.sync.get('videoId').catch(() => ({}));
    videoId = stored?.videoId ?? null;
  }

  if (!videoId) {
    const err = new Error('Could not determine the video ID.');
    err.code = 'NO_VIDEO';
    throw err;
  }

  return { tabId: tab.id, videoId };
}

/**
 * Run a self-contained async function inside a YouTube tab via executeScript.
 * Retries once if the first attempt fails (handles brief loading gaps).
 */
async function runInYouTubeTab(tabId, func, args) {
  const MAX_ATTEMPTS = 2;
  let lastError;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        world: 'MAIN',
        func,
        args,
      });

      const item = results?.[0];
      if (!item) return { ok: false, message: 'executeScript returned no results.' };
      if (item.error) return { ok: false, message: String(item.error) };
      return item.result ?? { ok: false, message: 'Script returned undefined.' };
    } catch (err) {
      lastError = err;
      console.log(`[Skimd] executeScript attempt ${attempt + 1} failed:`, err.message);
      // Wait briefly before retry to let the tab finish loading.
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }

  return { ok: false, message: `Cannot script tab: ${lastError?.message}` };
}

// ── Injected functions ────────────────────────────────────────────────────────
// These are serialised by Chrome via .toString() and executed inside the YouTube
// tab's MAIN world. They must be fully self-contained — no outer-scope refs.

async function transcriptInjected(videoId) {
  try {
    const ANDROID_VERSION = '20.10.38';
    const ANDROID_UA = `com.google.android.youtube/${ANDROID_VERSION} (Linux; U; Android 14)`;
    const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';

    function decodeEntities(s) {
      return s
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
        .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
    }

    function getAttr(attrStr, name) {
      const m = attrStr.match(new RegExp('\\b' + name + '="([^"]*)"'));
      return m ? m[1] : null;
    }

    function parseXmlCues(xml) {
      const cues = [];
      let m;

      const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/g;
      while ((m = pRe.exec(xml)) !== null) {
        const t = getAttr(m[1], 't');
        if (t === null) continue;
        const d = getAttr(m[1], 'd');
        const content = m[2]
          .replace(/<s\b[^>]*>([^<]*)<\/s>/g, '$1')
          .replace(/<[^>]+>/g, '');
        const text = decodeEntities(content).trim();
        if (text) cues.push({ start: parseInt(t, 10) / 1000, dur: parseInt(d || '0', 10) / 1000, text });
      }
      if (cues.length > 0) return cues;

      const textRe = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;
      while ((m = textRe.exec(xml)) !== null) {
        const start = getAttr(m[1], 'start');
        if (start === null) continue;
        const dur = getAttr(m[1], 'dur');
        const text = decodeEntities(m[2].replace(/<[^>]+>/g, '')).trim();
        if (text) cues.push({ start: parseFloat(start), dur: parseFloat(dur || '0'), text });
      }
      return cues;
    }

    async function fetchPlayerData() {
      const res = await fetch(INNERTUBE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': ANDROID_UA,
        },
        body: JSON.stringify({
          context: {
            client: { clientName: 'ANDROID', clientVersion: ANDROID_VERSION },
          },
          videoId,
        }),
      });
      if (!res.ok) throw new Error(`Innertube ANDROID HTTP ${res.status}`);
      return res.json();
    }

    async function fetchTrackCues(track) {
      const timedRes = await fetch(track.baseUrl, {
        headers: { 'User-Agent': ANDROID_UA },
      });
      if (!timedRes.ok) throw new Error(`Timedtext HTTP ${timedRes.status}`);
      const body = await timedRes.text();
      if (!body.trim()) return [];
      return parseXmlCues(body);
    }

    // Fast path: use page-embedded data if captions are present.
    let playerData = null;
    const native = window.ytInitialPlayerResponse;
    const nativeTracks =
      native?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

    if (native?.videoDetails?.videoId === videoId && nativeTracks.length > 0) {
      playerData = native;
    }

    // Slow path: ANDROID Innertube fetch (from youtube.com origin — no 403).
    const usedNativeTracks = Boolean(playerData);
    if (!playerData) playerData = await fetchPlayerData();

    const tracks =
      playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

    if (tracks.length === 0) {
      return { ok: true, data: { transcript: '', cues: [], hasCaptions: false } };
    }

    const selectTrack = (items) => items.find((t) => t.languageCode === 'en') ?? items[0];
    let cues = await fetchTrackCues(selectTrack(tracks));

    if (cues.length === 0 && usedNativeTracks) {
      const freshPlayerData = await fetchPlayerData();
      const freshTracks =
        freshPlayerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
      if (freshTracks.length === 0) {
        return { ok: false, message: 'Caption track refresh returned no tracks.' };
      }
      cues = await fetchTrackCues(selectTrack(freshTracks));
    }

    if (cues.length === 0) {
      return { ok: false, message: 'Caption track returned no transcript cues.' };
    }

    return {
      ok: true,
      data: { transcript: cues.map((c) => c.text).join(' '), cues, hasCaptions: true },
    };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

async function chaptersInjected(videoId) {
  try {
    const ANDROID_VERSION = '20.10.38';
    const ANDROID_UA = `com.google.android.youtube/${ANDROID_VERSION} (Linux; U; Android 14)`;
    const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';

    let playerData = null;
    const native = window.ytInitialPlayerResponse;
    if (native?.videoDetails?.videoId === videoId) {
      playerData = native;
    }

    if (!playerData) {
      const res = await fetch(INNERTUBE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': ANDROID_UA,
        },
        body: JSON.stringify({
          context: {
            client: { clientName: 'ANDROID', clientVersion: ANDROID_VERSION },
          },
          videoId,
        }),
      });
      if (!res.ok) return { ok: false, message: `Innertube ANDROID HTTP ${res.status}` };
      playerData = await res.json();
    }

    const description = playerData?.videoDetails?.shortDescription ?? '';
    const CHAPTER_RE = /^(?:(\d+):)?(\d{1,2}):(\d{2})\s+(.+)$/;
    const chapters = [];

    for (const line of description.split('\n')) {
      const match = CHAPTER_RE.exec(line.trim());
      if (!match) continue;
      const hours = match[1] ? parseInt(match[1], 10) : 0;
      const startSeconds = hours * 3600 + parseInt(match[2], 10) * 60 + parseInt(match[3], 10);
      const title = match[4].trim();
      if (title) chapters.push({ startSeconds, title });
    }

    if (!chapters.some((c) => c.startSeconds === 0)) return { ok: true, data: [] };

    const seen = new Set();
    const deduped = chapters
      .filter((c) => { if (seen.has(c.startSeconds)) return false; seen.add(c.startSeconds); return true; })
      .sort((a, b) => a.startSeconds - b.startSeconds);

    return { ok: true, data: deduped };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch and parse the transcript for the current YouTube video.
 * Resolves the tab automatically. Callers don't need a tabId.
 */
export async function fetchTranscript(videoId) {
  const { tabId } = await resolveYouTubeTab();
  const result = await runInYouTubeTab(tabId, transcriptInjected, [videoId]);

  if (!result.ok) {
    const error = new Error(result.message);
    error.code = 'TRANSCRIPT_ERROR';
    throw error;
  }

  return result.data;
}

/**
 * Fetch chapter timestamps from the current YouTube video's description.
 * Resolves the tab automatically.
 */
export async function fetchChapters(videoId) {
  const { tabId } = await resolveYouTubeTab();
  const result = await runInYouTubeTab(tabId, chaptersInjected, [videoId]);

  console.log('[Skimd] CHAPTERS RESPONSE:', result);

  if (!result.ok) {
    const error = new Error(result.message);
    error.code = 'TRANSCRIPT_ERROR';
    throw error;
  }

  return result.data;
}
