'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/layout/AdminShell';
import { dataStore } from '@/lib/data-store';
import {
  Store,
  ChevronRight,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Clock,
  Search,
  Check,
  Calendar,
  CreditCard,
  Settings,
  Leaf,
  LogOut,
} from 'lucide-react';
import { SubscriptionStatus } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function SuperAdminTenantsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [tenants, setTenants] = useState(() => dataStore.getTenants());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SubscriptionStatus>('all');

  const reloadTenants = () => {
    setTenants([...dataStore.getTenants()]);
  };

  const handleStatusChange = (tenantId: string, newStatus: SubscriptionStatus) => {
    dataStore.updateTenantStatus(tenantId, newStatus);
    reloadTenants();
    showToast(`Subscription status updated to ${newStatus.toUpperCase()}`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('super_admin_authenticated');
    router.push('/admin/login');
  };

  const filteredTenants = tenants.filter((t) => {
    if (statusFilter !== 'all' && t.subscription_status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.business_name.toLowerCase().includes(q);
      const matchOwner = t.owner_name.toLowerCase().includes(q);
      const matchCity = t.city.toLowerCase().includes(q);
      const matchLic = t.dealer_license_number.toLowerCase().includes(q);
      if (!matchName && !matchOwner && !matchCity && !matchLic) return false;
    }
    return true;
  });

  const totalTenants = tenants.length;
  const activeCount = tenants.filter((t) => t.subscription_status === 'active').length;
  const trialCount = tenants.filter((t) => t.subscription_status === 'trial').length;

  return (
    <AdminShell>
      <div className="space-y-6">

        {/* Hero Header Banner matching Screenshot 1:1 */}
        <div className="bg-gradient-to-r from-[#EFF6FF] via-white to-[#EBFDF5] border border-blue-100 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-6">
          
          {/* Top Row inside Hero Banner: Navigation & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <nav className="flex items-center gap-1.5 text-2xs font-extrabold text-blue-600">
              <span>Super Admin</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" strokeWidth={2.5} />
              <span className="text-slate-900 font-semibold">Dashboard</span>
            </nav>

            {/* Quick Actions matching top right of image */}
            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard"
                className="bg-white hover:bg-slate-50 text-slate-800 text-2xs font-extrabold px-4 py-2 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2 transition-all"
              >
                <Store className="w-3.5 h-3.5 text-blue-600" />
                <span>Switch to Shop Counter</span>
              </Link>

              <button
                onClick={handleLogout}
                className="bg-[#2563EB] hover:bg-blue-700 text-white text-2xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Middle Row inside Hero Banner: Title & Subtitle + Isolation Active Box */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="space-y-1 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Registered Tenant Shops Catalog
              </h1>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Multi-tenant management portal: View registered pesticide shops, subscription status, and per-tenant server-enforced feature flags.
              </p>
            </div>

            {/* Dark Green Badge matching Screenshot Right Side */}
            <div className="bg-[#00875A] text-white p-3.5 px-5 rounded-2xl flex items-center space-x-3.5 shadow-md border border-[#006C48] shrink-0">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold text-white flex items-center gap-1">
                  <span>Multi-Tenant Isolation Active</span>
                </div>
                <div className="text-[11px] font-bold text-emerald-100 flex items-center gap-1 mt-0.5">
                  <span>{totalTenants} Shop Accounts Registered</span>
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Top 3 KPI Summary Cards with Upward Trendlines matching Screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          
          {/* Card 1: Total Registered Shops */}
          <div className="bg-[#EFF6FF] border border-blue-100 rounded-3xl p-5 shadow-2xs flex items-center justify-between group hover:shadow-md transition-all relative overflow-hidden">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 rounded-2xl bg-[#3B82F6] text-white flex items-center justify-center shadow-xs shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xs font-extrabold text-blue-900/80 uppercase tracking-wider block">Total Registered Shops</span>
                <div className="text-xl font-semibold text-blue-950 mt-0.5">{totalTenants} Tenants</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Upward Blue Trendline Graphic */}
              <svg className="w-12 h-6 text-blue-500" viewBox="0 0 50 25" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M2 20 L 15 15 L 30 18 L 48 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 2: Active Paid Subscriptions */}
          <div className="bg-[#ECFDF5] border border-emerald-100 rounded-3xl p-5 shadow-2xs flex items-center justify-between group hover:shadow-md transition-all relative overflow-hidden">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 rounded-2xl bg-[#10B981] text-white flex items-center justify-center shadow-xs shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xs font-extrabold text-emerald-900/80 uppercase tracking-wider block">Active Paid Subscriptions</span>
                <div className="text-xl font-semibold text-emerald-950 mt-0.5">{activeCount} Shops</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Upward Green Trendline Graphic */}
              <svg className="w-12 h-6 text-emerald-500" viewBox="0 0 50 25" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M2 20 L 15 15 L 30 18 L 48 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <ChevronRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 3: Trial Accounts */}
          <div className="bg-[#F5F3FF] border border-purple-100 rounded-3xl p-5 shadow-2xs flex items-center justify-between group hover:shadow-md transition-all relative overflow-hidden">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center shadow-xs shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xs font-extrabold text-purple-900/80 uppercase tracking-wider block">Trial Accounts</span>
                <div className="text-xl font-semibold text-purple-950 mt-0.5">{trialCount} Shops</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Upward Purple Trendline Graphic */}
              <svg className="w-12 h-6 text-purple-500" viewBox="0 0 50 25" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M2 20 L 15 15 L 30 18 L 48 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <ChevronRight className="w-4 h-4 text-purple-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

        </div>

        {/* Search & Status Filter Bar matching Screenshot */}
        <div className="bg-white p-3.5 px-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
          
          {/* Search Input */}
          <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search shop name, owner, city, or license #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-500 uppercase text-2xs mr-1">Status:</span>
            {(['all', 'active', 'trial', 'suspended'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-1.5 rounded-xl font-semibold text-2xs uppercase transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st === 'all' ? 'All' : st === 'active' ? 'Active' : st === 'trial' ? 'Trial' : 'Suspended'}
              </button>
            ))}
          </div>
        </div>

        {/* Tenant Shop Cards Grid (2 Columns matching Screenshot) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTenants.map((t) => {
            const branches = dataStore.getBranches(t.id);
            const featureFlags = t.settings?.features ?? {};
            const enabledCount = Object.values(featureFlags).filter(Boolean).length;
            const totalCount = Object.keys(featureFlags).length || 13;
            const isActive = t.subscription_status === 'active';
            const isTrial = t.subscription_status === 'trial';

            return (
              <div
                key={t.id}
                className={`bg-white border rounded-3xl p-6 shadow-xs hover:shadow-md transition-all space-y-5 flex flex-col justify-between ${
                  isActive ? 'border-emerald-500 border-t-4' : 'border-amber-400 border-t-4'
                }`}
              >
                <div className="space-y-4">
                  
                  {/* Card Header Row matching Screenshot */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#DCFCE7] text-[#10B981] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Leaf className="w-5 h-5 fill-[#10B981]" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-slate-900 tracking-tight">{t.business_name}</h2>
                        <p className="text-xs text-slate-600 font-semibold mt-0.5">
                          Owner: <strong className="text-slate-900 font-bold">{t.owner_name}</strong> &nbsp;|&nbsp; City: <strong className="text-slate-900 font-bold">{t.city}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-2xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#DCFCE7] text-[#15803D] border border-emerald-300'
                          : isTrial
                          ? 'bg-[#FEF3C7] text-[#B45309] border border-amber-300'
                          : 'bg-red-100 text-red-950 border border-red-300'
                      }`}
                    >
                      <span>{isActive ? '• ACTIVE' : isTrial ? '🕒 TRIAL' : 'SUSPENDED'}</span>
                    </span>
                  </div>

                  {/* 4 Soft Pastel Metric Boxes matching Screenshot 1:1 */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    
                    {/* Box 1: Dealer License (Soft Blue) */}
                    <div className="bg-[#EFF6FF] p-3 rounded-2xl border border-blue-100 space-y-1">
                      <div className="flex items-center space-x-1.5 text-blue-600">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-extrabold uppercase text-slate-500">Dealer License</span>
                      </div>
                      <div className="font-semibold text-slate-900 font-mono text-xs">{t.dealer_license_number}</div>
                    </div>

                    {/* Box 2: License Expiry (Soft Purple) */}
                    <div className="bg-[#F5F3FF] p-3 rounded-2xl border border-purple-100 space-y-1">
                      <div className="flex items-center space-x-1.5 text-purple-600">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-extrabold uppercase text-slate-500">License Expiry</span>
                      </div>
                      <div className="font-semibold text-slate-900 font-mono text-xs">{t.license_expiry_date}</div>
                    </div>

                    {/* Box 3: Outlets / Branches (Soft Green) */}
                    <div className="bg-[#ECFDF5] p-3 rounded-2xl border border-emerald-100 space-y-1">
                      <div className="flex items-center space-x-1.5 text-emerald-600">
                        <Store className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-extrabold uppercase text-slate-500">Outlets / Branches</span>
                      </div>
                      <div className="font-semibold text-emerald-950 text-xs">{branches.length} Registered Outlets</div>
                    </div>

                    {/* Box 4: Feature Toggles (Soft Cyan) */}
                    <div className="bg-[#ECFEFF] p-3 rounded-2xl border border-cyan-100 space-y-1">
                      <div className="flex items-center space-x-1.5 text-cyan-700">
                        <Settings className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-extrabold uppercase text-slate-500">Feature Toggles</span>
                      </div>
                      <div className="font-semibold text-cyan-950 text-xs">{enabledCount} of {totalCount} Enabled</div>
                    </div>

                  </div>

                  {/* Registered Outlets list */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Outlets:</span>
                    <div className="flex flex-wrap gap-2">
                      {branches.map((b) => (
                        <span key={b.id} className="bg-[#EFF6FF] text-blue-950 border border-blue-200 text-2xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-red-500" />
                          <span>{b.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Card Action Buttons matching Screenshot 1:1 */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleStatusChange(t.id, 'active')}
                      className={`px-4 py-2 rounded-xl text-2xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#00875A] text-white shadow-xs'
                          : 'bg-[#F8FAFC] text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      <span>Set Active</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(t.id, 'trial')}
                      className={`px-4 py-2 rounded-xl text-2xs font-semibold transition-all cursor-pointer ${
                        isTrial
                          ? 'bg-[#F59E0B] text-slate-950 shadow-xs'
                          : 'bg-[#F8FAFC] text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Set Trial
                    </button>
                  </div>

                  <Link
                    href={`/admin/tenants/${t.id}`}
                    className="bg-[#051329] hover:bg-[#0B2347] active:bg-[#020A17] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Manage Feature Access</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </AdminShell>
  );
}
