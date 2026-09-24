'use client';

import React from 'react';
import { Menu, ChevronDown } from 'lucide-react';
import { dataStore } from '@/lib/data-store';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';

interface TopHeaderProps {
  onToggleMobileSidebar: () => void;
  selectedBranchId: string;
  onSelectBranch: (id: string) => void;
}

export default function TopHeader({ onToggleMobileSidebar, selectedBranchId, onSelectBranch }: TopHeaderProps) {
  const branches = dataStore.getBranches();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm no-print">
      <div className="h-16 px-4 sm:px-5 flex items-center justify-between gap-3">

        {/* Left: Mobile menu button only (shop name now lives in sidebar) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-emerald-600"
          >
            <Menu className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Center: Branch Context Selector + Global Search */}
        <div className="flex items-center gap-2 flex-1 max-w-2xl justify-center">
          <div className="hidden md:flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-full px-3.5 h-10 text-xs font-semibold shrink-0 shadow-xs transition-colors">
            <span className="text-slate-400 font-medium text-2xs uppercase tracking-wider shrink-0">VIEW</span>
            <span className="h-3.5 w-px bg-slate-200 shrink-0"></span>
            <select
              value={selectedBranchId}
              onChange={(e) => onSelectBranch(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer max-w-[150px] truncate appearance-none pr-1"
            >
              <option value="all" className="bg-white text-slate-900 font-semibold">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-white text-slate-900 font-semibold">{b.name}</option>
              ))}
            </select>
            <span className="h-3.5 w-px bg-slate-200 shrink-0"></span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none" strokeWidth={2} />
          </div>

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
