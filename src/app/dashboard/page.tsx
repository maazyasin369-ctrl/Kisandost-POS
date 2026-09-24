import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  TrendingUp, ShoppingCart, Users, AlertTriangle, Clock,
  ChevronRight, Package, Zap, Sparkles, BookOpen, ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import { getDashboardStats, getSalesHistory } from '@/actions/sales'
import { getDashboardAnalytics } from '@/actions/analytics'
import SalesTrendChart from '@/components/dashboard/SalesTrendChart'
import SalesByCompanyList from '@/components/dashboard/SalesByCompanyList'
import StockHealthChart from '@/components/dashboard/StockHealthChart'

function KpiCard({ label, value, sub, gradientClass, iconBgClass, icon: Icon }: {
  label: string; value: string; sub?: string
  gradientClass: string; iconBgClass: string; icon: React.ElementType
}) {
  return (
    <div className={`rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 bg-white border border-slate-200/80 ${gradientClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xs font-medium uppercase tracking-widest text-slate-500 mb-2">{label}</p>
          <p className="text-2xl font-semibold text-slate-900 tabular-nums tracking-tight leading-none mb-1.5">{value}</p>
          {sub && <p className="text-2xs font-normal text-slate-500">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${iconBgClass}`}>
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
      </div>
    </div>
  )
}

