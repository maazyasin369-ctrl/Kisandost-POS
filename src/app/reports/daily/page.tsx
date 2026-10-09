'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { getDailyReport, getShopReportContext } from '@/actions/reports'
import {
  Calendar, Download, TrendingUp, Banknote, CreditCard,
  Package, Users, ChevronLeft, ChevronRight, BarChart3, RefreshCw
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { StatCard } from '@/components/admin/StatCard'
import { usePagination } from '@/hooks/usePagination'
import Pagination from '@/components/ui/Pagination'

type DailyReportData = Awaited<ReturnType<typeof getDailyReport>>
type ReportContext = NonNullable<Awaited<ReturnType<typeof getShopReportContext>>>

function formatDateISO(d: Date) {
  return d.toISOString().split('T')[0]
}

function formatDateDisplay(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default function DailySalesReportPage() {
  const [selectedDate, setSelectedDate] = useState(formatDateISO(new Date()))
  const [branchFilter, setBranchFilter] = useState<string | undefined>(undefined)
  const [ctx, setCtx] = useState<ReportContext | null>(null)
  const [report, setReport] = useState<DailyReportData | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getShopReportContext().then((data) => {
      if (data) setCtx(data)
    })
  }, [])

  const loadReport = (date: string, branch?: string, tenantId?: string) => {
    if (!tenantId) return
    startTransition(async () => {
      const data = await getDailyReport(tenantId, date, branch)
      setReport(data)
    })
  }

  useEffect(() => {
    if (!ctx) return
    loadReport(selectedDate, ctx.multiBranch ? branchFilter : undefined, ctx.tenantId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, branchFilter, ctx])

  const shiftDate = (days: number) => {
    const d = new Date(`${selectedDate}T00:00:00`)
    d.setDate(d.getDate() + days)
    setSelectedDate(formatDateISO(d))
  }

  const handleExportCSV = () => {
    if (!report || report.sales.length === 0) return
    const headers = ['Sale #', 'Time', 'Customer', 'Payment', 'Subtotal', 'Discount', 'Total', 'Status']
    const rows = report.sales.map(s => {
      const custObj = Array.isArray(s.customers) ? s.customers[0] : s.customers
      const time = new Date(s.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
      return [
        s.sale_number, time,
        `"${(custObj?.name ?? 'Walk-in').replace(/"/g, '""')}"`,
        s.payment_type.toUpperCase(),
        s.subtotal, s.discount_total, s.grand_total, s.status.toUpperCase()
      ]
    })
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Daily_Sales_${selectedDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const salesPagination = usePagination(report?.sales ?? [], 10)

  // Build hourly chart data from sales
  const hourlyData = React.useMemo(() => {
    if (!report) return []
    const map: Record<number, number> = {}
    for (let h = 7; h <= 21; h++) map[h] = 0
    for (const s of report.sales) {
      const h = new Date(s.created_at).getHours()
      if (h >= 7 && h <= 21) map[h] = (map[h] ?? 0) + s.grand_total
    }
    return Object.entries(map).map(([hour, revenue]) => ({
      hour: `${hour}:00`,
      revenue,
    }))
  }, [report])

  const isToday = selectedDate === formatDateISO(new Date())

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="bg-[var(--kd-surface)] p-6 rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-foreground rounded-xl text-primary">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Daily Sales Report</h1>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              {formatDateDisplay(selectedDate)}{isToday ? ' (Today)' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 font-semibold text-xs px-4.5 py-2.5 rounded-full border border-border transition-all cursor-pointer shadow-[var(--kd-shadow)] active:scale-95"
          >
            <Download className="w-4 h-4 text-primary" strokeWidth={2.2} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Navigation + Filters */}
      <div className="bg-[var(--kd-surface)] p-4 rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="p-2 rounded-xl bg-background hover:bg-[var(--kd-primary-soft)] text-foreground border border-border transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={selectedDate}
            max={formatDateISO(new Date())}
            onChange={e => setSelectedDate(e.target.value)}
            className="border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground bg-background focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <button
            onClick={() => shiftDate(1)}
            disabled={isToday}
            className="p-2 rounded-xl bg-background hover:bg-[var(--kd-primary-soft)] text-foreground border border-border transition-colors cursor-pointer disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedDate(formatDateISO(new Date()))}
            className="text-xs font-semibold text-primary hover:underline px-2 py-1 cursor-pointer"
          >
            Today
          </button>
        </div>

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

        {isPending && (
          <div className="flex items-center gap-2 text-xs text-primary font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={TrendingUp} label="Total revenue" value={`Rs. ${(report?.totalRevenue ?? 0).toLocaleString()}`} hint="Selected day" spark={[report?.cashRevenue ?? 0, report?.creditRevenue ?? 0, report?.totalRevenue ?? 0]} />
        <StatCard icon={Banknote} label="Cash sales" value={`Rs. ${(report?.cashRevenue ?? 0).toLocaleString()}`} hint="Counter cash" spark={[report?.cashRevenue ?? 0, report?.cashRevenue ?? 0]} />
        <StatCard icon={CreditCard} tone="accent" label="Udhaar credit" value={`Rs. ${(report?.creditRevenue ?? 0).toLocaleString()}`} hint="Issued today" spark={[report?.creditRevenue ?? 0, report?.creditRevenue ?? 0]} />
        <StatCard icon={BarChart3} tone="accent" label="Transactions" value={String(report?.transactionCount ?? 0)} hint="Completed sales" spark={[report?.transactionCount ?? 0, report?.transactionCount ?? 0]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Sales Chart */}
        <div className="lg:col-span-2 bg-[var(--kd-surface)] rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border p-5">
          <h2 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Sales by Hour (Rs.)
          </h2>
          {hourlyData.length === 0 || !report || report.totalRevenue === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-xs font-semibold">
              No sales recorded for this date.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={hourlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => [`Rs. ${Number(v ?? 0).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ fontSize: 11, fontWeight: 700, borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="revenue" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-[var(--kd-surface)] rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border p-5 space-y-3">
          <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Top Products
          </h2>
          {!report || report.topProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs font-semibold">No products sold today.</div>
          ) : (
            <div className="space-y-2">
              {report.topProducts.map((p, i) => {
                const maxRevenue = report.topProducts[0]?.revenue ?? 1
                const pct = Math.round((p.revenue / maxRevenue) * 100)
                return (
                  <div key={p.name} className="space-y-0.5">
                    <div className="flex justify-between text-xs font-bold text-foreground">
                      <span className="truncate max-w-[140px]">#{i + 1} {p.name}</span>
                      <span className="text-primary font-mono">Rs. {p.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-background rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-2xs text-muted-foreground font-semibold w-12 text-right">{p.qty} units</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-[var(--kd-surface)] rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border overflow-hidden">
        <div className="p-4 bg-background border-b border-border text-foreground flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Transaction Log ({report?.sales.length ?? 0} sales)
          </h2>
          {(report?.totalDiscounts ?? 0) > 0 && (
            <span className="text-xs font-bold text-amber-300">
              Total Discounts Given: Rs. {report!.totalDiscounts.toLocaleString()}
            </span>
          )}
        </div>

        {!report || report.sales.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-xs font-semibold">
            No transactions recorded for {formatDateDisplay(selectedDate)}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-background text-muted-foreground font-semibold uppercase text-2xs border-b border-border">
                  <th className="p-3">Sale #</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3 text-right">Subtotal</th>
                  <th className="p-3 text-right">Discount</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-semibold text-foreground">
                {salesPagination.pageItems.map(s => {
                  const custObj = Array.isArray(s.customers) ? s.customers[0] : s.customers
                  const time = new Date(s.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <tr key={s.id} className="hover:bg-[var(--kd-primary-soft)]">
                      <td className="p-3 font-mono font-semibold text-foreground">{s.sale_number}</td>
                      <td className="p-3 text-muted-foreground font-mono">{time}</td>
                      <td className="p-3">{custObj?.name ?? 'Walk-in Farmer'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold uppercase ${
                          s.payment_type === 'cash' ? 'bg-[var(--kd-primary-soft)] text-primary' :
                          s.payment_type === 'credit' ? 'bg-[var(--kd-accent-soft)] text-accent' : 'bg-blue-100 text-blue-900'
                        }`}>
                          {s.payment_type}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">Rs. {s.subtotal.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-red-500">
                        {s.discount_total > 0 ? `-Rs. ${s.discount_total.toLocaleString()}` : '—'}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-primary">Rs. {s.grand_total.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold uppercase ${
                          s.status === 'completed' ? 'bg-[var(--kd-primary-soft)] text-primary' : 'bg-red-100 text-red-800'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-primary text-primary-foreground font-semibold">
                  <td className="p-3" colSpan={4}>DAILY TOTALS</td>
                  <td className="p-3 text-right font-mono">Rs. {report.sales.reduce((s, r) => s + r.subtotal, 0).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-amber-300">-Rs. {report.totalDiscounts.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-accent font-semibold">Rs. {report.totalRevenue.toLocaleString()}</td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            </table>
            <Pagination
              page={salesPagination.page}
              totalPages={salesPagination.totalPages}
              totalItems={salesPagination.totalItems}
              from={salesPagination.from}
              to={salesPagination.to}
              pageSize={salesPagination.pageSize}
              onPageChange={salesPagination.setPage}
              onPageSizeChange={salesPagination.setPageSize}
            />
          </div>
        )}
      </div>
    </div>
  )
}
