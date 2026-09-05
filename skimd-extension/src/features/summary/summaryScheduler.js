import { summariseAllFormats } from '../../shared/groq.js';

export async function summariseFormats({ transcript, apiKey, request = summariseAllFormats }) {
  return request({ transcript, apiKey });
}
