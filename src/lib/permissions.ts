import { Role, TenantFeatures } from './types'

export interface UserSessionContext {
  userId: string
  tenantId: string
  role: Role
  branchId?: string
  features: TenantFeatures
}

// Centralized Role Hierarchy & Action Permissions (Section 10 & Section 13)
export function canPerformAction(role: Role, action: string): boolean {
  if (role === 'super_admin') return true

  switch (action) {
    // POS / Counter Sales
    case 'create_sale':
    case 'view_stock':
    case 'view_customer_balance':
    case 'print_receipt':
      return ['owner', 'branch_manager', 'salesman'].includes(role)

    // Manager / Owner Elevated Actions
    case 'edit_prices':
    case 'view_cost_prices':
    case 'view_profit_margins':
    case 'approve_return':
    case 'void_sale':
    case 'manage_purchases':
    case 'manage_suppliers':
    case 'manage_transfers':
    case 'close_day':
      return ['owner', 'branch_manager'].includes(role)

    // Tenant Owner Only Actions
    case 'manage_branches':
    case 'manage_staff':
    case 'view_consolidated_reports':
    case 'manage_tenant_settings':
      return role === 'owner'

    default:
      return false
  }
}

// Server-side Feature Guard (Section 13.1)
export function isFeatureEnabled(features: TenantFeatures | undefined | null, featureKey: keyof Omit<TenantFeatures, 'tenant_id' | 'updated_at'>): boolean {
  if (!features) return true // Default enable if not configured
  return Boolean(features[featureKey])
}
