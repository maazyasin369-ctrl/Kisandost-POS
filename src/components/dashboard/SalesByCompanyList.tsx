'use client'

import React from 'react'
import { Building2 } from 'lucide-react'
import { CompanySalesItem } from '@/actions/analytics'

interface SalesByCompanyListProps {
  companies: CompanySalesItem[]
}

const BAR_COLORS = [
  'bg-primary',
  'bg-accent',
  'bg-chart-3',
  'bg-primary/70',
  'bg-accent/60',
]

export default function SalesByCompanyList({ companies }: SalesByCompanyListProps) {
  const sortedCompanies = [...companies].sort((a, b) => b.amount - a.amount)
  const maxAmount = Math.max(...sortedCompanies.map((c) => c.amount), 1)

  return (
    <div className="flex h-full flex-col justify-between space-y-4 rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] p-5 shadow-[var(--kd-shadow)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-[var(--kd-accent-soft)] p-2 text-accent">
            <Building2 className="size-4" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Sales by Company</h2>
            <p className="text-2xs font-normal text-muted-foreground">Revenue share by manufacturer</p>
          </div>
        </div>
        <span className="rounded-full border border-border bg-background px-2.5 py-1 text-2xs font-medium text-muted-foreground">
          Top {sortedCompanies.length} Brands
        </span>
      </div>

      {/* Breakdown List */}
      <div className="space-y-3.5 flex-1">
        {sortedCompanies.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No company sales in this period.</p>
        )}
        {sortedCompanies.map((company, index) => {
          const barWidthPercent = Math.round((company.amount / maxAmount) * 100)
          const barColor = BAR_COLORS[index % BAR_COLORS.length]

          return (
            <div key={company.id || index} className="space-y-1.5 group">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-2xs font-medium text-muted-foreground font-mono w-4">
                    #{index + 1}
                  </span>
                  <span className="truncate font-medium text-foreground">
                    {company.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-2xs font-medium text-muted-foreground bg-background px-2 py-0.5 rounded-md">
                    {company.percentage}%
                  </span>
                  <span className="font-semibold text-foreground tabular-nums">
                    Rs. {company.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="h-2 bg-background rounded-full overflow-hidden p-0.5 border border-border/60">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.max(6, barWidthPercent)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-2xs font-normal text-muted-foreground">
        <span>Includes Direct Counter + FEFO Sales</span>
        <span className="text-foreground font-medium">Real-Time Aggregation</span>
      </div>
    </div>
  )
}
