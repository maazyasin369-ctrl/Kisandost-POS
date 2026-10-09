-- 0002_seed_data.sql — Comprehensive Seed Data for Pesticide Shop SaaS
-- Seed dataset: 1 Tenant, 2 Branches, 4 Companies, 6 Products, 10 FEFO Batches, 10 Customers with credit history, Purchases, Schemes, and Sales history.

-- 1. SEED TENANT
INSERT INTO tenants (id, business_name, owner_name, phone, city, dealer_license_number, license_expiry_date, subscription_status, settings)
VALUES (
  '9a9760e9-d361-4e9b-8c9b-17d60a0c8ce6',
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
  '87536177-63d4-4250-9e71-4c93048ab9ee',
  '9a9760e9-d361-4e9b-8c9b-17d60a0c8ce6',
  'Multan Grains Market Branch',
  'Shop 14-B, Galla Mandi, Vehari Road, Multan',
  '+92 300 1234567',
  true
),
(
  '51112311-17ce-4c27-ba5a-b0675500c806',
  '9a9760e9-d361-4e9b-8c9b-17d60a0c8ce6',
  'Khanewal Bypass Branch',
  'Plot 4, Khanewal Road, Multan',
  '+92 301 7654321',
  true
) ON CONFLICT DO NOTHING;

-- 3. SEED COMPANIES (Brands)
INSERT INTO companies (id, tenant_id, name, contact_person, phone, notes)
VALUES 
('fa1d9359-a86c-43f7-8eda-9d4bf52210d9', '9a9760e9-d361-4e9b-8c9b-17d60a0c8ce6', 'Bayer CropScience', 'Shahid Mehmood (TSM)', '+92 321 4455667', 'Premium German pesticides, cotton & wheat portfolio'),
('5a1ca7b6-9936-459f-ab66-fbbf71f8c0eb', '9a9760e9-d361-4e9b-8c9b-17d60a0c8ce6', 'Syngenta Pakistan', 'Usman Ali', '+92 300 8877665', 'Syngenta insecticides & fungicides'),
('38556cbb-aa91-419f-8a3a-86f46d435f41', '9a9760e9-d361-4e9b-8c9b-17d60a0c8ce6', 'FMC United Chemical', 'Kamran Bhatti', '+92 312 9900112', 'Coragen, Karate, and weedicides'),
('35ed1d39-2160-4130-aec5-eeb55f5669a0', '9a9760e9-d361-4e9b-8c9b-17d60a0c8ce6', 'Tara Crop Science (Local)', 'Rana Sohail', '+92 301 3344556', 'Economical local generic spray formulations')
ON CONFLICT DO NOTHING;

-- 4. SEED PRODUCTS
INSERT INTO products (id, tenant_id, company_id, name, active_ingredient, formulation_type, pack_size, pack_unit, crop_tags, pest_tags, reorder_level)
VALUES
('5423d79c-a868-40d7-b0a5-817ef307eada', '9a9760e9-d361-4e9b-8c9b-17d60a0c8ce6', 'fa1d9359-a86c-43f7-8eda-9d4bf52210d9', 'Confidor 200 SL (Imidacloprid)', 'Imidacloprid 200g/L', 'SL', 250, 'ml', ARRAY['Cotton', 'Wheat', 'Vegetables'], ARRAY['Jassid', 'Thrips', 'Whitefly'], 25),
('36dfc331-8315-4d3c-abd8-ed981db7016e', '9a9760e9-d361-4e9b-8c9b-17d60a0c8ce6', '38556cbb-aa91-419f-8a3a-86f46d435f41', 'Coragen 20 SC (Chlorantraniliprole)', 'Chlorantraniliprole 200g/L', 'SC', 50, 'ml', ARRAY['Rice', 'Sugarcane', 'Cotton'], ARRAY['Stem Borer', 'American Bollworm'], 15),
('20a6e8a2-7cf9-41fe-bc64-ff829770edf4', '9a9760e9-d361-4e9b-8c9b-17d60a0c8ce6', '5a1ca7b6-9936-459f-ab66-fbbf71f8c0eb', 'Match 50 EC (Lufenuron)', 'Lufenuron 50g/L', 'EC', 400, 'ml', ARRAY['Cotton', 'Maize'], ARRAY['Spotted Bollworm', 'Armyworm'], 20),
('1d286fc1-3b43-49e6-82db-eacb12dee1be', '9a9760e9-d361-4e9b-8c9b-17d60a0c8ce6', '35ed1d39-2160-4130-aec5-eeb55f5669a0', 'Tara Emamectin Benzoate 1.9 EC', 'Emamectin Benzoate 19g/L', 'EC', 200, 'ml', ARRAY['Cotton', 'Chillies'], ARRAY['Heliothis', 'Fruit Borer'], 30)
ON CONFLICT DO NOTHING;

-- 5. SEED FEFO BATCHES
INSERT INTO batches (id, product_id, branch_id, batch_number, manufacture_date, expiry_date, cost_price, sale_price, quantity_received, quantity_current)
VALUES
('64b99f7b-ef8e-4de5-b290-dc3daa36c26b', '5423d79c-a868-40d7-b0a5-817ef307eada', '87536177-63d4-4250-9e71-4c93048ab9ee', 'BAY-2025-09A', '2025-01-10', '2026-11-30', 1450.00, 1850.00, 100, 34),
('683290a2-5c6d-4c75-8848-5111f0eab647', '36dfc331-8315-4d3c-abd8-ed981db7016e', '87536177-63d4-4250-9e71-4c93048ab9ee', 'FMC-COR-441', '2025-01-01', '2026-09-15', 2200.00, 2750.00, 50, 8),
('f68bfb80-49a9-4666-8656-cf3b520b5032', '20a6e8a2-7cf9-41fe-bc64-ff829770edf4', '87536177-63d4-4250-9e71-4c93048ab9ee', 'SYN-MAT-102', '2025-02-15', '2027-01-10', 1600.00, 2050.00, 80, 42)
ON CONFLICT DO NOTHING;

-- 6. SEED SUPPLIER SCHEMES (Supplier Bonus Schemes - Section 9)
INSERT INTO schemes (id, tenant_id, company_id, description, target_quantity, bonus_description, valid_from, valid_to)
VALUES
('b9a3a520-b880-4486-869d-43a8e031567c', '9a9760e9-d361-4e9b-8c9b-17d60a0c8ce6', 'fa1d9359-a86c-43f7-8eda-9d4bf52210d9', 'Kharif Cotton Season Target', 500, '5% Cash Rebate + 10 Free Confidor Bottles', '2026-05-01', '2026-10-31')
ON CONFLICT DO NOTHING;
