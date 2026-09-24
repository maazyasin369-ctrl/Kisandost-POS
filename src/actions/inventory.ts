'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ─── Suppliers ────────────────────────────────────────────────────────────────

export async function getSuppliers(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('suppliers')
    .select('id, name, contact_person, phone, address')
    .eq('tenant_id', tenantId)
    .order('name')
  return data ?? []
}

export async function createSupplier(input: {
  tenantId: string
  name: string
  contactPerson?: string
  phone: string
  address?: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      tenant_id: input.tenantId,
      name: input.name,
      contact_person: input.contactPerson,
      phone: input.phone,
      address: input.address,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/suppliers')
  return { id: data.id }
}

// ─── Purchases ────────────────────────────────────────────────────────────────

export async function getPurchases(tenantId: string, branchId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('purchases')
    .select(`
      id, purchase_number, status, total_amount, created_at,
      suppliers(name),
      branches(name)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (branchId) query = query.eq('branch_id', branchId)

  const { data } = await query
  return data ?? []
}

export async function createPurchase(input: {
  tenantId: string
  branchId: string
  supplierId: string
  items: {
    productId: string
    batchNumber: string
    expiryDate: string
    quantityOrdered: number
    costPrice: number
  }[]
}) {
  const supabase = await createClient()

  // Generate purchase number
  const { count } = await supabase
    .from('purchases')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', input.tenantId)

  const purchaseNumber = `PO-${String((count ?? 0) + 1).padStart(4, '0')}`
  const totalAmount = input.items.reduce((s, i) => s + i.costPrice * i.quantityOrdered, 0)

  const { data: purchase, error } = await supabase
    .from('purchases')
    .insert({
      tenant_id: input.tenantId,
      branch_id: input.branchId,
      supplier_id: input.supplierId,
      purchase_number: purchaseNumber,
      status: 'ordered',
      total_amount: totalAmount,
    })
    .select('id')
    .single()

  if (error || !purchase) return { error: error?.message }

  // Insert purchase items
  await supabase.from('purchase_items').insert(
    input.items.map(item => ({
      purchase_id: purchase.id,
      product_id: item.productId,
      batch_number: item.batchNumber,
      expiry_date: item.expiryDate,
      quantity_ordered: item.quantityOrdered,
      quantity_received: 0,
      cost_price: item.costPrice,
    }))
  )

  // Update supplier ledger
  const { data: lastEntry } = await supabase
    .from('supplier_ledger')
    .select('running_balance')
    .eq('supplier_id', input.supplierId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const prevBalance = lastEntry?.running_balance ?? 0
  await supabase.from('supplier_ledger').insert({
    tenant_id: input.tenantId,
    supplier_id: input.supplierId,
    purchase_id: purchase.id,
    type: 'purchase',
    amount: totalAmount,
    running_balance: prevBalance + totalAmount,
  })

  revalidatePath('/purchases')
  revalidatePath('/suppliers')
  return { id: purchase.id, purchaseNumber }
}

export async function receivePurchase(purchaseId: string, branchId: string) {
  const supabase = await createClient()

  // Get purchase items
  const { data: items } = await supabase
    .from('purchase_items')
    .select('id, product_id, batch_number, expiry_date, quantity_ordered, cost_price')
    .eq('purchase_id', purchaseId)

  if (!items?.length) return { error: 'No items found' }

  // For each item: create/update a batch with sale_price auto-set at cost+20%
  for (const item of items) {
    const salePrice = Math.round(item.cost_price * 1.2) // default 20% margin

    const { data: existingBatch } = await supabase
      .from('batches')
      .select('id, quantity_current')
      .eq('product_id', item.product_id)
      .eq('branch_id', branchId)
      .eq('batch_number', item.batch_number)
      .single()

    if (existingBatch) {
      await supabase
        .from('batches')
        .update({
          quantity_current: existingBatch.quantity_current + item.quantity_ordered,
          quantity_received: item.quantity_ordered,
        })
        .eq('id', existingBatch.id)
    } else {
      await supabase.from('batches').insert({
        product_id: item.product_id,
        branch_id: branchId,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
        cost_price: item.cost_price,
        sale_price: salePrice,
        quantity_received: item.quantity_ordered,
        quantity_current: item.quantity_ordered,
      })
    }

    // Mark item as received
    await supabase
      .from('purchase_items')
      .update({ quantity_received: item.quantity_ordered })
      .eq('id', item.id)
  }

  // Update purchase status
  await supabase
    .from('purchases')
    .update({ status: 'received' })
    .eq('id', purchaseId)

  revalidatePath('/purchases')
  revalidatePath('/inventory')
  return { success: true }
}

// ─── Stock Transfers ──────────────────────────────────────────────────────────

export async function getStockTransfers(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('stock_transfers')
    .select(`
      id, status, created_at, received_at,
      from_branch:from_branch_id(name),
      to_branch:to_branch_id(name),
      requester:requested_by(full_name)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createStockTransfer(input: {
  tenantId: string
  fromBranchId: string
  toBranchId: string
  requestedBy: string
  items: { batchId: string; quantity: number }[]
}) {
  const supabase = await createClient()

  const { data: transfer, error } = await supabase
    .from('stock_transfers')
    .insert({
      tenant_id: input.tenantId,
      from_branch_id: input.fromBranchId,
      to_branch_id: input.toBranchId,
      requested_by: input.requestedBy,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error || !transfer) return { error: error?.message }

  await supabase.from('stock_transfer_items').insert(
    input.items.map(i => ({
      transfer_id: transfer.id,
      batch_id: i.batchId,
      quantity: i.quantity,
    }))
  )

  revalidatePath('/transfers')
  return { id: transfer.id }
}

export async function approveStockTransfer(transferId: string, receivedBy: string) {
  const supabase = await createClient()

  const { data: transfer } = await supabase
    .from('stock_transfers')
    .select('from_branch_id, to_branch_id, tenant_id')
    .eq('id', transferId)
    .single()

  if (!transfer) return { error: 'Transfer not found' }

  const { data: items } = await supabase
    .from('stock_transfer_items')
    .select('batch_id, quantity')
    .eq('transfer_id', transferId)

  if (!items?.length) return { error: 'No items found' }

  for (const item of items) {
    // Deduct from source batch
    const { data: sourceBatch } = await supabase
      .from('batches')
      .select('quantity_current, product_id, expiry_date, cost_price, sale_price, batch_number, manufacture_date')
      .eq('id', item.batch_id)
      .single()

    if (!sourceBatch) continue

    await supabase
      .from('batches')
      .update({ quantity_current: sourceBatch.quantity_current - item.quantity })
      .eq('id', item.batch_id)

    // Add to destination branch (check if batch already exists there)
    const { data: destBatch } = await supabase
      .from('batches')
      .select('id, quantity_current')
      .eq('product_id', sourceBatch.product_id)
      .eq('branch_id', transfer.to_branch_id)
      .eq('batch_number', sourceBatch.batch_number)
      .single()

    if (destBatch) {
      await supabase
        .from('batches')
        .update({ quantity_current: destBatch.quantity_current + item.quantity })
        .eq('id', destBatch.id)
    } else {
      await supabase.from('batches').insert({
        product_id: sourceBatch.product_id,
        branch_id: transfer.to_branch_id,
        batch_number: sourceBatch.batch_number,
        expiry_date: sourceBatch.expiry_date,
        manufacture_date: sourceBatch.manufacture_date,
        cost_price: sourceBatch.cost_price,
        sale_price: sourceBatch.sale_price,
        quantity_received: item.quantity,
        quantity_current: item.quantity,
      })
    }
  }

  await supabase
    .from('stock_transfers')
    .update({
      status: 'received',
      received_by: receivedBy,
      received_at: new Date().toISOString(),
    })
    .eq('id', transferId)

  revalidatePath('/transfers')
  revalidatePath('/inventory')
  return { success: true }
}
