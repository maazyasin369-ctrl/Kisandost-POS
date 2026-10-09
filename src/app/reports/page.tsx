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
import { ShopStats } from '@/components/dashboard/ShopStats';

export default async function ReportsHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle();

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
      color: 'bg-primary',
      lightBg: 'bg-[var(--kd-primary-soft)] border-primary/20 text-primary'
    },
    {
      title: 'Monthly & Company Breakdown',
      description: 'Analyze company-wise sales (Bayer, Syngenta, FMC, local brands), profit margins, and MoM growth trends.',
      href: '/reports/monthly',
      icon: TrendingUp,
      badge: 'Monthly',
      color: 'bg-accent',
      lightBg: 'bg-[var(--kd-accent-soft)] border-accent/20 text-accent'
    },
    {
      title: 'Day-End Cash Closing',
      description: 'Reconcile drawer cash counted against expected sales, record discrepancies, and lock daily register.',
      href: '/reports/day-closing',
      icon: Landmark,
      badge: 'Register',
      color: 'bg-primary',
      lightBg: 'bg-[var(--kd-primary-soft)] border-primary/20 text-primary'
    },
    {
      title: 'Sales History & Thermal Receipts',
      description: 'Search, review, re-print 80mm receipts, share WhatsApp summaries, and manage return/void requests.',
      href: '/reports/sales-history',
      icon: History,
      badge: 'Audit',
      color: 'bg-accent',
      lightBg: 'bg-[var(--kd-accent-soft)] border-accent/20 text-accent'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--kd-surface)] p-6 rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center space-x-2.5">
            <div className="p-2 bg-foreground rounded-xl text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <span>Reports & Business Analytics Portal</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
            Access daily counter summaries, company sales distributions, cash drawer reconciliation, and historic registers.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/pos"
            className="bg-primary text-primary-foreground hover:opacity-90 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-[var(--kd-shadow)] transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Go to POS</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <ShopStats
        items={[
          { icon: 'trend', label: 'This month', value: `Rs. ${grandTotalSales.toLocaleString()}`, hint: 'Completed sales', spark: [cashSales, creditSales, grandTotalSales] },
          { icon: 'cash', label: "Today's cash", value: `Rs. ${cashSales.toLocaleString()}`, hint: 'Collected at the counter', spark: [cashSales, cashSales] },
          { icon: 'udhaar', tone: 'accent', label: 'Outstanding udhaar', value: `Rs. ${creditSales.toLocaleString()}`, hint: 'Still owed', spark: [creditSales, creditSales] },
        ]}
      />

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group bg-[var(--kd-surface)] p-6 rounded-xl shadow-[var(--kd-shadow)] border border-border hover:shadow-md hover:border-primary transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg text-white ${card.color} shadow-[var(--kd-shadow)]`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${card.lightBg}`}>
                    {card.badge}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                  <span>{card.title}</span>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
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
