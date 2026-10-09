'use server'

import { revalidatePath } from 'next/cache'
import { createDataClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function getShopReportContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) return null

  const [{ data: features }, { data: branches }] = await Promise.all([
    supabase
      .from('tenant_features')
      .select('multi_branch')
      .eq('tenant_id', profile.tenant_id)
      .maybeSingle(),
    supabase
      .from('branches')
      .select('id, name')
      .eq('tenant_id', profile.tenant_id)
      .eq('is_active', true)
      .order('name'),
  ])

  return {
    tenantId: profile.tenant_id,
    multiBranch: features?.multi_branch === true,
    branches: branches ?? [],
  }
}

async function resolveTenantId(requested?: string) {
  const ctx = await getShopReportContext()
  return ctx?.tenantId ?? requested ?? null
}

export interface DayClosingInput {
  tenantId: string
  branchId: string
  closedBy: string
  closingDate: string
  openingCash: number
  closingCashActual: number
}

export async function getDayClosings(tenantId?: string, branchId?: string) {
  const supabase = await createDataClient()
  const resolvedTenant = await resolveTenantId(tenantId)
  if (!resolvedTenant) return []

  let query = supabase
    .from('day_closings')
    .select(`
      id, closing_date, opening_cash, total_cash_sales, total_credit_sales,
      total_payments_received, closing_cash_expected, closing_cash_actual,
      difference, notes, created_at,
      branches(name),
      profiles(full_name)
    `)
    .eq('tenant_id', resolvedTenant)
    .order('closing_date', { ascending: false })
    .limit(30)

  if (branchId) query = query.eq('branch_id', branchId)

  const { data } = await query
  return data ?? []
}

