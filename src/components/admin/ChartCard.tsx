'use client'

import React from 'react'

export function ChartCard({
  title,
  note,
  action,
  children,
  className = '',
}: {
  title: string
  note?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`flex flex-col rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] p-5 shadow-[var(--kd-shadow)] ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
          {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
        </div>
        {action}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  )
}
