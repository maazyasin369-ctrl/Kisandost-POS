'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Settings2, LogOut, ChevronDown, MapPin, UserCheck } from 'lucide-react';
import { useShopChrome } from './ShopChrome';

export default function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const chrome = useShopChrome();
  const ownerName = chrome?.ownerName || 'Owner';

  const initials = ownerName
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
        className="flex items-center gap-2 rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] py-1.5 pr-2.5 pl-2"
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--kd-primary-soft)] text-2xs font-medium text-primary">
          {initials}
        </div>
        <div className="hidden text-left leading-tight sm:block">
          <div className="text-xs font-medium text-foreground">{ownerName.split(' ')[0]}</div>
          <div className="text-2xs font-medium text-muted-foreground">Owner</div>
        </div>
        <ChevronDown className="size-3.5 text-muted-foreground" strokeWidth={2} style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] text-xs shadow-[var(--kd-shadow)]">
          <div className="border-b border-border bg-background px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--kd-primary-soft)] text-sm font-medium text-primary">
                {initials}
              </div>
              <div>
                <div className="text-xs font-medium text-foreground">{ownerName}</div>
                <div className="mt-0.5 text-2xs text-muted-foreground">{chrome?.businessName}</div>
                <div className="font-mono text-2xs text-muted-foreground">{chrome?.license}</div>
              </div>
            </div>
          </div>

          <div className="space-y-0.5 p-1.5">
            <Link href="/settings/users" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-foreground hover:bg-[var(--kd-primary-soft)]">
              <UserCheck className="size-4 text-primary" strokeWidth={1.75} />
              <span>Staff & User Roles</span>
            </Link>
            <Link href="/branches" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-foreground hover:bg-[var(--kd-primary-soft)]">
              <MapPin className="size-4 text-primary" strokeWidth={1.75} />
              <span>Branch Locations</span>
            </Link>
            <Link href="/settings" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-foreground hover:bg-[var(--kd-primary-soft)]">
              <Settings2 className="size-4 text-primary" strokeWidth={1.75} />
              <span>Shop Settings</span>
            </Link>
            <Link href="/admin/dashboard" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-foreground hover:bg-[var(--kd-primary-soft)]">
              <ShieldCheck className="size-4 text-accent" strokeWidth={1.75} />
              <span>Super Admin Portal</span>
            </Link>
          </div>

          <div className="border-t border-border p-1.5">
            <button
              onClick={() => { setOpen(false); router.push('/login'); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-danger hover:bg-[var(--kd-primary-soft)]"
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
