// Mock data & Data Store for immediate counter testing & demonstration
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
  Scheme,
  DayClosing
} from './types';


export const demoTenant1: Tenant = {
  id: '11111111-1111-1111-1111-111111111111',
  business_name: 'Pak Agro Chemical & Pesticide Network',
  owner_name: 'Chaudhry Tariq Mehmood',
  phone: '+92 300 1234567',
  city: 'Multan',
  dealer_license_number: 'PB-MLT-2024-8891',
  license_expiry_date: '2027-12-31',
  subscription_status: 'active',
  settings: {
    branch_mode: 'consolidated',
    features: {
      pos: true,
      udhaar: true,
      sales_history: true,
      inventory: true,
      purchases: true,
      suppliers: true,
      multi_branch: true,
      schemes: true,
      reports: true,
      day_closing: true,
      staff_accounts: true,
      branch_management: true,
      company_catalog: true,
    },
  },
  created_at: '2024-01-01T00:00:00Z',
};

export const demoTenant2: Tenant = {
  id: '22222222-2222-2222-2222-222222222222',
  business_name: 'Kisan Zarai Markaz & Seeds',
  owner_name: 'Mian Shahid Rasheed',
  phone: '+92 301 7654321',
  city: 'Sahiwal',
  dealer_license_number: 'PB-SHW-2025-4410',
  license_expiry_date: '2026-10-15',
  subscription_status: 'trial',
  settings: {
    branch_mode: 'independent',
    features: {
      pos: true,
      udhaar: true,
      sales_history: true,
      inventory: true,
      purchases: false, // Differing flag to prove per-tenant isolation
      suppliers: true,
      multi_branch: false, // Differing flag to prove per-tenant isolation
      schemes: true,
      reports: true,
      day_closing: false,
      staff_accounts: false,
      branch_management: false,
      company_catalog: true,
    },
  },
  created_at: '2025-02-15T00:00:00Z',
};

export const initialTenants: Tenant[] = [demoTenant1, demoTenant2];
export const initialTenant: Tenant = demoTenant1;

export const initialBranches: Branch[] = [
  {
    id: 'branch-001',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    name: 'Multan Grains Market Branch',
    address: 'Shop 14-B, Galla Mandi, Vehari Road, Multan',
    phone: '+92 300 1234567',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'branch-002',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    name: 'Khanewal Bypass Branch',
    address: 'Plot 4, Khanewal Road, Multan',
    phone: '+92 301 7654321',
    is_active: true,
    created_at: '2024-03-15T00:00:00Z'
  },
  {
    id: 'branch-003',
    tenant_id: '22222222-2222-2222-2222-222222222222',
    name: 'Sahiwal High Street Outlet',
    address: 'Shop 42, High Street, Sahiwal',
    phone: '+92 301 7654321',
    is_active: true,
    created_at: '2025-02-15T00:00:00Z'
  }
];

export const initialProfiles: Profile[] = [
  {
    id: 'usr-owner',
    tenant_id: 'tenant-001',
    full_name: 'Chaudhry Tariq Mehmood',
    phone: '+92 300 1234567',
    role: 'owner',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'usr-mgr1',
    tenant_id: 'tenant-001',
    full_name: 'Muhammad Asif (Manager)',
    phone: '+92 302 9988776',
    role: 'branch_manager',
    is_active: true,
    created_at: '2024-01-10T00:00:00Z'
  },
  {
    id: 'usr-sales1',
    tenant_id: 'tenant-001',
    full_name: 'Ali Raza (Salesman)',
    phone: '+92 303 5544332',
    role: 'salesman',
    is_active: true,
    created_at: '2024-02-01T00:00:00Z'
  }
];

export const initialCompanies: Company[] = [
  {
    id: 'cmp-bayer',
    tenant_id: 'tenant-001',
    name: 'Bayer CropScience',
    contact_person: 'Shahid Mehmood (TSM)',
    phone: '+92 321 4455667',
    notes: 'Premium German pesticides, cotton & wheat portfolio',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cmp-syngenta',
    tenant_id: 'tenant-001',
    name: 'Syngenta Pakistan',
    contact_person: 'Usman Ali',
    phone: '+92 300 8877665',
    notes: 'Syngenta insecticides & fungicides',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cmp-fmc',
    tenant_id: 'tenant-001',
    name: 'FMC United Chemical',
    contact_person: 'Kamran Bhatti',
    phone: '+92 312 9900112',
    notes: 'Coragen, Karate, and weedicides',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cmp-tara',
    tenant_id: 'tenant-001',
    name: 'Tara Crop Science (Local)',
    contact_person: 'Rana Sohail',
    phone: '+92 301 3344556',
    notes: 'Economical local generic spray formulations',
    created_at: '2024-01-01T00:00:00Z'
  }
];

