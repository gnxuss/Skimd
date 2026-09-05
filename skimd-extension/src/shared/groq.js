// Groq AI summary — calls api.groq.com directly from the extension.
// The API key is passed in by the caller; never read from the environment.

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models';
const GROQ_MODEL = 'openai/gpt-oss-120b';
const ATTEMPT_TIMEOUT_MS = 30_000;
const TOTAL_TIMEOUT_MS = 45_000;
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 5_000;

/**
 * Fetch with bounded retry for rate limits and transient provider failures.
 */
async function fetchWithRetry(url, opts, { retryProviderErrors = false } = {}) {
  const deadline = Date.now() + TOTAL_TIMEOUT_MS;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw timeoutError();

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      Math.min(ATTEMPT_TIMEOUT_MS, remaining),
    );

    let res;
    try {
      res = await fetch(url, { ...opts, signal: controller.signal });
    } catch (error) {
      if (error.name === 'AbortError') throw timeoutError();
      const networkError = new Error('Groq network request failed');
      networkError.code = 'GROQ_NETWORK_ERROR';
      throw networkError;
    } finally {
      clearTimeout(timeoutId);
    }

    const retryable = res.status === 429 || (retryProviderErrors && res.status >= 500);
    if (!retryable || attempt === MAX_RETRIES) return res;

    await res.body?.cancel().catch(() => {});
    const retryAfterSeconds = Number.parseFloat(res.headers.get('Retry-After') ?? '');
    const exponentialDelay = BASE_DELAY_MS * (2 ** attempt);
    const requestedDelay = Number.isFinite(retryAfterSeconds)
      ? retryAfterSeconds * 1_000
      : exponentialDelay;
    const delay = Math.min(requestedDelay, MAX_RETRY_DELAY_MS, deadline - Date.now());
    if (deadline - Date.now() <= 0) throw timeoutError();
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

function timeoutError() {
  const error = new Error('Groq request timed out');
  error.code = 'GROQ_TIMEOUT';
  return error;
}

const SYSTEM_PROMPTS = {
  paragraph:
    'You are a concise video summariser. Given a YouTube video transcript, write a clear, flowing summary in 3-5 sentences. Capture the main ideas without adding your own opinions. Do not use bullet points.',

  bullets:
    'You are a concise video summariser. Given a YouTube video transcript, write a summary as a list of 4-10 bullet points. Each bullet should be a single, clear sentence covering a key point. Start each bullet with "•".',

  tldr:
    'You are a concise video summariser. Given a YouTube video transcript, write a TLDR in exactly 1-2 sentences that captures the single most important takeaway. Be direct and specific.',
};

const ALL_FORMATS_PROMPT = [
  'You are a concise video summariser. Return a paragraph, bullet points, and a TLDR for the provided YouTube transcript.',
  'The paragraph must be 3-5 clear sentences. The bullets must contain 4-10 concise key points. The TLDR must be exactly 1-2 direct sentences.',
  'Capture the main ideas without adding opinions.',
].join(' ');

const ALL_FORMATS_RESPONSE = {
  type: 'json_schema',
  json_schema: {
    name: 'video_summaries',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        paragraph: { type: 'string' },
        bullets: {
          type: 'array',
          items: { type: 'string' },
          minItems: 4,
          maxItems: 10,
        },
        tldr: { type: 'string' },
      },
      required: ['paragraph', 'bullets', 'tldr'],
      additionalProperties: false,
    },
  },
};

