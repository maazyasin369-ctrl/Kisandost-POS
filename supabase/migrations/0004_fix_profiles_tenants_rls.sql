-- 0004_fix_profiles_tenants_rls.sql
-- Ensure authenticated users can read profiles and tenants without RLS blocking

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_features DISABLE ROW LEVEL SECURITY;
