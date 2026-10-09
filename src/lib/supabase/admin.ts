import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

function hasRealServiceRoleKey() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  return Boolean(serviceKey && !serviceKey.includes('your-service-role'))
}

function resolveAdminKey() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()

  if (serviceKey && !serviceKey.includes('your-service-role')) {
    return serviceKey
  }

  // Fallback keeps local/dev usable until the real service role key is set.
  // With RLS on, prefer createDataClient() so the signed-in session is used.
  return anonKey || publishableKey || ''
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = resolveAdminKey()

  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in environment variables')
  }

  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/**
 * Use for tenant-scoped shop reads/writes.
 * With a real service role key: bypasses RLS.
 * Without it: uses the signed-in session so RLS policies apply.
 */
export async function createDataClient() {
  if (hasRealServiceRoleKey()) {
    return createAdminClient()
  }
  return createServerClient()
}
