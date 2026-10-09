'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Building2,
  FileSpreadsheet,
  Settings,
  ArrowLeftRight,
  Landmark,
  Store,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { dataStore } from '@/lib/data-store';

export default function HeaderNav() {
  const pathname = usePathname();
  const tenant = dataStore.getTenant();
  const branches = dataStore.getBranches();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/pos', label: 'POS Checkout', icon: ShoppingCart, highlight: true },
    { href: '/inventory', label: 'Inventory & FEFO', icon: Package },
    { href: '/purchases', label: 'Purchases PO', icon: Store },
    { href: '/transfers', label: 'Branch Transfers', icon: ArrowLeftRight },
    { href: '/schemes', label: 'Schemes & Bonuses', icon: ShieldCheck },
    { href: '/customers', label: 'Farmers (Udhaar)', icon: Users },
    { href: '/suppliers', label: 'Suppliers', icon: Building2 },
    { href: '/reports/day-closing', label: 'Day Closing', icon: Landmark },
    { href: '/reports', label: 'Reports Hub', icon: FileSpreadsheet },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-primary text-primary-foreground shadow-md border-b border-emerald-800">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary text-white p-2 rounded-lg font-bold text-xl flex items-center gap-2">
            <Store className="h-6 w-6" />
            <span>KisanDost POS</span>
          </div>
          <div className="hidden md:block pl-3 border-l border-emerald-800">
            <h1 className="text-sm font-semibold text-emerald-100">{tenant.business_name}</h1>
            <p className="text-xs text-emerald-300">License: {tenant.dealer_license_number} | {tenant.city}</p>
          </div>
        </div>

        {/* Branch Mode & Switcher (Section 2 & 9) */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-primary border border-emerald-700 rounded-md px-3 py-1.5 text-xs text-emerald-200">
            <span className="text-primary font-medium mr-2">Branch View:</span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-primary text-primary-foreground">🌐 Consolidated (All Branches)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id} className="bg-primary text-primary-foreground">📍 {b.name}</option>
              ))}
            </select>
          </div>

          <div className="hidden lg:flex items-center space-x-2 bg-primary/60 px-3 py-1.5 rounded-full border border-emerald-700/50">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-xs text-emerald-200 font-medium">{tenant.owner_name} (Owner)</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="bg-primary border-t border-emerald-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    item.highlight
                      ? 'bg-primary text-primary-foreground hover:opacity-90 font-semibold shadow-[var(--kd-shadow)]'
                      : isActive
                      ? 'bg-emerald-800 text-white border-b-2 border-amber-400'
                      : 'text-emerald-200 hover:opacity-90/60 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
