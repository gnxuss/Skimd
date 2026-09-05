import { useState, useEffect } from 'react';
import { validateKey } from '../../shared/groq.js';

const STORAGE_KEY = 'groq_api_key';

export async function validateAndPersistKey(key, { validate = validateKey, persist } = {}) {
  await validate(key);
  const write = persist ?? ((value) => chrome.storage.local.set({ [STORAGE_KEY]: value }));
  await write(key);
  return true;
}

/**
 * Manages the Groq API key lifecycle:
 *   - Reads from chrome.storage.local on mount
 *   - Validates against Groq before saving
 *   - Writes to chrome.storage.local on success
 *   - Exposes loading, error, and isValid state
 *
 * @returns {{
 *   apiKey:   string,
 *   isValid:  boolean,
 *   loading:  boolean,
 *   error:    { code: string, message: string } | null,
 *   saveKey:  (key: string) => Promise<boolean>,
 *   clearKey: () => Promise<void>,
 * }}
 */
export function useApiKey() {
  const [apiKey,  setApiKey]  = useState('');
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(true); // true while reading initial value
  const [error,   setError]   = useState(null);

  // Read stored key on mount.
  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY).then((result) => {
      const stored = result[STORAGE_KEY] ?? '';
      setApiKey(stored);
      setIsValid(Boolean(stored));
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  /**
   * Validate and save a new API key.
   * Calls Groq to confirm the key works before persisting.
   */
  async function saveKey(key) {
    const trimmed = key.trim();
    if (!trimmed) {
      setError({ code: 'INVALID_KEY', message: 'Please enter an API key.' });
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await validateAndPersistKey(trimmed);
      setApiKey(trimmed);
      setIsValid(true);
      return true;
    } catch (err) {
      setError({ code: err.code ?? 'GROQ_UNAVAILABLE', message: err.message });
      setIsValid(false);
      return false;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Remove the API key from storage and reset state.
   */
  async function clearKey() {
    await chrome.storage.local.remove(STORAGE_KEY).catch(() => {});
    setApiKey('');
    setIsValid(false);
    setError(null);
  }

  return { apiKey, isValid, loading, error, saveKey, clearKey };
}
