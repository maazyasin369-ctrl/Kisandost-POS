'use client';

import React from 'react';
import { LucideIcon, PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="bg-[var(--kd-surface)] p-8 sm:p-12 rounded-xl border border-border text-center flex flex-col items-center justify-center space-y-3 shadow-[var(--kd-shadow)]">
      <div className="p-3 bg-[var(--kd-primary-soft)] text-primary rounded-full border border-emerald-100">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 bg-primary text-primary-foreground hover:opacity-90 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-[var(--kd-shadow)] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