function PaymentBadge({ type }: { type: string }) {
  if (type === 'cash') return (
    <span className="inline-block text-2xs font-semibold uppercase px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/70">CASH</span>
  )
  if (type === 'credit') return (
    <span className="inline-block text-2xs font-semibold uppercase px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/70">UDHAAR</span>
  )
  return (
    <span className="inline-block text-2xs font-semibold uppercase px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/70">PARTIAL</span>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Get profile + tenant
  const { data: profile } = await admin
    .from('profiles')
    .select('id, tenant_id, full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: tenant } = await admin
    .from('tenants')
    .select('id, business_name, owner_name, city, dealer_license_number, settings')
    .eq('id', profile.tenant_id)
    .single()

  // Fetch stats, recent sales, and analytics in parallel
  const [stats, recentSales, analytics] = await Promise.all([
    getDashboardStats(profile.tenant_id),
    getSalesHistory(profile.tenant_id, undefined, 8),
    getDashboardAnalytics(profile.tenant_id, 'today'),
  ])

  return (
    <div className="space-y-6">

      {/* Page Header — H1 Title is font-bold (700) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-2xs font-medium text-slate-400 mb-1">
            <span>Overview</span>
            <ChevronRight className="w-3 h-3" strokeWidth={2} />
            <span className="text-slate-900 font-semibold">Executive Dashboard</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Shop Operations &amp; Counter Summary
          </h1>
        </div>
        <Link
          href="/pos"
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-semibold text-sm px-5 py-3 rounded-xl shadow-xs transition-all transform hover:-translate-y-0.5 shrink-0"
        >
          <ShoppingCart className="w-4 h-4 text-slate-950" strokeWidth={2} />
          <span>OPEN POS COUNTER</span>
        </Link>
      </div>

      {/* Hero Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs relative overflow-hidden border border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 bg-yellow-400 text-slate-950 text-2xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>{tenant?.settings?.branch_mode?.toUpperCase() ?? 'INDEPENDENT'} VIEW MODE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              Welcome back, <span className="text-slate-900 font-semibold">{profile.full_name}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              {tenant?.business_name} &nbsp;·&nbsp; License:{' '}
              <strong className="text-slate-900 font-mono font-medium">{tenant?.dealer_license_number ?? 'N/A'}</strong>
              &nbsp;·&nbsp; {tenant?.city}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl text-right shadow-2xs">
            <span className="text-2xs font-medium text-slate-400 uppercase block mb-0.5">Role</span>
            <span className="inline-block text-xs font-semibold bg-yellow-400 text-slate-950 px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">{profile.role.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Light & Clean KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Today's Revenue"
          value={`Rs. ${stats.todayRevenue.toLocaleString()}`}
          sub={`Cash: Rs. ${stats.todayCash.toLocaleString()} | Credit: Rs. ${stats.todayCredit.toLocaleString()}`}
          gradientClass=""
          iconBgClass="bg-yellow-50 text-yellow-800 border border-yellow-200/70"
          icon={TrendingUp}
        />
        <KpiCard
          label="This Month's Revenue"
          value={`Rs. ${stats.monthRevenue.toLocaleString()}`}
          sub="Month-to-date all branches"
          gradientClass=""
          iconBgClass="bg-blue-50 text-blue-700 border border-blue-200/70"
          icon={TrendingUp}
        />
        <KpiCard
          label="Outstanding Udhaar"
          value={`Rs. ${stats.totalOutstandingCredit.toLocaleString()}`}
          sub="Total farmer credit owed to shop"
          gradientClass=""
          iconBgClass="bg-amber-50 text-amber-700 border border-amber-200/70"
          icon={Users}
        />
        <KpiCard
          label="Expiring Batches"
          value={`${stats.expiringBatches.length} Batches`}
          sub="Within next 90 days (FEFO alert)"
          gradientClass=""
          iconBgClass="bg-rose-50 text-rose-600 border border-rose-200/70"
          icon={Clock}
        />
      </div>

      {/* Data Visualization Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Sales Trend Area Chart (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <SalesTrendChart
            initialData={analytics.salesTrend}
            tenantId={profile.tenant_id}
            initialRange="today"
          />
        </div>

        {/* Company Sales Breakdown Bar List (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <SalesByCompanyList companies={analytics.companySales} />
        </div>
      </div>

      {/* Main Grid: Counter Sales, FEFO Expiry List, & Stock Health Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Recent Sales Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-400 text-slate-950 rounded-xl shadow-2xs">
                <ShoppingCart className="w-4 h-4" strokeWidth={2} />
              </div>
              <h2 className="font-semibold text-base text-slate-900">Recent Counter Sales</h2>
            </div>
            <Link href="/reports/sales-history" className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 group">
              <span>View Full History</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2.5 bg-slate-50/80 text-slate-500 text-2xs font-medium uppercase tracking-wider border-b border-slate-200/70">
              <span>Receipt # / Farmer Name</span>
              <span className="text-right">Grand Total</span>
              <span className="text-right">Payment</span>
            </div>
            <div className="divide-y divide-slate-100">
              {recentSales.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs font-normal">
                  No sales recorded yet. <Link href="/pos" className="text-slate-900 font-semibold hover:underline">Start your first sale →</Link>
                </div>
              ) : recentSales.map((sale: Awaited<ReturnType<typeof getSalesHistory>>[number]) => {
                const cust = (sale.customers as unknown) as { name?: string } | Array<{ name?: string }> | null
                const customerName = Array.isArray(cust) ? cust[0]?.name : cust?.name

                const prof = (sale.profiles as unknown) as { full_name?: string } | Array<{ full_name?: string }> | null
                const staffName = Array.isArray(prof) ? prof[0]?.full_name : prof?.full_name

                const br = (sale.branches as unknown) as { name?: string } | Array<{ name?: string }> | null
                const branchName = Array.isArray(br) ? br[0]?.name : br?.name

                return (
                  <div key={sale.id} className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-3 items-center hover:bg-slate-50/60 transition-colors">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 font-mono">{sale.sale_number}</span>
                      {customerName && (
                        <span className="ml-2 text-2xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {customerName}
                        </span>
                      )}
                      <div className="text-2xs text-slate-500 font-normal mt-0.5">
                        {new Date(sale.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                        {' '}· {staffName ?? 'Staff'}
                        {' '}· {branchName}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums text-right">
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
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-rose-50 text-rose-600 border border-rose-200/70 rounded-xl">
                  <AlertTriangle className="w-4 h-4" strokeWidth={2} />
                </div>
                <h2 className="font-semibold text-base text-slate-900">FEFO Expiry Warnings</h2>
              </div>
              <span className="bg-rose-50 text-rose-700 border border-rose-200/70 text-2xs font-semibold px-2.5 py-1 rounded-full">
                {stats.expiringBatches.length} Urgent
              </span>
            </div>

            <div className="space-y-2.5 flex-1">
              {stats.expiringBatches.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs font-normal">
                  No batches expiring within 90 days. ✓
                </div>
              ) : stats.expiringBatches.slice(0, 4).map((b: Awaited<ReturnType<typeof getDashboardStats>>['expiringBatches'][number]) => {
                const daysLeft = Math.ceil((new Date(b.expiry_date).getTime() - Date.now()) / 86400000)
                const prodObj = Array.isArray(b.products) ? b.products[0] : b.products;
                const prodName = prodObj?.name ?? 'Unknown Product';
                const isCritical = daysLeft <= 30

                return (
                  <div key={b.id} className="p-3 bg-slate-50/60 border border-slate-200/80 rounded-xl shadow-2xs text-xs flex items-center gap-3 hover:border-slate-300 transition-colors">
                    {/* Visual Icon Chip */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isCritical ? 'bg-rose-100 border-rose-200 text-rose-600' : 'bg-amber-100 border-amber-200 text-amber-700'
                    }`}>
                      {isCritical ? <ShieldAlert className="w-4 h-4" strokeWidth={2} /> : <Clock className="w-4 h-4" strokeWidth={2} />}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex justify-between items-start font-medium text-slate-900">
                        <span className="font-semibold truncate mr-2">{prodName}</span>
                        <span className={`text-2xs font-semibold px-2 py-0.5 rounded shrink-0 ${isCritical ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950'}`}>
                          {daysLeft}d left
                        </span>
                      </div>
                      <div className="flex justify-between text-2xs text-slate-500 font-mono font-normal">
                        <span>Batch: {b.batch_number}</span>
                        <span>Stock: <strong className="text-slate-900 font-semibold">{b.quantity_current} units</strong></span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pt-2">
              <Link
                href="/inventory"
                className="w-full bg-slate-950 hover:bg-slate-900 text-yellow-400 border border-yellow-400/30 text-xs font-semibold py-2.5 rounded-xl text-center block transition-all shadow-xs"
              >
                Manage Inventory &amp; Batches →
              </Link>
            </div>
          </div>

          {/* Stock Health Donut Chart */}
          <StockHealthChart summary={analytics.stockHealth} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
        <p className="text-2xs font-medium uppercase tracking-widest text-slate-400">Quick Counter Actions</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/purchases" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition-all transform active:scale-95">
            <Package className="w-4 h-4 text-yellow-400" />
            <span>New Purchase Order</span>
          </Link>
          <Link href="/customers" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 text-xs font-semibold shadow-xs transition-all transform active:scale-95">
            <Users className="w-4 h-4 text-slate-950" />
            <span>Record Farmer Payment</span>
          </Link>
          <Link href="/transfers" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition-all transform active:scale-95">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Branch Transfer</span>
          </Link>
          <Link href="/reports/day-closing" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200/80 transition-all transform active:scale-95">
            <BookOpen className="w-4 h-4 text-slate-700" />
            <span>Close Day</span>
          </Link>
        </div>
      </div>

    </div>
  )
}
