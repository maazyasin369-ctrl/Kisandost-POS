import {
  initialTenant,
  initialTenants,
  initialBranches,
  initialProfiles,
  initialCompanies,
  initialProducts,
  initialBatches,
  initialCustomers,
  initialSales,
  initialLedger,
  initialSuppliers,
  initialSupplierLedger,
  initialTransfers,
  initialPurchases,
  initialSchemes,
  initialDayClosings,
  initialBillingTerms,
  initialTenantPayments
} from './mock-data';

import {
  Tenant,
  Branch,
  Profile,
  Company,
  Product,
  Batch,
  Customer,
  Sale,
  CreditLedgerEntry,
  Supplier,
  SupplierLedgerEntry,
  StockTransfer,
  Purchase,
  PurchaseItem,
  Scheme,
  DayClosing,
  PaymentType,
  SubscriptionStatus,
  TenantBillingTerms,
  TenantPaymentRecord,
  AdminNotification,
  BillingCycle,
  FeeCycle
} from './types';

class DataStore {
  private tenants: Tenant[] = [...initialTenants];
  private tenant: Tenant = this.tenants[0];
  private branches: Branch[] = [...initialBranches];
  private profiles: Profile[] = [...initialProfiles];
  private companies: Company[] = [...initialCompanies];
  private products: Product[] = [...initialProducts];
  private batches: Batch[] = [...initialBatches];
  private customers: Customer[] = [...initialCustomers];
  private sales: Sale[] = [...initialSales];
  private ledger: CreditLedgerEntry[] = [...initialLedger];
  private suppliers: Supplier[] = [...initialSuppliers];
  private supplierLedger: SupplierLedgerEntry[] = [...initialSupplierLedger];
  private transfers: StockTransfer[] = [...initialTransfers];
  private purchases: Purchase[] = [...initialPurchases];
  private schemes: Scheme[] = [...initialSchemes];
  private dayClosings: DayClosing[] = [...initialDayClosings];
  private billingTerms: TenantBillingTerms[] = [...initialBillingTerms];
  private tenantPayments: TenantPaymentRecord[] = [...initialTenantPayments];
  private manualDismissedNotifications: string[] = [];

  private isLoaded = false;

  private ensureClientLoaded() {
    if (!this.isLoaded && typeof window !== 'undefined') {
      this.isLoaded = true;
      try {
        const storedTenants = localStorage.getItem('pesticide_tenants');
        if (storedTenants) this.tenants = JSON.parse(storedTenants);

        const storedBranches = localStorage.getItem('pesticide_branches');
        if (storedBranches) this.branches = JSON.parse(storedBranches);

        const storedProducts = localStorage.getItem('pesticide_products');
        if (storedProducts) this.products = JSON.parse(storedProducts);

        const storedCustomers = localStorage.getItem('pesticide_customers');
        if (storedCustomers) this.customers = JSON.parse(storedCustomers);

        const storedSales = localStorage.getItem('pesticide_sales');
        if (storedSales) this.sales = JSON.parse(storedSales);

        const storedLedger = localStorage.getItem('pesticide_ledger');
        if (storedLedger) this.ledger = JSON.parse(storedLedger);

        const storedBatches = localStorage.getItem('pesticide_batches');
        if (storedBatches) this.batches = JSON.parse(storedBatches);

        const storedPurchases = localStorage.getItem('pesticide_purchases');
        if (storedPurchases) this.purchases = JSON.parse(storedPurchases);

        const storedCompanies = localStorage.getItem('pesticide_companies');
        if (storedCompanies) this.companies = JSON.parse(storedCompanies);

        const storedProfiles = localStorage.getItem('pesticide_profiles');
        if (storedProfiles) this.profiles = JSON.parse(storedProfiles);

        const storedSuppliers = localStorage.getItem('pesticide_suppliers');
        if (storedSuppliers) this.suppliers = JSON.parse(storedSuppliers);

        const storedSupplierLedger = localStorage.getItem('pesticide_supplier_ledger');
        if (storedSupplierLedger) this.supplierLedger = JSON.parse(storedSupplierLedger);

        const storedTransfers = localStorage.getItem('pesticide_transfers');
        if (storedTransfers) this.transfers = JSON.parse(storedTransfers);

        const storedSchemes = localStorage.getItem('pesticide_schemes');
        if (storedSchemes) this.schemes = JSON.parse(storedSchemes);

        const storedDayClosings = localStorage.getItem('pesticide_day_closings');
        if (storedDayClosings) this.dayClosings = JSON.parse(storedDayClosings);

        const storedBillingTerms = localStorage.getItem('pesticide_billing_terms');
        if (storedBillingTerms) this.billingTerms = JSON.parse(storedBillingTerms);

        const storedTenantPayments = localStorage.getItem('pesticide_tenant_payments');
        if (storedTenantPayments) this.tenantPayments = JSON.parse(storedTenantPayments);

        const storedDismissed = localStorage.getItem('pesticide_dismissed_notifications');
        if (storedDismissed) this.manualDismissedNotifications = JSON.parse(storedDismissed);

        this.recalculateLedgerBalances();
      } catch (e) {
        console.error('Error loading data from localStorage', e);
      }
    }
  }

  recalculateLedgerBalances() {
    // Ensure Maaz Yasin profile and ledger exist in dataset
    if (!this.customers.some(c => c.id === 'cust-maaz')) {
      const maazProfile = initialCustomers.find(c => c.id === 'cust-maaz');
      if (maazProfile) this.customers.push({ ...maazProfile });
    }

    const maazEntries = initialLedger.filter(l => l.customer_id === 'cust-maaz');
    maazEntries.forEach(e => {
      if (!this.ledger.some(existing => existing.id === e.id)) {
        this.ledger.push({ ...e });
      }
    });

    // Group ledger entries by customer_id
    const customerEntriesMap: Record<string, CreditLedgerEntry[]> = {};
    this.ledger.forEach(entry => {
      if (!customerEntriesMap[entry.customer_id]) {
        customerEntriesMap[entry.customer_id] = [];
      }
      customerEntriesMap[entry.customer_id].push(entry);
    });

    // For each customer, sort entries by created_at ASC and calculate continuous running sum
    this.customers.forEach(customer => {
      const entries = customerEntriesMap[customer.id] || [];
      entries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      let running = 0;
      entries.forEach(entry => {
        if (entry.type === 'payment') {
          running -= entry.amount;
        } else {
          running += entry.amount;
        }
        entry.running_balance = running;
      });

      if (entries.length > 0) {
        customer.current_balance = running;
      }
    });

    this.save('pesticide_customers', this.customers);
    this.save('pesticide_ledger', this.ledger);
  }

