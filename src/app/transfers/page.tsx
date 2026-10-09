'use client'

import React, { useEffect, useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { approveStockTransfer, createStockTransfer, getTransferWorkspace } from '@/actions/inventory'
import ModuleLocked from '@/components/shop/ModuleLocked'
import { useToast } from '@/components/ui/Toast'
import { usePagination } from '@/hooks/usePagination'
import Pagination from '@/components/ui/Pagination'

type Workspace = Awaited<ReturnType<typeof getTransferWorkspace>>
type TransferWorkspace = Extract<Workspace, { transfers: unknown[] }>
type TransferRow = TransferWorkspace['transfers'][number]

function isTransferWorkspace(data: Workspace | null): data is TransferWorkspace {
  return !!data && 'transfers' in data
}

export default function TransfersPage() {
  const { showToast } = useToast()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [fromBranchId, setFromBranchId] = useState('')
  const [toBranchId, setToBranchId] = useState('')
  const [batchId, setBatchId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [submitting, setSubmitting] = useState(false)

  const transferRows: TransferRow[] = isTransferWorkspace(workspace) ? workspace.transfers : []
  const pagination = usePagination(transferRows, 10)

  const load = async () => {
    setLoading(true)
    const data = await getTransferWorkspace()
    setWorkspace(data)
    if (isTransferWorkspace(data)) {
      setFromBranchId(data.branches[0]?.id ?? '')
      setToBranchId(data.branches[1]?.id ?? data.branches[0]?.id ?? '')
      setBatchId(data.batches[0]?.id ?? '')
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading transfers…</p>
  }

  if (!isTransferWorkspace(workspace)) {
    return (
      <ModuleLocked
        title="Branch transfers are off"
        body="This shop is a single outlet. Stock moves between outlets stay hidden until Super Admin turns on Multi-Branch access."
      />
    )
  }

  const canTransfer = workspace.branches.length >= 2

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    const res = await createStockTransfer({
      tenantId: '',
      fromBranchId,
      toBranchId,
      requestedBy: '',
      items: [{ batchId, quantity: Number(quantity) }],
    })
    setSubmitting(false)
    if ('id' in res && res.id) {
      showToast('Transfer requested.', 'success')
      setOpen(false)
      load()
    } else {
      showToast('error' in res ? res.error || 'Could not create the transfer.' : 'Could not create the transfer.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] p-6 shadow-[var(--kd-shadow)]">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <ArrowLeftRight className="size-5 text-primary" />
            Branch transfers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Move stock from one outlet to another. The destination outlet receives the same batch.</p>
        </div>
        <button
          type="button"
          disabled={!canTransfer}
          onClick={() => setOpen(true)}
          className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          New transfer
        </button>
      </div>

      {!canTransfer && (
        <p className="rounded-[var(--kd-radius)] border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
          Add a second outlet under Branch Locations before requesting a transfer.
        </p>
      )}

      <div className="overflow-hidden rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)]">
        {workspace.transfers.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No transfers yet.</p>
        ) : (
          <>
            {pagination.pageItems.map((transfer) => {
              const from = Array.isArray(transfer.from_branch) ? transfer.from_branch[0] : transfer.from_branch
              const to = Array.isArray(transfer.to_branch) ? transfer.to_branch[0] : transfer.to_branch
              return (
                <div key={transfer.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{from?.name ?? 'Outlet'} → {to?.name ?? 'Outlet'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(transfer.created_at).toLocaleString()} · {transfer.status}</p>
                  </div>
                  {transfer.status === 'pending' && (
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await approveStockTransfer(transfer.id, '')
                        if ('success' in res && res.success) {
                          showToast('Transfer received at the destination outlet.', 'success')
                          load()
                        } else {
                          showToast('error' in res ? res.error || 'Could not receive this transfer.' : 'Could not receive this transfer.', 'error')
                        }
                      }}
                      className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    >
                      Receive
                    </button>
                  )}
                </div>
              )
            })}
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
          </>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-24" onClick={() => setOpen(false)}>
          <form
            onSubmit={handleCreate}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md space-y-3 rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] p-5 shadow-[var(--kd-shadow)]"
          >
            <h2 className="text-base font-semibold text-foreground">New transfer</h2>
            <label className="block text-xs text-muted-foreground">
              From
              <select value={fromBranchId} onChange={(event) => setFromBranchId(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                {workspace.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select>
            </label>
            <label className="block text-xs text-muted-foreground">
              To
              <select value={toBranchId} onChange={(event) => setToBranchId(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                {workspace.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select>
            </label>
            <label className="block text-xs text-muted-foreground">
              Batch
              <select value={batchId} onChange={(event) => setBatchId(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                {workspace.batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.label}</option>)}
              </select>
            </label>
            <label className="block text-xs text-muted-foreground">
              Quantity
              <input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min={1} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-full px-3 py-1.5 text-xs text-muted-foreground">Cancel</button>
              <button type="submit" disabled={submitting || !batchId} className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
                {submitting ? 'Saving…' : 'Request transfer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
