'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeftRight, Plus, CheckCircle2, Truck } from 'lucide-react'
import { getStockTransfers, createStockTransfer, approveStockTransfer } from '@/actions/inventory'
import { useToast } from '@/components/ui/Toast'

type TransferData = Awaited<ReturnType<typeof getStockTransfers>>;

export default function TransfersPage() {
  const { showToast } = useToast()
  const [transfers, setTransfers] = useState<TransferData>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [fromBranchId, setFromBranchId] = useState('22222222-2222-2222-2222-222222222222')
  const [toBranchId, setToBranchId] = useState('22222222-2222-2222-2222-333333333333')
  const [batchId, setBatchId] = useState('55555555-5555-5555-5555-111111111111')
  const [quantity, setQuantity] = useState('10')
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const data = await getStockTransfers('11111111-1111-1111-1111-111111111111')
    setTransfers(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quantity || parseInt(quantity) <= 0) return

    setSubmitting(true)
    const res = await createStockTransfer({
      tenantId: '11111111-1111-1111-1111-111111111111',
      fromBranchId,
      toBranchId,
      requestedBy: 'usr-owner1',
      items: [{ batchId, quantity: parseInt(quantity) }],
    })
    setSubmitting(false)

    if ('id' in res && res.id) {
      showToast('Stock transfer request created!', 'success')
      setIsModalOpen(false)
      loadData()
    } else {
      const errMsg = 'error' in res ? (res as { error?: string }).error : 'Failed to create transfer'
      showToast(errMsg || 'Failed to create transfer', 'error')
    }
  }

  const handleApproveTransfer = async (id: string) => {
    const res = await approveStockTransfer(id, 'usr-owner1')
    if (res.success) {
      showToast('Stock transfer approved & inventory updated in destination branch!', 'success')
      loadData()
    } else {
      showToast(res.error || 'Approval failed', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2.5 tracking-tight">
            <div className="p-2 bg-slate-950 text-yellow-400 rounded-xl">
              <ArrowLeftRight className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <span>Inter-Branch Stock Transfers</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Request, track, and approve stock transfers between branch locations with atomic deduct-then-add logic.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>NEW BRANCH STOCK TRANSFER</span>
        </button>
      </div>

      {/* New Transfer Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-emerald-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                <ArrowLeftRight className="h-5 w-5 text-emerald-700" />
                <span>Request Inter-Branch Stock Transfer</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">From Sending Branch *</label>
                  <select
                    value={fromBranchId}
                    onChange={(e) => setFromBranchId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold"
                  >
                    <option value="22222222-2222-2222-2222-222222222222">Multan Grains Market Branch</option>
                    <option value="22222222-2222-2222-2222-333333333333">Khanewal Bypass Branch</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">To Destination Branch *</label>
                  <select
                    value={toBranchId}
                    onChange={(e) => setToBranchId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold"
                  >
                    <option value="22222222-2222-2222-2222-333333333333">Khanewal Bypass Branch</option>
                    <option value="22222222-2222-2222-2222-222222222222">Multan Grains Market Branch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Product Batch to Transfer *</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold"
                >
                  <option value="55555555-5555-5555-5555-111111111111">Confidor 200 SL — Batch: BAY-2025-09A (Exp: 2026-11-30)</option>
                  <option value="55555555-5555-5555-5555-222222222222">Coragen 20 SC — Batch: FMC-COR-441 (Exp: 2026-09-15)</option>
                  <option value="55555555-5555-5555-5555-333333333333">Match 50 EC — Batch: SYN-MAT-102 (Exp: 2027-01-10)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Transfer Quantity (Units) *</label>
                <input
                  type="number"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-extrabold text-sm"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md transition-all cursor-pointer"
                >
                  <Truck className="h-4 w-4" />
                  <span>{submitting ? 'Submitting...' : 'Submit Transfer Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfers List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <h2 className="font-extrabold text-base text-slate-900">Stock Transfer History &amp; Status</h2>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading transfer requests...</div>
        ) : transfers.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">No stock transfers recorded yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transfers.map((t) => {
              const fromObj = Array.isArray(t.from_branch) ? t.from_branch[0] : t.from_branch;
              const toObj = Array.isArray(t.to_branch) ? t.to_branch[0] : t.to_branch;
              const reqObj = Array.isArray(t.requester) ? t.requester[0] : t.requester;
              return (
                <div key={t.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xs font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                        t.status === 'received' ? 'bg-emerald-100 text-emerald-900' :
                        t.status === 'pending' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                      }`}>
                        STATUS: {t.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-900">
                      From: {fromObj?.name} → To: {toObj?.name}
                    </div>
                    <div className="text-2xs text-slate-500 font-mono">
                      Requested by: {reqObj?.full_name ?? 'Staff'} · Date: {new Date(t.created_at).toLocaleString()}
                    </div>
                  </div>

                {t.status === 'pending' && (
                  <button
                    onClick={() => handleApproveTransfer(t.id)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>APPROVE &amp; RECEIVE STOCK</span>
                  </button>
                )}
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  )
}
