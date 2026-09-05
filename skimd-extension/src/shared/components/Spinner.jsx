import React from 'react';

// Loading spinner — brand primary colour.
export default function Spinner() {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
