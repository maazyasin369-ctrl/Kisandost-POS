'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { getDailyReport } from '@/actions/reports'
import {
  Calendar, Download, TrendingUp, Banknote, CreditCard,
  Package, Users, ChevronLeft, ChevronRight, BarChart3, RefreshCw
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type DailyReportData = Awaited<ReturnType<typeof getDailyReport>>

const DEMO_TENANT = '11111111-1111-1111-1111-111111111111'
const DEMO_BRANCH = '22222222-2222-2222-2222-222222222222'

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
  const [report, setReport] = useState<DailyReportData | null>(null)
  const [isPending, startTransition] = useTransition()

  const loadReport = (date: string, branch?: string) => {
    startTransition(async () => {
      const data = await getDailyReport(DEMO_TENANT, date, branch)
      setReport(data)
    })
  }

  useEffect(() => {
    loadReport(selectedDate, branchFilter)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, branchFilter])

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
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-950 rounded-xl text-yellow-400">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daily Sales Report</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {formatDateDisplay(selectedDate)}{isToday ? ' (Today)' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-semibold text-xs px-4.5 py-2.5 rounded-full border border-slate-800 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Download className="w-4 h-4 text-yellow-400" strokeWidth={2.2} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Navigation + Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={selectedDate}
            max={formatDateISO(new Date())}
            onChange={e => setSelectedDate(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            onClick={() => shiftDate(1)}
            disabled={isToday}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedDate(formatDateISO(new Date()))}
            className="text-xs font-extrabold text-emerald-700 hover:underline px-2 py-1 cursor-pointer"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-600">Branch:</span>
          <select
            value={branchFilter ?? 'all'}
            onChange={e => setBranchFilter(e.target.value === 'all' ? undefined : e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="all">All Branches</option>
            <option value={DEMO_BRANCH}>Multan Grains Market</option>
            <option value="22222222-2222-2222-2222-333333333333">Khanewal Bypass</option>
          </select>
        </div>

        {isPending && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Revenue', value: `Rs. ${(report?.totalRevenue ?? 0).toLocaleString()}`,
            icon: TrendingUp, bg: 'bg-emerald-50 border-emerald-200', icon_bg: 'bg-emerald-600', text: 'text-emerald-900'
          },
          {
            label: 'Cash Sales', value: `Rs. ${(report?.cashRevenue ?? 0).toLocaleString()}`,
            icon: Banknote, bg: 'bg-teal-50 border-teal-200', icon_bg: 'bg-teal-600', text: 'text-teal-900'
          },
          {
            label: 'Udhaar Credit', value: `Rs. ${(report?.creditRevenue ?? 0).toLocaleString()}`,
            icon: CreditCard, bg: 'bg-amber-50 border-amber-200', icon_bg: 'bg-amber-500', text: 'text-amber-900'
          },
          {
            label: 'Transactions', value: String(report?.transactionCount ?? 0),
            icon: BarChart3, bg: 'bg-indigo-50 border-indigo-200', icon_bg: 'bg-indigo-600', text: 'text-indigo-900'
          },
        ].map(card => (
          <div key={card.label} className={`bg-white p-4 rounded-2xl shadow-sm border ${card.bg} flex items-center justify-between gap-3`}>
            <div>
              <div className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider">{card.label}</div>
              <div className={`text-lg font-semibold mt-1 ${card.text} font-mono`}>{card.value}</div>
            </div>
            <div className={`p-2.5 rounded-xl ${card.icon_bg}`}>
              <card.icon className="w-4 h-4 text-white" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="font-extrabold text-sm text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-700" />
            Sales by Hour (Rs.)
          </h2>
          {hourlyData.length === 0 || !report || report.totalRevenue === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs font-semibold">
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
          <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-700" />
            Top Products
          </h2>
          {!report || report.topProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-semibold">No products sold today.</div>
          ) : (
            <div className="space-y-2">
              {report.topProducts.map((p, i) => {
                const maxRevenue = report.topProducts[0]?.revenue ?? 1
                const pct = Math.round((p.revenue / maxRevenue) * 100)
                return (
                  <div key={p.name} className="space-y-0.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span className="truncate max-w-[140px]">#{i + 1} {p.name}</span>
                      <span className="text-emerald-700 font-mono">Rs. {p.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-emerald-600 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-2xs text-slate-500 font-semibold w-12 text-right">{p.qty} units</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-100 border-b border-slate-200 text-slate-900 flex items-center justify-between">
          <h2 className="font-extrabold text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            Transaction Log ({report?.sales.length ?? 0} sales)
          </h2>
          {(report?.totalDiscounts ?? 0) > 0 && (
            <span className="text-xs font-bold text-amber-300">
              Total Discounts Given: Rs. {report!.totalDiscounts.toLocaleString()}
            </span>
          )}
        </div>

        {!report || report.sales.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold">
            No transactions recorded for {formatDateDisplay(selectedDate)}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-extrabold uppercase text-2xs border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-900">
                {report.sales.map(s => {
                  const custObj = Array.isArray(s.customers) ? s.customers[0] : s.customers
                  const time = new Date(s.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-extrabold text-slate-900">{s.sale_number}</td>
                      <td className="p-3 text-slate-500 font-mono">{time}</td>
                      <td className="p-3">{custObj?.name ?? 'Walk-in Farmer'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold uppercase ${
                          s.payment_type === 'cash' ? 'bg-emerald-100 text-emerald-900' :
                          s.payment_type === 'credit' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                        }`}>
                          {s.payment_type}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">Rs. {s.subtotal.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-red-500">
                        {s.discount_total > 0 ? `-Rs. ${s.discount_total.toLocaleString()}` : '—'}
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-emerald-900">Rs. {s.grand_total.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold uppercase ${
                          s.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-950 text-white font-extrabold">
                  <td className="p-3" colSpan={4}>DAILY TOTALS</td>
                  <td className="p-3 text-right font-mono">Rs. {report.sales.reduce((s, r) => s + r.subtotal, 0).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-amber-300">-Rs. {report.totalDiscounts.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-amber-400 font-semibold">Rs. {report.totalRevenue.toLocaleString()}</td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
