'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useShopChrome } from './ShopChrome';
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
                ? 'bg-[var(--kd-primary-soft)] font-medium text-primary'
                : 'font-medium text-muted-foreground hover:bg-[var(--kd-primary-soft)] hover:text-foreground'
              }
            `}
          >
            <GroupIcon
              className={`size-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`}
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
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-2xs font-semibold uppercase tracking-wider transition-all ${
            isGroupActive ? 'bg-[var(--kd-primary-soft)] text-foreground' : 'font-medium text-muted-foreground hover:bg-[var(--kd-primary-soft)] hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <GroupIcon className={`size-3.5 ${isGroupActive ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={2} />
            <span>{group.title}</span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-foreground' : ''
            }`}
            strokeWidth={2}
          />
        </button>

        {/* Accordion Sub-items */}
        {isOpen && (
          <div className="ml-2 space-y-0.5 border-l border-border pl-2">
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
                    ${active
                      ? 'bg-[var(--kd-primary-soft)] font-medium text-primary'
                      : 'font-medium text-muted-foreground hover:bg-[var(--kd-primary-soft)] hover:text-foreground'
                    }
                  `}
                >
                  <Icon
                    className={`size-3.5 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`}
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

  const chrome = useShopChrome();
  const shopName = chrome?.businessName || 'Shop';
  const multiBranch = chrome?.multiBranch === true;
  const groups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.href !== '/transfers' || multiBranch),
    }))
    .filter((group) => group.items.length > 0);
  const settings = {
    ...settingsGroup,
    items: settingsGroup.items.filter((item) => item.href !== '/branches' || multiBranch),
  };

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
          ${active
            ? 'bg-[var(--kd-primary-soft)] text-primary'
            : 'text-muted-foreground hover:bg-[var(--kd-primary-soft)] hover:text-foreground'
          }
        `}
      >
        <Icon
          className={`size-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`}
          strokeWidth={2}
        />
      </Link>
    );
  };

  const renderNav = (forceExpanded = false) => {
    if (isCollapsed && !forceExpanded) {
      return (
        <nav className="flex h-full flex-col items-center overflow-hidden border-r border-border bg-[var(--kd-surface)] select-none">
          {/* Shop Brand Header - Mini Icon */}
          <div className="flex h-16 w-full shrink-0 items-center justify-center border-b border-border px-2">
            <Link
              href="/dashboard"
              title={shopName}
              className="flex size-8 overflow-hidden rounded-lg"
            >
              <span className="w-1/2 bg-primary" />
              <span className="w-1/2 bg-accent" />
            </Link>
          </div>

          {/* Scrollable Nav Icons */}
          <div className="flex-1 overflow-y-auto py-3 px-2 flex flex-col items-center gap-1.5 scrollbar-thin w-full">
            {groups.map((group, groupIdx) => (
              <React.Fragment key={group.id}>
                {groupIdx > 0 && <div className="my-1 h-px w-8 shrink-0 bg-border" />}
                {group.items.map((item) => renderCollapsedItem(item))}
              </React.Fragment>
            ))}
          </div>

          {/* Settings Footer - Mini Icons */}
          <div className="flex w-full shrink-0 flex-col items-center gap-1.5 border-t border-border bg-background p-2">
            {settings.items.map((item) => renderCollapsedItem(item))}
          </div>
        </nav>
      );
    }

    return (
      <nav className="flex h-full flex-col overflow-hidden border-r border-border bg-[var(--kd-surface)] select-none">
        {/* Shop Brand Header */}
        <div className="flex h-16 shrink-0 items-center border-b border-border pl-4 pr-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-7 shrink-0 overflow-hidden rounded-lg">
              <span className="w-1/2 bg-primary" />
              <span className="w-1/2 bg-accent" />
            </span>
            <span className="truncate text-sm font-semibold tracking-tight text-foreground">
              {shopName}
            </span>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--kd-primary-soft)] transition-colors ml-auto border border-border shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Nav Groups */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4 scrollbar-thin">
          {groups.map((group) => renderNavGroup(group))}
        </div>

        {/* Settings Footer */}
        <div className="shrink-0 border-t border-border bg-background px-3 py-3">
          {renderNavGroup(settings)}
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
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