export const initialProducts: Product[] = [
  {
    id: 'prod-001',
    tenant_id: 'tenant-001',
    company_id: 'cmp-bayer',
    company_name: 'Bayer CropScience',
    name: 'Confidor 200 SL (Imidacloprid)',
    active_ingredient: 'Imidacloprid 200g/L',
    formulation_type: 'SL',
    pack_size: 250,
    pack_unit: 'ml',
    crop_tags: ['Cotton', 'Wheat', 'Vegetables', 'Citrus'],
    pest_tags: ['Jassid', 'Thrips', 'Whitefly', 'Aphid'],
    reorder_level: 25,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'prod-002',
    tenant_id: 'tenant-001',
    company_id: 'cmp-fmc',
    company_name: 'FMC United Chemical',
    name: 'Coragen 20 SC (Chlorantraniliprole)',
    active_ingredient: 'Chlorantraniliprole 200g/L',
    formulation_type: 'SC',
    pack_size: 50,
    pack_unit: 'ml',
    crop_tags: ['Rice', 'Sugarcane', 'Maize', 'Cotton'],
    pest_tags: ['Stem Borer', 'American Bollworm', 'Armyworm'],
    reorder_level: 15,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'prod-003',
    tenant_id: 'tenant-001',
    company_id: 'cmp-syngenta',
    company_name: 'Syngenta Pakistan',
    name: 'Match 50 EC (Lufenuron)',
    active_ingredient: 'Lufenuron 50g/L',
    formulation_type: 'EC',
    pack_size: 400,
    pack_unit: 'ml',
    crop_tags: ['Cotton', 'Maize'],
    pest_tags: ['Spotted Bollworm', 'Armyworm'],
    reorder_level: 20,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'prod-004',
    tenant_id: 'tenant-001',
    company_id: 'cmp-tara',
    company_name: 'Tara Crop Science (Local)',
    name: 'Tara Emamectin Benzoate 1.9 EC',
    active_ingredient: 'Emamectin Benzoate 19g/L',
    formulation_type: 'EC',
    pack_size: 200,
    pack_unit: 'ml',
    crop_tags: ['Cotton', 'Chillies', 'Tomato'],
    pest_tags: ['Heliothis', 'Fruit Borer'],
    reorder_level: 30,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'prod-005',
    tenant_id: 'tenant-001',
    company_id: 'cmp-bayer',
    company_name: 'Bayer CropScience',
    name: 'Nativo 75 WG (Tebuconazole + Trifloxystrobin)',
    active_ingredient: 'Tebuconazole 50% + Trifloxystrobin 25%',
    formulation_type: 'granules',
    pack_size: 100,
    pack_unit: 'g',
    crop_tags: ['Rice', 'Wheat'],
    pest_tags: ['Leaf Blast', 'Rust', 'Sheath Blight'],
    reorder_level: 10,
    created_at: '2024-01-01T00:00:00Z'
  }
];

