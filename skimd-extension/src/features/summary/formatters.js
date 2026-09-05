/**
 * Render a summary string into a React-renderable node based on format.
 *
 * paragraph — returns the string as-is (plain text rendered in a <p>)
 * bullets   — splits on "•" and returns a list of trimmed strings
 * tldr      — returns the string as-is (single sentence)
 *
 * Consumers can render the output however they like; this module only
 * transforms the raw Gemini output string into structured data.
 */

/**
 * @param {string} text   Raw summary string from the API
 * @param {'paragraph'|'bullets'|'tldr'} format
 * @returns {string | string[]}
 *   - paragraph/tldr → string
 *   - bullets → string[] of bullet content (the "•" is stripped)
 */
export function formatSummary(text, format) {
  if (!text) return format === 'bullets' ? [] : '';

  if (format === 'bullets') {
    return text
      .split('\n')
      .filter((line) => /^[•\-*]/.test(line.trim())) // preamble lines never start with a bullet
      .map((line) => line.replace(/^[•\-*]\s*/, '').trim())
      .filter(Boolean);
  }

  return text.trim();
}
