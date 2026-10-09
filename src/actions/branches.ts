'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function shopContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) return null
  const { data: features } = await supabase
    .from('tenant_features')
    .select('multi_branch')
    .eq('tenant_id', profile.tenant_id)
    .maybeSingle()
  return { supabase, profile, multiBranch: features?.multi_branch === true }
}

export async function getBranchLocations() {
  const ctx = await shopContext()
  if (!ctx) return { error: 'Sign in to continue.' as const }
  if (!ctx.multiBranch) return { error: 'disabled' as const }

  const { data } = await ctx.supabase
    .from('branches')
    .select('id, name, address, phone, is_active')
    .eq('tenant_id', ctx.profile.tenant_id)
    .order('name')

  return { branches: data ?? [] }
}

export async function addBranch(input: { name: string; address: string; phone: string }) {
  const ctx = await shopContext()
  if (!ctx) return { error: 'Sign in to continue.' }
  if (!ctx.multiBranch) return { error: 'Multi-branch is not enabled for this shop.' }

  const name = input.name.trim()
  const address = input.address.trim()
  const phone = input.phone.trim()
  if (!name || !address) return { error: 'Outlet name and address are required.' }

  const { error } = await ctx.supabase.from('branches').insert({
    tenant_id: ctx.profile.tenant_id,
    name,
    address,
    phone,
    is_active: true,
  })
  if (error) return { error: error.message }

  revalidatePath('/branches')
  revalidatePath('/transfers')
  return { success: true }
}