export const initialBatches: Batch[] = [
  {
    id: 'batch-001',
    product_id: 'prod-001',
    branch_id: 'branch-001',
    batch_number: 'BAY-2025-09A',
    manufacture_date: '2025-01-10',
    expiry_date: '2026-11-30', // FEFO nearest expiry
    cost_price: 1450,
    sale_price: 1850,
    quantity_received: 100,
    quantity_current: 34,
    created_at: '2025-01-15T00:00:00Z',
    product_name: 'Confidor 200 SL (Imidacloprid)',
    company_name: 'Bayer CropScience'
  },
  {
    id: 'batch-002',
    product_id: 'prod-001',
    branch_id: 'branch-001',
    batch_number: 'BAY-2025-12B',
    manufacture_date: '2025-02-01',
    expiry_date: '2027-02-28', // Later expiry
    cost_price: 1480,
    sale_price: 1850,
    quantity_received: 150,
    quantity_current: 150,
    created_at: '2025-02-10T00:00:00Z',
    product_name: 'Confidor 200 SL (Imidacloprid)',
    company_name: 'Bayer CropScience'
  },
  {
    id: 'batch-003',
    product_id: 'prod-002',
    branch_id: 'branch-001',
    batch_number: 'FMC-COR-441',
    manufacture_date: '2025-01-01',
    expiry_date: '2026-09-15', // Expiring in ~1 month!
    cost_price: 2200,
    sale_price: 2750,
    quantity_received: 50,
    quantity_current: 8,
    created_at: '2025-01-05T00:00:00Z',
    product_name: 'Coragen 20 SC (Chlorantraniliprole)',
    company_name: 'FMC United Chemical'
  },
  {
    id: 'batch-004',
    product_id: 'prod-003',
    branch_id: 'branch-001',
    batch_number: 'SYN-MAT-102',
    manufacture_date: '2025-02-15',
    expiry_date: '2027-01-10',
    cost_price: 1600,
    sale_price: 2050,
    quantity_received: 80,
    quantity_current: 42,
    created_at: '2025-02-20T00:00:00Z',
    product_name: 'Match 50 EC (Lufenuron)',
    company_name: 'Syngenta Pakistan'
  },
  {
    id: 'batch-005',
    product_id: 'prod-004',
    branch_id: 'branch-001',
    batch_number: 'TARA-EMA-77',
    manufacture_date: '2025-03-01',
    expiry_date: '2026-12-31',
    cost_price: 650,
    sale_price: 900,
    quantity_received: 200,
    quantity_current: 110,
    created_at: '2025-03-05T00:00:00Z',
    product_name: 'Tara Emamectin Benzoate 1.9 EC',
    company_name: 'Tara Crop Science (Local)'
  },
  {
    id: 'batch-006',
    product_id: 'prod-005',
    branch_id: 'branch-001',
    batch_number: 'BAY-NAT-801',
    manufacture_date: '2025-01-20',
    expiry_date: '2027-05-20',
    cost_price: 1950,
    sale_price: 2400,
    quantity_received: 40,
    quantity_current: 18,
    created_at: '2025-01-25T00:00:00Z',
    product_name: 'Nativo 75 WG (Tebuconazole + Trifloxystrobin)',
    company_name: 'Bayer CropScience'
  }
];

export const initialCustomers: Customer[] = [
  {
    id: 'cust-001',
    tenant_id: 'tenant-001',
    branch_id: 'branch-001',
    name: 'Malik Mohammad Akram',
    phone: '+92 300 9876543',
    address: 'Mouza Shahpur, Tehsil Multan',
    land_size: 45,
    crop_type: 'Cotton & Wheat',
    credit_limit: 150000,
    current_balance: 62500,
    is_active: true,
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'cust-002',
    tenant_id: 'tenant-001',
    branch_id: 'branch-001',
    name: 'Rana Zulfiqar Ali',
    phone: '+92 302 1122334',
    address: 'Chak 21-MR, Multan',
    land_size: 25,
    crop_type: 'Mango Orchard & Maize',
    credit_limit: 80000,
    current_balance: 18400,
    is_active: true,
    created_at: '2024-02-10T00:00:00Z'
  },
  {
    id: 'cust-003',
    tenant_id: 'tenant-001',
    branch_id: 'branch-001',
    name: 'Haji Ghulam Rasool',
    phone: '+92 304 5566778',
    address: 'Basti Malook, Lodhran Road',
    land_size: 120,
    crop_type: 'Sugarcane & Rice',
    credit_limit: 400000,
    current_balance: 145000,
    is_active: true,
    created_at: '2024-01-05T00:00:00Z'
  },
  {
    id: 'cust-004',
    tenant_id: 'tenant-001',
    branch_id: 'branch-001',
    name: 'Jam Sajjad Hussain',
    phone: '+92 306 4433221',
    address: 'Khad Factory Area, Multan',
    land_size: 15,
    crop_type: 'Vegetables (Tomato/Chillies)',
    credit_limit: 50000,
    current_balance: 49500, // Near credit limit warning!
    is_active: true,
    created_at: '2024-04-01T00:00:00Z'
  },
  {
    id: 'cust-maaz',
    tenant_id: 'tenant-001',
    branch_id: 'branch-001',
    name: 'Maaz Yasin',
    phone: '+92 300 7766554',
    address: 'Basti Malook, Multan',
    land_size: 35,
    crop_type: 'Cotton & Wheat',
    credit_limit: 100000,
    current_balance: -34000, // Advance Prepaid Balance of Rs. 34,000!
    is_active: true,
    created_at: '2026-08-01T00:00:00Z'
  }
];

