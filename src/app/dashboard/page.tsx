import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  ShoppingCart, AlertTriangle, Clock,
  Package, ArrowRight, ArrowLeftRight,
  ShieldAlert, History, CreditCard, FileBarChart2, Truck,
} from 'lucide-react'
import { getDashboardStats, getSalesHistory } from '@/actions/sales'
import { getDashboardAnalytics } from '@/actions/analytics'
import SalesTrendChart from '@/components/dashboard/SalesTrendChart'
import StockHealthChart from '@/components/dashboard/StockHealthChart'
import { ShopStats } from '@/components/dashboard/ShopStats'

function PaymentBadge({ type }: { type: string }) {
  if (type === 'cash') return (
    <span className="inline-block rounded-full bg-[var(--kd-primary-soft)] px-2.5 py-0.5 text-2xs font-medium uppercase text-primary">Cash</span>
  )
  if (type === 'credit') return (
    <span className="inline-block rounded-full bg-[var(--kd-accent-soft)] px-2.5 py-0.5 text-2xs font-medium uppercase text-accent">Udhaar</span>
  )
  return (
    <span className="inline-block rounded-full bg-[color-mix(in_srgb,var(--kd-warning)_12%,transparent)] px-2.5 py-0.5 text-2xs font-medium uppercase text-warning">Partial</span>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>
}) {
  const { branch } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Session client required — admin/anon fallback is blocked by RLS.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) redirect('/login')

  const [{ data: tenant }, { data: features }] = await Promise.all([
    supabase
      .from('tenants')
      .select('id, business_name, owner_name, city, dealer_license_number, settings')
      .eq('id', profile.tenant_id)
      .maybeSingle(),
    supabase
      .from('tenant_features')
      .select('multi_branch')
      .eq('tenant_id', profile.tenant_id)
      .maybeSingle(),
  ])
  const multiBranch = features?.multi_branch === true
  const branchId = multiBranch && branch && branch !== 'all' ? branch : undefined

  // Fetch stats, recent sales, and analytics in parallel
  const [stats, recentSales, analytics] = await Promise.all([
    getDashboardStats(profile.tenant_id, branchId),
    getSalesHistory(profile.tenant_id, branchId, 8),
    getDashboardAnalytics(profile.tenant_id, '30d', branchId),
  ])
  const spark = analytics.salesTrend.length > 1
    ? analytics.salesTrend.map((point) => point.total)
    : [0, stats.todayRevenue || 0]

  return (
    <div className="space-y-6">

      <div className="relative overflow-hidden rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] p-6 shadow-[var(--kd-shadow)]">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-primary">
              {multiBranch ? 'Multi-branch view' : 'Single outlet'}
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Welcome back, {profile.full_name}
            </h1>
            <p className="text-xs font-normal text-muted-foreground sm:text-sm">
              {tenant?.business_name} · License:{' '}
              <strong className="font-mono font-medium text-foreground">{tenant?.dealer_license_number ?? 'N/A'}</strong>
              {' · '}{tenant?.city}
            </p>
          </div>
          <Link
            href="/pos"
            className="flex shrink-0 items-center gap-2 rounded-[var(--kd-radius)] bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            <ShoppingCart className="size-4" strokeWidth={2} />
            <span>Open POS counter</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] p-2 shadow-[var(--kd-shadow)]">
        <Link href="/pos" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-medium text-primary-foreground">
          <ShoppingCart className="size-3.5" />
          POS
        </Link>
        <Link href="/customers" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-[var(--kd-primary-soft)]">
          <CreditCard className="size-3.5 text-primary" />
          Udhaar payment
        </Link>
        <Link href="/inventory" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-[var(--kd-primary-soft)]">
          <Package className="size-3.5 text-primary" />
          Stock
        </Link>
        <Link href="/purchases" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-[var(--kd-primary-soft)]">
          <Truck className="size-3.5 text-primary" />
          Purchase
        </Link>
        <Link href="/reports/sales-history" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-[var(--kd-primary-soft)]">
          <History className="size-3.5 text-accent" />
          Sales history
        </Link>
        <Link href="/reports" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-[var(--kd-primary-soft)]">
          <FileBarChart2 className="size-3.5 text-accent" />
          Reports
        </Link>
        {multiBranch && (
          <Link href="/transfers" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-[var(--kd-primary-soft)]">
            <ArrowLeftRight className="size-3.5 text-accent" />
            Transfer
          </Link>
        )}
      </div>

      <ShopStats
        items={[
          {
            icon: 'trend',
            label: "Today's revenue",
            value: `Rs. ${stats.todayRevenue.toLocaleString()}`,
            hint: `Cash Rs. ${stats.todayCash.toLocaleString()} · Udhaar Rs. ${stats.todayCredit.toLocaleString()}`,
            spark,
          },
          {
            icon: 'trend',
            tone: 'accent',
            label: 'This month',
            value: `Rs. ${stats.monthRevenue.toLocaleString()}`,
            hint: 'Month to date',
            spark,
          },
          {
            icon: 'users',
            label: 'Outstanding udhaar',
            value: `Rs. ${stats.totalOutstandingCredit.toLocaleString()}`,
            hint: 'Still owed by farmers',
            spark: spark.map(() => stats.totalOutstandingCredit),
          },
          {
            icon: 'clock',
            tone: 'accent',
            label: 'Expiring batches',
            value: String(stats.expiringBatches.length),
            hint: 'Within the next 90 days',
            spark: spark.map(() => stats.expiringBatches.length),
          },
        ]}
      />

      {/* Data Visualization Charts Row */}
      <SalesTrendChart
        initialData={analytics.salesTrend}
        initialCompanies={analytics.companySales}
        tenantId={profile.tenant_id}
        branchId={branchId}
        initialRange="30d"
      />

      {/* Main Grid: Counter Sales, FEFO Expiry List, & Stock Health Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Recent Sales Table */}
        <div className="space-y-4 rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] p-5 shadow-[var(--kd-shadow)] lg:col-span-7">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center space-x-2">
              <div className="rounded-xl bg-[var(--kd-primary-soft)] p-2 text-primary">
                <ShoppingCart className="size-4" strokeWidth={2} />
              </div>
              <h2 className="text-base font-semibold text-foreground">Recent Counter Sales</h2>
            </div>
            <Link href="/reports/sales-history" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              <span>View Full History</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="bg-[var(--kd-surface)] rounded-xl border border-border overflow-hidden shadow-2xs">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2.5 bg-background/80 text-muted-foreground text-2xs font-medium uppercase tracking-wider border-b border-border">
              <span>Receipt # / Farmer Name</span>
              <span className="text-right">Grand Total</span>
              <span className="text-right">Payment</span>
            </div>
            <div className="divide-y divide-border">
              {recentSales.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-xs font-normal">
                  No sales recorded yet. <Link href="/pos" className="text-foreground font-semibold hover:underline">Start your first sale →</Link>
                </div>
              ) : recentSales.map((sale: Awaited<ReturnType<typeof getSalesHistory>>[number]) => {
                const cust = (sale.customers as unknown) as { name?: string } | Array<{ name?: string }> | null
                const customerName = Array.isArray(cust) ? cust[0]?.name : cust?.name

                const prof = (sale.profiles as unknown) as { full_name?: string } | Array<{ full_name?: string }> | null
                const staffName = Array.isArray(prof) ? prof[0]?.full_name : prof?.full_name

                const br = (sale.branches as unknown) as { name?: string } | Array<{ name?: string }> | null
                const branchName = Array.isArray(br) ? br[0]?.name : br?.name

                return (
                  <div key={sale.id} className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-3 items-center hover:bg-[var(--kd-primary-soft)]/60 transition-colors">
                    <div>
                      <span className="text-xs font-semibold text-foreground font-mono">{sale.sale_number}</span>
                      {customerName && (
                        <span className="ml-2 text-2xs font-medium text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                          {customerName}
                        </span>
                      )}
                      <div className="text-2xs text-muted-foreground font-normal mt-0.5">
                        {new Date(sale.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                        {' '}· {staffName ?? 'Staff'}
                        {' '}· {branchName}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums text-right">
                      Rs. {sale.grand_total.toLocaleString()}
                    </span>
                    <div className="text-right">
                      <PaymentBadge type={sale.payment_type} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: FEFO Expiry Panel + Stock Health Chart */}
        <div className="lg:col-span-5 space-y-5 flex flex-col">
          {/* FEFO Expiry Panel with Visual Alert Chips */}
          <div className="bg-[var(--kd-surface)] rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border p-5 space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[color-mix(in_srgb,var(--kd-danger)_12%,transparent)] text-danger border border-danger/30 rounded-xl">
                  <AlertTriangle className="w-4 h-4" strokeWidth={2} />
                </div>
                <h2 className="font-semibold text-base text-foreground">FEFO Expiry Warnings</h2>
              </div>
              <span className="bg-[color-mix(in_srgb,var(--kd-danger)_12%,transparent)] text-danger border border-danger/30 text-2xs font-semibold px-2.5 py-1 rounded-full">
                {stats.expiringBatches.length} Urgent
              </span>
            </div>

            <div className="space-y-2.5 flex-1">
              {stats.expiringBatches.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground text-xs font-normal">
                  No batches expiring within 90 days. ✓
                </div>
              ) : stats.expiringBatches.slice(0, 4).map((b: Awaited<ReturnType<typeof getDashboardStats>>['expiringBatches'][number]) => {
                const daysLeft = Math.ceil((new Date(b.expiry_date).getTime() - Date.now()) / 86400000)
                const prodObj = Array.isArray(b.products) ? b.products[0] : b.products;
                const prodName = prodObj?.name ?? 'Unknown Product';
                const isCritical = daysLeft <= 30

                return (
                  <div key={b.id} className="p-3 bg-background border border-border rounded-xl shadow-2xs text-xs flex items-center gap-3 hover:border-border transition-colors">
                    {/* Visual Icon Chip */}
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${
                      isCritical
                        ? 'border-danger/30 bg-[color-mix(in_srgb,var(--kd-danger)_12%,transparent)] text-danger'
                        : 'border-warning/30 bg-[color-mix(in_srgb,var(--kd-warning)_12%,transparent)] text-warning'
                    }`}>
                      {isCritical ? <ShieldAlert className="size-4" strokeWidth={2} /> : <Clock className="size-4" strokeWidth={2} />}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between font-medium text-foreground">
                        <span className="mr-2 truncate font-semibold">{prodName}</span>
                        <span className={`shrink-0 rounded px-2 py-0.5 text-2xs font-semibold ${
                          isCritical
                            ? 'bg-danger text-white'
                            : 'bg-[color-mix(in_srgb,var(--kd-warning)_18%,transparent)] text-warning'
                        }`}>
                          {daysLeft}d left
                        </span>
                      </div>
                      <div className="flex justify-between text-2xs text-muted-foreground font-mono font-normal">
                        <span>Batch: {b.batch_number}</span>
                        <span>Stock: <strong className="text-foreground font-semibold">{b.quantity_current} units</strong></span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pt-2">
              <Link
                href="/inventory"
                className="w-full bg-primary text-primary-foreground hover:opacity-90 border border-primary/30 text-xs font-semibold py-2.5 rounded-xl text-center block transition-all shadow-[var(--kd-shadow)]"
              >
                Manage Inventory &amp; Batches →
              </Link>
            </div>
          </div>

          {/* Stock Health Donut Chart */}
          <StockHealthChart summary={analytics.stockHealth} />
        </div>
      </div>

    </div>
  )
}
