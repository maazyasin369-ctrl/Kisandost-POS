'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Settings2, LogOut, ChevronDown, MapPin, UserCheck } from 'lucide-react';
import { dataStore } from '@/lib/data-store';

export default function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tenant = dataStore.getTenant();

  const initials = tenant.owner_name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200/80 transition-colors group"
      >
        <div className="w-7 h-7 rounded-lg bg-slate-950 text-amber-400 text-2xs font-extrabold flex items-center justify-center tracking-wider shrink-0 shadow-2xs">
          {initials}
        </div>
        <div className="hidden sm:block text-left leading-tight">
          <div className="text-xs font-bold text-slate-900">{tenant.owner_name.split(' ')[0]}</div>
          <div className="text-2xs text-slate-500 font-medium">Owner</div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900 transition-transform duration-150" strokeWidth={2} style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-rule shadow-modal z-50 overflow-hidden animate-scale-in text-xs">
          <div className="px-4 py-3 border-b border-rule bg-lift">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-950 text-amber-400 text-sm font-extrabold flex items-center justify-center tracking-wider shrink-0">
                {initials}
              </div>
              <div>
                <div className="font-bold text-ink text-xs">{tenant.owner_name}</div>
                <div className="text-2xs text-muted mt-0.5">{tenant.business_name}</div>
                <div className="text-2xs font-mono text-muted">{tenant.dealer_license_number}</div>
              </div>
            </div>
          </div>

          <div className="p-1.5 space-y-0.5">
            <Link href="/settings/users" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-lift text-ink font-semibold transition-colors">
              <UserCheck className="w-4 h-4 text-sarson-600" strokeWidth={1.75} />
              <span>Staff & User Roles</span>
            </Link>
            <Link href="/branches" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-lift text-ink font-semibold transition-colors">
              <MapPin className="w-4 h-4 text-sarson-600" strokeWidth={1.75} />
              <span>Branch Locations</span>
            </Link>
            <Link href="/settings" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-lift text-ink font-semibold transition-colors">
              <Settings2 className="w-4 h-4 text-sarson-600" strokeWidth={1.75} />
              <span>Shop Settings</span>
            </Link>
            <Link href="/admin/dashboard" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-lift text-ink font-semibold transition-colors">
              <ShieldCheck className="w-4 h-4 text-amber-600" strokeWidth={1.75} />
              <span>Super Admin Portal</span>
            </Link>
          </div>

          <div className="p-1.5 border-t border-rule">
            <button
              onClick={() => { setOpen(false); router.push('/login'); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-status-alert-bg text-status-alert-text font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
