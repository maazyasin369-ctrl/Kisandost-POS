import React from 'react'

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] shadow-[var(--kd-shadow)] ${className}`}
    >
      {children}
    </section>
  )
}
