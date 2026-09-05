import assert from 'node:assert/strict';
import test from 'node:test';

import { summarise } from '../src/shared/groq.js';

function jsonResponse(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

test('summary retries one transient provider failure and then succeeds', async (t) => {
  // Given: Groq is temporarily unavailable for one attempt.
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return calls === 1
      ? jsonResponse(503, { error: { message: 'redacted fixture' } })
      : jsonResponse(200, { choices: [{ message: { content: 'summary' } }] });
  };

  // When: one summary is requested.
  const result = await summarise({
    transcript: 'synthetic',
    format: 'paragraph',
    apiKey: 'synthetic',
  });

  // Then: the bounded retry succeeds without requiring another user click.
  assert.equal(result, 'summary');
  assert.equal(calls, 2);
});

test('three-format scheduler bounds concurrency and preserves result order', async () => {
  // Given: a request function that exposes active request count without content.
  const { summariseFormats } = await import('../src/features/summary/summaryScheduler.js');
  let active = 0;
  let maxActive = 0;
  const ordinals = [];
  const request = async () => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    ordinals.push('all');
    await Promise.resolve();
    active -= 1;
    return {
      paragraph: 'result-paragraph',
      bullets: 'result-bullets',
      tldr: 'result-tldr',
    };
  };

  // When: all supported formats are requested.
  const results = await summariseFormats({
    transcript: 'synthetic',
    apiKey: 'synthetic',
    request,
  });

  // Then: one request returns every format in display order.
  assert.equal(maxActive, 1);
  assert.deepEqual(ordinals, ['all']);
  assert.deepEqual(results, {
    paragraph: 'result-paragraph',
    bullets: 'result-bullets',
    tldr: 'result-tldr',
  });
});

test('three-format scheduler surfaces a terminal failure without starting siblings', async () => {
  // Given: the combined request fails terminally.
  const { summariseFormats } = await import('../src/features/summary/summaryScheduler.js');
  const requested = [];
  const request = async () => {
    requested.push('all');
    const error = new Error('safe failure');
    error.code = 'GROQ_REQUEST_ERROR';
    throw error;
  };

  // When/Then: the batch rejects after exactly one transcript-bearing request.
  await assert.rejects(
    summariseFormats({ transcript: 'synthetic', apiKey: 'synthetic', request }),
    (error) => error.code === 'GROQ_REQUEST_ERROR',
  );
  assert.deepEqual(requested, ['all']);
});

test('terminal client responses are not retried', async (t) => {
  // Given: Groq rejects the request as invalid.
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return jsonResponse(422, { error: { message: 'redacted fixture' } });
  };

  // When/Then: the stable terminal code is returned after exactly one request.
  await assert.rejects(
    summarise({ transcript: 'synthetic', format: 'paragraph', apiKey: 'synthetic' }),
    (error) => error.code === 'GROQ_REQUEST_ERROR',
  );
  assert.equal(calls, 1);
});

test('long transcripts are transmitted once for all summary formats', async () => {
  // Given: Groq's documented free-tier 8K token-per-minute budget and four
  // synthetic transcript sizes spanning the former failure boundary.
  const { summariseFormats } = await import('../src/features/summary/summaryScheduler.js');
  const observations = [];

  for (const characterCount of [4_000, 8_000, 12_000, 16_000]) {
    let consumedTokens = 0;
    let requestCount = 0;
    const request = async ({ transcript }) => {
      requestCount += 1;
      const estimatedTokens = Math.ceil(transcript.length / 4);
      consumedTokens += estimatedTokens;
      observations.push({ characterCount, estimatedTokens, requestCount });

      if (consumedTokens > 8_000) {
        const error = new Error('synthetic rate limit');
        error.code = 'GROQ_RATE_LIMITED';
        throw error;
      }

      return {
        paragraph: 'result-paragraph',
        bullets: 'result-bullets',
        tldr: 'result-tldr',
      };
    };

    // When: one click requests every summary format.
    const result = await summariseFormats({
      transcript: 'x'.repeat(characterCount),
      apiKey: 'synthetic',
      request,
    });

    // Then: one transcript-bearing request returns the complete result set.
    assert.equal(requestCount, 1);
    assert.deepEqual(Object.keys(result), ['paragraph', 'bullets', 'tldr']);
  }

  assert.deepEqual(observations, [
    { characterCount: 4_000, estimatedTokens: 1_000, requestCount: 1 },
    { characterCount: 8_000, estimatedTokens: 2_000, requestCount: 1 },
    { characterCount: 12_000, estimatedTokens: 3_000, requestCount: 1 },
    { characterCount: 16_000, estimatedTokens: 4_000, requestCount: 1 },
  ]);
});
