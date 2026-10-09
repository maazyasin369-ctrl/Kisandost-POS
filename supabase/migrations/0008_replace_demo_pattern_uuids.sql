-- Replace patterned demo UUIDs (1111…, 2222…, 7777…) with professional random UUIDs.
-- Safe to re-run: only remaps rows that still have the old IDs.
-- Auth profile id edb3eddc-3806-444c-9cfb-4291bb7d4124 is left unchanged (linked to auth.users).

-- Bypass FK checks while remapping primary keys in dependency order.
SET session_replication_role = replica;

CREATE TEMP TABLE id_remap (
  old_id uuid PRIMARY KEY,
  new_id uuid UNIQUE NOT NULL
);

INSERT INTO id_remap (old_id, new_id) VALUES
  -- tenant
  ('11111111-1111-1111-1111-111111111111', '9a9760e9-d361-4e9b-8c9b-17d60a0c8ce6'),
  -- branches
  ('22222222-2222-2222-2222-222222222222', '87536177-63d4-4250-9e71-4c93048ab9ee'),
  ('22222222-2222-2222-2222-333333333333', '51112311-17ce-4c27-ba5a-b0675500c806'),
  -- companies
  ('33333333-3333-3333-3333-111111111111', 'fa1d9359-a86c-43f7-8eda-9d4bf52210d9'),
  ('33333333-3333-3333-3333-222222222222', '5a1ca7b6-9936-459f-ab66-fbbf71f8c0eb'),
  ('33333333-3333-3333-3333-333333333333', '38556cbb-aa91-419f-8a3a-86f46d435f41'),
  ('33333333-3333-3333-3333-444444444444', '35ed1d39-2160-4130-aec5-eeb55f5669a0'),
  -- products
  ('44444444-4444-4444-4444-111111111111', '5423d79c-a868-40d7-b0a5-817ef307eada'),
  ('44444444-4444-4444-4444-222222222222', '36dfc331-8315-4d3c-abd8-ed981db7016e'),
  ('44444444-4444-4444-4444-333333333333', '20a6e8a2-7cf9-41fe-bc64-ff829770edf4'),
  ('44444444-4444-4444-4444-444444444444', '1d286fc1-3b43-49e6-82db-eacb12dee1be'),
  -- batches
  ('55555555-5555-5555-5555-111111111111', '64b99f7b-ef8e-4de5-b290-dc3daa36c26b'),
  ('55555555-5555-5555-5555-222222222222', '683290a2-5c6d-4c75-8848-5111f0eab647'),
  ('55555555-5555-5555-5555-333333333333', 'f68bfb80-49a9-4666-8656-cf3b520b5032'),
  -- customers
  ('77777777-7777-7777-7777-111111111111', '91983567-7716-46f3-95f3-b1fb3200a0d2'),
  ('77777777-7777-7777-7777-222222222222', '62698630-9167-46ce-b631-4f8d479fc1d2'),
  ('77777777-7777-7777-7777-333333333333', 'a6dbfbaf-d55b-48d7-ad2f-f9f4f68d3b2c'),
  -- schemes
  ('66666666-6666-6666-6666-111111111111', 'b9a3a520-b880-4486-869d-43a8e031567c')
ON CONFLICT (old_id) DO NOTHING;

-- Remap FK columns first (children), then primary keys.

