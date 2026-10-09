'use server'

import { createDataClient } from '@/lib/supabase/admin'

export interface SalesTrendPoint {
  time: string
  cash: number
  credit: number
  total: number
}

export interface CompanySalesItem {
  id: string
  name: string
  amount: number
  percentage: number
  itemCount: number
}

export interface StockHealthSummary {
  healthyCount: number
  healthyPercent: number
  expiringCount: number
  expiringPercent: number
  lowStockCount: number
  lowStockPercent: number
  totalItems: number
}

export type AnalyticsRange = 'today' | '7d' | '30d' | 'custom'

export interface DashboardAnalyticsData {
  range: AnalyticsRange
  salesTrend: SalesTrendPoint[]
  companySales: CompanySalesItem[]
  stockHealth: StockHealthSummary
}

function splitCashCredit(s: { payment_type: string; grand_total: number; amount_paid: number }) {
  const cashAmt = s.payment_type === 'cash' ? s.grand_total : s.amount_paid
  const creditAmt = Math.max(0, s.grand_total - cashAmt)
  return { cashAmt, creditAmt }
}

function mapBuckets(bucketMap: Map<string, { cash: number; credit: number }>): SalesTrendPoint[] {
  return Array.from(bucketMap.entries()).map(([time, data]) => ({
    time,
    cash: Math.round(data.cash),
    credit: Math.round(data.credit),
    total: Math.round(data.cash + data.credit),
  }))
}

