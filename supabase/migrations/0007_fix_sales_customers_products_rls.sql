-- Align sales/customers/products RLS with same_tenant() so shop history reads work reliably
DROP POLICY IF EXISTS tenant_isolation_sales ON public.sales;
CREATE POLICY tenant_isolation_sales ON public.sales
  FOR ALL TO authenticated
  USING ((SELECT public.same_tenant(tenant_id)))
  WITH CHECK ((SELECT public.same_tenant(tenant_id)));

DROP POLICY IF EXISTS tenant_isolation_customers ON public.customers;
CREATE POLICY tenant_isolation_customers ON public.customers
  FOR ALL TO authenticated
  USING ((SELECT public.same_tenant(tenant_id)))
  WITH CHECK ((SELECT public.same_tenant(tenant_id)));

DROP POLICY IF EXISTS tenant_isolation_products ON public.products;
CREATE POLICY tenant_isolation_products ON public.products
  FOR ALL TO authenticated
  USING ((SELECT public.same_tenant(tenant_id)))
  WITH CHECK ((SELECT public.same_tenant(tenant_id)));
