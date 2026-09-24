'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { getMonthlyReport } from '@/actions/reports'
import {
  TrendingUp, Building2, Download, BarChart3, Calendar,
  RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

type MonthlyReportData = Awaited<ReturnType<typeof getMonthlyReport>>

const DEMO_TENANT = '11111111-1111-1111-1111-111111111111'

const COMPANY_COLORS = [
  '#059669', '#0284c7', '#d97706', '#7c3aed', '#db2777',
  '#0d9488', '#ca8a04', '#4f46e5', '#16a34a', '#dc2626'
]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function MonthlyReportPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-indexed
  const [report, setReport] = useState<MonthlyReportData | null>(null)
  const [isPending, startTransition] = useTransition()

  const loadReport = (y: number, m: number) => {
    startTransition(async () => {
      const data = await getMonthlyReport(DEMO_TENANT, y, m)
      setReport(data)
    })
  }

  useEffect(() => {
    loadReport(year, month)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

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

  const totalRevenue = report?.totalRevenue ?? 0

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-950 rounded-xl text-yellow-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Monthly Sales & Company Breakdown</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {monthLabel} — Company-wise revenue distribution and daily trend
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-semibold text-xs px-4.5 py-2.5 rounded-full border border-slate-800 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <Download className="w-4 h-4 text-yellow-400" strokeWidth={2.2} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Month Navigation */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3">
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="border border-slate-300 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
              className="border border-slate-300 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-20"
            />
          </div>
          <button
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setMonth(now.getMonth() + 1); setYear(now.getFullYear()) }}
            className="text-xs font-extrabold text-indigo-700 hover:underline px-2 py-1 cursor-pointer"
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-between">
          <div>
            <div className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Monthly Revenue</div>
            <div className="text-2xl font-semibold text-indigo-900 font-mono mt-1">Rs. {totalRevenue.toLocaleString()}</div>
          </div>
          <div className="p-3 bg-indigo-600 rounded-xl">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Total Transactions</div>
            <div className="text-2xl font-semibold text-slate-900 font-mono mt-1">{report?.transactionCount ?? 0}</div>
          </div>
          <div className="p-3 bg-emerald-600 rounded-xl">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Avg Per Day</div>
            <div className="text-2xl font-semibold text-slate-900 font-mono mt-1">
              Rs. {report?.dailyData && report.dailyData.length > 0
                ? Math.round(totalRevenue / report.dailyData.length).toLocaleString()
                : '0'}
            </div>
          </div>
          <div className="p-3 bg-amber-500 rounded-xl">
            <Calendar className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="font-extrabold text-sm text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-700" />
            Daily Revenue Trend — {monthLabel}
          </h2>
          {!report || report.dailyData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs font-semibold">
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="font-extrabold text-sm text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-700" />
            Company Distribution
          </h2>
          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs font-semibold">
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-100 border-b border-slate-200 text-slate-900">
          <h2 className="font-extrabold text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Company-wise Sales Breakdown — {monthLabel}
          </h2>
        </div>

        {!report || report.companyBreakdown.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold">
            No company sales data for {monthLabel}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-extrabold uppercase text-2xs border-b border-slate-200">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Company / Brand</th>
                  <th className="p-3 text-right">Revenue (Rs)</th>
                  <th className="p-3">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-900">
                {report.companyBreakdown.map((c, i) => {
                  const pct = totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 100) : 0
                  return (
                    <tr key={c.name} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="w-6 h-6 rounded-full text-white font-semibold text-2xs flex items-center justify-center"
                          style={{ backgroundColor: COMPANY_COLORS[i % COMPANY_COLORS.length] }}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="p-3 font-extrabold text-slate-900">{c.name}</td>
                      <td className="p-3 text-right font-mono font-extrabold text-indigo-900">Rs. {c.revenue.toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 min-w-[60px]">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: COMPANY_COLORS[i % COMPANY_COLORS.length] }}
                            />
                          </div>
                          <span className="text-2xs font-semibold text-slate-600 w-10">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-indigo-950 text-white font-extrabold">
                  <td className="p-3" colSpan={2}>MONTH TOTAL</td>
                  <td className="p-3 text-right font-mono text-amber-400">Rs. {totalRevenue.toLocaleString()}</td>
                  <td className="p-3 text-xs text-indigo-300">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
