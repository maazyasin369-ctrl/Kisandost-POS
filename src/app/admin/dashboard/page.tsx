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
  CreditCard,
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
            <nav className="flex items-center gap-1.5 text-2xs font-medium text-slate-400 mb-1">
              <span>Super Admin</span>
              <ChevronRight className="w-3 h-3 text-slate-400" strokeWidth={2} />
              <span className="text-slate-900 font-semibold">SaaS Control Center</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Platform Operations & Multi-Tenant Summary
            </h1>
          </div>

          {/* Solid Action Button */}
          <Link
            href="/admin/tenants"
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-semibold text-sm px-5 py-3 rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5"
          >
            <Building2 className="w-4 h-4 fill-slate-950 text-slate-950" strokeWidth={2} />
            <span>MANAGE ALL TENANTS</span>
          </Link>
        </div>

        {/* Hero Banner */}
        <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden border border-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 bg-slate-900 text-amber-400 text-2xs font-semibold px-3 py-1 rounded-full border border-slate-800 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>SUPER ADMIN OPERATOR PORTAL</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                Global Platform Dashboard
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-normal">
                Overseeing multi-tenant pesticide dealers, SaaS subscriptions, license expirations, and platform GMV sales.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-right">
                <span className="text-2xs font-medium text-slate-400 uppercase block">System Security</span>
                <span className="text-xs font-semibold text-amber-400 font-mono">Operator Token Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Light KPI Cards Grid (Green for Active/Sales, Amber for Trial) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Registered Shops (Green) */}
          <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-2xs font-medium uppercase tracking-widest text-emerald-900/80 mb-2">Registered Dealers</p>
                <p className="text-2xl font-semibold text-emerald-950 tabular-nums tracking-tight leading-none mb-1.5">1 Active Shop</p>
                <p className="text-2xs font-medium text-emerald-800">{tenant.business_name}</p>
              </div>
              <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                <Building2 className="w-5 h-5" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Outlets (Green) */}
          <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-2xs font-medium uppercase tracking-widest text-emerald-900/80 mb-2">Branch Outlets</p>
                <p className="text-2xl font-semibold text-emerald-950 tabular-nums tracking-tight leading-none mb-1.5">{branches.length} Outlets</p>
                <p className="text-2xs font-medium text-emerald-800">Multan Region Outlets</p>
              </div>
              <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                <Store className="w-5 h-5" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Platform GMV (Green) */}
          <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-2xs font-medium uppercase tracking-widest text-emerald-900/80 mb-2">Platform GMV Sales</p>
                <p className="text-2xl font-semibold text-emerald-950 tabular-nums tracking-tight leading-none mb-1.5">Rs. {totalGmvSales.toLocaleString()}</p>
                <p className="text-2xs font-medium text-emerald-800">Counter POS Receipts</p>
              </div>
              <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                <TrendingUp className="w-5 h-5" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Trial Accounts (Amber) */}
          <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-2xs font-medium uppercase tracking-widest text-amber-900/80 mb-2">Trial Accounts</p>
                <p className="text-2xl font-semibold text-amber-950 tabular-nums tracking-tight leading-none mb-1.5">{profiles.length} Active Users</p>
                <p className="text-2xs font-medium text-amber-800">Role Assignments Active</p>
              </div>
              <div className="p-3 bg-amber-500 text-slate-950 rounded-xl shadow-xs shrink-0">
                <Users className="w-5 h-5" strokeWidth={2} />
              </div>
            </div>
          </div>

        </div>

        {/* Upcoming & Overdue Tenant Billing Notifications Widget */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-slate-950 text-amber-400 rounded-lg">
                <CreditCard className="w-4 h-4" strokeWidth={2} />
              </div>
              <div>
                <h2 className="font-semibold text-base text-slate-900">Upcoming &amp; Overdue Tenant Billing</h2>
                <p className="text-2xs text-slate-500 font-normal">Real-time alerts for tenant recurring billing dues and overdue charges</p>
              </div>
            </div>
            <Link
              href="/admin/tenants"
              className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1"
            >
              <span>View All Tenants</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataStore.getAdminNotifications().map((notif) => {
              const isOverdue = notif.severity === 'overdue';
              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border space-y-2 flex flex-col justify-between ${
                    isOverdue ? 'bg-red-50/80 border-red-200 text-red-950' : 'bg-amber-50/80 border-amber-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      isOverdue ? 'bg-red-600 text-white' : 'bg-amber-400 text-slate-950'
                    }`}>
                      {isOverdue ? '🔴 OVERDUE ESCALATION' : '🕒 DUE SOON'}
                    </span>
                    <span className="text-xs font-mono font-semibold">
                      Due: {notif.due_date}
                    </span>
                  </div>

                  <p className="text-xs font-semibold leading-snug">
                    {notif.message}
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-emerald-800">
                      Rs. {notif.amount.toLocaleString()}
                    </span>
                    <Link
                      href={notif.link_url}
                      className="bg-slate-950 hover:bg-slate-800 text-amber-400 font-semibold text-2xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <span>Open Billing Tab</span>
                      <ArrowRight className="w-3 h-3 text-amber-400" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tenant Shop Management Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-slate-950 text-white rounded-lg">
                <Building2 className="w-4 h-4" strokeWidth={2} />
              </div>
              <h2 className="font-semibold text-base text-slate-900">Registered Pesticide Dealers Portfolio</h2>
            </div>
            <span className="bg-amber-400 text-slate-950 text-2xs font-semibold px-3 py-1 rounded-md shadow-2xs">
              SaaS Active
            </span>
          </div>

          {/* Solid Card Detail */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900 text-base">{tenant.business_name}</span>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-2xs font-semibold px-2.5 py-0.5 rounded-full">
                  {tenant.subscription_status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-normal">
                Owner: <strong className="text-slate-900 font-semibold">{tenant.owner_name}</strong> ({tenant.phone}) | License: <strong className="text-slate-900 font-mono font-semibold">{tenant.dealer_license_number}</strong> | City: <strong className="text-slate-900 font-semibold">{tenant.city}</strong>
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/admin/tenants"
                className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <span>Manage Subscription &amp; License</span>
                <ArrowRight className="w-4 h-4 text-amber-400" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Operator Actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <p className="text-2xs font-medium uppercase tracking-widest text-slate-500">Operator Platform Shortcuts</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/tenants"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition-all transform active:scale-95"
            >
              <Building2 className="w-4 h-4" />
              <span>Tenant Portfolio</span>
            </Link>
            <Link
              href="/admin/audit-logs"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-semibold shadow-xs transition-all transform active:scale-95"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Platform Audit Logs</span>
            </Link>
            <Link
              href="/pos"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all transform active:scale-95"
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
