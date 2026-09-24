'use client'

import React, { useState, useEffect } from 'react'
import { BookOpen, Banknote, CheckCircle2, History } from 'lucide-react'
import { closeDayAction, getDayClosings } from '@/actions/reports'
import { useToast } from '@/components/ui/Toast'

type DayClosingData = Awaited<ReturnType<typeof getDayClosings>>;

export default function DayClosingPage() {
  const { showToast } = useToast()
  const [closings, setClosings] = useState<DayClosingData>([])
  const [loading, setLoading] = useState(true)
  const [isWizardOpen, setIsWizardOpen] = useState(false)

  // Guided wizard form state
  const [openingCash, setOpeningCash] = useState('5000')
  const [actualCash, setActualCash] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const data = await getDayClosings('11111111-1111-1111-1111-111111111111')
    setClosings(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCloseDaySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!actualCash) return

    setSubmitting(true)
    const todayStr = new Date().toISOString().split('T')[0]

    const res = await closeDayAction({
      tenantId: '11111111-1111-1111-1111-111111111111',
      branchId: '22222222-2222-2222-2222-222222222222',
      closedBy: 'usr-owner1',
      closingDate: todayStr,
      openingCash: parseFloat(openingCash) || 0,
      closingCashActual: parseFloat(actualCash) || 0,
    })

    setSubmitting(false)

    if (res.success) {
      showToast('Day closing saved successfully!', 'success')
      setIsWizardOpen(false)
      setActualCash('')
      setNotes('')
      loadData()
    } else {
      showToast(res.error || 'Failed to close day', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2.5 tracking-tight">
            <div className="p-2 bg-slate-950 text-yellow-400 rounded-xl">
              <BookOpen className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <span>End-of-Day Cash Drawer Reconciliation</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Perform daily cash drawer counts against system sales &amp; farmer payment totals. Record cash differences.
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Banknote className="h-4 w-4 stroke-[2.5]" />
          <span>CLOSE TODAY&apos;S CASH DRAWER</span>
        </button>
      </div>

      {/* Guided Closing Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-emerald-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-emerald-700" />
                <span>Day-End Cash Reconciliation Wizard</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsWizardOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCloseDaySubmit} className="space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                <div className="font-extrabold text-emerald-900">Closing Date: {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <p className="text-2xs text-emerald-700">System will aggregate today&apos;s cash sales and farmer collections automatically.</p>
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Morning Opening Cash Float (Rs) *</label>
                <input
                  type="number"
                  required
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Actual Cash Counted in Drawer Tonight (Rs) *</label>
                <input
                  type="number"
                  required
                  autoFocus
                  placeholder="Enter physical cash counted in drawer..."
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  className="w-full p-3 border border-emerald-400 rounded-xl font-mono text-base font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-emerald-50/40"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Closing Notes / Discrepancy Reason (Optional):</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Rs. 100 extra/short due to change shortage"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{submitting ? 'Saving...' : 'Complete & Save Day Closing'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historical Day Closings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-700" />
          <span>Past Cash Drawer Reconciliation Log</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading closing records...</div>
        ) : closings.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">No day closings recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-extrabold uppercase text-2xs border-b border-slate-200">
                  <th className="p-3">Date</th>
                  <th className="p-3">Branch</th>
                  <th className="p-3 text-right">Opening Cash</th>
                  <th className="p-3 text-right">Cash Sales</th>
                  <th className="p-3 text-right">Collections</th>
                  <th className="p-3 text-right">Expected Cash</th>
                  <th className="p-3 text-right">Actual Cash</th>
                  <th className="p-3 text-right">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-900">
                {closings.map((c) => {
                  const branchObj = Array.isArray(c.branches) ? c.branches[0] : c.branches;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-extrabold">{c.closing_date}</td>
                      <td className="p-3 text-slate-600">{branchObj?.name}</td>
                      <td className="p-3 text-right font-mono">Rs. {c.opening_cash?.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-emerald-700">Rs. {c.total_cash_sales?.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-blue-700">Rs. {c.total_payments_received?.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold">Rs. {c.closing_cash_expected?.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-extrabold text-slate-900">Rs. {c.closing_cash_actual?.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono">
                        <span className={`px-2 py-0.5 rounded font-semibold ${
                          c.difference === 0 ? 'bg-emerald-100 text-emerald-800' :
                          c.difference > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {c.difference >= 0 ? `+Rs. ${c.difference.toLocaleString()}` : `-Rs. ${Math.abs(c.difference).toLocaleString()}`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
