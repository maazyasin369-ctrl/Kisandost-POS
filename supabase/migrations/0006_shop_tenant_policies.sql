-- Shop users could not read stock, sale lines, companies, or ledgers.
-- Those tables had RLS enabled and no policies, so every query returned zero rows.
-- Batches were also limited to user_branches, which has no rows for shop owners.

CREATE OR REPLACE FUNCTION public.same_tenant(row_tenant uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT row_tenant IS NOT NULL
    AND (
      row_tenant = public.current_tenant_id()
      OR public.current_user_role() = 'super_admin'
    );
$$;

REVOKE ALL ON FUNCTION public.same_tenant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.same_tenant(uuid) TO authenticated;

DROP POLICY IF EXISTS tenant_isolation_batches ON public.batches;
CREATE POLICY tenant_isolation_batches ON public.batches
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.branches b
      WHERE b.id = batches.branch_id
        AND (SELECT public.same_tenant(b.tenant_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.branches b
      WHERE b.id = batches.branch_id
        AND (SELECT public.same_tenant(b.tenant_id))
    )
  );

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'companies',
    'credit_ledger',
    'payments',
    'suppliers',
    'purchases',
    'supplier_ledger',
    'schemes',
    'day_closings',
    'stock_transfers',
    'audit_log'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation_%I ON public.%I FOR ALL TO authenticated USING ((SELECT public.same_tenant(tenant_id))) WITH CHECK ((SELECT public.same_tenant(tenant_id)))',
      tbl, tbl
    );
  END LOOP;
END $$;

DROP POLICY IF EXISTS tenant_isolation_sale_items ON public.sale_items;
CREATE POLICY tenant_isolation_sale_items ON public.sale_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_items.sale_id
        AND (SELECT public.same_tenant(s.tenant_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_items.sale_id
        AND (SELECT public.same_tenant(s.tenant_id))
    )
  );

DROP POLICY IF EXISTS tenant_isolation_sale_returns ON public.sale_returns;
CREATE POLICY tenant_isolation_sale_returns ON public.sale_returns
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_returns.sale_id
        AND (SELECT public.same_tenant(s.tenant_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_returns.sale_id
        AND (SELECT public.same_tenant(s.tenant_id))
    )
  );

DROP POLICY IF EXISTS tenant_isolation_purchase_items ON public.purchase_items;
CREATE POLICY tenant_isolation_purchase_items ON public.purchase_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchases p
      WHERE p.id = purchase_items.purchase_id
        AND (SELECT public.same_tenant(p.tenant_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.purchases p
      WHERE p.id = purchase_items.purchase_id
        AND (SELECT public.same_tenant(p.tenant_id))
    )
  );

DROP POLICY IF EXISTS tenant_isolation_stock_transfer_items ON public.stock_transfer_items;
CREATE POLICY tenant_isolation_stock_transfer_items ON public.stock_transfer_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stock_transfers t
      WHERE t.id = stock_transfer_items.transfer_id
        AND (SELECT public.same_tenant(t.tenant_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stock_transfers t
      WHERE t.id = stock_transfer_items.transfer_id
        AND (SELECT public.same_tenant(t.tenant_id))
    )
  );

DROP POLICY IF EXISTS user_branches_own ON public.user_branches;
CREATE POLICY user_branches_own ON public.user_branches
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.branches b
      WHERE b.id = user_branches.branch_id
        AND (SELECT public.same_tenant(b.tenant_id))
    )
  );
