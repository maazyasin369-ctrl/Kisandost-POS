'use client'

import type { LucideIcon } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

export function StatCard({
  label,
  value,
  hint,
  trend,
  spark,
  icon: Icon,
  tone = 'primary',
}: {
  label: string
  value: string
  hint?: string
  trend?: { value: number }
  spark: number[]
  icon: LucideIcon
  tone?: 'primary' | 'accent'
}) {
  const up = (trend?.value ?? 0) >= 0
  const data = spark.map((v, i) => ({ i, v }))
  const stroke = tone === 'accent' ? 'var(--kd-accent)' : 'var(--kd-primary)'
  const soft = tone === 'accent' ? 'var(--kd-accent-soft)' : 'var(--kd-primary-soft)'

  return (
    <article className="relative overflow-hidden rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] p-5 shadow-[var(--kd-shadow)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-[1.65rem] font-semibold leading-none tracking-tight text-foreground tabular-nums">
            {value}
          </p>
        </div>
        <span
          className="flex size-9 items-center justify-center rounded-xl"
          style={{ background: soft, color: stroke }}
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {trend && (
            <span
              className={`rounded-full px-1.5 py-0.5 font-medium tabular-nums ${
                up
                  ? 'bg-[color-mix(in_srgb,var(--kd-success)_12%,transparent)] text-success'
                  : 'bg-[color-mix(in_srgb,var(--kd-danger)_12%,transparent)] text-danger'
              }`}
            >
              {up ? '+' : '−'}
              {Math.abs(trend.value)}%
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
        <div className="h-9 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <Area type="monotone" dataKey="v" stroke={stroke} fill={soft} strokeWidth={1.75} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </article>
  )
}

export function WidgetState({
  kind,
  title,
}: {
  kind: 'loading' | 'empty' | 'error'
  title: string
}) {
  if (kind === 'loading') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)]" />
        ))}
      </div>
    )
  }
  return (
    <div className="rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] px-4 py-10 text-center text-sm text-muted-foreground">
      {kind === 'error' ? `Could not load ${title}.` : `No ${title} yet.`}
    </div>
  )
}
