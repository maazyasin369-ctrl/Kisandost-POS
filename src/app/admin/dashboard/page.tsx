'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Building2,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react'
import AdminShell from '@/components/layout/AdminShell'
import { dataStore } from '@/lib/data-store'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatCard, WidgetState } from '@/components/admin/StatCard'
import { ChartCard } from '@/components/admin/ChartCard'
import { Card } from '@/components/admin/Card'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { formatPkr, PLACEHOLDER_GMV, PLACEHOLDER_SPARKS } from '@/components/admin/format'

type Range = keyof typeof PLACEHOLDER_GMV extends infer K ? K extends 'note' ? never : K : never

type DealerRow = {
  id: string
  dealer: string
  owner: string
  city: string
  license: string
  outlets: number
  status: string
  plan: string
}

export default function SuperAdminDashboardPage() {
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [range, setRange] = useState<Range>('30D')

  useEffect(() => {
    try {
      dataStore.getTenants()
      setReady(true)
    } catch {
      setFailed(true)
    }
  }, [])

  const tenants = ready ? dataStore.getTenants() : []
  const branches = ready ? dataStore.getBranches() : []
  const sales = ready ? dataStore.getSales() : []
  const profiles = ready ? dataStore.getProfiles() : []
  const alerts = ready ? dataStore.getAdminNotifications() : []
  const totalGmv = sales.reduce((sum, s) => sum + s.grand_total, 0)

  const rows: DealerRow[] = useMemo(
    () =>
      tenants.map((t) => ({
        id: t.id,
        dealer: t.business_name,
        owner: t.owner_name,
        city: t.city,
        license: t.dealer_license_number,
        outlets: branches.filter((b) => b.tenant_id === t.id).length,
        status: t.subscription_status,
        plan: t.subscription_status === 'trial' ? 'Trial' : 'Standard',
      })),
    [tenants, branches],
  )

  const billingBars = [
    {
      name: 'Paid',
      value: Math.max(totalGmv, 1),
      fill: 'var(--kd-primary)',
    },
    {
      name: 'Upcoming',
      value: alerts.filter((n) => n.severity === 'warning').reduce((s, n) => s + n.amount, 0),
      fill: 'var(--kd-accent)',
    },
    {
      name: 'Overdue',
      value: alerts.filter((n) => n.severity === 'overdue').reduce((s, n) => s + n.amount, 0),
      fill: 'var(--kd-danger)',
    },
  ]

  const donutColors = ['var(--kd-primary)', 'var(--kd-accent)', 'var(--kd-chart-3)', 'var(--kd-warning)']
  const statusDonut = ['active', 'trial', 'suspended', 'pending_approval']
    .map((status) => ({
      name: status.replaceAll('_', ' '),
      value: tenants.filter((t) => t.subscription_status === status).length,
    }))
    .filter((d) => d.value > 0)

  const columns: Column<DealerRow>[] = [
    { key: 'dealer', header: 'Dealer', sortable: true, sortValue: (r) => r.dealer, render: (r) => r.dealer },
    { key: 'owner', header: 'Owner', sortable: true, sortValue: (r) => r.owner, render: (r) => r.owner },
    { key: 'city', header: 'City', sortable: true, sortValue: (r) => r.city, render: (r) => r.city },
    { key: 'license', header: 'License', render: (r) => r.license },
    { key: 'outlets', header: 'Outlets', sortable: true, align: 'right', sortValue: (r) => r.outlets, render: (r) => r.outlets },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'plan', header: 'Plan', render: (r) => r.plan },
  ]

  const gmvSeries = PLACEHOLDER_GMV[range]

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <PageHeader
          crumbs={[{ label: 'Super Admin' }, { label: 'Dashboard' }]}
          title="Platform overview"
          description="Dealers, outlets, GMV, and billing in one view."
          action={{ href: '/admin/tenants', label: 'Manage tenants' }}
        />

        {!ready && !failed && <WidgetState kind="loading" title="metrics" />}
        {failed && <WidgetState kind="error" title="metrics" />}
        {ready && tenants.length === 0 && <WidgetState kind="empty" title="dealers" />}

        {ready && tenants.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Building2} label="Registered dealers" value={String(tenants.length)} hint="vs last month" trend={{ value: 12 }} spark={[...PLACEHOLDER_SPARKS.dealers]} />
              <StatCard icon={Store} tone="accent" label="Branch outlets" value={String(branches.length)} hint="vs last month" trend={{ value: 8 }} spark={[...PLACEHOLDER_SPARKS.outlets]} />
              <StatCard icon={TrendingUp} label="Platform GMV" value={formatPkr(totalGmv)} hint="receipts" trend={{ value: 6 }} spark={[...PLACEHOLDER_SPARKS.gmv]} />
              <StatCard icon={Users} tone="accent" label="Trial accounts" value={String(profiles.filter((p) => tenants.find((t) => t.id === p.tenant_id)?.subscription_status === 'trial').length || profiles.length)} hint="vs last month" trend={{ value: -3 }} spark={[...PLACEHOLDER_SPARKS.trials]} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
              <ChartCard
                className="xl:col-span-3"
                title="Platform GMV"
                note="Gross merchandise value across shops"
                action={
                  <div className="flex rounded-full border border-border bg-[var(--kd-background)] p-0.5 text-xs">
                    {(['7D', '30D', '12M'] as Range[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setRange(key)}
                        className={`rounded-full px-2.5 py-1 font-medium ${range === key ? 'bg-[var(--kd-surface)] text-foreground shadow-[var(--kd-shadow)]' : 'text-muted-foreground'}`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                }
              >
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={[...gmvSeries]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gmvFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--kd-primary)" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="var(--kd-primary)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--kd-border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--kd-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--kd-muted)' }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip formatter={(v) => formatPkr(Number(v))} />
                    <Area type="monotone" dataKey="gmv" stroke="var(--kd-primary)" fill="url(#gmvFill)" strokeWidth={2.25} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard className="xl:col-span-2" title="Tenants by status" note="Subscription mix">
                <div className="flex items-center gap-2">
                  <div className="h-[220px] flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusDonut} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="var(--kd-surface)" strokeWidth={3}>
                          {statusDonut.map((_, i) => (
                            <Cell key={i} fill={donutColors[i % donutColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="flex w-28 flex-col gap-2 text-xs">
                    {statusDonut.map((item, i) => (
                      <li key={item.name} className="flex items-center justify-between gap-2 capitalize text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full" style={{ background: donutColors[i % donutColors.length] }} />
                          {item.name}
                        </span>
                        <span className="font-medium tabular-nums text-foreground">{item.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
              <ChartCard className="xl:col-span-3" title="Billing by status" note="Amounts in PKR">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={billingBars} barSize={28}>
                    <CartesianGrid vertical={false} stroke="var(--kd-border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--kd-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--kd-muted)' }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip formatter={(v) => formatPkr(Number(v))} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {billingBars.map((bar) => (
                        <Cell key={bar.name} fill={bar.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <Card className="xl:col-span-2">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h2 className="text-base font-semibold tracking-tight">Billing alerts</h2>
                  <Link href="/admin/tenants" className="text-sm font-medium text-accent">View all</Link>
                </div>
                {alerts.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-muted-foreground">No billing alerts.</p>
                ) : (
                  <ul>
                    {alerts.map((alert) => (
                      <li key={alert.id} className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 last:border-0">
                        <div className="min-w-0">
                          <div className="mb-1 flex items-center gap-2">
                            <StatusBadge status={alert.severity === 'overdue' ? 'overdue' : 'due soon'} />
                          </div>
                          <p className="truncate text-sm font-medium">{alert.tenant_name}</p>
                          <p className="text-xs text-muted-foreground">Due {alert.due_date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums">{formatPkr(alert.amount)}</p>
                          <Link href={alert.link_url} className="text-xs font-medium text-accent">Open billing</Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <Card>
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">Registered dealers</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">{rows.length} shops on the platform</p>
                </div>
              </div>
              <DataTable
                rows={rows}
                columns={columns}
                emptyLabel="No dealers yet."
                rowAction={(row) => ({ href: `/admin/tenants/${row.id}`, label: 'Open dealer' })}
              />
            </Card>
          </>
        )}
      </div>
    </AdminShell>
  )
}
