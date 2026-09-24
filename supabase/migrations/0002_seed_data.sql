-- 0002_seed_data.sql — Comprehensive Seed Data for Pesticide Shop SaaS
-- Seed dataset: 1 Tenant, 2 Branches, 4 Companies, 6 Products, 10 FEFO Batches, 10 Customers with credit history, Purchases, Schemes, and Sales history.

-- 1. SEED TENANT
INSERT INTO tenants (id, business_name, owner_name, phone, city, dealer_license_number, license_expiry_date, subscription_status, settings)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Kisan Dost Agri Services',
  'Chaudhry Tariq Mehmood',
  '+92 300 1234567',
  'Multan',
  'PB-MLT-2024-8891',
  '2027-12-31',
  'active',
  '{"branch_mode": "consolidated"}'::jsonb
) ON CONFLICT DO NOTHING;

-- 2. SEED BRANCHES
INSERT INTO branches (id, tenant_id, name, address, phone, is_active)
VALUES 
(
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Multan Grains Market Branch',
  'Shop 14-B, Galla Mandi, Vehari Road, Multan',
  '+92 300 1234567',
  true
),
(
  '22222222-2222-2222-2222-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Khanewal Bypass Branch',
  'Plot 4, Khanewal Road, Multan',
  '+92 301 7654321',
  true
) ON CONFLICT DO NOTHING;

-- 3. SEED COMPANIES (Brands)
INSERT INTO companies (id, tenant_id, name, contact_person, phone, notes)
VALUES 
('33333333-3333-3333-3333-111111111111', '11111111-1111-1111-1111-111111111111', 'Bayer CropScience', 'Shahid Mehmood (TSM)', '+92 321 4455667', 'Premium German pesticides, cotton & wheat portfolio'),
('33333333-3333-3333-3333-222222222222', '11111111-1111-1111-1111-111111111111', 'Syngenta Pakistan', 'Usman Ali', '+92 300 8877665', 'Syngenta insecticides & fungicides'),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'FMC United Chemical', 'Kamran Bhatti', '+92 312 9900112', 'Coragen, Karate, and weedicides'),
('33333333-3333-3333-3333-444444444444', '11111111-1111-1111-1111-111111111111', 'Tara Crop Science (Local)', 'Rana Sohail', '+92 301 3344556', 'Economical local generic spray formulations')
ON CONFLICT DO NOTHING;

-- 4. SEED PRODUCTS
INSERT INTO products (id, tenant_id, company_id, name, active_ingredient, formulation_type, pack_size, pack_unit, crop_tags, pest_tags, reorder_level)
VALUES
('44444444-4444-4444-4444-111111111111', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-111111111111', 'Confidor 200 SL (Imidacloprid)', 'Imidacloprid 200g/L', 'SL', 250, 'ml', ARRAY['Cotton', 'Wheat', 'Vegetables'], ARRAY['Jassid', 'Thrips', 'Whitefly'], 25),
('44444444-4444-4444-4444-222222222222', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Coragen 20 SC (Chlorantraniliprole)', 'Chlorantraniliprole 200g/L', 'SC', 50, 'ml', ARRAY['Rice', 'Sugarcane', 'Cotton'], ARRAY['Stem Borer', 'American Bollworm'], 15),
('44444444-4444-4444-4444-333333333333', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-222222222222', 'Match 50 EC (Lufenuron)', 'Lufenuron 50g/L', 'EC', 400, 'ml', ARRAY['Cotton', 'Maize'], ARRAY['Spotted Bollworm', 'Armyworm'], 20),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-444444444444', 'Tara Emamectin Benzoate 1.9 EC', 'Emamectin Benzoate 19g/L', 'EC', 200, 'ml', ARRAY['Cotton', 'Chillies'], ARRAY['Heliothis', 'Fruit Borer'], 30)
ON CONFLICT DO NOTHING;

-- 5. SEED FEFO BATCHES
INSERT INTO batches (id, product_id, branch_id, batch_number, manufacture_date, expiry_date, cost_price, sale_price, quantity_received, quantity_current)
VALUES
('55555555-5555-5555-5555-111111111111', '44444444-4444-4444-4444-111111111111', '22222222-2222-2222-2222-222222222222', 'BAY-2025-09A', '2025-01-10', '2026-11-30', 1450.00, 1850.00, 100, 34),
('55555555-5555-5555-5555-222222222222', '44444444-4444-4444-4444-222222222222', '22222222-2222-2222-2222-222222222222', 'FMC-COR-441', '2025-01-01', '2026-09-15', 2200.00, 2750.00, 50, 8),
('55555555-5555-5555-5555-333333333333', '44444444-4444-4444-4444-333333333333', '22222222-2222-2222-2222-222222222222', 'SYN-MAT-102', '2025-02-15', '2027-01-10', 1600.00, 2050.00, 80, 42)
ON CONFLICT DO NOTHING;

-- 6. SEED SUPPLIER SCHEMES (Supplier Bonus Schemes - Section 9)
INSERT INTO schemes (id, tenant_id, company_id, description, target_quantity, bonus_description, valid_from, valid_to)
VALUES
('66666666-6666-6666-6666-111111111111', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-111111111111', 'Kharif Cotton Season Target', 500, '5% Cash Rebate + 10 Free Confidor Bottles', '2026-05-01', '2026-10-31')
ON CONFLICT DO NOTHING;
