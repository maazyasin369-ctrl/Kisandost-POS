'use client'



import React from 'react'

import AdminShell from '@/components/layout/AdminShell'

import { PageHeader } from '@/components/admin/PageHeader'

import { StatusBadge } from '@/components/admin/StatusBadge'

import { dataStore } from '@/lib/data-store'

import { formatPkr } from '@/components/admin/format'

import { usePagination } from '@/hooks/usePagination'

import Pagination from '@/components/ui/Pagination'



export default function SuperAdminAuditLogsPage() {

  const sales = dataStore.getSales()

  const transfers = dataStore.getTransfers()



  const auditEvents = [

    {

      id: 'log-1',

      time: '2026-08-27 16:30:00',

      type: 'Session',

      action: 'Operator session verified',

      detail: 'Super Admin signed in from 192.168.1.11',

      status: 'active',

    },

    {

      id: 'log-2',

      time: '2026-08-27 15:45:12',

      type: 'Sale',

      action: 'POS sale recorded',

      detail: `Receipt ${sales[0]?.sale_number || 'REC-2026-001'} for ${formatPkr(sales[0]?.grand_total || 24500)}`,

      status: 'paid',

    },

    {

      id: 'log-3',

      time: '2026-08-27 14:10:00',

      type: 'Transfer',

      action: 'Inventory transfer started',

      detail: `Transfer ${transfers[0]?.id || 'TRF-001'} between Main Outlet and Ghalla Mandi Branch`,

      status: 'due soon',

    },

    {

      id: 'log-4',

      time: '2026-08-27 12:00:00',

      type: 'License',

      action: 'Dealer license checked',

      detail: 'License PB-MLT-2024-8891 is active',

      status: 'active',

    },

  ]



  const pagination = usePagination(auditEvents, 10)



  return (

    <AdminShell>

      <div className="flex flex-col gap-6">

        <PageHeader

          crumbs={[{ label: 'Super Admin' }, { label: 'Audit logs' }]}

          title="Audit logs"

          description="Recent operator, sales, transfer, and license events."

        />



        <section className="overflow-hidden rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] shadow-[var(--kd-shadow)]">

          <div className="border-b border-border px-5 py-4">

            <h2 className="text-base font-semibold tracking-tight">Activity</h2>

          </div>

          <ul>

            {pagination.pageItems.map((log) => (

              <li key={log.id} className="flex flex-col gap-2 border-b border-border px-5 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">

                <div className="min-w-0">

                  <div className="mb-1 flex items-center gap-2">

                    <span className="rounded-full bg-[var(--kd-accent-soft)] px-2 py-0.5 text-xs font-medium text-accent">{log.type}</span>

                    <span className="text-sm font-medium text-foreground">{log.action}</span>

                  </div>

                  <p className="text-sm text-muted-foreground">{log.detail}</p>

                </div>

                <div className="flex items-center gap-3">

                  <span className="text-xs tabular-nums text-muted-foreground">{log.time}</span>

                  <StatusBadge status={log.status} />

                </div>

              </li>

            ))}

          </ul>

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

        </section>

      </div>

    </AdminShell>

  )

}

