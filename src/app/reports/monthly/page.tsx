'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { getMonthlyReport, getShopReportContext } from '@/actions/reports'
import {
  TrendingUp, Building2, Download, BarChart3, Calendar,
  RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { StatCard } from '@/components/admin/StatCard'
import { usePagination } from '@/hooks/usePagination'
import Pagination from '@/components/ui/Pagination'

type MonthlyReportData = Awaited<ReturnType<typeof getMonthlyReport>>
type ReportContext = NonNullable<Awaited<ReturnType<typeof getShopReportContext>>>

const COMPANY_COLORS = [
  '#145c3a', '#2c4a86', '#b45309', '#0d9488', '#7c3aed',
  '#db2777', '#ca8a04', '#4f46e5', '#15803d', '#b91c1c'
]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function MonthlyReportPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-indexed
  const [branchFilter, setBranchFilter] = useState<string | undefined>(undefined)
  const [ctx, setCtx] = useState<ReportContext | null>(null)
  const [report, setReport] = useState<MonthlyReportData | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getShopReportContext().then((data) => {
      if (data) setCtx(data)
    })
  }, [])

  const loadReport = (y: number, m: number, branch?: string, tenantId?: string) => {
    if (!tenantId) return
    startTransition(async () => {
      const data = await getMonthlyReport(tenantId, y, m, branch)
      setReport(data)
    })
  }

  useEffect(() => {
    if (!ctx) return
    loadReport(year, month, ctx.multiBranch ? branchFilter : undefined, ctx.tenantId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, branchFilter, ctx])

  const shiftMonth = (delta: number) => {
    let m = month + delta
    let y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    setMonth(m)
    setYear(y)
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`

  const handleExportCSV = () => {
    if (!report) return
    const headers = ['Company', 'Revenue (Rs)']
    const rows = (report.companyBreakdown ?? []).map(c => [
      `"${c.name.replace(/"/g, '""')}"`, c.revenue
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Monthly_Company_${year}_${String(month).padStart(2, '0')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const pieData = (report?.companyBreakdown ?? []).slice(0, 8).map(c => ({
    name: c.name,
    value: c.revenue,
  }))

  const companyPagination = usePagination(report?.companyBreakdown ?? [], 10)

  const totalRevenue = report?.totalRevenue ?? 0

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="bg-[var(--kd-surface)] p-6 rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-foreground rounded-xl text-primary">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Monthly Sales & Company Breakdown</h1>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              {monthLabel} — Company-wise revenue distribution and daily trend
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 font-semibold text-xs px-4.5 py-2.5 rounded-full border border-border transition-all cursor-pointer shadow-[var(--kd-shadow)] active:scale-95"
        >
          <Download className="w-4 h-4 text-primary" strokeWidth={2.2} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Month Navigation */}
      <div className="bg-[var(--kd-surface)] p-4 rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border flex flex-wrap items-center gap-4">
        {ctx?.multiBranch && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-muted-foreground">Branch:</span>
            <select
              value={branchFilter ?? 'all'}
              onChange={(e) => setBranchFilter(e.target.value === 'all' ? undefined : e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Branches</option>
              {ctx.branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="p-2 rounded-xl bg-background hover:bg-[var(--kd-primary-soft)] text-foreground border border-border transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3">
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="border border-border rounded-xl px-2 py-1.5 text-xs font-bold text-foreground bg-background focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              min={2020}
              max={now.getFullYear()}
              onChange={e => setYear(Number(e.target.value))}
              className="border border-border rounded-xl px-2 py-1.5 text-xs font-bold text-foreground bg-background focus:ring-2 focus:ring-indigo-500 focus:outline-none w-20"
            />
          </div>
          <button
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            className="p-2 rounded-xl bg-background hover:bg-[var(--kd-primary-soft)] text-foreground border border-border transition-colors cursor-pointer disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setMonth(now.getMonth() + 1); setYear(now.getFullYear()) }}
            className="text-xs font-semibold text-indigo-700 hover:underline px-2 py-1 cursor-pointer"
          >
            This Month
          </button>
        </div>

        {isPending && (
          <div className="flex items-center gap-2 text-xs text-indigo-700 font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={TrendingUp} label="Monthly revenue" value={`Rs. ${totalRevenue.toLocaleString()}`} hint="Selected month" spark={report?.dailyData?.length ? report.dailyData.map((day) => day.revenue) : [0, totalRevenue]} />
        <StatCard icon={BarChart3} tone="accent" label="Transactions" value={String(report?.transactionCount ?? 0)} hint="Completed sales" spark={[report?.transactionCount ?? 0, report?.transactionCount ?? 0]} />
        <StatCard icon={Calendar} label="Average per day" value={`Rs. ${report?.dailyData && report.dailyData.length > 0 ? Math.round(totalRevenue / report.dailyData.length).toLocaleString() : '0'}`} hint="Days with sales" spark={report?.dailyData?.length ? report.dailyData.map((day) => day.revenue) : [0, 0]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-[var(--kd-surface)] rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border p-5">
          <h2 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-700" />
            Daily Revenue Trend — {monthLabel}
          </h2>
          {!report || report.dailyData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-xs font-semibold">
              No sales data for {monthLabel}.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={report.dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => [`Rs. ${Number(v ?? 0).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ fontSize: 11, fontWeight: 700, borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Company Pie Chart */}
        <div className="bg-[var(--kd-surface)] rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border p-5">
          <h2 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-700" />
            Company Distribution
          </h2>
          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-xs font-semibold">
              No data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COMPANY_COLORS[index % COMPANY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`Rs. ${Number(v ?? 0).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ fontSize: 11, fontWeight: 700, borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Company Breakdown Table */}
      <div className="bg-[var(--kd-surface)] rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border overflow-hidden">
        <div className="p-4 bg-background border-b border-border text-foreground">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Company-wise Sales Breakdown — {monthLabel}
          </h2>
        </div>

        {!report || report.companyBreakdown.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-xs font-semibold">
            No company sales data for {monthLabel}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-background text-muted-foreground font-semibold uppercase text-2xs border-b border-border">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Company / Brand</th>
                  <th className="p-3 text-right">Revenue (Rs)</th>
                  <th className="p-3">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-semibold text-foreground">
                {companyPagination.pageItems.map((c, idx) => {
                  const i = (companyPagination.page - 1) * companyPagination.pageSize + idx
                  const pct = totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 100) : 0
                  return (
                    <tr key={c.name} className="hover:bg-[var(--kd-primary-soft)]">
                      <td className="p-3">
                        <span className="w-6 h-6 rounded-full text-white font-semibold text-2xs flex items-center justify-center"
                          style={{ backgroundColor: COMPANY_COLORS[i % COMPANY_COLORS.length] }}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-foreground">{c.name}</td>
                      <td className="p-3 text-right font-mono font-semibold text-indigo-900">Rs. {c.revenue.toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-background rounded-full h-2 min-w-[60px]">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: COMPANY_COLORS[i % COMPANY_COLORS.length] }}
                            />
                          </div>
                          <span className="text-2xs font-semibold text-muted-foreground w-10">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-indigo-950 text-white font-semibold">
                  <td className="p-3" colSpan={2}>MONTH TOTAL</td>
                  <td className="p-3 text-right font-mono text-accent">Rs. {totalRevenue.toLocaleString()}</td>
                  <td className="p-3 text-xs text-indigo-300">100%</td>
                </tr>
              </tfoot>
            </table>
            <Pagination
              page={companyPagination.page}
              totalPages={companyPagination.totalPages}
              totalItems={companyPagination.totalItems}
              from={companyPagination.from}
              to={companyPagination.to}
              pageSize={companyPagination.pageSize}
              onPageChange={companyPagination.setPage}
              onPageSizeChange={companyPagination.setPageSize}
            />
          </div>
        )}
      </div>
    </div>
  )
}
