'use client'

import React from 'react'
import { Building2, Award } from 'lucide-react'
import { CompanySalesItem } from '@/actions/analytics'

interface SalesByCompanyListProps {
  companies: CompanySalesItem[]
}

const BAR_COLORS = [
  'bg-emerald-600',
  'bg-amber-500',
  'bg-slate-900',
  'bg-slate-700',
  'bg-slate-500',
]

export default function SalesByCompanyList({ companies }: SalesByCompanyListProps) {
  const sortedCompanies = [...companies].sort((a, b) => b.amount - a.amount)
  const maxAmount = Math.max(...sortedCompanies.map((c) => c.amount), 1)

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-400 text-slate-950 rounded-xl shadow-xs">
            <Building2 className="w-4 h-4 text-slate-950" strokeWidth={2} />
          </div>
          <div>
            <h2 className="font-semibold text-base text-slate-900">Sales by Company</h2>
            <p className="text-2xs font-normal text-slate-500">Revenue share by manufacturer</p>
          </div>
        </div>
        <span className="bg-slate-100 text-slate-700 text-2xs font-semibold px-2.5 py-1 rounded-full border border-slate-200/80">
          Top {sortedCompanies.length} Brands
        </span>
      </div>

      {/* Breakdown List */}
      <div className="space-y-3.5 flex-1">
        {sortedCompanies.map((company, index) => {
          const barWidthPercent = Math.round((company.amount / maxAmount) * 100)
          const barColor = BAR_COLORS[index % BAR_COLORS.length]

          return (
            <div key={company.id || index} className="space-y-1.5 group">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-2xs font-medium text-slate-400 font-mono w-4">
                    #{index + 1}
                  </span>
                  <span className="font-semibold text-slate-900 truncate group-hover:text-amber-600 transition-colors">
                    {company.name}
                  </span>
                  {index === 0 && (
                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" strokeWidth={2} />
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-2xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {company.percentage}%
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    Rs. {company.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
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
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-2xs font-normal text-slate-400">
        <span>Includes Direct Counter + FEFO Sales</span>
        <span className="text-slate-700 font-medium">Real-Time Aggregation</span>
      </div>
    </div>
  )
}