-- tenant_id columns
UPDATE profiles p SET tenant_id = m.new_id FROM id_remap m WHERE p.tenant_id = m.old_id;
UPDATE tenant_features tf SET tenant_id = m.new_id FROM id_remap m WHERE tf.tenant_id = m.old_id;
UPDATE branches b SET tenant_id = m.new_id FROM id_remap m WHERE b.tenant_id = m.old_id;
UPDATE companies c SET tenant_id = m.new_id FROM id_remap m WHERE c.tenant_id = m.old_id;
UPDATE products p SET tenant_id = m.new_id FROM id_remap m WHERE p.tenant_id = m.old_id;
UPDATE customers c SET tenant_id = m.new_id FROM id_remap m WHERE c.tenant_id = m.old_id;
UPDATE sales s SET tenant_id = m.new_id FROM id_remap m WHERE s.tenant_id = m.old_id;
UPDATE payments p SET tenant_id = m.new_id FROM id_remap m WHERE p.tenant_id = m.old_id;
UPDATE credit_ledger cl SET tenant_id = m.new_id FROM id_remap m WHERE cl.tenant_id = m.old_id;
UPDATE schemes s SET tenant_id = m.new_id FROM id_remap m WHERE s.tenant_id = m.old_id;
UPDATE suppliers s SET tenant_id = m.new_id FROM id_remap m WHERE s.tenant_id = m.old_id;
UPDATE purchases p SET tenant_id = m.new_id FROM id_remap m WHERE p.tenant_id = m.old_id;
UPDATE supplier_ledger sl SET tenant_id = m.new_id FROM id_remap m WHERE sl.tenant_id = m.old_id;
UPDATE day_closings d SET tenant_id = m.new_id FROM id_remap m WHERE d.tenant_id = m.old_id;
UPDATE stock_transfers st SET tenant_id = m.new_id FROM id_remap m WHERE st.tenant_id = m.old_id;
UPDATE audit_log a SET tenant_id = m.new_id FROM id_remap m WHERE a.tenant_id = m.old_id;
UPDATE pending_requests pr SET tenant_id = m.new_id FROM id_remap m WHERE pr.tenant_id = m.old_id;
UPDATE admin_audit_log a SET tenant_id = m.new_id FROM id_remap m WHERE a.tenant_id = m.old_id;

-- branch_id columns
UPDATE batches b SET branch_id = m.new_id FROM id_remap m WHERE b.branch_id = m.old_id;
UPDATE customers c SET branch_id = m.new_id FROM id_remap m WHERE c.branch_id = m.old_id;
UPDATE sales s SET branch_id = m.new_id FROM id_remap m WHERE s.branch_id = m.old_id;
UPDATE purchases p SET branch_id = m.new_id FROM id_remap m WHERE p.branch_id = m.old_id;
UPDATE day_closings d SET branch_id = m.new_id FROM id_remap m WHERE d.branch_id = m.old_id;
UPDATE stock_transfers st SET from_branch_id = m.new_id FROM id_remap m WHERE st.from_branch_id = m.old_id;
UPDATE stock_transfers st SET to_branch_id = m.new_id FROM id_remap m WHERE st.to_branch_id = m.old_id;
UPDATE user_branches ub SET branch_id = m.new_id FROM id_remap m WHERE ub.branch_id = m.old_id;

-- company_id columns
UPDATE products p SET company_id = m.new_id FROM id_remap m WHERE p.company_id = m.old_id;
UPDATE schemes s SET company_id = m.new_id FROM id_remap m WHERE s.company_id = m.old_id;

-- product_id columns
UPDATE batches b SET product_id = m.new_id FROM id_remap m WHERE b.product_id = m.old_id;
UPDATE purchase_items pi SET product_id = m.new_id FROM id_remap m WHERE pi.product_id = m.old_id;

-- batch_id columns
UPDATE sale_items si SET batch_id = m.new_id FROM id_remap m WHERE si.batch_id = m.old_id;
UPDATE stock_transfer_items sti SET batch_id = m.new_id FROM id_remap m WHERE sti.batch_id = m.old_id;

-- customer_id columns
UPDATE sales s SET customer_id = m.new_id FROM id_remap m WHERE s.customer_id = m.old_id;
UPDATE payments p SET customer_id = m.new_id FROM id_remap m WHERE p.customer_id = m.old_id;
UPDATE credit_ledger cl SET customer_id = m.new_id FROM id_remap m WHERE cl.customer_id = m.old_id;

-- Primary keys (leaf → root)
UPDATE schemes s SET id = m.new_id FROM id_remap m WHERE s.id = m.old_id;
UPDATE batches b SET id = m.new_id FROM id_remap m WHERE b.id = m.old_id;
UPDATE products p SET id = m.new_id FROM id_remap m WHERE p.id = m.old_id;
UPDATE companies c SET id = m.new_id FROM id_remap m WHERE c.id = m.old_id;
UPDATE customers c SET id = m.new_id FROM id_remap m WHERE c.id = m.old_id;
UPDATE branches b SET id = m.new_id FROM id_remap m WHERE b.id = m.old_id;
UPDATE tenants t SET id = m.new_id FROM id_remap m WHERE t.id = m.old_id;

SET session_replication_role = DEFAULT;
