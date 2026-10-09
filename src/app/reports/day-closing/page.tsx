'use client'

import React, { useState, useEffect } from 'react'
import { BookOpen, Banknote, CheckCircle2, History, Printer, X } from 'lucide-react'
import { closeDayAction, getDayClosings, getShopReportContext } from '@/actions/reports'
import { useToast } from '@/components/ui/Toast'
import PrintableReceipt, { DayClosingPrintData } from '@/components/PrintableReceipt'
import { usePrintReceipt } from '@/lib/use-print-receipt'
import { usePagination } from '@/hooks/usePagination'
import Pagination from '@/components/ui/Pagination'

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
  const [branchId, setBranchId] = useState('')
  const [tenantId, setTenantId] = useState('')

  // Selected closing print modal state
  const [selectedClosingPrint, setSelectedClosingPrint] = useState<DayClosingPrintData | null>(null)
  const { triggerPrint } = usePrintReceipt()
  const pagination = usePagination(closings, 10)

  const loadData = async (shopTenantId?: string) => {
    setLoading(true)
    const data = await getDayClosings(shopTenantId)
    setClosings(data)
    setLoading(false)
  }

  useEffect(() => {
    getShopReportContext().then((ctx) => {
      if (!ctx) return
      setTenantId(ctx.tenantId)
      setBranchId(ctx.branches[0]?.id ?? '')
      loadData(ctx.tenantId)
    })
  }, [])

  const handleCloseDaySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!actualCash) return

    setSubmitting(true)
    const todayStr = new Date().toISOString().split('T')[0]

    const res = await closeDayAction({
      tenantId,
      branchId,
      closedBy: '',
      closingDate: todayStr,
      openingCash: parseFloat(openingCash) || 0,
      closingCashActual: parseFloat(actualCash) || 0,
    })

    setSubmitting(false)

    if (res.success) {
      showToast('Day closing saved successfully!', 'success')
      setIsWizardOpen(false)

      const closing = res.closing as {
        total_cash_sales?: number
        total_payments_received?: number
        closing_cash_expected?: number
        difference?: number
      } | undefined
      const actualNum = parseFloat(actualCash) || 0
      setSelectedClosingPrint({
        closing_date: todayStr,
        recorded_at: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
        recorded_by: 'Owner / Manager',
        total_cash_sales: Number(closing?.total_cash_sales ?? 0),
        total_farmer_collections: Number(closing?.total_payments_received ?? 0),
        expected_cash: Number(closing?.closing_cash_expected ?? 0),
        actual_cash: actualNum,
        variance: Number(closing?.difference ?? 0),
        notes,
      })

      setActualCash('')
      setNotes('')
      loadData(tenantId)
    } else {
      showToast(res.error || 'Failed to close day', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[var(--kd-surface)] p-6 rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center space-x-2.5 tracking-tight">
            <div className="p-2 bg-foreground text-accent rounded-xl">
              <BookOpen className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <span>End-of-Day Cash Drawer Reconciliation</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Perform daily cash drawer counts against system sales &amp; farmer payment totals. Record cash differences.
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="bg-primary text-primary-foreground hover:opacity-90 text-foreground font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-[var(--kd-shadow)] transition-all cursor-pointer"
        >
          <Banknote className="h-4 w-4 stroke-[2.5]" />
          <span>CLOSE TODAY&apos;S CASH DRAWER</span>
        </button>
      </div>

      {/* Guided Closing Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--kd-surface)] rounded-[var(--kd-radius)] shadow-2xl max-w-lg w-full p-6 space-y-5 border border-primary/20">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>Day-End Cash Reconciliation Wizard</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsWizardOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-[var(--kd-primary-soft)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCloseDaySubmit} className="space-y-4 text-xs">
              <div className="bg-[var(--kd-primary-soft)] border border-primary/20 rounded-xl p-3.5 space-y-1">
                <div className="font-semibold text-primary">Closing Date: {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <p className="text-2xs text-primary">System will aggregate today&apos;s cash sales and farmer collections automatically.</p>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Morning Opening Cash Float (Rs) *</label>
                <input
                  type="number"
                  required
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl font-mono text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Actual Cash Counted in Drawer Tonight (Rs) *</label>
                <input
                  type="number"
                  required
                  autoFocus
                  placeholder="Enter physical cash counted in drawer..."
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  className="w-full p-3 border border-emerald-400 rounded-xl font-mono text-base font-semibold text-foreground focus:ring-2 focus:ring-primary focus:outline-none bg-[var(--kd-primary-soft)]/40"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Closing Notes / Discrepancy Reason (Optional):</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Rs. 100 extra/short due to change shortage"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="flex-1 bg-background hover:bg-[var(--kd-primary-soft)] text-foreground font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md transition-all cursor-pointer"
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
      <div className="bg-[var(--kd-surface)] rounded-xl shadow-[var(--kd-shadow)] border border-border p-5 space-y-4">
        <h2 className="font-semibold text-base text-foreground flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <span>Past Cash Drawer Reconciliation Log</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground text-xs">Loading closing records...</div>
        ) : closings.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-xs">No day closings recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-background text-foreground font-semibold uppercase text-2xs border-b border-border">
                  <th className="p-3">Date</th>
                  <th className="p-3">Branch</th>
                  <th className="p-3 text-right">Opening Cash</th>
                  <th className="p-3 text-right">Cash Sales</th>
                  <th className="p-3 text-right">Collections</th>
                  <th className="p-3 text-right">Expected Cash</th>
                  <th className="p-3 text-right">Actual Cash</th>
                  <th className="p-3 text-right">Difference</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-semibold text-foreground">
                {pagination.pageItems.map((c) => {
                  const branchObj = Array.isArray(c.branches) ? c.branches[0] : c.branches;
                  return (
                    <tr key={c.id} className="hover:bg-[var(--kd-primary-soft)]">
                      <td className="p-3 font-mono font-semibold">{c.closing_date}</td>
                      <td className="p-3 text-muted-foreground">{branchObj?.name}</td>
                      <td className="p-3 text-right font-mono">Rs. {c.opening_cash?.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-primary">Rs. {c.total_cash_sales?.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-accent">Rs. {c.total_payments_received?.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold">Rs. {c.closing_cash_expected?.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-semibold text-foreground">Rs. {c.closing_cash_actual?.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono">
                        <span className={`px-2 py-0.5 rounded font-semibold ${
                          c.difference === 0 ? 'bg-[var(--kd-primary-soft)] text-primary' :
                          c.difference > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {c.difference >= 0 ? `+Rs. ${c.difference.toLocaleString()}` : `-Rs. ${Math.abs(c.difference).toLocaleString()}`}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedClosingPrint({
                              closing_date: c.closing_date,
                              recorded_at: '20:00',
                              recorded_by: 'Manager',
                              total_cash_sales: c.total_cash_sales ?? 0,
                              total_farmer_collections: c.total_payments_received ?? 0,
                              expected_cash: c.closing_cash_expected ?? 0,
                              actual_cash: c.closing_cash_actual ?? 0,
                              variance: c.difference ?? 0,
                            })
                          }}
                          className="p-1.5 rounded-lg bg-background hover:bg-[var(--kd-primary-soft)] text-foreground border border-border transition-colors cursor-pointer inline-flex items-center gap-1 text-2xs font-semibold"
                          title="Print Thermal Closing Slip"
                        >
                          <Printer className="w-3.5 h-3.5 text-foreground" />
                          <span>Slip</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              from={pagination.from}
              to={pagination.to}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        )}
      </div>

      {/* Day Closing Thermal Print Modal */}
      {selectedClosingPrint && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--kd-surface)] rounded-[var(--kd-radius)] shadow-2xl max-w-sm w-full border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[var(--kd-surface)] text-foreground p-4 flex items-center justify-between no-print">
              <div className="flex items-center space-x-2">
                <Printer className="h-4 w-4 text-accent" />
                <span className="font-bold text-xs">Day Closing Thermal Slip ({selectedClosingPrint.closing_date})</span>
              </div>
              <button onClick={() => setSelectedClosingPrint(null)} className="text-muted-foreground hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-background flex justify-center max-h-[70vh] overflow-y-auto">
              <div className="bg-[var(--kd-surface)] p-2 shadow-md border border-border rounded">
                <PrintableReceipt type="day_closing" dayClosing={selectedClosingPrint} />
              </div>
            </div>

            <div className="p-3 bg-background border-t border-border flex items-center justify-between no-print">
              <button
                onClick={() => setSelectedClosingPrint(null)}
                className="bg-slate-200 hover:bg-slate-300 text-foreground font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={triggerPrint}
                className="bg-primary text-primary-foreground hover:opacity-90 text-white font-semibold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-[var(--kd-shadow)] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