async function requestCompletion({ transcript, apiKey, systemPrompt, responseFormat, maxCompletionTokens }) {
  let res;
  try {
    res = await fetchWithRetry(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `TRANSCRIPT:\n${transcript}` },
        ],
        temperature: 0.4,
        reasoning_effort: 'low',
        max_completion_tokens: maxCompletionTokens,
        ...(responseFormat ? { response_format: responseFormat } : {}),
      }),
    }, { retryProviderErrors: true });
  } catch (err) {
    if (err.code === 'GROQ_TIMEOUT' || err.code === 'GROQ_NETWORK_ERROR') throw err;
    const error = new Error('Groq network request failed');
    error.code = 'GROQ_NETWORK_ERROR';
    throw error;
  }

  if (res.status === 401 || res.status === 403) {
    const error = new Error('Groq API key is invalid or revoked');
    error.code = 'INVALID_KEY';
    throw error;
  }

  if (!res.ok) {
    await res.text().catch(() => '');
    const error = new Error('Groq rejected the summary request');
    error.code = res.status === 429
      ? 'GROQ_RATE_LIMITED'
      : res.status >= 400 && res.status < 500
        ? 'GROQ_REQUEST_ERROR'
        : 'GROQ_PROVIDER_ERROR';
    throw error;
  }

  let data;
  try {
    data = await res.json();
  } catch {
    const error = new Error('Groq response could not be parsed');
    error.code = 'GROQ_MALFORMED_RESPONSE';
    throw error;
  }

  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    const error = new Error('Groq returned an empty response');
    error.code = 'GROQ_EMPTY_RESPONSE';
    throw error;
  }

  return text;
}

/**
 * Summarise a transcript using Groq.
 *
 * @param {{ transcript: string, format: 'paragraph'|'bullets'|'tldr', apiKey: string }} params
 * @returns {Promise<string>}  The summary string.
 * @throws {{ message: string, code: 'INVALID_KEY'|'GROQ_UNAVAILABLE' }}
 */
export async function summarise({ transcript, format, apiKey }) {
  const systemPrompt = SYSTEM_PROMPTS[format];
  if (!systemPrompt) {
    const err = new Error(`Unknown format "${format}". Expected paragraph, bullets, or tldr.`);
    err.code = 'GROQ_UNAVAILABLE';
    throw err;
  }

  return requestCompletion({
    transcript,
    apiKey,
    systemPrompt,
    maxCompletionTokens: 512,
  });
}

export async function summariseAllFormats({ transcript, apiKey }) {
  const content = await requestCompletion({
    transcript,
    apiKey,
    systemPrompt: ALL_FORMATS_PROMPT,
    responseFormat: ALL_FORMATS_RESPONSE,
    maxCompletionTokens: 1_024,
  });

  try {
    const summaries = JSON.parse(content);
    if (
      typeof summaries.paragraph !== 'string'
      || !Array.isArray(summaries.bullets)
      || summaries.bullets.some((bullet) => typeof bullet !== 'string')
      || typeof summaries.tldr !== 'string'
      || !summaries.paragraph.trim()
      || summaries.bullets.length === 0
      || !summaries.tldr.trim()
    ) {
      throw new Error('invalid summary shape');
    }

    return {
      paragraph: summaries.paragraph.trim(),
      bullets: summaries.bullets.map((bullet) => `• ${bullet.trim()}`).join('\n'),
      tldr: summaries.tldr.trim(),
    };
  } catch {
    const error = new Error('Groq response could not be parsed');
    error.code = 'GROQ_MALFORMED_RESPONSE';
    throw error;
  }
}

/**
 * Validate an API key by making a minimal test request.
 * Resolves true on success, throws with code INVALID_KEY or GROQ_UNAVAILABLE.
 *
 * @param {string} apiKey
 * @returns {Promise<true>}
 */
export async function validateKey(apiKey) {
  let res;
  try {
    res = await fetchWithRetry(GROQ_MODELS_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  } catch (err) {
    const error = new Error(
      err.code === 'GROQ_TIMEOUT' ? 'Groq request timed out' : 'Groq network request failed'
    );
    error.code = 'GROQ_UNAVAILABLE';
    throw error;
  }

  if (res.status === 401 || res.status === 403) {
    const error = new Error('API key is invalid or revoked');
    error.code = 'INVALID_KEY';
    throw error;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const error = new Error(`Groq returned HTTP ${res.status}: ${body.slice(0, 100)}`);
    // 4xx other than 401 is not a network failure — treat as GROQ_UNAVAILABLE
    error.code = 'GROQ_UNAVAILABLE';
    throw error;
  }

  return true;
}
