'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dataStore } from '@/lib/data-store';
import {
  LayoutDashboard,
  ShoppingCart,
  History,
  Users,
  Package,
  Truck,
  Building2,
  ArrowLeftRight,
  Tag,
  CalendarDays,
  TrendingUp,
  BookOpen,
  Settings2,
  UserCheck,
  MapPin,
  CreditCard,
  FileBarChart2,
  ChevronDown,
  X,
  Leaf,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  isPrimary?: boolean;
}

interface NavGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: 'overview',
    title: 'Overview',
    icon: LayoutDashboard,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    id: 'sales',
    title: 'Sales & Udhaar',
    icon: ShoppingCart,
    items: [
      { href: '/pos', label: 'POS Counter', icon: ShoppingCart, isPrimary: true },
      { href: '/reports/sales-history', label: 'Sales History', icon: History },
      { href: '/customers', label: 'Farmers / Ledger', icon: Users },
      { href: '/credit', label: 'Udhaar Register', icon: CreditCard },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory & Stock',
    icon: Package,
    items: [
      { href: '/inventory', label: 'Stock & FEFO Batches', icon: Package },
      { href: '/purchases', label: 'Purchase Orders', icon: Truck },
      { href: '/suppliers', label: 'Suppliers', icon: Building2 },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    icon: ArrowLeftRight,
    items: [
      { href: '/transfers', label: 'Branch Transfers', icon: ArrowLeftRight },
      { href: '/schemes', label: 'Trade Schemes', icon: Tag },
    ],
  },
  {
    id: 'reports',
    title: 'Reports & Audit',
    icon: FileBarChart2,
    items: [
      { href: '/reports', label: 'Reports Hub', icon: FileBarChart2 },
      { href: '/reports/daily', label: 'Daily Sales', icon: CalendarDays },
      { href: '/reports/monthly', label: 'Monthly / Company', icon: TrendingUp },
      { href: '/reports/day-closing', label: 'Day Closing', icon: BookOpen },
    ],
  },
];

const settingsGroup: NavGroup = {
  id: 'settings',
  title: 'System Settings',
  icon: Settings2,
  items: [
    { href: '/settings/users', label: 'Users & Roles', icon: UserCheck },
    { href: '/branches', label: 'Branch Locations', icon: MapPin },
    { href: '/settings/companies', label: 'Company Catalog', icon: Building2 },
    { href: '/settings', label: 'Shop Settings', icon: Settings2 },
  ],
};

