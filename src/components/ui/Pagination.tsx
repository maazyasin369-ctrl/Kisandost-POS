'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { PAGE_SIZE_OPTIONS } from '@/hooks/usePagination'

type PaginationProps = {
  page: number
  totalPages: number
  totalItems: number
  from: number
  to: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  className?: string
  /** Compact mode for tight card footers */
  compact?: boolean
}

function pageWindow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, 4, '…', total]
  if (current >= total - 2) return [1, '…', total - 3, total - 2, total - 1, total]
  return [1, '…', current - 1, current, current + 1, '…', total]
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  from,
  to,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className = '',
  compact = false,
}: PaginationProps) {
  if (totalItems === 0) return null

  const pages = pageWindow(page, totalPages)

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border bg-[var(--kd-surface)] px-4 py-3 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="tabular-nums">
          Showing <strong className="text-foreground font-semibold">{from}</strong>
          –<strong className="text-foreground font-semibold">{to}</strong> of{' '}
          <strong className="text-foreground font-semibold">{totalItems}</strong>
        </span>
        {onPageSizeChange && !compact && (
          <label className="inline-flex items-center gap-1.5">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {!(PAGE_SIZE_OPTIONS as readonly number[]).includes(pageSize) && (
                <option value={pageSize}>{pageSize}</option>
              )}
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1">
        <NavBtn
          label="First page"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          icon={<ChevronsLeft className="size-3.5" />}
        />
        <NavBtn
          label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          icon={<ChevronLeft className="size-3.5" />}
        />

        {!compact &&
          pages.map((p, idx) =>
            p === '…' ? (
              <span key={`e-${idx}`} className="px-1.5 text-xs text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-8 h-8 rounded-lg px-2 text-xs font-semibold transition-colors cursor-pointer ${
                  p === page
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-background text-foreground hover:bg-[var(--kd-primary-soft)] hover:text-primary'
                }`}
              >
                {p}
              </button>
            ),
          )}

        {compact && (
          <span className="min-w-[4.5rem] text-center text-xs font-semibold tabular-nums text-foreground">
            {page} / {totalPages}
          </span>
        )}

        <NavBtn
          label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          icon={<ChevronRight className="size-3.5" />}
        />
        <NavBtn
          label="Last page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          icon={<ChevronsRight className="size-3.5" />}
        />
      </div>
    </div>
  )
}

function NavBtn({
  label,
  disabled,
  onClick,
  icon,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-[var(--kd-primary-soft)] hover:text-primary disabled:pointer-events-none disabled:opacity-35 cursor-pointer"
    >
      {icon}
    </button>
  )
}
