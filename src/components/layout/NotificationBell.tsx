'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, Clock, Users, ChevronRight } from 'lucide-react';
import { getShopAlerts } from '@/actions/sales';

type Alerts = Awaited<ReturnType<typeof getShopAlerts>>;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [alerts, setAlerts] = useState<Alerts>({ expiring: [], lowStock: [], overLimit: [] });

  useEffect(() => {
    getShopAlerts().then(setAlerts).catch(() => {});
  }, []);

  const expiringBatches = alerts.expiring;
  const lowStock = alerts.lowStock;
  const overLimit = alerts.overLimit;

  const totalCount = expiringBatches.length + lowStock.length + overLimit.length;

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
        className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-[var(--kd-primary-soft)] transition-colors focus-visible:outline-emerald-600"
        title="System alerts"
      >
        <Bell className="w-5 h-5" strokeWidth={1.75} />
        {totalCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-alert-text ring-2 ring-[var(--kd-surface)]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--kd-surface)] rounded-xl border border-border shadow-modal z-50 overflow-hidden animate-scale-in">
          <div className="px-4 py-3 border-b border-border bg-background flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" strokeWidth={1.75} />
              <span className="text-xs font-bold text-foreground">System Alerts</span>
            </div>
            <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${
              totalCount > 0 ? 'bg-status-alert-bg text-status-alert-text border border-status-alert-border' : 'bg-background text-muted-foreground border border-border'
            }`}>
              {totalCount} open
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {totalCount === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs">All systems healthy — no urgent items.</div>
            ) : (
              <>
                {expiringBatches.map(b => {
                  const days = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / 86400000);
                  return (
                    <Link key={b.id} href="/inventory" onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-background border-b border-border/50 group transition-colors">
                      <Clock className="w-4 h-4 text-status-udhaar-text mt-0.5 shrink-0" strokeWidth={1.75} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">{b.productName}</div>
                        <div className="text-2xs text-muted-foreground mt-0.5">Batch {b.batchNumber} · expires {b.expiryDate} ({days}d) · {b.quantity} units</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                    </Link>
                  );
                })}
                {lowStock.map(p => (
                  <Link key={p.id} href={`/inventory/${p.id}`} onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-background border-b border-border/50 group transition-colors">
                    <AlertTriangle className="w-4 h-4 text-status-alert-text mt-0.5 shrink-0" strokeWidth={1.75} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-foreground truncate">{p.name}</div>
                      <div className="text-2xs text-muted-foreground mt-0.5">{p.qty} units on hand · reorder at {p.reorderLevel}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                  </Link>
                ))}
                {overLimit.map(c => (
                  <Link key={c.id} href={`/customers/${c.id}`} onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-background border-b border-border/50 group transition-colors">
                    <Users className="w-4 h-4 text-status-udhaar-text mt-0.5 shrink-0" strokeWidth={1.75} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-foreground truncate">{c.name} — credit exceeded</div>
                      <div className="text-2xs text-muted-foreground mt-0.5">Balance Rs. {c.balance.toLocaleString()} / limit Rs. {c.limit.toLocaleString()}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
