'use client';

import React from 'react';
import Link from 'next/link';
import AdminShell from '@/components/layout/AdminShell';
import { dataStore } from '@/lib/data-store';
import {
  Building2,
  TrendingUp,
  Store,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Clock,
} from 'lucide-react';

export default function SuperAdminDashboardPage() {
  const tenant = dataStore.getTenant();
  const branches = dataStore.getBranches();
  const sales = dataStore.getSales();
  const profiles = dataStore.getProfiles();

  const totalGmvSales = sales.reduce((sum, s) => sum + s.grand_total, 0);

  return (
    <AdminShell>
      <div className="space-y-7">

        {/* Page Title Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <nav className="flex items-center gap-1.5 text-2xs font-bold text-slate-400 mb-1">
              <span>Super Admin</span>
              <ChevronRight className="w-3 h-3 text-slate-400" strokeWidth={2} />
              <span className="text-slate-900 font-extrabold">SaaS Control Center</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Platform Operations & Multi-Tenant Summary
            </h1>
          </div>

          {/* Solid Action Button */}
          <Link
            href="/admin/tenants"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-semibold text-sm px-5 py-3 rounded-xl shadow-action transition-all transform hover:-translate-y-0.5"
          >
            <Building2 className="w-4 h-4 fill-slate-950" strokeWidth={2} />
            <span>MANAGE ALL TENANTS</span>
          </Link>
        </div>

        {/* Hero Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 bg-slate-800 text-blue-300 text-2xs font-extrabold px-3 py-1 rounded-full border border-slate-700 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>SUPER ADMIN OPERATOR PORTAL</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Global Platform Dashboard
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Overseeing multi-tenant pesticide dealers, SaaS subscriptions, license expirations, and platform GMV sales.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-right">
                <span className="text-2xs font-bold text-slate-400 uppercase block">System Security</span>
                <span className="text-xs font-semibold text-amber-400 font-mono">Operator Token Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Light KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Registered Shops */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-2xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Registered Dealers</p>
                <p className="text-2xl font-semibold text-slate-900 tabular-nums tracking-tight leading-none mb-1.5">1 Active Shop</p>
                <p className="text-2xs font-bold text-blue-600">{tenant.business_name}</p>
              </div>
              <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
                <Building2 className="w-5 h-5" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Outlets */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-2xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Branch Outlets</p>
                <p className="text-2xl font-semibold text-slate-900 tabular-nums tracking-tight leading-none mb-1.5">{branches.length} Outlets</p>
                <p className="text-2xs font-bold text-amber-700">Multan Region Outlets</p>
              </div>
              <div className="p-3 bg-amber-600 text-white rounded-xl shadow-xs shrink-0">
                <Store className="w-5 h-5" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Platform GMV */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-2xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Platform GMV Sales</p>
                <p className="text-2xl font-semibold text-slate-900 tabular-nums tracking-tight leading-none mb-1.5">Rs. {totalGmvSales.toLocaleString()}</p>
                <p className="text-2xs font-bold text-indigo-600">Counter POS Receipts</p>
              </div>
              <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
                <TrendingUp className="w-5 h-5" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Users */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-2xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Staff & Users</p>
                <p className="text-2xl font-semibold text-slate-900 tabular-nums tracking-tight leading-none mb-1.5">{profiles.length} Active Users</p>
                <p className="text-2xs font-bold text-purple-700">Role Assignments Active</p>
              </div>
              <div className="p-3 bg-purple-600 text-white rounded-xl shadow-xs shrink-0">
                <Users className="w-5 h-5" strokeWidth={2} />
              </div>
            </div>
          </div>

        </div>

        {/* Tenant Shop Management Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-600 text-white rounded-lg">
                <Building2 className="w-4 h-4" strokeWidth={2} />
              </div>
              <h2 className="font-extrabold text-base text-slate-900">Registered Pesticide Dealers Portfolio</h2>
            </div>
            <span className="bg-blue-600 text-white text-2xs font-semibold px-3 py-1 rounded-md shadow-xs">
              SaaS Active
            </span>
          </div>

          {/* Solid Card Detail */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900 text-base">{tenant.business_name}</span>
                <span className="bg-blue-100 text-blue-800 border border-blue-200 text-2xs font-extrabold px-2.5 py-0.5 rounded-full">
                  {tenant.subscription_status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Owner: <strong className="text-slate-900">{tenant.owner_name}</strong> ({tenant.phone}) | License: <strong className="text-amber-700 font-mono">{tenant.dealer_license_number}</strong> | City: <strong className="text-slate-900">{tenant.city}</strong>
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/admin/tenants"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <span>Manage Subscription & License</span>
                <ArrowRight className="w-4 h-4 text-amber-400" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Operator Actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <p className="text-2xs font-extrabold uppercase tracking-widest text-slate-500">Operator Platform Shortcuts</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/tenants"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all transform active:scale-95"
            >
              <Building2 className="w-4 h-4" />
              <span>Tenant Portfolio</span>
            </Link>
            <Link
              href="/admin/audit-logs"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs transition-all transform active:scale-95"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Platform Audit Logs</span>
            </Link>
            <Link
              href="/pos"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all transform active:scale-95"
            >
              <Store className="w-4 h-4" />
              <span>Test Counter POS</span>
            </Link>
          </div>
        </div>

      </div>
    </AdminShell>
  );
}
