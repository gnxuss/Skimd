const SUMMARY_FORMATS = ['paragraph', 'bullets', 'tldr'];

export function hasCompleteSummaries(summaries) {
  if (!summaries || typeof summaries !== 'object' || Array.isArray(summaries)) return false;
  return SUMMARY_FORMATS.every((format) => (
    typeof summaries[format] === 'string' && summaries[format].trim().length > 0
  ));
}

export function isAutoSummariseReady({
  apiKey,
  videoId,
  transcript,
  hasCaptions,
  transcriptLoading,
  transcriptError,
  summaryLoading,
  hydrated,
  summaries,
}) {
  return Boolean(
    apiKey
    && videoId
    && transcript
    && hasCaptions === true
    && !transcriptLoading
    && !transcriptError
    && !summaryLoading
    && hydrated
    && !hasCompleteSummaries(summaries),
  );
}

export function createAutoSummariseClaims() {
  const claimedVideoIds = new Set();
  return {
    claim(videoId) {
      if (!videoId || claimedVideoIds.has(videoId)) return false;
      claimedVideoIds.add(videoId);
      return true;
    },
  };
}
