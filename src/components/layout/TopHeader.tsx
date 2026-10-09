'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Menu, ChevronDown } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';
import { useShopChrome } from './ShopChrome';

interface TopHeaderProps {
  onToggleMobileSidebar: () => void;
}

export default function TopHeader({ onToggleMobileSidebar }: TopHeaderProps) {
  const chrome = useShopChrome();
  const multiBranch = chrome?.multiBranch === true;
  const branches = chrome?.branches ?? [];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedBranchId = multiBranch ? (searchParams.get('branch') ?? 'all') : 'all';
  const outletName = branches[0]?.name || 'Main outlet';

  const onSelectBranch = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!id || id === 'all') params.delete('branch');
    else params.set('branch', id);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-[var(--kd-surface)]">
      <div className="h-16 px-4 sm:px-5 flex items-center justify-between gap-3">

        {/* Left: Mobile menu button only (shop name now lives in sidebar) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleMobileSidebar}
            className="rounded-lg p-2 text-muted-foreground hover:bg-[var(--kd-primary-soft)] hover:text-foreground lg:hidden"
          >
            <Menu className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Center: Branch Context Selector + Global Search */}
        <div className="flex items-center gap-2 flex-1 max-w-2xl justify-center">
          {multiBranch ? (
            <div className="hidden h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3.5 text-xs font-semibold text-foreground md:flex">
              <span className="shrink-0 text-2xs font-medium uppercase tracking-wider text-muted-foreground">VIEW</span>
              <span className="h-3.5 w-px shrink-0 bg-border"></span>
              <select
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                className="max-w-[150px] cursor-pointer appearance-none truncate bg-transparent pr-1 font-semibold text-foreground focus:outline-none"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <span className="h-3.5 w-px shrink-0 bg-border"></span>
              <ChevronDown className="pointer-events-none size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
            </div>
          ) : (
            <div className="hidden h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3.5 text-xs font-semibold text-foreground md:flex">
              <span className="shrink-0 text-2xs font-medium uppercase tracking-wider text-muted-foreground">OUTLET</span>
              <span className="h-3.5 w-px shrink-0 bg-border"></span>
              <span className="max-w-[180px] truncate">{outletName}</span>
            </div>
          )}

          <GlobalSearch />
        </div>

        {/* Right: Notifications & User Profile Menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