export default function Sidebar({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    overview: true,
    sales: true,
    inventory: true,
    operations: false,
    reports: false,
    settings: false,
  });

  // Auto-expand the section matching the current route
  useEffect(() => {
    navGroups.forEach((group) => {
      if (group.items.some((item) =>
        item.href === pathname ||
        (item.href !== '/dashboard' && item.href !== '/reports' && pathname.startsWith(item.href))
      )) {
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    });
    if (settingsGroup.items.some((item) => pathname.startsWith(item.href))) {
      setOpenGroups((prev) => ({ ...prev, settings: true }));
    }
  }, [pathname]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isItemActive = (href: string) =>
    href === '/dashboard' || href === '/reports'
      ? pathname === href
      : pathname === href || pathname.startsWith(href + '/');

  const renderNavGroup = (group: NavGroup) => {
    const isOpen = openGroups[group.id];
    const isGroupActive = group.items.some((item) => isItemActive(item.href));
    const GroupIcon = group.icon;

    // Single-item group (Overview → Dashboard) — render as a direct link
    if (group.items.length === 1 && group.id === 'overview') {
      const item = group.items[0];
      const active = isItemActive(item.href);
      return (
        <div key={group.id} className="space-y-0.5">
          <Link
            href={item.href}
            onClick={onCloseMobile}
            className={`
              flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all duration-150
              ${active
                ? 'bg-slate-950 text-white shadow-sm font-semibold'
                : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900'
              }
            `}
          >
            <GroupIcon
              className={`shrink-0 w-4 h-4 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`}
              strokeWidth={2}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        </div>
      );
    }

    return (
      <div key={group.id} className="space-y-1">
        {/* Accordion Group Header */}
        <button
          onClick={() => toggleGroup(group.id)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-2xs font-semibold uppercase tracking-wider transition-all ${
            isGroupActive ? 'text-slate-900 bg-slate-100 font-semibold' : 'text-slate-500 font-medium hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <GroupIcon className={`w-3.5 h-3.5 ${isGroupActive ? 'text-slate-900' : 'text-slate-400'}`} strokeWidth={2} />
            <span>{group.title}</span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-slate-900' : ''
            }`}
            strokeWidth={2}
          />
        </button>

        {/* Accordion Sub-items */}
        {isOpen && (
          <div className="ml-2 pl-2 border-l border-slate-200 space-y-0.5 animate-fade-in-up">
            {group.items.map((item) => {
              const active = isItemActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`
                    flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs
                    transition-all duration-150
                    ${item.isPrimary
                      ? active
                        ? 'bg-yellow-400 text-slate-950 hover:bg-yellow-500 font-semibold shadow-md my-1 ring-2 ring-yellow-500/40'
                        : 'bg-yellow-400 text-slate-950 hover:bg-yellow-500 font-semibold shadow-md my-1'
                      : active
                        ? 'bg-slate-950 text-white font-semibold shadow-sm'
                        : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon
                    className={`shrink-0 w-3.5 h-3.5 ${
                      item.isPrimary
                        ? 'text-slate-950'
                        : active
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-slate-900'
                    }`}
                    strokeWidth={2}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const tenant = dataStore.getTenant();
  const shopName = tenant?.business_name || 'KisanDost';

  const renderCollapsedItem = (item: NavItem) => {
    const active = isItemActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onCloseMobile}
        title={item.label}
        className={`
          relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150 shrink-0
          ${item.isPrimary
            ? active
              ? 'bg-yellow-400 text-slate-950 font-semibold shadow-md ring-2 ring-yellow-500/40 scale-105'
              : 'bg-yellow-400 text-slate-950 hover:bg-yellow-500 font-semibold shadow-md hover:scale-105'
            : active
              ? 'bg-slate-950 text-white font-semibold shadow-sm scale-105'
              : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900 hover:scale-105'
          }
        `}
      >
        <Icon
          className={`shrink-0 w-4 h-4 ${
            item.isPrimary
              ? 'text-slate-950'
              : active
                ? 'text-white'
                : 'text-slate-500 group-hover:text-slate-900'
          }`}
          strokeWidth={2}
        />
      </Link>
    );
  };

  const renderNav = (forceExpanded = false) => {
    if (isCollapsed && !forceExpanded) {
      return (
        <nav className="flex flex-col h-full bg-white select-none overflow-hidden border-r border-slate-200 shadow-sm items-center">
          {/* Shop Brand Header - Mini Icon */}
          <div className="h-16 flex items-center justify-center shrink-0 w-full border-b border-slate-200/80 px-2">
            <Link
              href="/dashboard"
              title={shopName}
              className="bg-amber-400 text-slate-950 p-2 rounded-xl flex items-center justify-center shadow-xs hover:scale-105 transition-transform"
            >
              <Leaf className="w-4 h-4" strokeWidth={2.5} />
            </Link>
          </div>

          {/* Scrollable Nav Icons */}
          <div className="flex-1 overflow-y-auto py-3 px-2 flex flex-col items-center gap-1.5 scrollbar-thin w-full">
            {navGroups.map((group, groupIdx) => (
              <React.Fragment key={group.id}>
                {groupIdx > 0 && <div className="w-8 h-px bg-slate-200 my-1 shrink-0" />}
                {group.items.map((item) => renderCollapsedItem(item))}
              </React.Fragment>
            ))}
          </div>

          {/* Settings Footer - Mini Icons */}
          <div className="shrink-0 border-t border-slate-200 p-2 bg-slate-50/80 flex flex-col items-center gap-1.5 w-full">
            {settingsGroup.items.map((item) => renderCollapsedItem(item))}
          </div>
        </nav>
      );
    }

    return (
      <nav className="flex flex-col h-full bg-white select-none overflow-hidden border-r border-slate-200 shadow-sm">
        {/* Shop Brand Header */}
        <div className="h-16 flex items-center shrink-0 border-b border-slate-200/80 pl-4 pr-8">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-amber-400 text-slate-950 p-1.5 rounded-xl flex items-center justify-center shadow-xs shrink-0">
              <Leaf className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-slate-900 tracking-tight truncate">
              {shopName}
            </span>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-auto border border-slate-200 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Nav Groups */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4 scrollbar-thin">
          {navGroups.map((group) => renderNavGroup(group))}
        </div>

        {/* Settings Footer */}
        <div className="shrink-0 border-t border-slate-200 px-3 py-3 bg-slate-50/80">
          {renderNavGroup(settingsGroup)}
        </div>
      </nav>
    );
  };

  return (
    <>
      {/* Desktop sidebar — w-64 when open, w-16 when collapsed */}
      <aside
        className={`hidden lg:block fixed top-0 bottom-0 left-0 z-50 overflow-hidden transition-[width] duration-200 ease-in-out no-print ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {renderNav()}
      </aside>

      {/* Mobile drawer overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[90] flex no-print">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[85vw] h-full z-10 animate-fade-in-up">
            {renderNav(true)}
          </div>
        </div>
      )}
    </>
  );
}
