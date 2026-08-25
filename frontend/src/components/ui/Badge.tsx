'use client';

import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'category';
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ variant = 'info', children, color, className = '' }: BadgeProps) {
  const classes = ['badge', `badge-${variant}`, className].filter(Boolean).join(' ');

  const style = variant === 'category' && color
    ? { backgroundColor: `${color}20`, color, borderColor: `${color}40` } as React.CSSProperties
    : undefined;

  return (
    <span className={classes} style={style}>
      {variant !== 'category' && <span className="badge-dot" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, 'success' | 'danger' | 'warning'> = {
    SUCCESS: 'success',
    FAILED: 'danger',
    PENDING: 'warning',
  };

  return (
    <Badge variant={variantMap[status] || 'info'}>
      {status}
    </Badge>
  );
}
