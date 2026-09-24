'use client'

import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { PackageCheck, ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react'
import { StockHealthSummary } from '@/actions/analytics'

interface StockHealthChartProps {
  summary: StockHealthSummary
}

export default function StockHealthChart({ summary }: StockHealthChartProps) {
  const pieData = [
    { name: 'Healthy Stock', value: summary.healthyCount, color: '#16a34a', percent: summary.healthyPercent },
    { name: 'Expiring <= 90d', value: summary.expiringCount, color: '#f59e0b', percent: summary.expiringPercent },
    { name: 'Low Stock Alert', value: summary.lowStockCount, color: '#e11d48', percent: summary.lowStockPercent },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200/70 rounded-xl shadow-2xs">
            <PackageCheck className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <h2 className="font-semibold text-base text-slate-900">Stock Health Overview</h2>
            <p className="text-2xs font-normal text-slate-500">Inventory condition &amp; FEFO risk</p>
          </div>
        </div>
        <span className="text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-full">
          {summary.totalItems} Active Batches
        </span>
      </div>

      {/* Donut Chart + Central Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Recharts Pie Donut */}
        <div className="relative w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-slate-950 text-white px-3 py-1.5 rounded-lg shadow-md text-xs font-medium border border-slate-800">
                        <span className="block text-yellow-400 font-semibold">{data.name}</span>
                        <span>{data.value} Batches ({data.percent}%)</span>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Donut Center Count */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-semibold text-slate-900 leading-none tabular-nums">
              {summary.totalItems}
            </span>
            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
              BATCHES
            </span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="space-y-2.5 flex-1 w-full">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-xs">
            <div className="flex items-center gap-2 font-medium text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" strokeWidth={2} />
              <span>Healthy Batches</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-emerald-950 tabular-nums">{summary.healthyCount}</span>
              <span className="text-2xs text-emerald-700 font-normal ml-1">({summary.healthyPercent}%)</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs">
            <div className="flex items-center gap-2 font-medium text-slate-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" strokeWidth={2} />
              <span>Expiring Soon (&le;90d)</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-amber-950 tabular-nums">{summary.expiringCount}</span>
              <span className="text-2xs text-amber-800 font-normal ml-1">({summary.expiringPercent}%)</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/60 border border-rose-200/60 text-xs">
            <div className="flex items-center gap-2 font-medium text-slate-900">
              <AlertCircle className="w-4 h-4 text-rose-600" strokeWidth={2} />
              <span>Low Stock Alerts</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-rose-950 tabular-nums">{summary.lowStockCount}</span>
              <span className="text-2xs text-rose-700 font-normal ml-1">({summary.lowStockPercent}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
