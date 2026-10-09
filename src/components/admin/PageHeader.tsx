import React from 'react'
import { ChevronRight } from 'lucide-react'
import { Button } from './Button'

export function PageHeader({
  crumbs,
  title,
  description,
  action,
}: {
  crumbs: { label: string; href?: string }[]
  title: string
  description?: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {crumbs.map((crumb, i) => (
            <span key={crumb.label} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3" />}
              <span className={i === crumbs.length - 1 ? 'text-foreground' : undefined}>{crumb.label}</span>
            </span>
          ))}
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <Button href={action.href}>{action.label}</Button>}
    </div>
  )
}
