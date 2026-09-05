import assert from 'node:assert/strict';
import test from 'node:test';

import { validateKey } from '../src/shared/groq.js';
import { validateAndPersistKey } from '../src/features/settings/useApiKey.js';
import {
  resolveErrorMessage,
  saveSucceeded,
} from '../src/shared/components/errorMessages.js';

function response(status, body = '') {
  return new Response(body, { status });
}

test('validation uses the credential-only provider request and resolves on success', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, method: options?.method, body: options?.body };
    return response(200, JSON.stringify({ data: [] }));
  };

  await assert.doesNotReject(validateKey('synthetic-in-memory-only'));
  assert.deepEqual(request, {
    url: 'https://api.groq.com/openai/v1/models',
    method: 'GET',
    body: undefined,
  });
});

test('validation preserves authentication and availability error codes', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  for (const [fetchResult, expectedCode] of [
    [async () => response(401), 'INVALID_KEY'],
    [async () => response(403), 'INVALID_KEY'],
    [async () => response(503), 'GROQ_UNAVAILABLE'],
    [async () => { throw new TypeError('synthetic transport failure'); }, 'GROQ_UNAVAILABLE'],
  ]) {
    globalThis.fetch = fetchResult;
    await assert.rejects(validateKey('synthetic-in-memory-only'), { code: expectedCode });
  }
});

test('settings error contract renders specific guidance', () => {
  assert.equal(
    resolveErrorMessage({ code: 'INVALID_KEY' }),
    'That key was rejected. Double-check it in the Groq console.',
  );
  assert.equal(
    resolveErrorMessage({ code: 'GROQ_UNAVAILABLE' }),
    'Could not reach Groq. Check your internet connection and try again.',
  );
  assert.equal(resolveErrorMessage({ message: 'Supported explicit message' }), 'Supported explicit message');
});

test('only an explicit successful save result can display confirmation', () => {
  assert.equal(saveSucceeded(true), true);
  assert.equal(saveSucceeded(false), false);
  assert.equal(saveSucceeded(undefined), false);
});

test('persistence occurs exactly once after validation and never after validation failure', async () => {
  let writes = 0;
  const persist = async () => { writes += 1; };

  assert.equal(await validateAndPersistKey('candidate', {
    validate: async () => true,
    persist,
  }), true);
  assert.equal(writes, 1);

  for (const code of ['INVALID_KEY', 'GROQ_UNAVAILABLE']) {
    await assert.rejects(validateAndPersistKey('candidate', {
      validate: async () => { throw Object.assign(new Error('mock failure'), { code }); },
      persist,
    }), { code });
  }
  assert.equal(writes, 1);
});
