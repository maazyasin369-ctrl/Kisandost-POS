import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getDashboardStats } from '@/actions/sales';
import { 
  FileSpreadsheet, 
  Calendar, 
  TrendingUp, 
  Landmark, 
  History, 
  ChevronRight, 
  ArrowRight,
  BarChart3
} from 'lucide-react';

import { createAdminClient } from '@/lib/supabase/admin';

export default async function ReportsHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  const stats = await getDashboardStats(profile.tenant_id);
  const grandTotalSales = stats.monthRevenue;
  const cashSales = stats.todayCash;
  const creditSales = stats.totalOutstandingCredit;

  const reportCards = [
    {
      title: 'Daily Sales Report',
      description: "Detailed daily transaction logs, cash/credit breakdowns, sales by salesman, and comparison to previous periods.",
      href: '/reports/daily',
      icon: Calendar,
      badge: 'Daily',
      color: 'bg-emerald-600',
      lightBg: 'bg-emerald-50 border-emerald-200 text-emerald-800'
    },
    {
      title: 'Monthly & Company Breakdown',
      description: 'Analyze company-wise sales (Bayer, Syngenta, FMC, local brands), profit margins, and MoM growth trends.',
      href: '/reports/monthly',
      icon: TrendingUp,
      badge: 'Monthly',
      color: 'bg-indigo-600',
      lightBg: 'bg-indigo-50 border-indigo-200 text-indigo-800'
    },
    {
      title: 'Day-End Cash Closing',
      description: 'Reconcile drawer cash counted against expected sales, record discrepancies, and lock daily register.',
      href: '/reports/day-closing',
      icon: Landmark,
      badge: 'Register',
      color: 'bg-amber-600',
      lightBg: 'bg-amber-50 border-amber-200 text-amber-800'
    },
    {
      title: 'Sales History & Thermal Receipts',
      description: 'Search, review, re-print 80mm receipts, share WhatsApp summaries, and manage return/void requests.',
      href: '/reports/sales-history',
      icon: History,
      badge: 'Audit',
      color: 'bg-cyan-600',
      lightBg: 'bg-cyan-50 border-cyan-200 text-cyan-800'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <div className="p-2 bg-slate-950 rounded-xl text-yellow-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <span>Reports & Business Analytics Portal</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Access daily counter summaries, company sales distributions, cash drawer reconciliation, and historic registers.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/pos"
            className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Go to POS</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">This Month's Revenue</span>
          <p className="text-xl font-bold text-slate-900 mt-1">Rs. {grandTotalSales.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Today's Cash Collected</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">Rs. {cashSales.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Outstanding Udhaar Credit</span>
          <p className="text-xl font-bold text-amber-600 mt-1">Rs. {creditSales.toLocaleString()}</p>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg text-white ${card.color} shadow-sm`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${card.lightBg}`}>
                    {card.badge}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                  <span>{card.title}</span>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                <span>View Full Details</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