export const initialSales: Sale[] = [
  {
    id: 'sale-001',
    tenant_id: 'tenant-001',
    branch_id: 'branch-001',
    branch_name: 'Multan Grains Market Branch',
    sale_number: 'MUL-0104',
    customer_id: 'cust-001',
    customer_name: 'Malik Mohammad Akram',
    customer_phone: '+92 300 9876543',
    sold_by: 'usr-sales1',
    sold_by_name: 'Ali Raza',
    payment_type: 'partial',
    subtotal: 18500,
    discount_total: 500,
    grand_total: 18000,
    amount_paid: 5000,
    remaining_balance: 13000,
    status: 'completed',
    created_at: '2026-08-25T10:15:00Z',
    items: [
      {
        id: 'si-001',
        sale_id: 'sale-001',
        batch_id: 'batch-001',
        product_name_snapshot: 'Confidor 200 SL (Imidacloprid)',
        quantity: 10,
        unit_price: 1850,
        discount: 500,
        line_total: 18000,
        batch_number: 'BAY-2025-09A',
        expiry_date: '2026-11-30'
      }
    ]
  },
  {
    id: 'sale-002',
    tenant_id: 'tenant-001',
    branch_id: 'branch-001',
    branch_name: 'Multan Grains Market Branch',
    sale_number: 'MUL-0105',
    customer_id: 'cust-002',
    customer_name: 'Rana Zulfiqar Ali',
    customer_phone: '+92 302 1122334',
    sold_by: 'usr-sales1',
    sold_by_name: 'Ali Raza',
    payment_type: 'cash',
    subtotal: 5500,
    discount_total: 0,
    grand_total: 5500,
    amount_paid: 5500,
    remaining_balance: 0,
    status: 'completed',
    created_at: '2026-08-25T11:45:00Z',
    items: [
      {
        id: 'si-002',
        sale_id: 'sale-002',
        batch_id: 'batch-003',
        product_name_snapshot: 'Coragen 20 SC (Chlorantraniliprole)',
        quantity: 2,
        unit_price: 2750,
        discount: 0,
        line_total: 5500,
        batch_number: 'FMC-COR-441',
        expiry_date: '2026-09-15'
      }
    ]
  }
];

export const initialLedger: CreditLedgerEntry[] = [
  {
    id: 'ledg-001',
    tenant_id: 'tenant-001',
    customer_id: 'cust-001',
    customer_name: 'Malik Mohammad Akram',
    sale_id: 'sale-001',
    sale_number: 'MUL-0104',
    type: 'sale_credit',
    amount: 13000,
    running_balance: 62500,
    note: 'Partial payment sale udhaar balance',
    created_at: '2026-08-25T10:15:00Z'
  },
  {
    id: 'ledg-mz-001',
    tenant_id: 'tenant-001',
    customer_id: 'cust-maaz',
    customer_name: 'Maaz Yasin',
    type: 'payment',
    amount: 50000,
    running_balance: -50000,
    note: 'Advance Season Deposit Received (Bank Transfer)',
    created_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 'ledg-mz-002',
    tenant_id: 'tenant-001',
    customer_id: 'cust-maaz',
    customer_name: 'Maaz Yasin',
    type: 'sale_credit',
    amount: 16000,
    running_balance: -34000,
    note: 'POS Counter Sale MUL-0101 (Offset from Advance Balance)',
    created_at: '2026-08-15T14:30:00Z'
  }
];

export const initialSuppliers: Supplier[] = [
  {
    id: 'sup-001',
    tenant_id: 'tenant-001',
    name: 'Bayer CropScience Pakistan Pvt Ltd',
    contact_person: 'Tariq Shah (Regional Manager)',
    phone: '+92 42 111 229 377',
    address: 'Plot 24, Industrial Estate, Multan',
    current_balance: 450000,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'sup-002',
    tenant_id: 'tenant-001',
    name: 'FMC United Agri Distributors',
    contact_person: 'Nadeem Abbasi',
    phone: '+92 61 6511223',
    address: 'Vehari Road Chemicals Market, Multan',
    current_balance: 180000,
    created_at: '2024-01-01T00:00:00Z'
  }
];

