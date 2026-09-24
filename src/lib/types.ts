// Database Types for Pesticide Shop Management SaaS

export type Role = 'super_admin' | 'owner' | 'branch_manager' | 'salesman';
export type SubscriptionStatus = 'trial' | 'active' | 'suspended';
export type BranchMode = 'independent' | 'consolidated' | 'hybrid';
export type FormulationType = 'EC' | 'WP' | 'SL' | 'SC' | 'granules' | 'powder' | 'other';
export type PackUnit = 'ml' | 'L' | 'g' | 'kg';
export type PaymentType = 'cash' | 'credit' | 'partial';
export type TransferStatus = 'pending' | 'in_transit' | 'received' | 'cancelled';
export type LedgerType = 'sale_credit' | 'payment' | 'adjustment';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'other';

export interface Tenant {
  id: string;
  business_name: string;
  owner_name: string;
  phone: string;
  city: string;
  dealer_license_number: string;
  license_expiry_date: string;
  subscription_status: SubscriptionStatus;
  settings: {
    branch_mode: BranchMode;
    features?: Record<string, boolean>;
  };
  created_at: string;
}

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  address: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  full_name: string;
  phone: string;
  role: Role;
  branch_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  tenant_id: string;
  name: string;
  contact_person: string;
  phone: string;
  notes?: string;
  is_active?: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  company_id: string;
  company_name?: string;
  name: string;
  active_ingredient: string;
  formulation_type: FormulationType;
  pack_size: number;
  pack_unit: PackUnit;
  crop_tags: string[];
  pest_tags: string[];
  reorder_level: number;
  created_at: string;
}

export interface Batch {
  id: string;
  product_id: string;
  branch_id: string;
  batch_number: string;
  manufacture_date?: string;
  expiry_date: string;
  cost_price: number;
  sale_price: number;
  quantity_received: number;
  quantity_current: number;
  created_at: string;
  product_name?: string;
  company_name?: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  branch_id: string;
  name: string;
  phone: string;
  address: string;
  land_size?: number;
  crop_type?: string;
  credit_limit: number;
  current_balance?: number;
  is_active: boolean;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  batch_id: string;
  product_name_snapshot: string;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
  batch_number?: string;
  expiry_date?: string;
}

export interface Sale {
  id: string;
  tenant_id: string;
  branch_id: string;
  branch_name?: string;
  sale_number: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  sold_by: string;
  sold_by_name?: string;
  payment_type: PaymentType;
  subtotal: number;
  discount_total: number;
  grand_total: number;
  amount_paid: number;
  remaining_balance?: number;
  status: 'completed' | 'void' | 'returned';
  return_reason?: string;
  items?: SaleItem[];
  created_at: string;
}

export interface CreditLedgerEntry {
  id: string;
  tenant_id: string;
  customer_id: string;
  customer_name?: string;
  sale_id?: string;
  sale_number?: string;
  type: LedgerType;
  amount: number;
  running_balance: number;
  note?: string;
  created_at: string;
}

export type SupplierLedgerType = 'purchase' | 'payment' | 'adjustment';

export interface SupplierLedgerEntry {
  id: string;
  tenant_id: string;
  supplier_id: string;
  supplier_name?: string;
  purchase_id?: string;
  purchase_number?: string;
  type: SupplierLedgerType;
  amount: number;
  payment_method?: string;
  note?: string;
  running_balance: number;
  created_at: string;
}

export interface Supplier {
  id: string;
  tenant_id: string;
  name: string;
  contact_person: string;
  phone: string;
  address: string;
  current_balance?: number;
  created_at: string;
}

export interface StockTransfer {
  id: string;
  tenant_id: string;
  from_branch_id: string;
  from_branch_name?: string;
  to_branch_id: string;
  to_branch_name?: string;
  status: TransferStatus;
  requested_by: string;
  requested_by_name?: string;
  received_by?: string;
  received_by_name?: string;
  item_count?: number;
  created_at: string;
  received_at?: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  product_name?: string;
  batch_number: string;
  expiry_date: string;
  quantity_ordered: number;
  quantity_received: number;
  cost_price: number;
  sale_price?: number;
}

export interface Purchase {
  id: string;
  tenant_id: string;
  branch_id: string;
  branch_name?: string;
  supplier_id: string;
  supplier_name?: string;
  purchase_number: string;
  status: 'ordered' | 'received' | 'partially_received';
  total_amount: number;
  items?: PurchaseItem[];
  created_at: string;
}

export interface Scheme {
  id: string;
  tenant_id: string;
  company_id: string;
  company_name?: string;
  description: string;
  target_quantity: number;
  bonus_description: string;
  valid_from: string;
  valid_to: string;
  created_at: string;
}

export interface DayClosing {
  id: string;
  tenant_id: string;
  branch_id: string;
  branch_name?: string;
  closing_date: string;
  opening_cash: number;
  total_cash_sales: number;
  total_credit_sales: number;
  total_payments_received: number;
  closing_cash_expected: number;
  closing_cash_actual: number;
  difference: number;
  closed_by: string;
  closed_by_name?: string;
  notes?: string;
  created_at: string;
}

export interface TenantFeatures {
  tenant_id: string;
  multi_branch: boolean;
  schemes: boolean;
  purchases: boolean;
  suppliers: boolean;
  reports: boolean;
  updated_at: string;
}

export interface PendingRequest {
  id: string;
  tenant_id: string;
  tenant_name?: string;
  requested_by: string;
  requested_by_name?: string;
  request_type: 'new_staff' | 'new_branch' | 'enable_module' | string;
  request_details: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_note?: string;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id?: string;
  admin_name?: string;
  tenant_id?: string;
  tenant_name?: string;
  action: string;
  details?: Record<string, unknown>;
  created_at: string;
}

