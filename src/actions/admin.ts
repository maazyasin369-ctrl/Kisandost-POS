'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Tenant Management (Super Admin) ─────────────────────────────────────────

export async function getAllTenants() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('tenants')
    .select(`
      id, business_name, owner_name, phone, city, subscription_status, created_at,
      tenant_features(multi_branch, schemes, purchases, suppliers, reports)
    `)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getTenantFeatures(tenantId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('tenant_features')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()
  return data
}

export async function updateTenantFeature(
  tenantId: string,
  feature: 'multi_branch' | 'schemes' | 'purchases' | 'suppliers' | 'reports',
  value: boolean,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient()

  const { error } = await admin
    .from('tenant_features')
    .upsert({ tenant_id: tenantId, [feature]: value, updated_at: new Date().toISOString() })

  if (error) return { success: false, error: error.message }

  // Log to admin audit log
  await admin.from('admin_audit_log').insert({
    admin_id: adminId,
    tenant_id: tenantId,
    action: `TOGGLE_FEATURE: ${feature} → ${value}`,
    details: { feature, value },
  })

  revalidatePath('/tenants')
  return { success: true }
}

export async function updateSubscriptionStatus(
  tenantId: string,
  status: 'trial' | 'active' | 'suspended',
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient()

  const { error } = await admin
    .from('tenants')
    .update({ subscription_status: status, updated_at: new Date().toISOString() })
    .eq('id', tenantId)

  if (error) return { success: false, error: error.message }

  await admin.from('admin_audit_log').insert({
    admin_id: adminId,
    tenant_id: tenantId,
    action: `UPDATE_SUBSCRIPTION: ${status}`,
    details: { status },
  })

  revalidatePath('/tenants')
  return { success: true }
}

// ─── Pending Approval Requests ────────────────────────────────────────────────

export async function getPendingRequests() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('pending_requests')
    .select(`
      id, request_type, request_details, status, created_at, review_note, reviewed_at,
      tenants(business_name, city),
      profiles!pending_requests_requested_by_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function approveRequest(
  requestId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient()

  const { data: request } = await admin
    .from('pending_requests')
    .select('request_type, request_details, tenant_id, requested_by')
    .eq('id', requestId)
    .single()

  if (!request) return { success: false, error: 'Request not found' }

  // Auto-execute the underlying change on approval
  if (request.request_type === 'enable_module') {
    const feature = request.request_details.feature as string
    await admin
      .from('tenant_features')
      .upsert({ tenant_id: request.tenant_id, [feature]: true, updated_at: new Date().toISOString() })
  } else if (request.request_type === 'new_branch') {
    const { name, address, phone } = request.request_details
    await admin.from('branches').insert({
      tenant_id: request.tenant_id,
      name,
      address,
      phone,
      is_active: true,
    })
    // Enable multi_branch feature
    await admin
      .from('tenant_features')
      .upsert({ tenant_id: request.tenant_id, multi_branch: true, updated_at: new Date().toISOString() })
  } else if (request.request_type === 'new_staff') {
    // Activate the user account
    const userId = request.request_details.user_id
    if (userId) {
      await admin.from('profiles').update({ is_active: true }).eq('id', userId)
    }
  }

  // Mark request as approved
  const { error } = await admin
    .from('pending_requests')
    .update({
      status: 'approved',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) return { success: false, error: error.message }

  await admin.from('admin_audit_log').insert({
    admin_id: adminId,
    tenant_id: request.tenant_id,
    action: `APPROVED_REQUEST: ${request.request_type}`,
    details: request.request_details,
  })

  revalidatePath('/tenants')
  return { success: true }
}

export async function rejectRequest(
  requestId: string,
  adminId: string,
  note: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient()

  const { data: request } = await admin
    .from('pending_requests')
    .select('request_type, tenant_id')
    .eq('id', requestId)
    .single()

  if (!request) return { success: false, error: 'Request not found' }

  const { error } = await admin
    .from('pending_requests')
    .update({
      status: 'rejected',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      review_note: note,
    })
    .eq('id', requestId)

  if (error) return { success: false, error: error.message }

  await admin.from('admin_audit_log').insert({
    admin_id: adminId,
    tenant_id: request.tenant_id,
    action: `REJECTED_REQUEST: ${request.request_type}`,
    details: { note },
  })

  revalidatePath('/tenants')
  return { success: true }
}

export async function getAdminAuditLog(limit = 50) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('admin_audit_log')
    .select(`
      id, action, details, created_at,
      tenants(business_name),
      profiles(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}
