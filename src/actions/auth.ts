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

  // Use the signed-in session so RLS policies (auth.uid()) apply.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, full_name, phone, role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  return profile
}

export async function getTenantContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, full_name, phone, role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) return null

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, business_name, owner_name, phone, city, dealer_license_number, subscription_status, settings')
    .eq('id', profile.tenant_id)
    .single()

  const { data: features } = await supabase
    .from('tenant_features')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .single()

  return { profile, tenant, features }
}

function mapAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password. Please check your login details.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.'
  }
  return message
}

function hasRealServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  return Boolean(key && !key.includes('your-service-role'))
}

export async function loginWithCredentials(identifier: string, password: string) {
  const raw = identifier.trim()
  if (!raw || !password) {
    return { error: 'Please enter your email and password.' }
  }

  // Supabase Auth signs in with email. Username handles are not stored in auth.users.
  const email = raw.includes('@') ? raw.toLowerCase() : null
  if (!email) {
    return {
      error: 'Please sign in with your email address (e.g. owner@kisandost.pk).',
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { error: mapAuthError(error.message) }
  }

  if (!data.user) {
    return { error: 'Authentication failed. Please try again.' }
  }

  // Read with the authenticated session client. Do not use the admin/anon
  // fallback here — RLS is enabled and only auth.uid() can see the profile.
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, tenant_id, is_active')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profileError) {
    await supabase.auth.signOut()
    return { error: 'Could not load your shop profile. Please try again.' }
  }

  if (!profile) {
    await supabase.auth.signOut()
    return {
      error: 'Account exists in Auth but has no shop profile. Contact Super Admin to activate your shop.',
    }
  }

  if (!profile.is_active) {
    await supabase.auth.signOut()
    return { error: 'Your shop owner login has been disabled by Super Admin.' }
  }

  redirect('/dashboard')
}

export async function login(formData: FormData) {
  const email = (formData.get('email') || formData.get('identifier')) as string
  const password = formData.get('password') as string
  return loginWithCredentials(email, password)
}

export async function demoLogin() {
  return loginWithCredentials('owner@kisandost.pk', 'KisanDost@2026!')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const businessName = formData.get('business_name') as string
  const phone = formData.get('phone') as string
  const city = formData.get('city') as string

  const supabase = await createClient()

  // 1. Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError || !authData.user) {
    return { error: authError?.message || 'Signup failed' }
  }

  const userId = authData.user.id

  // Prefer service-role for bootstrap inserts under RLS.
  // Without it, signup inserts will fail once RLS blocks anon writes.
  const writer = hasRealServiceRoleKey() ? createAdminClient() : supabase

  // 2. Create the tenant record
  const { data: tenant, error: tenantError } = await writer
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
    return { error: tenantError?.message || 'Could not create tenant record' }
  }

  // 3. Create the owner profile
  const { error: profileInsertError } = await writer.from('profiles').insert({
    id: userId,
    tenant_id: tenant.id,
    full_name: fullName,
    phone,
    role: 'owner',
    is_active: true,
  })

  if (profileInsertError) {
    return { error: profileInsertError.message || 'Could not create shop profile' }
  }

  // 4. Create default tenant features (single-branch to start)
  await writer.from('tenant_features').insert({
    tenant_id: tenant.id,
    multi_branch: false,
    schemes: true,
    purchases: true,
    suppliers: true,
    reports: true,
  })

  // 5. Create a default branch
  await writer.from('branches').insert({
    tenant_id: tenant.id,
    name: `${businessName} - Main Branch`,
    address: city,
    phone,
    is_active: true,
  })

  redirect('/dashboard')
}

export async function getShopChrome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, tenant_id')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) return null

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, business_name, owner_name, dealer_license_number')
    .eq('id', profile.tenant_id)
    .maybeSingle()

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
    ownerName: profile.full_name,
    role: profile.role,
    businessName: tenant?.business_name ?? 'Shop',
    license: tenant?.dealer_license_number ?? '',
    multiBranch: features?.multi_branch === true,
    branches: branches ?? [],
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
