'use client'

import React, { useState, useTransition } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { TrendingUp, RefreshCw } from 'lucide-react'
import {
  getDashboardAnalytics,
  SalesTrendPoint,
  CompanySalesItem,
  AnalyticsRange,
} from '@/actions/analytics'
import SalesByCompanyList from './SalesByCompanyList'

interface SalesTrendChartProps {
  initialData: SalesTrendPoint[]
  initialCompanies: CompanySalesItem[]
  tenantId: string
  branchId?: string
  initialRange?: Exclude<AnalyticsRange, 'custom'>
}

function isoDate(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function SalesTrendChart({
  initialData,
  initialCompanies,
  tenantId,
  branchId,
  initialRange = '30d',
}: SalesTrendChartProps) {
  const [range, setRange] = useState<AnalyticsRange>(initialRange)
  const [data, setData] = useState<SalesTrendPoint[]>(initialData)
  const [companies, setCompanies] = useState<CompanySalesItem[]>(initialCompanies)
  const [isPending, startTransition] = useTransition()
  const [showCustom, setShowCustom] = useState(false)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 6)
    return isoDate(d)
  })
  const [toDate, setToDate] = useState(() => isoDate(new Date()))

  const loadRange = (next: AnalyticsRange, from?: string, to?: string) => {
    setRange(next)
    startTransition(async () => {
      const res = await getDashboardAnalytics(
        tenantId,
        next,
        branchId,
        next === 'custom' ? from : undefined,
        next === 'custom' ? to : undefined,
      )
      setData(res.salesTrend)
      setCompanies(res.companySales)
    })
  }

  const handleRangeChange = (newRange: Exclude<AnalyticsRange, 'custom'>) => {
    setShowCustom(false)
    if (newRange === range) return
    loadRange(newRange)
  }

  const handleApplyCustom = () => {
    if (!fromDate || !toDate || fromDate > toDate) return
    setShowCustom(true)
    loadRange('custom', fromDate, toDate)
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.total, 0)
  const cashRevenue = data.reduce((sum, item) => sum + item.cash, 0)
  const creditRevenue = data.reduce((sum, item) => sum + item.credit, 0)
  const isLive = range === 'today'

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <div className="space-y-4 rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] p-5 shadow-[var(--kd-shadow)] lg:col-span-7 xl:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-[var(--kd-primary-soft)] p-2 text-primary">
              <TrendingUp className="size-4" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">Sales Over Time</h2>
                {isLive && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-[var(--kd-primary-soft)] px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-primary">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
                    </span>
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-2xs font-normal text-muted-foreground">
                Cash vs. Udhaar revenue trends
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-1">
              {([
                { id: 'today', label: 'Today' },
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
              ] as const).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRangeChange(r.id)}
                  disabled={isPending}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-2xs font-semibold transition-all ${
                    range === r.id && !showCustom
                      ? 'bg-[var(--kd-primary-soft)] text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustom((v) => !v)}
                disabled={isPending}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-2xs font-semibold transition-all ${
                  range === 'custom' || showCustom
                    ? 'bg-[var(--kd-primary-soft)] text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Custom
              </button>
            </div>
          </div>
        </div>

        {showCustom && (
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-background p-3">
            <label className="text-2xs font-medium text-muted-foreground">
              From
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 block rounded-lg border border-border bg-[var(--kd-surface)] px-2.5 py-1.5 text-xs text-foreground"
              />
            </label>
            <label className="text-2xs font-medium text-muted-foreground">
              To
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1 block rounded-lg border border-border bg-[var(--kd-surface)] px-2.5 py-1.5 text-xs text-foreground"
              />
            </label>
            <button
              type="button"
              onClick={handleApplyCustom}
              disabled={isPending || !fromDate || !toDate || fromDate > toDate}
              className="h-8 rounded-lg bg-primary px-3 text-2xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-background p-2.5 text-left">
            <span className="mb-0.5 block text-2xs font-medium uppercase tracking-wider text-muted-foreground">Total Sales</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">Rs. {totalRevenue.toLocaleString()}</span>
          </div>
          <div className="rounded-xl border border-primary/20 bg-[var(--kd-primary-soft)] p-2.5 text-left">
            <span className="mb-0.5 flex items-center gap-1 text-2xs font-medium uppercase tracking-wider text-primary">
              <span className="size-2 rounded-full bg-primary" /> Cash Counter
            </span>
            <span className="text-sm font-semibold tabular-nums text-foreground">Rs. {cashRevenue.toLocaleString()}</span>
          </div>
          <div className="rounded-xl border border-warning/20 bg-[color-mix(in_srgb,var(--kd-warning)_12%,transparent)] p-2.5 text-left">
            <span className="mb-0.5 flex items-center gap-1 text-2xs font-medium uppercase tracking-wider text-warning">
              <span className="size-2 rounded-full bg-warning" /> Udhaar Credit
            </span>
            <span className="text-sm font-semibold tabular-nums text-foreground">Rs. {creditRevenue.toLocaleString()}</span>
          </div>
        </div>

        <div className="relative h-[260px] w-full pt-2">
          {isPending && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-[var(--kd-surface)]/80 backdrop-blur-xs">
              <div className="flex items-center gap-2 rounded-full border border-border bg-[var(--kd-surface)] px-4 py-2 text-xs font-semibold text-foreground shadow-md">
                <RefreshCw className="size-4 animate-spin" />
                <span>Updating Chart Data...</span>
              </div>
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--kd-primary)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--kd-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--kd-warning)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--kd-warning)" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="var(--kd-border)" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fontWeight: 500, fill: 'var(--kd-muted)' }}
                axisLine={false}
                tickLine={false}
                dy={5}
              />
              <YAxis
                tick={{ fontSize: 11, fontWeight: 500, fill: 'var(--kd-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const cashVal = Number(payload.find((p) => p.dataKey === 'cash')?.value ?? 0)
                  const creditVal = Number(payload.find((p) => p.dataKey === 'credit')?.value ?? 0)
                  return (
                    <div className="space-y-1.5 rounded-xl border border-border bg-[var(--kd-surface)] p-3 text-xs text-foreground shadow-xl">
                      <div className="flex justify-between gap-4 border-b border-border pb-1 font-semibold text-primary">
                        <span>{label}</span>
                        <span>Total: Rs. {(cashVal + creditVal).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 font-medium text-primary">
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-primary" /> Cash
                        </span>
                        <span className="font-mono font-semibold">Rs. {cashVal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 font-medium text-warning">
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-warning" /> Udhaar
                        </span>
                        <span className="font-mono font-semibold">Rs. {creditVal.toLocaleString()}</span>
                      </div>
                    </div>
                  )
                }}
              />
              <Area type="monotone" dataKey="cash" stroke="var(--kd-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCash)" />
              <Area type="monotone" dataKey="credit" stroke="var(--kd-warning)" strokeWidth={2} fillOpacity={1} fill="url(#colorCredit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="lg:col-span-5 xl:col-span-4">
        <SalesByCompanyList companies={companies} />
      </div>
    </div>
  )
}