  private save(key: string, data: unknown) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.error(`Failed to save ${key} to localStorage`, e);
      }
    }
  }

  // Getters & Mutators
  getTenants() {
    this.ensureClientLoaded();
    return this.tenants;
  }
  getTenant(id?: string) {
    this.ensureClientLoaded();
    if (!id) return this.tenant;
    return this.tenants.find(t => t.id === id) ?? this.tenant;
  }
  createTenant(payload: {
    business_name: string;
    owner_name: string;
    phone: string;
    owner_email: string;
    city: string;
    dealer_license_number: string;
    license_expiry_date: string;
    subscription_status: SubscriptionStatus;
    branch_setup: 'single' | 'multiple';
    branches: { name: string; address: string; phone?: string }[];
  }): { success: boolean; error?: string; tenant?: Tenant; tempPassword?: string } {
    this.ensureClientLoaded();

    const licInput = payload.dealer_license_number.trim().toLowerCase();
    const isDuplicateLic = this.tenants.some(
      t => t.dealer_license_number.trim().toLowerCase() === licInput
    );
    if (isDuplicateLic) {
      return {
        success: false,
        error: `Dealer License Number '${payload.dealer_license_number}' is already registered by another shop tenant.`
      };
    }

    if (!payload.branches || payload.branches.length === 0) {
      return {
        success: false,
        error: 'At least one branch outlet must be defined for the tenant.'
      };
    }

    const tenantId = `tenant-${Date.now()}`;
    const isMultiBranch = payload.branch_setup === 'multiple' || payload.branches.length > 1;

    const newTenant: Tenant = {
      id: tenantId,
      business_name: payload.business_name.trim(),
      owner_name: payload.owner_name.trim(),
      phone: payload.phone.trim(),
      city: payload.city.trim(),
      dealer_license_number: payload.dealer_license_number.trim(),
      license_expiry_date: payload.license_expiry_date,
      subscription_status: payload.subscription_status || 'trial',
      settings: {
        branch_mode: isMultiBranch ? 'consolidated' : 'independent',
        features: {
          pos: true,
          udhaar: true,
          sales_history: true,
          inventory: true,
          purchases: true,
          suppliers: true,
          multi_branch: isMultiBranch,
          schemes: true,
          reports: true,
          day_closing: true,
          staff_accounts: true,
          branch_management: true,
          company_catalog: true,
        }
      },
      created_at: new Date().toISOString(),
    };

    const createdBranches: Branch[] = payload.branches.map((b, idx) => ({
      id: `branch-${Date.now()}-${idx + 1}`,
      tenant_id: tenantId,
      name: b.name.trim() || `${payload.business_name.trim()} - Main Outlet`,
      address: b.address.trim() || payload.city.trim(),
      phone: b.phone?.trim() || payload.phone.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
    }));

    const tempPassword = `KisanDost@${Math.floor(1000 + Math.random() * 9000)}`;
    const newProfile: Profile = {
      id: `prof-${Date.now()}`,
      tenant_id: tenantId,
      full_name: payload.owner_name.trim(),
      phone: payload.phone.trim(),
      role: 'owner',
      branch_id: createdBranches[0]?.id,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    this.tenants.unshift(newTenant);
    this.branches.push(...createdBranches);
    this.profiles.push(newProfile);

    this.save('pesticide_tenants', this.tenants);
    this.save('pesticide_branches', this.branches);
    this.save('pesticide_profiles', this.profiles);

    return {
      success: true,
      tenant: newTenant,
      tempPassword,
    };
  }
  updateTenantStatus(tenantIdOrStatus: string, statusArg?: SubscriptionStatus) {
    let targetTenant: Tenant | undefined;
    let newStatus: SubscriptionStatus;

    if (statusArg) {
      targetTenant = this.tenants.find(t => t.id === tenantIdOrStatus);
      newStatus = statusArg;
    } else {
      targetTenant = this.tenant;
      newStatus = tenantIdOrStatus as SubscriptionStatus;
    }

    if (targetTenant) {
      targetTenant.subscription_status = newStatus;
      this.save('pesticide_tenants', this.tenants);
    }
    return targetTenant ?? this.tenant;
  }
  updateTenantSettings(tenantIdOrSettings: any, settingsArg?: any) {
    let targetTenant: Tenant | undefined;
    let newSettings: Partial<Tenant['settings']>;

    if (settingsArg) {
      targetTenant = this.tenants.find(t => t.id === tenantIdOrSettings);
      newSettings = settingsArg;
    } else {
      targetTenant = this.tenant;
      newSettings = tenantIdOrSettings;
    }

    if (targetTenant) {
      targetTenant.settings = { ...targetTenant.settings, ...newSettings };
      this.save('pesticide_tenants', this.tenants);
    }
    return targetTenant ?? this.tenant;
  }
  getBranches(tenantId?: string) {
    this.ensureClientLoaded();
    if (tenantId) {
      return this.branches.filter(b => b.tenant_id === tenantId);
    }
    return this.branches;
  }
  getProfiles() {
    this.ensureClientLoaded();
    return this.profiles;
  }
  addProfile(payload: {
    full_name: string;
    phone: string;
    role: Profile['role'];
    branch_id?: string;
  }) {
    this.ensureClientLoaded();
    const newProfile: Profile = {
      id: `prof-${Date.now()}`,
      tenant_id: this.tenant.id,
      full_name: payload.full_name.trim(),
      phone: payload.phone.trim(),
      role: payload.role,
      branch_id: payload.branch_id || undefined,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.profiles.push(newProfile);
    this.save('pesticide_profiles', this.profiles);
    return newProfile;
  }
  updateProfile(id: string, payload: {
    full_name?: string;
    phone?: string;
    role?: Profile['role'];
    branch_id?: string;
    is_active?: boolean;
  }) {
    this.ensureClientLoaded();
    const profile = this.profiles.find(p => p.id === id);
    if (!profile) return null;

    if (payload.full_name !== undefined) profile.full_name = payload.full_name.trim();
    if (payload.phone !== undefined) profile.phone = payload.phone.trim();
    if (payload.role !== undefined) profile.role = payload.role;
    if (payload.branch_id !== undefined) profile.branch_id = payload.branch_id || undefined;
    if (payload.is_active !== undefined) profile.is_active = payload.is_active;

    this.save('pesticide_profiles', this.profiles);
    return profile;
  }
  toggleProfileStatus(id: string) {
    this.ensureClientLoaded();
    const profile = this.profiles.find(p => p.id === id);
    if (!profile) return null;
    profile.is_active = !profile.is_active;
    this.save('pesticide_profiles', this.profiles);
    return profile;
  }
  getCompanies() {
    this.ensureClientLoaded();
    return this.companies;
  }
  addCompany(payload: {
    name: string;
    contact_person: string;
    phone: string;
    notes?: string;
  }) {
    this.ensureClientLoaded();
    const newCompany: Company = {
      id: `cmp-${Date.now()}`,
      tenant_id: this.tenant.id,
      name: payload.name.trim(),
      contact_person: payload.contact_person.trim(),
      phone: payload.phone.trim(),
      notes: payload.notes?.trim() || '',
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.companies.unshift(newCompany);
    this.save('pesticide_companies', this.companies);
    return newCompany;
  }
  updateCompany(id: string, payload: {
    name?: string;
    contact_person?: string;
    phone?: string;
    notes?: string;
    is_active?: boolean;
  }) {
    this.ensureClientLoaded();
    const company = this.companies.find(c => c.id === id);
    if (!company) return null;

    if (payload.name !== undefined) company.name = payload.name.trim();
    if (payload.contact_person !== undefined) company.contact_person = payload.contact_person.trim();
    if (payload.phone !== undefined) company.phone = payload.phone.trim();
    if (payload.notes !== undefined) company.notes = payload.notes.trim();
    if (payload.is_active !== undefined) company.is_active = payload.is_active;

    this.save('pesticide_companies', this.companies);
    return company;
  }
  toggleCompanyStatus(id: string) {
    this.ensureClientLoaded();
    const company = this.companies.find(c => c.id === id);
    if (!company) return null;
    company.is_active = company.is_active === undefined ? false : !company.is_active;
    this.save('pesticide_companies', this.companies);
    return company;
  }
  getProducts() {
    this.ensureClientLoaded();
    return this.products.map(p => {
      const company = this.companies.find(c => c.id === p.company_id);
      return { ...p, company_name: company?.name || 'Unknown Brand' };
    });
  }
  addProduct(payload: {
    company_id: string;
    name: string;
    active_ingredient: string;
    formulation_type: string;
    pack_size: number;
    pack_unit: string;
    crop_tags: string[];
    reorder_level: number;
  }) {
    const tenant = this.tenant;
    const newProduct = {
      id: `prod-${Date.now()}`,
      tenant_id: tenant?.id || 'tenant-1',
      company_id: payload.company_id,
      name: payload.name.trim(),
      active_ingredient: payload.active_ingredient.trim(),
      formulation_type: payload.formulation_type as import('./types').FormulationType,
      pack_size: payload.pack_size,
      pack_unit: payload.pack_unit as import('./types').PackUnit,
      crop_tags: payload.crop_tags,
      pest_tags: [],
      reorder_level: payload.reorder_level,
      created_at: new Date().toISOString(),
    };
    this.products = [...this.products, newProduct];
    this.save('pesticide_products', this.products);
    return newProduct;
  }
  updateProduct(id: string, payload: {
    company_id?: string;
    name?: string;
    active_ingredient?: string;
    formulation_type?: import('./types').FormulationType;
    pack_size?: number;
    pack_unit?: import('./types').PackUnit;
    crop_tags?: string[];
    reorder_level?: number;
  }) {
    this.ensureClientLoaded();
    const prod = this.products.find(p => p.id === id);
    if (!prod) return null;

    if (payload.company_id !== undefined) prod.company_id = payload.company_id;
    if (payload.name !== undefined) prod.name = payload.name.trim();
    if (payload.active_ingredient !== undefined) prod.active_ingredient = payload.active_ingredient.trim();
    if (payload.formulation_type !== undefined) prod.formulation_type = payload.formulation_type;
    if (payload.pack_size !== undefined) prod.pack_size = payload.pack_size;
    if (payload.pack_unit !== undefined) prod.pack_unit = payload.pack_unit;
    if (payload.crop_tags !== undefined) prod.crop_tags = payload.crop_tags;
    if (payload.reorder_level !== undefined) prod.reorder_level = payload.reorder_level;

    this.save('pesticide_products', this.products);
    return prod;
  }
  deleteProduct(id: string): { success: boolean; error?: string } {
    this.ensureClientLoaded();
    const prod = this.products.find(p => p.id === id);
    if (!prod) return { success: false, error: 'Product not found.' };

    const prodBatches = this.batches.filter(b => b.product_id === id);
    const totalStock = prodBatches.reduce((sum, b) => sum + b.quantity_current, 0);

    if (totalStock > 0 || prodBatches.length > 0) {
      return {
        success: false,
        error: `Cannot delete product '${prod.name}': It has ${prodBatches.length} batch(es) with ${totalStock} total units in stock. Adjust or delete stock batches first.`
      };
    }

    const batchIds = new Set(prodBatches.map(b => b.id));
    const hasSales = this.sales.some(s => (s.items || []).some(i => batchIds.has(i.batch_id)));
    if (hasSales) {
      return {
        success: false,
        error: `Cannot delete product '${prod.name}': It has past customer sales history records.`
      };
    }

    this.products = this.products.filter(p => p.id !== id);
    this.save('pesticide_products', this.products);
    return { success: true };
  }
  getBatches(branchId?: string) {
    this.ensureClientLoaded();
    let list = this.batches;
    if (branchId) {
      list = list.filter(b => b.branch_id === branchId);
    }
    // FEFO: Sort by expiry_date ASC
    return list.slice().sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
  }
  updateBatch(id: string, payload: {
    batch_number?: string;
    expiry_date?: string;
    cost_price?: number;
    sale_price?: number;
  }) {
    this.ensureClientLoaded();
    const batch = this.batches.find(b => b.id === id);
    if (!batch) return null;

    if (payload.batch_number !== undefined) batch.batch_number = payload.batch_number.trim().toUpperCase();
    if (payload.expiry_date !== undefined) batch.expiry_date = payload.expiry_date;
    if (payload.cost_price !== undefined) batch.cost_price = payload.cost_price;
    if (payload.sale_price !== undefined) batch.sale_price = payload.sale_price;

    this.save('pesticide_batches', this.batches);
    return batch;
  }
  deleteBatch(id: string): { success: boolean; error?: string } {
    this.ensureClientLoaded();
    const batch = this.batches.find(b => b.id === id);
    if (!batch) return { success: false, error: 'Batch not found.' };

    const soldQty = batch.quantity_received - batch.quantity_current;
    if (soldQty > 0) {
      return {
        success: false,
        error: `Cannot delete batch ${batch.batch_number}: ${soldQty} units from this batch have already been sold in customer sales.`
      };
    }

    if (batch.quantity_current > 0) {
      return {
        success: false,
        error: `Cannot delete batch ${batch.batch_number}: It currently has ${batch.quantity_current} units in stock. Reverse the Purchase Order or adjust stock first.`
      };
    }

    this.batches = this.batches.filter(b => b.id !== id);
    this.save('pesticide_batches', this.batches);
    return { success: true };
  }
  getCustomers() {
    this.ensureClientLoaded();
    return this.customers;
  }
  getCustomerById(id: string) {
    this.ensureClientLoaded();
    return this.customers.find(c => c.id === id);
  }
  addCustomer(payload: {
    name: string;
    phone: string;
    address: string;
    land_size?: number;
    crop_type?: string;
    credit_limit?: number;
  }) {
    this.ensureClientLoaded();
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      tenant_id: this.tenant.id,
      branch_id: this.branches[0]?.id || 'branch-001',
      name: payload.name,
      phone: payload.phone,
      address: payload.address,
      land_size: payload.land_size || 0,
      crop_type: payload.crop_type || 'General Crops',
      credit_limit: payload.credit_limit || 50000,
      current_balance: 0,
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.customers.unshift(newCustomer);
    this.save('pesticide_customers', this.customers);
    return newCustomer;
  }
  updateCustomer(id: string, payload: {
    name?: string;
    phone?: string;
    address?: string;
    land_size?: number;
    crop_type?: string;
    credit_limit?: number;
  }) {
    this.ensureClientLoaded();
    const customer = this.customers.find(c => c.id === id);
    if (!customer) return null;

    if (payload.name !== undefined) customer.name = payload.name;
    if (payload.phone !== undefined) customer.phone = payload.phone;
    if (payload.address !== undefined) customer.address = payload.address;
    if (payload.land_size !== undefined) customer.land_size = payload.land_size;
    if (payload.crop_type !== undefined) customer.crop_type = payload.crop_type;
    if (payload.credit_limit !== undefined) customer.credit_limit = payload.credit_limit;

    this.save('pesticide_customers', this.customers);
    return customer;
  }
  deleteCustomer(id: string) {
    this.ensureClientLoaded();
    this.customers = this.customers.filter(c => c.id !== id);
    this.save('pesticide_customers', this.customers);
    return true;
  }
  getSales() {
    this.ensureClientLoaded();
    return this.sales;
  }
  returnSale(saleId: string, reason: string) {
    this.ensureClientLoaded();
    this.sales = this.sales.map(s =>
      s.id === saleId ? { ...s, status: 'returned' as const, return_reason: reason } : s
    );
    this.save('pesticide_sales', this.sales);
  }
  getLedger(customerId?: string) {
    this.ensureClientLoaded();
    if (customerId) return this.ledger.filter(l => l.customer_id === customerId);
    return this.ledger;
  }
  getSuppliers() {
    this.ensureClientLoaded();
    return this.suppliers;
  }
  getSupplierById(id: string) {
    this.ensureClientLoaded();
    return this.suppliers.find(s => s.id === id);
  }
  getSupplierLedger(supplierId?: string) {
    this.ensureClientLoaded();
    let entries = this.supplierLedger;
    if (supplierId) {
      entries = entries.filter(l => l.supplier_id === supplierId);
    }
    // Sort chronologically (oldest first) to compute running balance accurately
    const sorted = [...entries].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    let running = 0;
    sorted.forEach(e => {
      if (e.type === 'payment') {
        running -= e.amount;
      } else {
        running += e.amount;
      }
      e.running_balance = running;
    });

    // Return newest first for ledger statement presentation
    return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  addSupplier(payload: {
    name: string;
    contact_person: string;
    phone: string;
    address: string;
    current_balance?: number;
  }) {
    this.ensureClientLoaded();
    const newSupplier: Supplier = {
      id: `sup-${Date.now()}`,
      tenant_id: this.tenant.id,
      name: payload.name,
      contact_person: payload.contact_person,
      phone: payload.phone,
      address: payload.address,
      current_balance: payload.current_balance || 0,
      created_at: new Date().toISOString()
    };
    this.suppliers.unshift(newSupplier);
    this.save('pesticide_suppliers', this.suppliers);

    if (payload.current_balance && payload.current_balance > 0) {
      const initialEntry: SupplierLedgerEntry = {
        id: `sup-ledg-${Date.now()}`,
        tenant_id: this.tenant.id,
        supplier_id: newSupplier.id,
        supplier_name: newSupplier.name,
        type: 'purchase',
        amount: payload.current_balance,
        note: 'Opening Payable Balance',
        running_balance: payload.current_balance,
        created_at: new Date().toISOString()
      };
      this.supplierLedger.push(initialEntry);
      this.save('pesticide_supplier_ledger', this.supplierLedger);
    }

    return newSupplier;
  }
  updateSupplier(id: string, payload: {
    name?: string;
    contact_person?: string;
    phone?: string;
    address?: string;
    current_balance?: number;
  }) {
    this.ensureClientLoaded();
    const supplier = this.suppliers.find(s => s.id === id);
    if (!supplier) return null;

    if (payload.name !== undefined) supplier.name = payload.name;
    if (payload.contact_person !== undefined) supplier.contact_person = payload.contact_person;
    if (payload.phone !== undefined) supplier.phone = payload.phone;
    if (payload.address !== undefined) supplier.address = payload.address;
    if (payload.current_balance !== undefined) supplier.current_balance = payload.current_balance;

    this.save('pesticide_suppliers', this.suppliers);
    return supplier;
  }
  deleteSupplier(id: string) {
    this.ensureClientLoaded();
    this.suppliers = this.suppliers.filter(s => s.id !== id);
    this.supplierLedger = this.supplierLedger.filter(l => l.supplier_id !== id);
    this.save('pesticide_suppliers', this.suppliers);
    this.save('pesticide_supplier_ledger', this.supplierLedger);
    return true;
  }
  recordSupplierPayment(payload: {
    supplier_id: string;
    amount: number;
    payment_method?: string;
    note?: string;
  }) {
    this.ensureClientLoaded();
    const supplier = this.suppliers.find(s => s.id === payload.supplier_id);
    if (!supplier) return;

    supplier.current_balance = Math.max(0, (supplier.current_balance || 0) - payload.amount);
    (supplier as Supplier & { last_payment_method?: string; last_payment_note?: string }).last_payment_method = payload.payment_method;
    (supplier as Supplier & { last_payment_note?: string }).last_payment_note = payload.note;

    const newLedgerEntry: SupplierLedgerEntry = {
      id: `sup-ledg-${Date.now()}`,
      tenant_id: this.tenant.id,
      supplier_id: payload.supplier_id,
      supplier_name: supplier.name,
      type: 'payment',
      amount: payload.amount,
      payment_method: payload.payment_method || 'Cash',
      note: payload.note || `Distributor payment (${payload.payment_method || 'Cash'})`,
      running_balance: supplier.current_balance,
      created_at: new Date().toISOString()
    };

    this.supplierLedger.push(newLedgerEntry);
    this.save('pesticide_suppliers', this.suppliers);
    this.save('pesticide_supplier_ledger', this.supplierLedger);
    return supplier;
  }
  getTransfers() {
    this.ensureClientLoaded();
    return this.transfers;
  }
  getPurchases() {
    this.ensureClientLoaded();
    return this.purchases;
  }
  getPurchaseById(id: string) {
    this.ensureClientLoaded();
    return this.purchases.find(p => p.id === id);
  }

  deletePurchase(id: string): { success: boolean; error?: string } {
    this.ensureClientLoaded();
    const purchase = this.purchases.find(p => p.id === id);
    if (!purchase) return { success: false, error: 'Purchase order not found.' };

    // Check if stock has been sold from any of this PO's batches
    for (const item of purchase.items || []) {
      const batch = this.batches.find(
        b => b.product_id === item.product_id && b.branch_id === purchase.branch_id && b.batch_number === item.batch_number
      );
      if (batch) {
        const soldQty = batch.quantity_received - batch.quantity_current;
        if (soldQty > 0) {
          const prodName = item.product_name || 'Product';
          return {
            success: false,
            error: `Cannot delete purchase order ${purchase.purchase_number}: ${soldQty} units of ${prodName} (Batch: ${item.batch_number}) have already been sold to customers. Please adjust stock or edit instead.`
          };
        }
      }
    }

    // Revert batch quantities / remove batches
    (purchase.items || []).forEach(item => {
      const batchIndex = this.batches.findIndex(
        b => b.product_id === item.product_id && b.branch_id === purchase.branch_id && b.batch_number === item.batch_number
      );
      if (batchIndex !== -1) {
        const batch = this.batches[batchIndex];
        if (batch.quantity_received <= item.quantity_received) {
          this.batches.splice(batchIndex, 1);
        } else {
          batch.quantity_received -= item.quantity_received;
          batch.quantity_current -= item.quantity_received;
        }
      }
    });

    // Revert supplier balance
    const supplier = this.suppliers.find(s => s.id === purchase.supplier_id);
    if (supplier) {
      supplier.current_balance = Math.max(0, (supplier.current_balance || 0) - purchase.total_amount);
    }

    // Remove supplier ledger entry
    this.supplierLedger = this.supplierLedger.filter(l => l.purchase_id !== purchase.id);

    // Remove purchase
    this.purchases = this.purchases.filter(p => p.id !== purchase.id);

    this.save('pesticide_purchases', this.purchases);
    this.save('pesticide_batches', this.batches);
    this.save('pesticide_suppliers', this.suppliers);
    this.save('pesticide_supplier_ledger', this.supplierLedger);

    return { success: true };
  }

  updatePurchase(id: string, payload: {
    branch_id: string;
    supplier_id: string;
    items: {
      product_id: string;
      batch_number: string;
      expiry_date: string;
      quantity_ordered: number;
      cost_price: number;
      sale_price: number;
    }[];
  }): { success: boolean; error?: string } {
    this.ensureClientLoaded();
    const purchase = this.purchases.find(p => p.id === id);
    if (!purchase) return { success: false, error: 'Purchase order not found.' };

    // Check if stock has been sold from old batches that would be reduced below sold amount
    for (const item of purchase.items || []) {
      const batch = this.batches.find(
        b => b.product_id === item.product_id && b.branch_id === purchase.branch_id && b.batch_number === item.batch_number
      );
      if (batch) {
        const soldQty = batch.quantity_received - batch.quantity_current;
        const newItem = payload.items.find(i => i.product_id === item.product_id && i.batch_number === item.batch_number);
        const newQty = newItem ? newItem.quantity_ordered : 0;
        const availableQtyAfterReversal = batch.quantity_received - item.quantity_received + newQty;
        if (availableQtyAfterReversal < soldQty) {
          const prodName = item.product_name || 'Product';
          return {
            success: false,
            error: `Cannot update PO: ${soldQty} units of ${prodName} have already been sold. New quantity (${newQty}) is less than sold quantity.`
          };
        }
      }
    }

    // Revert old PO impact on batches
    (purchase.items || []).forEach(item => {
      const batchIndex = this.batches.findIndex(
        b => b.product_id === item.product_id && b.branch_id === purchase.branch_id && b.batch_number === item.batch_number
      );
      if (batchIndex !== -1) {
        const batch = this.batches[batchIndex];
        if (batch.quantity_received <= item.quantity_received && batch.quantity_current <= item.quantity_received) {
          this.batches.splice(batchIndex, 1);
        } else {
          batch.quantity_received -= item.quantity_received;
          batch.quantity_current -= item.quantity_received;
        }
      }
    });

    // Revert old supplier balance and ledger entry
    const oldSupplier = this.suppliers.find(s => s.id === purchase.supplier_id);
    if (oldSupplier) {
      oldSupplier.current_balance = Math.max(0, (oldSupplier.current_balance || 0) - purchase.total_amount);
    }
    this.supplierLedger = this.supplierLedger.filter(l => l.purchase_id !== purchase.id);

    // Apply new PO details
    const branch = this.branches.find(b => b.id === payload.branch_id);
    const newSupplier = this.suppliers.find(s => s.id === payload.supplier_id);
    let newTotalAmount = 0;

    const newPurchaseItems: PurchaseItem[] = payload.items.map((item, idx) => {
      const product = this.products.find(p => p.id === item.product_id);
      const lineCost = item.quantity_ordered * item.cost_price;
      newTotalAmount += lineCost;

      const existingBatch = this.batches.find(
        b => b.product_id === item.product_id && b.branch_id === payload.branch_id && b.batch_number === item.batch_number
      );

      if (existingBatch) {
        existingBatch.quantity_received += item.quantity_ordered;
        existingBatch.quantity_current += item.quantity_ordered;
        existingBatch.cost_price = item.cost_price;
        existingBatch.sale_price = item.sale_price;
        existingBatch.expiry_date = item.expiry_date;
      } else {
        const newBatch: Batch = {
          id: `batch-${Date.now()}-${idx}`,
          product_id: item.product_id,
          branch_id: payload.branch_id,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          cost_price: item.cost_price,
          sale_price: item.sale_price,
          quantity_received: item.quantity_ordered,
          quantity_current: item.quantity_ordered,
          created_at: new Date().toISOString(),
          product_name: product?.name,
          company_name: product?.company_name
        };
        this.batches.unshift(newBatch);
      }

      return {
        id: `pi-${Date.now()}-${idx}`,
        purchase_id: purchase.id,
        product_id: item.product_id,
        product_name: product?.name,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
        quantity_ordered: item.quantity_ordered,
        quantity_received: item.quantity_ordered,
        cost_price: item.cost_price,
        sale_price: item.sale_price
      };
    });

    purchase.branch_id = payload.branch_id;
    purchase.branch_name = branch?.name;
    purchase.supplier_id = payload.supplier_id;
    purchase.supplier_name = newSupplier?.name;
    purchase.total_amount = newTotalAmount;
    purchase.items = newPurchaseItems;

    if (newSupplier) {
      newSupplier.current_balance = (newSupplier.current_balance || 0) + newTotalAmount;
      const newLedgerEntry: SupplierLedgerEntry = {
        id: `sup-ledg-${Date.now()}`,
        tenant_id: this.tenant.id,
        supplier_id: payload.supplier_id,
        supplier_name: newSupplier.name,
        purchase_id: purchase.id,
        purchase_number: purchase.purchase_number,
        type: 'purchase',
        amount: newTotalAmount,
        note: `Stock purchase order ${purchase.purchase_number} (Updated)`,
        running_balance: newSupplier.current_balance,
        created_at: new Date().toISOString()
      };
      this.supplierLedger.push(newLedgerEntry);
    }

    this.save('pesticide_purchases', this.purchases);
    this.save('pesticide_batches', this.batches);
    this.save('pesticide_suppliers', this.suppliers);
    this.save('pesticide_supplier_ledger', this.supplierLedger);

    return { success: true };
  }
  getSchemes() {
    this.ensureClientLoaded();
    return this.schemes;
  }
  getDayClosings() {
    this.ensureClientLoaded();
    return this.dayClosings;
  }

  // CREATE PURCHASE & AUTOMATICALLY STOCK BATCHES
  createPurchase(payload: {
    branch_id: string;
    supplier_id: string;
    items: {
      product_id: string;
      batch_number: string;
      expiry_date: string;
      quantity_ordered: number;
      cost_price: number;
      sale_price: number;
    }[];
  }) {
    this.ensureClientLoaded();
    const branch = this.branches.find(b => b.id === payload.branch_id);
    const supplier = this.suppliers.find(s => s.id === payload.supplier_id);

    const purchaseNumber = `PO-2026-${(this.purchases.length + 82).toString().padStart(3, '0')}`;
    let totalAmount = 0;

    const purchaseItems: PurchaseItem[] = payload.items.map((item, idx) => {
      const product = this.products.find(p => p.id === item.product_id);
      const lineCost = item.quantity_ordered * item.cost_price;
      totalAmount += lineCost;

      // Automatically create or top up batch stock
      const existingBatch = this.batches.find(
        b => b.product_id === item.product_id && b.branch_id === payload.branch_id && b.batch_number === item.batch_number
      );

      if (existingBatch) {
        existingBatch.quantity_received += item.quantity_ordered;
        existingBatch.quantity_current += item.quantity_ordered;
        existingBatch.cost_price = item.cost_price;
        existingBatch.sale_price = item.sale_price;
      } else {
        const newBatch: Batch = {
          id: `batch-${Date.now()}-${idx}`,
          product_id: item.product_id,
          branch_id: payload.branch_id,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          cost_price: item.cost_price,
          sale_price: item.sale_price,
          quantity_received: item.quantity_ordered,
          quantity_current: item.quantity_ordered,
          created_at: new Date().toISOString(),
          product_name: product?.name,
          company_name: product?.company_name
        };
        this.batches.unshift(newBatch);
      }

      return {
        id: `pi-${Date.now()}-${idx}`,
        purchase_id: '',
        product_id: item.product_id,
        product_name: product?.name,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
        quantity_ordered: item.quantity_ordered,
        quantity_received: item.quantity_ordered,
        cost_price: item.cost_price,
        sale_price: item.sale_price
      };
    });

    const newPurchase: Purchase = {
      id: `pur-${Date.now()}`,
      tenant_id: this.tenant.id,
      branch_id: payload.branch_id,
      branch_name: branch?.name,
      supplier_id: payload.supplier_id,
      supplier_name: supplier?.name,
      purchase_number: purchaseNumber,
      status: 'received',
      total_amount: totalAmount,
      items: purchaseItems,
      created_at: new Date().toISOString()
    };

    newPurchase.items?.forEach(i => (i.purchase_id = newPurchase.id));
    this.purchases.unshift(newPurchase);

    // Update Supplier Balance & Ledger
    if (supplier) {
      supplier.current_balance = (supplier.current_balance || 0) + totalAmount;
      const newLedgerEntry: SupplierLedgerEntry = {
        id: `sup-ledg-${Date.now()}`,
        tenant_id: this.tenant.id,
        supplier_id: payload.supplier_id,
        supplier_name: supplier.name,
        purchase_id: newPurchase.id,
        purchase_number: purchaseNumber,
        type: 'purchase',
        amount: totalAmount,
        note: `Stock purchase order ${purchaseNumber}`,
        running_balance: supplier.current_balance,
        created_at: new Date().toISOString()
      };
      this.supplierLedger.push(newLedgerEntry);
      this.save('pesticide_supplier_ledger', this.supplierLedger);
    }

    this.save('pesticide_purchases', this.purchases);
    this.save('pesticide_batches', this.batches);
    this.save('pesticide_suppliers', this.suppliers);

    return newPurchase;
  }

  // CREATE STOCK TRANSFER (Branch to Branch)
  createStockTransfer(payload: {
    from_branch_id: string;
    to_branch_id: string;
    batch_id: string;
    quantity: number;
  }) {
    this.ensureClientLoaded();
    const fromBranch = this.branches.find(b => b.id === payload.from_branch_id);
    const toBranch = this.branches.find(b => b.id === payload.to_branch_id);
    const batch = this.batches.find(b => b.id === payload.batch_id);

    if (!batch || batch.quantity_current < payload.quantity) {
      throw new Error('Insufficient batch stock for transfer');
    }

    // Deduct stock from sending branch
    batch.quantity_current -= payload.quantity;

    const transfer: StockTransfer = {
      id: `trf-${Date.now()}`,
      tenant_id: this.tenant.id,
      from_branch_id: payload.from_branch_id,
      from_branch_name: fromBranch?.name,
      to_branch_id: payload.to_branch_id,
      to_branch_name: toBranch?.name,
      status: 'in_transit',
      requested_by: 'usr-mgr1',
      requested_by_name: 'Muhammad Asif',
      item_count: payload.quantity,
      created_at: new Date().toISOString()
    };

    this.transfers.unshift(transfer);
    this.save('pesticide_transfers', this.transfers);
    this.save('pesticide_batches', this.batches);

    return transfer;
  }

  // RECEIVE STOCK TRANSFER AT DESTINATION BRANCH
  receiveStockTransfer(transferId: string) {
    this.ensureClientLoaded();
    const transfer = this.transfers.find(t => t.id === transferId);
    if (!transfer || transfer.status !== 'in_transit') return;

    transfer.status = 'received';
    transfer.received_by = 'usr-mgr1';
    transfer.received_by_name = 'Muhammad Asif';
    transfer.received_at = new Date().toISOString();

    this.save('pesticide_transfers', this.transfers);
    return transfer;
  }

  // CREATE SCHEME
  createScheme(payload: {
    company_id: string;
    description: string;
    target_quantity: number;
    bonus_description: string;
    valid_from: string;
    valid_to: string;
  }) {
    this.ensureClientLoaded();
    const company = this.companies.find(c => c.id === payload.company_id);
    const newScheme: Scheme = {
      id: `sch-${Date.now()}`,
      tenant_id: this.tenant.id,
      company_id: payload.company_id,
      company_name: company?.name,
      description: payload.description,
      target_quantity: payload.target_quantity,
      bonus_description: payload.bonus_description,
      valid_from: payload.valid_from,
      valid_to: payload.valid_to,
      created_at: new Date().toISOString()
    };
    this.schemes.unshift(newScheme);
    this.save('pesticide_schemes', this.schemes);
    return newScheme;
  }

  // ATOMIC POS CHECKOUT TRANSACTION
  createSale(payload: {
    branch_id: string;
    customer_id?: string;
    sold_by: string;
    payment_type: PaymentType;
    subtotal: number;
    discount_total: number;
    grand_total: number;
    amount_paid: number;
    advance_used?: number;
    cash_paid?: number;
    items: {
      batch_id: string;
      quantity: number;
      unit_price: number;
      discount: number;
      line_total: number;
    }[];
  }): Sale {
    this.ensureClientLoaded();
    const branch = this.branches.find(b => b.id === payload.branch_id);
    const customer = payload.customer_id ? this.customers.find(c => c.id === payload.customer_id) : undefined;
    const seller = this.profiles.find(p => p.id === payload.sold_by) || this.profiles[2];

    const saleNumber = `MUL-${(this.sales.length + 106).toString().padStart(4, '0')}`;
    const remaining_balance = Math.max(0, payload.grand_total - payload.amount_paid);

    const enrichedItems = payload.items.map((item, idx) => {
      const batch = this.batches.find(b => b.id === item.batch_id);
      if (batch) {
        batch.quantity_current = Math.max(0, batch.quantity_current - item.quantity);
      }
      return {
        id: `si-${Date.now()}-${idx}`,
        sale_id: '',
        batch_id: item.batch_id,
        product_name_snapshot: batch?.product_name || 'Agri Spray Item',
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        line_total: item.line_total,
        batch_number: batch?.batch_number,
        expiry_date: batch?.expiry_date
      };
    });

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      tenant_id: this.tenant.id,
      branch_id: payload.branch_id,
      branch_name: branch?.name || 'Main Counter Branch',
      sale_number: saleNumber,
      customer_id: payload.customer_id,
      customer_name: customer?.name || 'Walk-in Farmer',
      customer_phone: customer?.phone || '-',
      sold_by: payload.sold_by,
      sold_by_name: seller.full_name,
      payment_type: payload.payment_type,
      subtotal: payload.subtotal,
      discount_total: payload.discount_total,
      grand_total: payload.grand_total,
      amount_paid: payload.amount_paid,
      remaining_balance: remaining_balance,
      status: 'completed',
      created_at: new Date().toISOString(),
      items: enrichedItems
    };

    newSale.items?.forEach(i => (i.sale_id = newSale.id));
    this.sales.unshift(newSale);

    const advanceOffset = payload.advance_used || 0;
    const actualCashPaid = payload.cash_paid !== undefined ? payload.cash_paid : (payload.payment_type === 'cash' ? payload.grand_total : payload.amount_paid - advanceOffset);
    const creditCharge = payload.grand_total - Math.max(0, actualCashPaid);

    if (customer && creditCharge > 0) {
      const newBal = (customer.current_balance || 0) + creditCharge;
      customer.current_balance = newBal;

      const ledgerEntry: CreditLedgerEntry = {
        id: `ledg-${Date.now()}`,
        tenant_id: this.tenant.id,
        customer_id: customer.id,
        customer_name: customer.name,
        sale_id: newSale.id,
        sale_number: newSale.sale_number,
        type: 'sale_credit',
        amount: creditCharge,
        running_balance: newBal,
        note: advanceOffset > 0
          ? `POS Counter Sale (${saleNumber}) - Offset Rs. ${advanceOffset.toLocaleString()} from Advance`
          : `POS Counter Sale (${payload.payment_type.toUpperCase()})`,
        created_at: new Date().toISOString()
      };
      this.ledger.unshift(ledgerEntry);
    }

    this.save('pesticide_sales', this.sales);
    this.save('pesticide_batches', this.batches);
    this.save('pesticide_customers', this.customers);
    this.save('pesticide_ledger', this.ledger);

    return newSale;
  }

  // RECORD CUSTOMER PAYMENT COLLECTION
  recordCustomerPayment(payload: {
    customer_id: string;
    amount: number;
    method: string;
    note?: string;
  }) {
    this.ensureClientLoaded();
    const customer = this.customers.find(c => c.id === payload.customer_id);
    if (!customer) return;

    const newBal = (customer.current_balance || 0) - payload.amount;
    customer.current_balance = newBal;

    const entry: CreditLedgerEntry = {
      id: `ledg-${Date.now()}`,
      tenant_id: this.tenant.id,
      customer_id: customer.id,
      customer_name: customer.name,
      type: 'payment',
      amount: payload.amount,
      running_balance: newBal,
      note: `Payment Received (${payload.method.toUpperCase()}) ${payload.note ? `- ${payload.note}` : ''}`,
      created_at: new Date().toISOString()
    };
    this.ledger.unshift(entry);

    this.save('pesticide_customers', this.customers);
    this.save('pesticide_ledger', this.ledger);

    return entry;
  }

  // ADD MANUAL CUSTOMER CREDIT / UDHAAR
  addCustomerCredit(payload: {
    customer_id: string;
    amount: number;
    note?: string;
  }) {
    this.ensureClientLoaded();
    const customer = this.customers.find(c => c.id === payload.customer_id);
    if (!customer) return;

    const newBal = (customer.current_balance || 0) + payload.amount;
    customer.current_balance = newBal;

    const entry: CreditLedgerEntry = {
      id: `ledg-${Date.now()}`,
      tenant_id: this.tenant.id,
      customer_id: customer.id,
      customer_name: customer.name,
      type: 'sale_credit',
      amount: payload.amount,
      running_balance: newBal,
      note: `Manual Udhaar Credit Added ${payload.note ? `- ${payload.note}` : ''}`,
      created_at: new Date().toISOString()
    };
    this.ledger.unshift(entry);

    this.save('pesticide_customers', this.customers);
    this.save('pesticide_ledger', this.ledger);

    return entry;
  }

  // RECORD DAY CLOSING RECONCILIATION
  recordDayClosing(payload: {
    branch_id: string;
    opening_cash: number;
    total_cash_sales: number;
    total_credit_sales: number;
    total_payments_received: number;
    closing_cash_expected: number;
    closing_cash_actual: number;
    notes?: string;
  }) {
    this.ensureClientLoaded();
    const branch = this.branches.find(b => b.id === payload.branch_id);
    const closing: DayClosing = {
      id: `dc-${Date.now()}`,
      tenant_id: this.tenant.id,
      branch_id: payload.branch_id,
      branch_name: branch?.name || 'Main Branch',
      closing_date: new Date().toISOString().split('T')[0],
      opening_cash: payload.opening_cash,
      total_cash_sales: payload.total_cash_sales,
      total_credit_sales: payload.total_credit_sales,
      total_payments_received: payload.total_payments_received,
      closing_cash_expected: payload.closing_cash_expected,
      closing_cash_actual: payload.closing_cash_actual,
      difference: payload.closing_cash_actual - payload.closing_cash_expected,
      closed_by: 'usr-mgr1',
      closed_by_name: 'Muhammad Asif',
      notes: payload.notes,
      created_at: new Date().toISOString()
    };
    this.dayClosings.unshift(closing);

    this.save('pesticide_day_closings', this.dayClosings);

    return closing;
  }

  // --- TENANT BILLING & COMMERCIAL TERMS METHODS ---

  getBillingTerms(tenantId: string): TenantBillingTerms {
    this.ensureClientLoaded();
    let terms = this.billingTerms.find(t => t.tenant_id === tenantId);
    if (!terms) {
      const tenantObj = this.tenants.find(t => t.id === tenantId);
      const bizName = tenantObj ? tenantObj.business_name : 'Shop Tenant';
      terms = {
        id: `term-${Date.now()}`,
        tenant_id: tenantId,
        subscription_plan: 'Standard Monthly SaaS License',
        billing_cycle: 'monthly',
        fee_amount: 5000,
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maintenance_fee_amount: 2500,
        maintenance_fee_cycle: '6_monthly',
        next_maintenance_due_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: 'Rs.',
        notes: `Default terms for ${bizName}`,
        updated_at: new Date().toISOString()
      };
      this.billingTerms.push(terms);
      this.save('pesticide_billing_terms', this.billingTerms);
    }
    return terms;
  }

  updateBillingTerms(tenantId: string, updates: Partial<TenantBillingTerms>): TenantBillingTerms {
    this.ensureClientLoaded();
    const index = this.billingTerms.findIndex(t => t.tenant_id === tenantId);
    if (index >= 0) {
      this.billingTerms[index] = {
        ...this.billingTerms[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
    } else {
      const newTerm: TenantBillingTerms = {
        id: `term-${Date.now()}`,
        tenant_id: tenantId,
        subscription_plan: updates.subscription_plan || 'Standard Monthly SaaS License',
        billing_cycle: updates.billing_cycle || 'monthly',
        fee_amount: updates.fee_amount ?? 5000,
        next_billing_date: updates.next_billing_date || new Date().toISOString().split('T')[0],
        maintenance_fee_amount: updates.maintenance_fee_amount ?? 2500,
        maintenance_fee_cycle: updates.maintenance_fee_cycle || '6_monthly',
        next_maintenance_due_date: updates.next_maintenance_due_date || new Date().toISOString().split('T')[0],
        currency: updates.currency || 'Rs.',
        notes: updates.notes,
        updated_at: new Date().toISOString()
      };
      this.billingTerms.push(newTerm);
    }
    this.save('pesticide_billing_terms', this.billingTerms);
    return this.getBillingTerms(tenantId);
  }

  getTenantPayments(tenantId: string): TenantPaymentRecord[] {
    this.ensureClientLoaded();
    return this.tenantPayments
      .filter(p => p.tenant_id === tenantId)
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }

  addTenantPayment(payment: Omit<TenantPaymentRecord, 'id' | 'created_at'>): TenantPaymentRecord {
    this.ensureClientLoaded();
    const newRecord: TenantPaymentRecord = {
      ...payment,
      id: `pay-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    this.tenantPayments.unshift(newRecord);
    this.save('pesticide_tenant_payments', this.tenantPayments);

    // Auto-advance next due dates when payment is recorded & auto-clear resolved notifications
    const terms = this.getBillingTerms(payment.tenant_id);
    if (terms) {
      if (payment.payment_type === 'subscription') {
        const currentDue = new Date(terms.next_billing_date);
        if (terms.billing_cycle === 'monthly') {
          currentDue.setMonth(currentDue.getMonth() + 1);
        } else {
          currentDue.setFullYear(currentDue.getFullYear() + 1);
        }
        this.updateBillingTerms(payment.tenant_id, {
          next_billing_date: currentDue.toISOString().split('T')[0]
        });
      } else if (payment.payment_type === 'maintenance') {
        const currentMaint = new Date(terms.next_maintenance_due_date);
        if (terms.maintenance_fee_cycle === '6_monthly') {
          currentMaint.setMonth(currentMaint.getMonth() + 6);
        } else {
          currentMaint.setFullYear(currentMaint.getFullYear() + 1);
        }
        this.updateBillingTerms(payment.tenant_id, {
          next_maintenance_due_date: currentMaint.toISOString().split('T')[0]
        });
      }
    }

    return newRecord;
  }

  // --- REAL-TIME BILLING NOTIFICATIONS EVALUATION ---

  getAdminNotifications(): AdminNotification[] {
    this.ensureClientLoaded();
    const notifications: AdminNotification[] = [];
    const todayStr = '2026-09-24';
    const today = new Date(todayStr);

    this.tenants.forEach((t) => {
      const terms = this.getBillingTerms(t.id);
      if (!terms) return;

      // 1. Subscription Billing Due / Overdue
      if (terms.next_billing_date) {
        const dueDate = new Date(terms.next_billing_date);
        const diffMs = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        const notifyThreshold = terms.billing_cycle === 'yearly' ? 14 : 3;

        if (diffDays <= notifyThreshold) {
          let severity: 'overdue' | 'warning' = 'warning';
          let type: AdminNotification['type'] = 'billing_due';
          let title = '';
          let message = '';

          if (diffDays < 0) {
            severity = 'overdue';
            type = 'billing_overdue';
            title = `OVERDUE: ${terms.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'} Subscription`;
            message = `${t.business_name} — ${terms.subscription_plan} (Rs. ${terms.fee_amount.toLocaleString()}) was due on ${terms.next_billing_date} (${Math.abs(diffDays)} day(s) OVERDUE).`;
          } else if (diffDays === 0) {
            severity = 'warning';
            type = 'billing_due';
            title = `DUE TODAY: ${terms.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'} Subscription`;
            message = `${t.business_name} — ${terms.subscription_plan} (Rs. ${terms.fee_amount.toLocaleString()}) is due today (${terms.next_billing_date}).`;
          } else {
            severity = 'warning';
            type = 'billing_due';
            title = `Due Soon: ${terms.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'} Subscription`;
            message = `${t.business_name} — ${terms.subscription_plan} (Rs. ${terms.fee_amount.toLocaleString()}) is due in ${diffDays} day(s) (${terms.next_billing_date}).`;
          }

          const notifId = `notif-sub-${t.id}-${terms.next_billing_date}`;
          if (!this.manualDismissedNotifications.includes(notifId)) {
            notifications.push({
              id: notifId,
              tenant_id: t.id,
              tenant_name: t.business_name,
              type,
              title,
              message,
              amount: terms.fee_amount,
              due_date: terms.next_billing_date,
              link_url: `/admin/tenants/${t.id}?tab=billing`,
              is_read: false,
              is_resolved: false,
              severity,
              created_at: new Date().toISOString()
            });
          }
        }
      }

      // 2. Maintenance Fee Due / Overdue
      if (terms.next_maintenance_due_date) {
        const maintDate = new Date(terms.next_maintenance_due_date);
        const diffMs = maintDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays <= 7) {
          let severity: 'overdue' | 'warning' = 'warning';
          let type: AdminNotification['type'] = 'maintenance_due';
          let title = '';
          let message = '';

          if (diffDays < 0) {
            severity = 'overdue';
            type = 'maintenance_overdue';
            title = `OVERDUE: Maintenance Fee`;
            message = `${t.business_name} — Maintenance fee (Rs. ${terms.maintenance_fee_amount.toLocaleString()}) was due on ${terms.next_maintenance_due_date} (${Math.abs(diffDays)} day(s) OVERDUE).`;
          } else if (diffDays === 0) {
            severity = 'warning';
            type = 'maintenance_due';
            title = `DUE TODAY: Maintenance Fee`;
            message = `${t.business_name} — Maintenance fee (Rs. ${terms.maintenance_fee_amount.toLocaleString()}) is due today (${terms.next_maintenance_due_date}).`;
          } else {
            severity = 'warning';
            type = 'maintenance_due';
            title = `Due Soon: Maintenance Fee`;
            message = `${t.business_name} — Maintenance fee (Rs. ${terms.maintenance_fee_amount.toLocaleString()}) is due in ${diffDays} day(s) (${terms.next_maintenance_due_date}).`;
          }

          const notifId = `notif-maint-${t.id}-${terms.next_maintenance_due_date}`;
          if (!this.manualDismissedNotifications.includes(notifId)) {
            notifications.push({
              id: notifId,
              tenant_id: t.id,
              tenant_name: t.business_name,
              type,
              title,
              message,
              amount: terms.maintenance_fee_amount,
              due_date: terms.next_maintenance_due_date,
              link_url: `/admin/tenants/${t.id}?tab=billing`,
              is_read: false,
              is_resolved: false,
              severity,
              created_at: new Date().toISOString()
            });
          }
        }
      }
    });

    // Sort overdue first, then nearest due date
    return notifications.sort((a, b) => {
      if (a.severity === 'overdue' && b.severity !== 'overdue') return -1;
      if (a.severity !== 'overdue' && b.severity === 'overdue') return 1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }

  dismissNotification(id: string): void {
    this.ensureClientLoaded();
    if (!this.manualDismissedNotifications.includes(id)) {
      this.manualDismissedNotifications.push(id);
      this.save('pesticide_dismissed_notifications', this.manualDismissedNotifications);
    }
  }
}

export const dataStore = new DataStore();

