'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getSession() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getCurrentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, tenant_id, full_name, phone, role, is_active')
    .eq('id', user.id)
    .single()

  return profile
}

export async function getTenantContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, tenant_id, full_name, phone, role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const { data: tenant } = await admin
    .from('tenants')
    .select('id, business_name, owner_name, phone, city, dealer_license_number, subscription_status, settings')
    .eq('id', profile.tenant_id)
    .single()

  const { data: features } = await admin
    .from('tenant_features')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .single()

  return { profile, tenant, features }
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function demoLogin() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: 'owner@kisandost.pk',
    password: 'KisanDost@2026!',
  })
  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const businessName = formData.get('business_name') as string
  const phone = formData.get('phone') as string
  const city = formData.get('city') as string

  const supabase = await createClient()
  const admin = createAdminClient()

  // 1. Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError || !authData.user) {
    return { error: authError?.message || 'Signup failed' }
  }

  const userId = authData.user.id

  // 2. Create the tenant record
  const { data: tenant, error: tenantError } = await admin
    .from('tenants')
    .insert({
      business_name: businessName,
      owner_name: fullName,
      phone,
      city,
      subscription_status: 'trial',
      settings: { branch_mode: 'independent' },
    })
    .select('id')
    .single()

  if (tenantError || !tenant) {
    return { error: 'Could not create tenant record' }
  }

  // 3. Create the owner profile
  await admin.from('profiles').insert({
    id: userId,
    tenant_id: tenant.id,
    full_name: fullName,
    phone,
    role: 'owner',
    is_active: true,
  })

  // 4. Create default tenant features (single-branch to start)
  await admin.from('tenant_features').insert({
    tenant_id: tenant.id,
    multi_branch: false,
    schemes: true,
    purchases: true,
    suppliers: true,
    reports: true,
  })

  // 5. Create a default branch
  await admin.from('branches').insert({
    tenant_id: tenant.id,
    name: `${businessName} - Main Branch`,
    address: city,
    phone,
    is_active: true,
  })

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