export async function closeDayAction(input: DayClosingInput): Promise<{ success: boolean; error?: string; closing?: unknown }> {
  const supabase = await createDataClient()
  const ctx = await getShopReportContext()
  if (!ctx) return { success: false, error: 'Sign in to close the day.' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sign in to close the day.' }

  const todayStart = new Date(input.closingDate)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(input.closingDate)
  todayEnd.setHours(23, 59, 59, 999)

  const validTenantId = ctx.tenantId
  const validBranchId = input.branchId || ctx.branches[0]?.id
  if (!validBranchId) return { success: false, error: 'No active outlet found for this shop.' }
  const validClosedBy = user.id

  // Check if already closed for this date
  const { data: existingClosing } = await supabase
    .from('day_closings')
    .select('id')
    .eq('branch_id', validBranchId)
    .eq('closing_date', input.closingDate)
    .maybeSingle()

  if (existingClosing) {
    return { success: false, error: 'Day closing already exists for this date and branch.' }
  }

  // Aggregate today's sales for this branch
  const { data: todaySales } = await supabase
    .from('sales')
    .select('grand_total, payment_type, amount_paid')
    .eq('tenant_id', validTenantId)
    .eq('branch_id', validBranchId)
    .eq('status', 'completed')
    .gte('created_at', todayStart.toISOString())
    .lte('created_at', todayEnd.toISOString())

  const totalCashSales = (todaySales ?? [])
    .filter(s => s.payment_type === 'cash')
    .reduce((sum, s) => sum + s.grand_total, 0)

  const totalCreditSales = (todaySales ?? [])
    .filter(s => s.payment_type !== 'cash')
    .reduce((sum, s) => sum + (s.grand_total - s.amount_paid), 0)

  // Aggregate today's payments received for this tenant
  const { data: todayPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('tenant_id', validTenantId)
    .gte('created_at', todayStart.toISOString())
    .lte('created_at', todayEnd.toISOString())

  const totalPaymentsReceived = (todayPayments ?? []).reduce((sum, p) => sum + p.amount, 0)

  const closingCashExpected = input.openingCash + totalCashSales + totalPaymentsReceived
  const difference = input.closingCashActual - closingCashExpected

  const { data: closing, error } = await supabase
    .from('day_closings')
    .insert({
      tenant_id: validTenantId,
      branch_id: validBranchId,
      closing_date: input.closingDate,
      opening_cash: input.openingCash,
      total_cash_sales: totalCashSales,
      total_credit_sales: totalCreditSales,
      total_payments_received: totalPaymentsReceived,
      closing_cash_expected: closingCashExpected,
      closing_cash_actual: input.closingCashActual,
      difference,
      closed_by: validClosedBy,
      notes: null,
    })
    .select('*')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/reports/day-closing')
  revalidatePath('/dashboard')
  revalidatePath('/reports/sales-history')
  revalidatePath('/reports/daily')

  return { success: true, closing }
}

export async function getDailyReport(tenantId: string | undefined, date: string, branchId?: string) {
  const supabase = await createDataClient()
  const resolvedTenant = await resolveTenantId(tenantId)
  if (!resolvedTenant) {
    return {
      sales: [],
      totalRevenue: 0,
      cashRevenue: 0,
      creditRevenue: 0,
      totalDiscounts: 0,
      transactionCount: 0,
      topProducts: [],
    }
  }

  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  let query = supabase
    .from('sales')
    .select(`
      id, sale_number, payment_type, subtotal, grand_total, amount_paid, discount_total, status, created_at,
      customers(name),
      profiles(full_name),
      sale_items(product_name_snapshot, quantity, unit_price, line_total)
    `)
    .eq('tenant_id', resolvedTenant)
    .eq('status', 'completed')
    .gte('created_at', dayStart.toISOString())
    .lte('created_at', dayEnd.toISOString())
    .order('created_at', { ascending: false })

  if (branchId) query = query.eq('branch_id', branchId)

  const { data: sales, error } = await query
  if (error) console.error('getDailyReport error:', error)

  const totalRevenue = (sales ?? []).reduce((s, sale) => s + sale.grand_total, 0)
  const cashRevenue = (sales ?? []).filter(s => s.payment_type === 'cash').reduce((s, sale) => s + sale.grand_total, 0)
  const creditRevenue = (sales ?? []).filter(s => s.payment_type !== 'cash').reduce((s, sale) => s + (sale.grand_total - sale.amount_paid), 0)
  const totalDiscounts = (sales ?? []).reduce((s, sale) => s + sale.discount_total, 0)

  // Top products by revenue
  const productMap = new Map<string, { name: string; qty: number; revenue: number }>()
  for (const sale of (sales ?? [])) {
    for (const item of (sale.sale_items ?? [])) {
      const existing = productMap.get(item.product_name_snapshot) ?? { name: item.product_name_snapshot, qty: 0, revenue: 0 }
      productMap.set(item.product_name_snapshot, {
        name: item.product_name_snapshot,
        qty: existing.qty + item.quantity,
        revenue: existing.revenue + item.line_total,
      })
    }
  }

  const topProducts = [...productMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return {
    sales: sales ?? [],
    totalRevenue,
    cashRevenue,
    creditRevenue,
    totalDiscounts,
    transactionCount: (sales ?? []).length,
    topProducts,
  }
}

export async function getMonthlyReport(tenantId: string | undefined, year: number, month: number, branchId?: string) {
  const supabase = await createDataClient()
  const resolvedTenant = await resolveTenantId(tenantId)
  if (!resolvedTenant) {
    return {
      totalRevenue: 0,
      transactionCount: 0,
      companyBreakdown: [],
      dailyData: [],
      cashRevenue: 0,
      creditRevenue: 0,
    }
  }

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

  let query = supabase
    .from('sales')
    .select(`
      id, grand_total, payment_type, amount_paid, created_at,
      sale_items(product_name_snapshot, line_total, batches(cost_price, product_id, products(company_id, companies(id, name))))
    `)
    .eq('tenant_id', resolvedTenant)
    .eq('status', 'completed')
    .gte('created_at', monthStart.toISOString())
    .lte('created_at', monthEnd.toISOString())

  if (branchId) query = query.eq('branch_id', branchId)

  const { data: sales, error } = await query
  if (error) console.error('getMonthlyReport error:', error)

  const totalRevenue = (sales ?? []).reduce((s, sale) => s + sale.grand_total, 0)
  const cashRevenue = (sales ?? []).filter((s) => s.payment_type === 'cash').reduce((s, sale) => s + sale.grand_total, 0)
  const creditRevenue = (sales ?? [])
    .filter((s) => s.payment_type !== 'cash')
    .reduce((s, sale) => s + (sale.grand_total - sale.amount_paid), 0)

  const companyMap = new Map<string, { name: string; revenue: number }>()
  for (const sale of sales ?? []) {
    for (const item of sale.sale_items ?? []) {
      const batch = Array.isArray(item.batches) ? item.batches[0] : item.batches
      const product = batch && (Array.isArray(batch.products) ? batch.products[0] : batch.products)
      const company = product && (Array.isArray(product.companies) ? product.companies[0] : product.companies)
      const companyName = company?.name ?? 'Unassigned'
      const existing = companyMap.get(companyName) ?? { name: companyName, revenue: 0 }
      companyMap.set(companyName, { name: companyName, revenue: existing.revenue + Number(item.line_total) })
    }
  }

  const dailyTrend: Record<string, number> = {}
  for (const sale of sales ?? []) {
    const day = new Date(sale.created_at).getDate().toString()
    dailyTrend[day] = (dailyTrend[day] ?? 0) + sale.grand_total
  }

  const dailyData = Object.entries(dailyTrend)
    .map(([day, revenue]) => ({ day: parseInt(day), revenue }))
    .sort((a, b) => a.day - b.day)

  return {
    totalRevenue,
    cashRevenue,
    creditRevenue,
    transactionCount: (sales ?? []).length,
    companyBreakdown: [...companyMap.values()].sort((a, b) => b.revenue - a.revenue),
    dailyData,
  }
}

