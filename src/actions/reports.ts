'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export interface DayClosingInput {
  tenantId: string
  branchId: string
  closedBy: string
  closingDate: string
  openingCash: number
  closingCashActual: number
}

export async function getDayClosings(tenantId: string, branchId?: string) {
  const supabase = createAdminClient()
  let query = supabase
    .from('day_closings')
    .select(`
      id, closing_date, opening_cash, total_cash_sales, total_credit_sales,
      total_payments_received, closing_cash_expected, closing_cash_actual,
      difference, notes, created_at,
      branches(name),
      profiles(full_name)
    `)
    .order('closing_date', { ascending: false })
    .limit(30)

  if (tenantId) query = query.eq('tenant_id', tenantId)
  if (branchId) query = query.eq('branch_id', branchId)

  const { data } = await query
  return data ?? []
}

export async function closeDayAction(input: DayClosingInput): Promise<{ success: boolean; error?: string; closing?: unknown }> {
  const supabase = createAdminClient()

  const todayStart = new Date(input.closingDate)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(input.closingDate)
  todayEnd.setHours(23, 59, 59, 999)

  const validTenantId = input.tenantId || '11111111-1111-1111-1111-111111111111'
  const validBranchId = input.branchId || '22222222-2222-2222-2222-222222222222'
  const validClosedBy = input.closedBy || 'edb3eddc-3806-444c-9cfb-4291bb7d4124'

  // Check if already closed for this date
  const { data: existingClosing } = await supabase
    .from('day_closings')
    .select('id')
    .eq('branch_id', validBranchId)
    .eq('closing_date', input.closingDate)
    .single()

  if (existingClosing) {
    return { success: false, error: 'Day closing already exists for this date and branch.' }
  }

  // Aggregate today's sales for this branch
  const { data: todaySales } = await supabase
    .from('sales')
    .select('grand_total, payment_type, amount_paid')
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

  // Aggregate today's payments received
  const { data: todayPayments } = await supabase
    .from('payments')
    .select('amount')
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
    })
    .select('*')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/reports/day-closing')
  revalidatePath('/dashboard')

  return { success: true, closing }
}

export async function getDailyReport(tenantId: string, date: string, branchId?: string) {
  const supabase = createAdminClient()

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
    .eq('status', 'completed')
    .gte('created_at', dayStart.toISOString())
    .lte('created_at', dayEnd.toISOString())
    .order('created_at', { ascending: false })

  if (tenantId) query = query.eq('tenant_id', tenantId)
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

export async function getMonthlyReport(tenantId: string, year: number, month: number, branchId?: string) {
  const supabase = createAdminClient()

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

  let query = supabase
    .from('sales')
    .select(`
      id, grand_total, payment_type, amount_paid, created_at,
      sale_items(product_name_snapshot, line_total, batches(cost_price, product_id, products(company_id, companies(name))))
    `)
    .eq('status', 'completed')
    .gte('created_at', monthStart.toISOString())
    .lte('created_at', monthEnd.toISOString())

  if (tenantId) query = query.eq('tenant_id', tenantId)
  if (branchId) query = query.eq('branch_id', branchId)

  const { data: sales, error } = await query
  if (error) console.error('getMonthlyReport error:', error)

  const totalRevenue = (sales ?? []).reduce((s, sale) => s + sale.grand_total, 0)

  // Company-wise breakdown
  const companyMap = new Map<string, { name: string; revenue: number }>()
  for (const sale of (sales ?? [])) {
    const items = (sale as unknown as { sale_items: Array<{ line_total: number; batches?: { products?: { companies?: { name?: string } } } }> }).sale_items
    for (const item of (items ?? [])) {
      const companyName = item.batches?.products?.companies?.name ?? 'Unknown'
      const existing = companyMap.get(companyName) ?? { name: companyName, revenue: 0 }
      companyMap.set(companyName, { name: companyName, revenue: existing.revenue + item.line_total })
    }
  }

  // Daily trend for recharts
  const dailyTrend: Record<string, number> = {}
  for (const sale of (sales ?? [])) {
    const day = new Date(sale.created_at).getDate().toString()
    dailyTrend[day] = (dailyTrend[day] ?? 0) + sale.grand_total
  }

  const dailyData = Object.entries(dailyTrend)
    .map(([day, revenue]) => ({ day: parseInt(day), revenue }))
    .sort((a, b) => a.day - b.day)

  return {
    totalRevenue,
    transactionCount: (sales ?? []).length,
    companyBreakdown: [...companyMap.values()].sort((a, b) => b.revenue - a.revenue),
    dailyData,
  }
}

