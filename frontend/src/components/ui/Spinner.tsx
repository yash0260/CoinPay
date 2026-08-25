'use client';

import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClass = size !== 'md' ? `spinner-${size}` : '';
  return (
    <div className={`spinner-container ${className}`} role="status" aria-label="Loading">
      <div className={`spinner ${sizeClass}`} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
