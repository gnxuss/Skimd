import React from 'react';

/**
 * Primary action button — Skimd brand.
 *
 * Typography:  text-sm / font-semibold (headings-only weight for CTAs)
 * Shape:       rounded-lg (consistent container radius)
 * Colour:      bg-brand-primary (#FE5A02) → hover #D94E02 (darker, stronger feedback)
 * Press feel:  hover:scale-[1.01] / active:scale-95 (GPU-composited, 100 ms)
 *              disabled:scale-100 prevents misleading tactile feedback
 * Elevation:   shadow-sm → hover:shadow-md (secondary action lift)
 */
export default function Button({ children, onClick, disabled = false, className = '', id }) {
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 rounded-lg text-sm font-semibold
        bg-brand-primary text-white
        hover:bg-[#D94E02]
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-sm hover:shadow-md
        transition-all duration-100
        hover:scale-[1.01] active:scale-95 disabled:scale-100
        will-change-transform
        ${className}`}
    >
      {children}
    </button>
  );
}
