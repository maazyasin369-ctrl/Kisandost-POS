-- 0005_reenable_core_rls.sql
-- Fix Security Advisor: "RLS Disabled in Public" on tenants, branches, profiles, tenant_features
-- Root cause: 0004 disabled RLS as a temporary login workaround.
-- service_role (admin client) continues to bypass RLS.

-- Helper: avoid recursive RLS when policies on profiles need tenant_id
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

REVOKE ALL ON FUNCTION public.current_tenant_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

-- ─── Re-enable RLS ──────────────────────────────────────────────────────────
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_features ENABLE ROW LEVEL SECURITY;

-- Drop old policies if re-running
DROP POLICY IF EXISTS tenants_select_own ON public.tenants;
DROP POLICY IF EXISTS tenants_update_own ON public.tenants;
DROP POLICY IF EXISTS branches_select_own ON public.branches;
DROP POLICY IF EXISTS branches_write_own ON public.branches;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS tenant_features_select_own ON public.tenant_features;
DROP POLICY IF EXISTS tenant_features_super_admin_all ON public.tenant_features;

-- ─── tenants ────────────────────────────────────────────────────────────────
CREATE POLICY tenants_select_own ON public.tenants
  FOR SELECT TO authenticated
  USING (
    id = public.current_tenant_id()
    OR public.current_user_role() = 'super_admin'
  );

CREATE POLICY tenants_update_own ON public.tenants
  FOR UPDATE TO authenticated
  USING (
    id = public.current_tenant_id()
    AND public.current_user_role() IN ('owner', 'super_admin')
  )
  WITH CHECK (
    id = public.current_tenant_id()
    AND public.current_user_role() IN ('owner', 'super_admin')
  );

-- ─── branches ───────────────────────────────────────────────────────────────
CREATE POLICY branches_select_own ON public.branches
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    OR public.current_user_role() = 'super_admin'
  );

CREATE POLICY branches_write_own ON public.branches
  FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND public.current_user_role() IN ('owner', 'branch_manager', 'super_admin')
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.current_user_role() IN ('owner', 'branch_manager', 'super_admin')
  );

-- ─── profiles ───────────────────────────────────────────────────────────────
-- Users can read themselves + coworkers in same tenant; super_admin reads all
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR tenant_id = public.current_tenant_id()
    OR public.current_user_role() = 'super_admin'
  );

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_user_role() IN ('owner', 'super_admin')
    )
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_user_role() IN ('owner', 'super_admin')
    )
  );

-- ─── tenant_features ────────────────────────────────────────────────────────
CREATE POLICY tenant_features_select_own ON public.tenant_features
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    OR public.current_user_role() = 'super_admin'
  );

-- Feature flags are platform-controlled; only super_admin mutates via authenticated role
CREATE POLICY tenant_features_super_admin_all ON public.tenant_features
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');
