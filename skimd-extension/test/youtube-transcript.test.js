import test from 'node:test';
import assert from 'node:assert/strict';

const VIDEO_ID = 'video-123';

function playerResponse(baseUrl) {
  return {
    videoDetails: { videoId: VIDEO_ID },
    captions: {
      playerCaptionsTracklistRenderer: {
        captionTracks: [{ languageCode: 'en', baseUrl }],
      },
    },
  };
}

function response({ ok = true, status = 200, text = '', json }) {
  return {
    ok,
    status,
    async text() { return text; },
    async json() { return json; },
  };
}

async function loadFetchTranscript({ nativePlayer, fetchImpl }) {
  let injected;
  globalThis.chrome = {
    tabs: {
      async query() {
        return [{ id: 7, active: true, url: `https://www.youtube.com/watch?v=${VIDEO_ID}` }];
      },
    },
    storage: { sync: { async get() { return {}; } } },
    scripting: {
      async executeScript({ target, func, args }) {
        injected = { target, args };
        const previousWindow = globalThis.window;
        const previousFetch = globalThis.fetch;
        globalThis.window = { ytInitialPlayerResponse: nativePlayer };
        globalThis.fetch = fetchImpl;
        try {
          return [{ result: await func(...args) }];
        } finally {
          globalThis.window = previousWindow;
          globalThis.fetch = previousFetch;
        }
      },
    },
  };

  const module = await import(`../src/shared/youtube.js?test=${Math.random()}`);
  return { fetchTranscript: module.fetchTranscript, getInjected: () => injected };
}

test('advertised native caption track with an empty body retries a fresh player track', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    if (String(url).includes('/youtubei/v1/player')) {
      return response({ json: playerResponse('https://captions.test/fresh') });
    }
    if (url === 'https://captions.test/native') return response({ text: '' });
    if (url === 'https://captions.test/fresh') {
      return response({ text: '<transcript><text start="1.5" dur="2">Working cue</text></transcript>' });
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  const { fetchTranscript, getInjected } = await loadFetchTranscript({
    nativePlayer: playerResponse('https://captions.test/native'),
    fetchImpl,
  });

  const result = await fetchTranscript(VIDEO_ID);

  assert.equal(result.hasCaptions, true);
  assert.equal(result.cues.length, 1);
  assert.ok(result.transcript.length > 0);
  assert.ok(calls.some((url) => url.includes('/youtubei/v1/player')));
  assert.deepEqual(getInjected(), { target: { tabId: 7 }, args: [VIDEO_ID] });
});

test('captionless player response remains a distinct no-captions result', async () => {
  const fetchImpl = async (url) => {
    assert.match(String(url), /youtubei\/v1\/player/);
    return response({ json: { videoDetails: { videoId: VIDEO_ID } } });
  };
  const { fetchTranscript } = await loadFetchTranscript({ nativePlayer: null, fetchImpl });

  assert.deepEqual(await fetchTranscript(VIDEO_ID), {
    transcript: '',
    cues: [],
    hasCaptions: false,
  });
});

test('non-OK caption response is a transcript retrieval error', async () => {
  const fetchImpl = async () => response({ ok: false, status: 503 });
  const { fetchTranscript } = await loadFetchTranscript({
    nativePlayer: playerResponse('https://captions.test/unavailable'),
    fetchImpl,
  });

  await assert.rejects(fetchTranscript(VIDEO_ID), {
    code: 'TRANSCRIPT_ERROR',
    message: 'Timedtext HTTP 503',
  });
});

test('empty refreshed caption response is a transcript retrieval error', async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes('/youtubei/v1/player')) {
      return response({ json: playerResponse('https://captions.test/fresh-empty') });
    }
    return response({ text: '' });
  };
  const { fetchTranscript } = await loadFetchTranscript({
    nativePlayer: playerResponse('https://captions.test/native-empty'),
    fetchImpl,
  });

  await assert.rejects(fetchTranscript(VIDEO_ID), {
    code: 'TRANSCRIPT_ERROR',
    message: 'Caption track returned no transcript cues.',
  });
});

test('malformed caption payload is a transcript retrieval error', async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes('/youtubei/v1/player')) {
      return response({ json: playerResponse('https://captions.test/malformed') });
    }
    return response({ text: '{"events": "unsupported"}' });
  };
  const { fetchTranscript } = await loadFetchTranscript({ nativePlayer: null, fetchImpl });

  await assert.rejects(fetchTranscript(VIDEO_ID), {
    code: 'TRANSCRIPT_ERROR',
    message: 'Caption track returned no transcript cues.',
  });
});

test('successful caption response satisfies the existing Summarise button guard', async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes('/youtubei/v1/player')) {
      return response({ json: playerResponse('https://captions.test/working') });
    }
    return response({ text: '<transcript><text start="0" dur="1">Ready</text></transcript>' });
  };
  const { fetchTranscript } = await loadFetchTranscript({ nativePlayer: null, fetchImpl });

  const result = await fetchTranscript(VIDEO_ID);
  const disabled = false || !result.hasCaptions || !result.transcript;

  assert.equal(disabled, false);
  assert.deepEqual(result.cues, [{ start: 0, dur: 1, text: 'Ready' }]);
});
