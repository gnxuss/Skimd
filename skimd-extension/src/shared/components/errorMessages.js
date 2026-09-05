const GROQ_MSG = 'Groq is currently unavailable. Please try again in a moment.';

const ERROR_MESSAGES = {
  INVALID_KEY:        'That key was rejected. Double-check it in the Groq console.',
  GROQ_REQUEST_ERROR: 'Groq rejected this summary request. Reload Skimd and try again.',
  GROQ_RATE_LIMITED:  'Groq usage is temporarily limited. Wait up to a minute and try again.',
  GROQ_UNAVAILABLE:   'Could not reach Groq. Check your internet connection and try again.',
  GROQ_PROVIDER_ERROR: 'Groq could not complete the summary after a few attempts. Please try again shortly.',
  GROQ_TIMEOUT:       'Groq did not finish the summary in time. Please try again shortly.',
  GROQ_NETWORK_ERROR: 'Could not connect to Groq. Check your internet connection and try again.',
  GROQ_MALFORMED_RESPONSE: 'Groq returned an unreadable response. Please try again.',
  GROQ_EMPTY_RESPONSE: 'Groq returned an empty summary. Please try again.',
  GEMINI_UNAVAILABLE: GROQ_MSG,
  NO_CAPTIONS:        "This video doesn't have captions. Skimd needs captions to generate a summary.",
  TRANSCRIPT_ERROR:   'Could not load the transcript. Try refreshing the extension.',
  NETWORK_ERROR:      'Cannot reach the Skimd server. Check that the backend is running.',
  NO_VIDEO:           'Open a YouTube video to get started.',
  UNKNOWN_ERROR:      'Something went wrong. Please try again.',
};

export function resolveErrorMessage(error) {
  if (!error) return null;
  return ERROR_MESSAGES[error.code] ?? error.message ?? ERROR_MESSAGES.UNKNOWN_ERROR;
}

export function saveSucceeded(result) {
  return result === true;
}