export async function getDashboardAnalytics(
  tenantId: string,
  range: AnalyticsRange = 'today',
  branchId?: string,
  fromDate?: string,
  toDate?: string,
): Promise<DashboardAnalyticsData> {
  const admin = await createDataClient()
  const now = new Date()

  let startDate = new Date()
  let endDate: Date | null = null

  if (range === 'today') {
    startDate.setHours(0, 0, 0, 0)
  } else if (range === '7d') {
    startDate.setDate(now.getDate() - 6)
    startDate.setHours(0, 0, 0, 0)
  } else if (range === '30d') {
    startDate.setDate(now.getDate() - 29)
    startDate.setHours(0, 0, 0, 0)
  } else {
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : new Date()
    startDate = from
    endDate = to
  }

  let salesQuery = admin
    .from('sales')
    .select('id, grand_total, amount_paid, payment_type, created_at, status')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })
  if (endDate) salesQuery = salesQuery.lte('created_at', endDate.toISOString())
  if (branchId) salesQuery = salesQuery.eq('branch_id', branchId)
  const { data: rawSales } = await salesQuery

  const { data: branchRows } = await admin
    .from('branches')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
  const branchIds = (branchId ? [branchId] : (branchRows ?? []).map((b) => b.id)).filter(Boolean)

  let itemsQuery = admin
    .from('sale_items')
    .select('line_total, quantity, batches(products(company_id, companies(id, name))), sales!inner(tenant_id, status, created_at, branch_id)')
    .eq('sales.tenant_id', tenantId)
    .eq('sales.status', 'completed')
    .gte('sales.created_at', startDate.toISOString())
  if (endDate) itemsQuery = itemsQuery.lte('sales.created_at', endDate.toISOString())
  if (branchId) itemsQuery = itemsQuery.eq('sales.branch_id', branchId)
  const { data: rawItems } = await itemsQuery

  const ninetyDaysFromNow = new Date()
  ninetyDaysFromNow.setDate(now.getDate() + 90)

  let batchQuery = admin
    .from('batches')
    .select('id, quantity_current, expiry_date, product_id, products(reorder_level)')
    .gt('quantity_current', 0)
  if (branchIds.length > 0) batchQuery = batchQuery.in('branch_id', branchIds)
  const { data: rawBatches } = branchIds.length > 0 ? await batchQuery : { data: [] as never[] }

  let salesTrend: SalesTrendPoint[] = []

  if (range === 'today') {
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
    const bucketMap = new Map<string, { cash: number; credit: number }>()
    hours.forEach((h) => bucketMap.set(h, { cash: 0, credit: 0 }))

    for (const s of rawSales ?? []) {
      const hourKey = `${String(new Date(s.created_at).getHours()).padStart(2, '0')}:00`
      if (!bucketMap.has(hourKey)) continue
      const { cashAmt, creditAmt } = splitCashCredit(s)
      const curr = bucketMap.get(hourKey)!
      bucketMap.set(hourKey, { cash: curr.cash + cashAmt, credit: curr.credit + creditAmt })
    }
    salesTrend = mapBuckets(bucketMap)
  } else if (range === '7d') {
    const bucketMap = new Map<string, { cash: number; credit: number }>()
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      bucketMap.set(d.toLocaleDateString('en-US', { weekday: 'short' }), { cash: 0, credit: 0 })
    }
    for (const s of rawSales ?? []) {
      const dayLabel = new Date(s.created_at).toLocaleDateString('en-US', { weekday: 'short' })
      if (!bucketMap.has(dayLabel)) continue
      const { cashAmt, creditAmt } = splitCashCredit(s)
      const curr = bucketMap.get(dayLabel)!
      bucketMap.set(dayLabel, { cash: curr.cash + cashAmt, credit: curr.credit + creditAmt })
    }
    salesTrend = mapBuckets(bucketMap)
  } else if (range === '30d') {
    const bucketMap = new Map<string, { cash: number; credit: number }>()
    for (let i = 29; i >= 0; i -= 3) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      const dateLabel = `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`
      bucketMap.set(dateLabel, { cash: 0, credit: 0 })
    }
    const bucketKeys = Array.from(bucketMap.keys())
    for (const s of rawSales ?? []) {
      const date = new Date(s.created_at)
      const dateLabel = `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'short' })}`
      const targetBucket = bucketKeys.find((k) => k === dateLabel) || bucketKeys[0]
      const { cashAmt, creditAmt } = splitCashCredit(s)
      const curr = bucketMap.get(targetBucket)!
      bucketMap.set(targetBucket, { cash: curr.cash + cashAmt, credit: curr.credit + creditAmt })
    }
    salesTrend = mapBuckets(bucketMap)
  } else {
    // Custom range — one bucket per calendar day
    const bucketMap = new Map<string, { cash: number; credit: number }>()
    const cursor = new Date(startDate)
    cursor.setHours(0, 0, 0, 0)
    const last = endDate ? new Date(endDate) : new Date()
    last.setHours(0, 0, 0, 0)
    while (cursor <= last) {
      const label = `${cursor.getDate()} ${cursor.toLocaleDateString('en-US', { month: 'short' })}`
      bucketMap.set(label, { cash: 0, credit: 0 })
      cursor.setDate(cursor.getDate() + 1)
    }
    for (const s of rawSales ?? []) {
      const date = new Date(s.created_at)
      const label = `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'short' })}`
      if (!bucketMap.has(label)) continue
      const { cashAmt, creditAmt } = splitCashCredit(s)
      const curr = bucketMap.get(label)!
      bucketMap.set(label, { cash: curr.cash + cashAmt, credit: curr.credit + creditAmt })
    }
    salesTrend = mapBuckets(bucketMap)
  }

  const companyMap = new Map<string, CompanySalesItem>()
  for (const item of rawItems ?? []) {
    const batch = Array.isArray(item.batches) ? item.batches[0] : item.batches
    const product = batch && (Array.isArray(batch.products) ? batch.products[0] : batch.products)
    const company = product && (Array.isArray(product.companies) ? product.companies[0] : product.companies)
    const id = company?.id ?? 'unknown'
    const name = company?.name ?? 'Unassigned'
    const current = companyMap.get(id) ?? { id, name, amount: 0, percentage: 0, itemCount: 0 }
    current.amount += Number(item.line_total) || 0
    current.itemCount += Number(item.quantity) || 0
    companyMap.set(id, current)
  }
  const companyTotal = [...companyMap.values()].reduce((sum, c) => sum + c.amount, 0)
  const companySales = [...companyMap.values()]
    .map((c) => ({
      ...c,
      amount: Math.round(c.amount),
      percentage: companyTotal > 0 ? Math.round((c.amount / companyTotal) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  let healthy = 0
  let expiring = 0
  let lowStock = 0
  const total = rawBatches?.length ?? 0
  for (const b of rawBatches ?? []) {
    const isExpiring = new Date(b.expiry_date) <= ninetyDaysFromNow
    const prod = Array.isArray(b.products) ? b.products[0] : b.products
    const reorderLevel = prod?.reorder_level ?? 10
    const isLow = b.quantity_current <= reorderLevel
    if (isLow) lowStock++
    else if (isExpiring) expiring++
    else healthy++
  }

  return {
    range,
    salesTrend,
    companySales,
    stockHealth: {
      healthyCount: healthy,
      healthyPercent: total ? Math.round((healthy / total) * 100) : 0,
      expiringCount: expiring,
      expiringPercent: total ? Math.round((expiring / total) * 100) : 0,
      lowStockCount: lowStock,
      lowStockPercent: total ? Math.round((lowStock / total) * 100) : 0,
      totalItems: total,
    },
  }
}
