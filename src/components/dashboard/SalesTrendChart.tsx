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
import { getDashboardAnalytics, SalesTrendPoint } from '@/actions/analytics'

interface SalesTrendChartProps {
  initialData: SalesTrendPoint[]
  tenantId: string
  initialRange?: 'today' | '7d' | '30d'
}

export default function SalesTrendChart({
  initialData,
  tenantId,
  initialRange = 'today',
}: SalesTrendChartProps) {
  const [range, setRange] = useState<'today' | '7d' | '30d'>(initialRange)
  const [data, setData] = useState<SalesTrendPoint[]>(initialData)
  const [isPending, startTransition] = useTransition()

  const handleRangeChange = (newRange: 'today' | '7d' | '30d') => {
    if (newRange === range) return
    setRange(newRange)
    startTransition(async () => {
      const res = await getDashboardAnalytics(tenantId, newRange)
      setData(res.salesTrend)
    })
  }

  // Calculate totals for summary readout
  const totalRevenue = data.reduce((sum, item) => sum + item.total, 0)
  const cashRevenue = data.reduce((sum, item) => sum + item.cash, 0)
  const creditRevenue = data.reduce((sum, item) => sum + item.credit, 0)

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-400 text-slate-950 rounded-xl shadow-xs">
            <TrendingUp className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <h2 className="font-semibold text-base text-slate-900">Sales Over Time</h2>
            <p className="text-2xs font-normal text-slate-500">
              Cash vs. Udhaar revenue trends
            </p>
          </div>
        </div>

        {/* Range Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          {(['today', '7d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => handleRangeChange(r)}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer ${
                range === r
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {r === 'today' ? 'Today' : r === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 text-left">
          <span className="text-2xs font-medium text-slate-400 uppercase tracking-wider block mb-0.5">Total Sales</span>
          <span className="text-sm font-semibold text-slate-900 tabular-nums">Rs. {totalRevenue.toLocaleString()}</span>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-2.5 text-left">
          <span className="text-2xs font-medium text-emerald-700 uppercase tracking-wider block flex items-center gap-1 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Cash Counter
          </span>
          <span className="text-sm font-semibold text-emerald-950 tabular-nums">Rs. {cashRevenue.toLocaleString()}</span>
        </div>
        <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-2.5 text-left">
          <span className="text-2xs font-medium text-amber-800 uppercase tracking-wider block flex items-center gap-1 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Udhaar Credit
          </span>
          <span className="text-sm font-semibold text-amber-950 tabular-nums">Rs. {creditRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Area Chart Container */}
      <div className="relative w-full h-[260px] pt-2">
        {isPending && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-10 flex items-center justify-center rounded-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-4 py-2 rounded-full shadow-md border border-slate-200">
              <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
              <span>Updating Chart Data...</span>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              dy={5}
            />

            <YAxis
              tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const cashVal = Number(payload.find((p) => p.dataKey === 'cash')?.value ?? 0)
                  const creditVal = Number(payload.find((p) => p.dataKey === 'credit')?.value ?? 0)
                  const totalVal = cashVal + creditVal
                  return (
                    <div className="bg-slate-950 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 font-normal">
                      <div className="font-semibold text-yellow-400 border-b border-slate-800 pb-1 flex justify-between gap-4">
                        <span>{label}</span>
                        <span>Total: Rs. {totalVal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-emerald-400 font-medium">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Cash Counter:
                        </span>
                        <span className="font-mono font-semibold">Rs. {cashVal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-amber-400 font-medium">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" /> Udhaar Credit:
                        </span>
                        <span className="font-mono font-semibold">Rs. {creditVal.toLocaleString()}</span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />

            <Area
              type="monotone"
              dataKey="cash"
              stroke="#16a34a"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorCash)"
            />

            <Area
              type="monotone"
              dataKey="credit"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCredit)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