export const initialSupplierLedger: SupplierLedgerEntry[] = [
  {
    id: 'sup-ledg-001',
    tenant_id: 'tenant-001',
    supplier_id: 'sup-001',
    supplier_name: 'Bayer CropScience Pakistan Pvt Ltd',
    type: 'purchase',
    amount: 450000,
    note: 'Opening Payable Balance (Bulk Stock Order)',
    running_balance: 450000,
    created_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 'sup-ledg-002',
    tenant_id: 'tenant-001',
    supplier_id: 'sup-001',
    supplier_name: 'Bayer CropScience Pakistan Pvt Ltd',
    purchase_id: 'pur-001',
    purchase_number: 'PO-2026-081',
    type: 'purchase',
    amount: 367000,
    note: 'Stock purchase bill PO-2026-081',
    running_balance: 817000,
    created_at: '2026-08-20T10:00:00Z'
  },
  {
    id: 'sup-ledg-003',
    tenant_id: 'tenant-001',
    supplier_id: 'sup-001',
    supplier_name: 'Bayer CropScience Pakistan Pvt Ltd',
    type: 'payment',
    amount: 367000,
    payment_method: 'Bank Transfer',
    note: 'HBL Online Transfer Ref #88921',
    running_balance: 450000,
    created_at: '2026-08-22T14:30:00Z'
  },
  {
    id: 'sup-ledg-004',
    tenant_id: 'tenant-001',
    supplier_id: 'sup-002',
    supplier_name: 'FMC United Agri Distributors',
    type: 'purchase',
    amount: 280000,
    note: 'Opening Payable Stock Consignment',
    running_balance: 280000,
    created_at: '2026-08-05T09:00:00Z'
  },
  {
    id: 'sup-ledg-005',
    tenant_id: 'tenant-001',
    supplier_id: 'sup-002',
    supplier_name: 'FMC United Agri Distributors',
    type: 'payment',
    amount: 100000,
    payment_method: 'Bank Transfer',
    note: 'Bank Payment MCB Cheque #449120',
    running_balance: 180000,
    created_at: '2026-08-18T11:15:00Z'
  }
];

export const initialTransfers: StockTransfer[] = [
  {
    id: 'trf-001',
    tenant_id: 'tenant-001',
    from_branch_id: 'branch-001',
    from_branch_name: 'Multan Grains Market Branch',
    to_branch_id: 'branch-002',
    to_branch_name: 'Khanewal Bypass Branch',
    status: 'in_transit',
    requested_by: 'usr-mgr1',
    requested_by_name: 'Muhammad Asif',
    item_count: 20,
    created_at: '2026-08-24T16:30:00Z'
  }
];

export const initialPurchases: Purchase[] = [
  {
    id: 'pur-001',
    tenant_id: 'tenant-001',
    branch_id: 'branch-001',
    branch_name: 'Multan Grains Market Branch',
    supplier_id: 'sup-001',
    supplier_name: 'Bayer CropScience Pakistan Pvt Ltd',
    purchase_number: 'PO-2026-081',
    status: 'received',
    total_amount: 367000,
    created_at: '2026-08-20T10:00:00Z',
    items: [
      {
        id: 'pi-001',
        purchase_id: 'pur-001',
        product_id: 'prod-001',
        product_name: 'Confidor 200 SL (Imidacloprid)',
        batch_number: 'BAY-2025-12B',
        expiry_date: '2027-02-28',
        quantity_ordered: 150,
        quantity_received: 150,
        cost_price: 1480,
        sale_price: 1850
      }
    ]
  }
];

export const initialSchemes: Scheme[] = [
  {
    id: 'sch-001',
    tenant_id: 'tenant-001',
    company_id: 'cmp-bayer',
    company_name: 'Bayer CropScience',
    description: 'Cotton Season Confidor 200 SL Special Volume Bonus',
    target_quantity: 500,
    bonus_description: 'Rs. 50,000 Cash Bonus + 10 Free Packs on hitting 500 units',
    valid_from: '2026-06-01',
    valid_to: '2026-10-31',
    created_at: '2026-06-01T00:00:00Z'
  },
  {
    id: 'sch-002',
    tenant_id: 'tenant-001',
    company_id: 'cmp-fmc',
    company_name: 'FMC United Chemical',
    description: 'Coragen Rice Borer Protection Target',
    target_quantity: 200,
    bonus_description: 'Gold Coin (5g) or Rs. 40,000 cash back on 200 packs',
    valid_from: '2026-07-01',
    valid_to: '2026-09-30',
    created_at: '2026-07-01T00:00:00Z'
  }
];

export const initialDayClosings: DayClosing[] = [
  {
    id: 'dc-001',
    tenant_id: 'tenant-001',
    branch_id: 'branch-001',
    branch_name: 'Multan Grains Market Branch',
    closing_date: '2026-08-24',
    opening_cash: 10000,
    total_cash_sales: 45500,
    total_credit_sales: 32000,
    total_payments_received: 15000,
    closing_cash_expected: 70500,
    closing_cash_actual: 70500,
    difference: 0,
    closed_by: 'usr-mgr1',
    closed_by_name: 'Muhammad Asif',
    notes: 'Drawer verified and matched exactly.',
    created_at: '2026-08-24T19:00:00Z'
  }
];
