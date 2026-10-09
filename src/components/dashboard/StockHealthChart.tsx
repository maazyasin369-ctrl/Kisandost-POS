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
    { name: 'Healthy Stock', value: summary.healthyCount, color: 'var(--kd-primary)', percent: summary.healthyPercent },
    { name: 'Expiring <= 90d', value: summary.expiringCount, color: 'var(--kd-warning)', percent: summary.expiringPercent },
    { name: 'Low Stock Alert', value: summary.lowStockCount, color: 'var(--kd-danger)', percent: summary.lowStockPercent },
  ].filter((entry) => entry.value > 0)

  return (
    <div className="bg-[var(--kd-surface)] rounded-[var(--kd-radius)] border border-border p-5 shadow-[var(--kd-shadow)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[var(--kd-primary-soft)] text-primary border border-primary/20 rounded-xl shadow-2xs">
            <PackageCheck className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <h2 className="font-semibold text-base text-foreground">Stock Health Overview</h2>
            <p className="text-2xs font-normal text-muted-foreground">Inventory condition &amp; FEFO risk</p>
          </div>
        </div>
        <span className="rounded-full border border-primary/20 bg-[var(--kd-primary-soft)] px-2.5 py-1 text-2xs font-semibold text-primary">
          {summary.totalItems} Active Batches
        </span>
      </div>

      {/* Donut Chart + Central Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Recharts Pie Donut */}
        <div className="relative w-36 h-36 shrink-0">
          {pieData.length === 0 && (
            <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">No batches</div>
          )}
          {pieData.length > 0 && <ResponsiveContainer width="100%" height="100%">
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
                      <div className="bg-[var(--kd-surface)] text-foreground px-3 py-1.5 rounded-lg shadow-md text-xs font-medium border border-border">
                        <span className="block text-primary font-semibold">{data.name}</span>
                        <span>{data.value} Batches ({data.percent}%)</span>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>}
          {/* Donut Center Count */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-semibold text-foreground leading-none tabular-nums">
              {summary.totalItems}
            </span>
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">
              BATCHES
            </span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="space-y-2.5 flex-1 w-full">
          <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-[var(--kd-primary-soft)] p-2.5 text-xs">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <ShieldCheck className="size-4 text-primary" strokeWidth={2} />
              <span>Healthy Batches</span>
            </div>
            <div className="text-right">
              <span className="font-semibold tabular-nums text-foreground">{summary.healthyCount}</span>
              <span className="ml-1 text-2xs font-normal text-primary">({summary.healthyPercent}%)</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-warning/20 bg-[color-mix(in_srgb,var(--kd-warning)_12%,transparent)] p-2.5 text-xs">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <AlertTriangle className="size-4 text-warning" strokeWidth={2} />
              <span>Expiring Soon (&le;90d)</span>
            </div>
            <div className="text-right">
              <span className="font-semibold tabular-nums text-foreground">{summary.expiringCount}</span>
              <span className="ml-1 text-2xs font-normal text-warning">({summary.expiringPercent}%)</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-danger/20 bg-[color-mix(in_srgb,var(--kd-danger)_12%,transparent)] p-2.5 text-xs">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <AlertCircle className="size-4 text-danger" strokeWidth={2} />
              <span>Low Stock Alerts</span>
            </div>
            <div className="text-right">
              <span className="font-semibold tabular-nums text-foreground">{summary.lowStockCount}</span>
              <span className="ml-1 text-2xs font-normal text-danger">({summary.lowStockPercent}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
