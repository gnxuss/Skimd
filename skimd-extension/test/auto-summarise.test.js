import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createAutoSummariseClaims,
  hasCompleteSummaries,
  isAutoSummariseReady,
} from '../src/features/summary/autoSummarise.js';

const READY = {
  apiKey: 'synthetic-key',
  videoId: 'video-a',
  transcript: 'synthetic transcript',
  hasCaptions: true,
  transcriptLoading: false,
  transcriptError: null,
  summaryLoading: false,
  hydrated: true,
  summaries: { paragraph: null, bullets: null, tldr: null },
};

test('given loading popup data, when readiness settles, then only hydrated data is eligible', () => {
  const states = [
    { ...READY, transcriptLoading: true, transcript: '' },
    { ...READY, summaryLoading: true, hydrated: false },
    READY,
  ];
  const eligibility = states.map(isAutoSummariseReady);
  assert.deepEqual(eligibility, [false, false, true]);
});

test('given complete cached summaries, when readiness is checked, then auto-start is suppressed', () => {
  const summaries = {
    paragraph: 'paragraph result',
    bullets: 'bullets result',
    tldr: 'tldr result',
  };
  assert.equal(hasCompleteSummaries(summaries), true);
  assert.equal(isAutoSummariseReady({ ...READY, summaries }), false);
});

test('given partial or malformed cache, when completeness is checked, then it remains incomplete', () => {
  const cases = [
    null,
    { paragraph: 'paragraph', bullets: null, tldr: 'tldr' },
    { paragraph: 'paragraph', bullets: '   ', tldr: 'tldr' },
    { paragraph: 'paragraph', bullets: ['unexpected'], tldr: 'tldr' },
  ];
  assert.deepEqual(cases.map(hasCompleteSummaries), [false, false, false, false]);
});

test('given a missing or failed prerequisite, when readiness is checked, then no request is eligible', () => {
  const cases = [
    { ...READY, apiKey: '' },
    { ...READY, videoId: null },
    { ...READY, transcript: '' },
    { ...READY, hasCaptions: false },
    { ...READY, transcriptError: { code: 'TRANSCRIPT_ERROR' } },
    { ...READY, transcriptLoading: true },
    { ...READY, summaryLoading: true },
    { ...READY, hydrated: false },
  ];
  assert.deepEqual(cases.map(isAutoSummariseReady), Array(cases.length).fill(false));
});

test('given one popup, when effects replay and remount, then each video is claimed once', () => {
  const claims = createAutoSummariseClaims();
  const results = [
    claims.claim('video-a'),
    claims.claim('video-a'),
    claims.claim('video-a'),
    claims.claim('video-a'),
  ];
  assert.deepEqual(results, [true, false, false, false]);
});

test('given a claimed video, when a new video appears, then the new video can be claimed once', () => {
  const claims = createAutoSummariseClaims();
  claims.claim('video-a');
  assert.equal(claims.claim('video-b'), true);
  assert.equal(claims.claim('video-b'), false);
});

test('given an automatic failure, when readiness replays and manual retry runs, then only manual retries', async () => {
  const claims = createAutoSummariseClaims();
  let requests = 0;
  const request = async () => {
    requests += 1;
    if (requests === 1) throw new Error('synthetic failure');
    return 'success';
  };
  assert.equal(claims.claim('video-a'), true);
  await assert.rejects(request());

  const replayClaimed = claims.claim('video-a');
  const manualResult = await request();

  assert.equal(replayClaimed, false);
  assert.equal(manualResult, 'success');
  assert.equal(requests, 2);
});
