import React from 'react';

/**
 * Skeleton — a single shimmer block.
 *
 * @param {{ className?: string }} props
 */
export default function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}
