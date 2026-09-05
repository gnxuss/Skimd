import React from 'react';
import { resolveErrorMessage } from './errorMessages.js';

/**
 * Elevated surface card for error states.
 * rounded-lg matches container radius token; shadow-sm gives card depth.
 * @param {{ code?: string, message?: string }} props
 */
export default function ErrorBanner({ code, message }) {
  const resolvedMessage = resolveErrorMessage({ code, message });

  return (
    <div className="mx-4 my-2 px-4 py-3 rounded-lg shadow-sm
      bg-red-50 dark:bg-red-900/20
      border border-red-200 dark:border-red-800
      text-red-700 dark:text-red-400
      text-sm font-normal leading-relaxed">
      {resolvedMessage}
    </div>
  );
}
