'use client';

import React from 'react';
import { dataStore } from '@/lib/data-store';
import { Settings, ShieldCheck, Building2, Store, Users, FileText } from 'lucide-react';

export default function SettingsPage() {
  const tenant = dataStore.getTenant();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
          <div className="p-2 bg-slate-950 rounded-xl text-yellow-400">
            <Settings className="h-5 w-5" />
          </div>
          <span>SaaS Tenant Settings & Shop Profile</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Manage shop dealer license details, subscription status, and consolidated vs per-branch reporting modes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="font-extrabold text-base text-slate-900 flex items-center space-x-2 border-b pb-2">
            <Store className="h-5 w-5 text-emerald-700" />
            <span>Pesticide License & Business Details</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 font-bold mb-0.5">Shop Business Name:</label>
              <div className="font-extrabold text-slate-900 text-sm">{tenant.business_name}</div>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-0.5">Owner Name:</label>
              <div className="font-bold text-slate-800">{tenant.owner_name}</div>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-0.5">Agri Dealer License Number:</label>
              <div className="font-mono font-bold text-emerald-800">{tenant.dealer_license_number}</div>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-0.5">License Expiry Date:</label>
              <div className="font-bold text-slate-800">{tenant.license_expiry_date}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="font-extrabold text-base text-slate-900 flex items-center space-x-2 border-b pb-2">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
            <span>SaaS Subscription & Multi-Branch Mode</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 font-bold mb-0.5">Subscription Status:</label>
              <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded uppercase">
                {tenant.subscription_status} Plan
              </span>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-0.5">Branch View Mode Configuration:</label>
              <select
                defaultValue={tenant.settings.branch_mode}
                className="w-full p-2 border border-slate-300 rounded font-bold bg-slate-50"
              >
                <option value="consolidated">🌐 Consolidated (All Branches Combined)</option>
                <option value="independent">📍 Independent (Per-Branch Isolation)</option>
                <option value="hybrid">⚡ Hybrid (Owner Choice)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
