'use client'

import React, { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { addBranch, getBranchLocations } from '@/actions/branches'
import ModuleLocked from '@/components/shop/ModuleLocked'
import { useToast } from '@/components/ui/Toast'
import { usePagination } from '@/hooks/usePagination'
import Pagination from '@/components/ui/Pagination'

type Locations = Awaited<ReturnType<typeof getBranchLocations>>

export default function BranchesPage() {
  const { showToast } = useToast()
  const [data, setData] = useState<Locations | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setData(await getBranchLocations())
  }

  useEffect(() => {
    load()
  }, [])

  const branchRows = data && !('error' in data) ? data.branches : []
  const pagination = usePagination(branchRows, 10)

  if (!data) return <p className="text-sm text-muted-foreground">Loading outlets…</p>
  if ('error' in data) {
    return (
      <ModuleLocked
        title="Branch locations are off"
        body="This shop runs as one outlet. Extra outlets and the branch list stay hidden until Super Admin turns on Multi-Branch access."
      />
    )
  }

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    const res = await addBranch({ name, address, phone })
    setSaving(false)
    if ('success' in res) {
      showToast('Outlet added.', 'success')
      setName('')
      setAddress('')
      setPhone('')
      load()
    } else {
      showToast(res.error || 'Could not add the outlet.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] p-6 shadow-[var(--kd-shadow)]">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <MapPin className="size-5 text-primary" />
          Branch locations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Outlets for this shop. Transfers can move stock between them.</p>
      </div>

      <div className="overflow-hidden rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] shadow-[var(--kd-shadow)]">
        <div className="grid gap-4 p-4 md:grid-cols-2">
          {pagination.pageItems.map((branch) => (
            <div key={branch.id} className="rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] p-5">
              <p className="font-medium text-foreground">{branch.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{branch.address}</p>
              {branch.phone && <p className="mt-1 text-xs text-muted-foreground">{branch.phone}</p>}
            </div>
          ))}
        </div>
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

      <form onSubmit={handleAdd} className="grid gap-3 rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] p-5 sm:grid-cols-3">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Outlet name" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Address" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        <div className="flex gap-2">
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
          <button type="submit" disabled={saving} className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">
            Add
          </button>
        </div>
      </form>
    </div>
  )
}
