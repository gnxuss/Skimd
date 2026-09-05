import assert from 'node:assert/strict';
import test from 'node:test';

import { summarise } from '../src/shared/groq.js';
import { summariseAllFormats } from '../src/shared/groq.js';
import { resolveErrorMessage } from '../src/shared/components/errorMessages.js';

const SUPPORTED_MODEL = 'openai/gpt-oss-120b';

function jsonResponse(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

test('summary request uses the supported Groq model and returns trimmed text', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  let requestMetadata;
  globalThis.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    requestMetadata = {
      pathname: new URL(url).pathname,
      method: options.method,
      model: body.model,
      messageCount: body.messages.length,
    };

    if (body.model !== SUPPORTED_MODEL) {
      return jsonResponse(400, {
        error: {
          type: 'invalid_request_error',
          code: 'model_decommissioned',
          param: 'model',
          message: 'redacted by test fixture',
        },
      });
    }

    return jsonResponse(200, {
      choices: [{ message: { content: '  usable summary  ' } }],
    });
  };

  const result = await summarise({
    transcript: 'synthetic transcript',
    format: 'paragraph',
    apiKey: 'synthetic-in-memory-only',
  });

  assert.equal(result, 'usable summary');
  assert.deepEqual(requestMetadata, {
    pathname: '/openai/v1/chat/completions',
    method: 'POST',
    model: SUPPORTED_MODEL,
    messageCount: 2,
  });
});

test('summary request classifies provider responses without exposing provider bodies', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  for (const [status, expectedCode] of [
    [401, 'INVALID_KEY'],
    [403, 'INVALID_KEY'],
    [400, 'GROQ_REQUEST_ERROR'],
    [422, 'GROQ_REQUEST_ERROR'],
    [429, 'GROQ_RATE_LIMITED'],
    [500, 'GROQ_PROVIDER_ERROR'],
    [503, 'GROQ_PROVIDER_ERROR'],
  ]) {
    globalThis.fetch = async () => jsonResponse(status, {
      error: {
        type: 'synthetic_type',
        code: 'synthetic_code',
        param: 'synthetic_param',
        message: 'provider body must never reach the local error',
      },
    }, status === 429 ? { 'Retry-After': '0' } : {});

    await assert.rejects(
      summarise({ transcript: 'synthetic', format: 'paragraph', apiKey: 'synthetic' }),
      (error) => error.code === expectedCode && !error.message.includes('provider body'),
    );
  }
});

test('all three formats use the supported provider contract', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  const formats = [];
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.model, SUPPORTED_MODEL);
    assert.equal(body.max_completion_tokens, 512);
    assert.equal(body.max_tokens, undefined);
    formats.push(body.messages[0].content);
    return jsonResponse(200, {
      choices: [{ message: { content: `summary-${formats.length}` } }],
    });
  };

  const results = await Promise.all(
    ['paragraph', 'bullets', 'tldr'].map((format) => summarise({
      transcript: 'synthetic',
      format,
      apiKey: 'synthetic',
    })),
  );

  assert.deepEqual(results, ['summary-1', 'summary-2', 'summary-3']);
  assert.equal(formats.length, 3);
});

test('transport, abort, malformed JSON, and empty success responses have stable codes', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  const cases = [
    [async () => { throw new TypeError('sensitive transport detail'); }, 'GROQ_NETWORK_ERROR'],
    [async () => { throw new DOMException('synthetic abort', 'AbortError'); }, 'GROQ_TIMEOUT'],
    [async () => new Response('{', { status: 200 }), 'GROQ_MALFORMED_RESPONSE'],
    [async () => jsonResponse(200, { choices: [{ message: { content: '   ' } }] }), 'GROQ_EMPTY_RESPONSE'],
  ];

  for (const [fetchImpl, expectedCode] of cases) {
    globalThis.fetch = fetchImpl;
    await assert.rejects(
      summarise({ transcript: 'synthetic', format: 'paragraph', apiKey: 'synthetic' }),
      (error) => error.code === expectedCode && !error.message.includes('sensitive transport detail'),
    );
  }
});

test('summary error codes render truthful safe guidance', () => {
  const expected = new Map([
    ['INVALID_KEY', 'That key was rejected. Double-check it in the Groq console.'],
    ['GROQ_REQUEST_ERROR', 'Groq rejected this summary request. Reload Skimd and try again.'],
    ['GROQ_RATE_LIMITED', 'Groq usage is temporarily limited. Wait up to a minute and try again.'],
    ['GROQ_PROVIDER_ERROR', 'Groq could not complete the summary after a few attempts. Please try again shortly.'],
    ['GROQ_TIMEOUT', 'Groq did not finish the summary in time. Please try again shortly.'],
    ['GROQ_NETWORK_ERROR', 'Could not connect to Groq. Check your internet connection and try again.'],
    ['GROQ_MALFORMED_RESPONSE', 'Groq returned an unreadable response. Please try again.'],
    ['GROQ_EMPTY_RESPONSE', 'Groq returned an empty summary. Please try again.'],
  ]);

  for (const [code, message] of expected) {
    assert.equal(resolveErrorMessage({ code }), message);
  }
});

test('combined summary request returns paragraph, bullets, and TLDR from one completion', async (t) => {
  // Given: a provider response containing the complete structured result set.
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  let calls = 0;
  let requestMetadata;
  globalThis.fetch = async (_url, options) => {
    calls += 1;
    const body = JSON.parse(options.body);
    requestMetadata = {
      model: body.model,
      messageCount: body.messages.length,
      responseType: body.response_format?.type,
      transcriptOccurrences: body.messages.filter(({ content }) => content.includes('synthetic-marker')).length,
    };
    return jsonResponse(200, {
      choices: [{
        message: {
          content: JSON.stringify({
            paragraph: 'paragraph result',
            bullets: ['first point', 'second point'],
            tldr: 'tldr result',
          }),
        },
      }],
    });
  };

  // When: all formats are requested for one transcript.
  const result = await summariseAllFormats({
    transcript: 'synthetic-marker',
    apiKey: 'synthetic',
  });

  // Then: the transcript crosses the provider boundary exactly once.
  assert.equal(calls, 1);
  assert.deepEqual(requestMetadata, {
    model: SUPPORTED_MODEL,
    messageCount: 2,
    responseType: 'json_schema',
    transcriptOccurrences: 1,
  });
  assert.deepEqual(result, {
    paragraph: 'paragraph result',
    bullets: '• first point\n• second point',
    tldr: 'tldr result',
  });
});
