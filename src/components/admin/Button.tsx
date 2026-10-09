import React from 'react'
import Link from 'next/link'

export function Button({
  href,
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  disabled,
  className = '',
}: {
  href?: string
  children: React.ReactNode
  variant?: 'primary' | 'ghost'
  type?: 'button' | 'submit'
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  const styles =
    variant === 'primary'
      ? 'bg-primary text-primary-foreground hover:opacity-90'
      : 'bg-transparent text-foreground hover:bg-[var(--kd-primary-soft)]'
  const cls = `inline-flex items-center justify-center gap-2 rounded-[var(--kd-radius)] px-3 py-2 text-sm font-medium transition disabled:opacity-60 ${styles} ${className}`
  if (href) return <Link href={href} className={cls}>{children}</Link>
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  )
}
