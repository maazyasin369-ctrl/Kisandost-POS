'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, Clock, Users, ChevronRight } from 'lucide-react';
import { dataStore } from '@/lib/data-store';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const batches = dataStore.getBatches();
  const products = dataStore.getProducts();
  const customers = dataStore.getCustomers();

  const expiringBatches = batches.filter(b => {
    const days = Math.ceil((new Date(b.expiry_date).getTime() - Date.now()) / 86400000);
    return days <= 120;
  });

  const lowStock = products.filter(p => {
    const total = batches.filter(b => b.product_id === p.id).reduce((s, b) => s + b.quantity_current, 0);
    return total <= p.reorder_level;
  });

  const overLimit = customers.filter(c => (c.current_balance || 0) > c.credit_limit);

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
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-emerald-600"
        title="System alerts"
      >
        <Bell className="w-5 h-5" strokeWidth={1.75} />
        {totalCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-alert-text ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-rule shadow-modal z-50 overflow-hidden animate-scale-in">
          <div className="px-4 py-3 border-b border-rule bg-lift flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-sarson-600" strokeWidth={1.75} />
              <span className="text-xs font-bold text-ink">System Alerts</span>
            </div>
            <span className={`text-2xs font-extrabold px-2 py-0.5 rounded-full ${
              totalCount > 0 ? 'bg-status-alert-bg text-status-alert-text border border-status-alert-border' : 'bg-lift text-muted border border-rule'
            }`}>
              {totalCount} open
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {totalCount === 0 ? (
              <div className="py-8 text-center text-muted text-xs">All systems healthy — no urgent items.</div>
            ) : (
              <>
                {expiringBatches.map(b => {
                  const days = Math.ceil((new Date(b.expiry_date).getTime() - Date.now()) / 86400000);
                  return (
                    <Link key={b.id} href="/inventory" onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-lift border-b border-rule/50 group transition-colors">
                      <Clock className="w-4 h-4 text-status-udhaar-text mt-0.5 shrink-0" strokeWidth={1.75} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-ink truncate">{b.product_name}</div>
                        <div className="text-2xs text-muted mt-0.5">Batch {b.batch_number} · expires {b.expiry_date} ({days}d) · {b.quantity_current} units</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                    </Link>
                  );
                })}
                {lowStock.map(p => (
                  <Link key={p.id} href={`/inventory/${p.id}`} onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-lift border-b border-rule/50 group transition-colors">
                    <AlertTriangle className="w-4 h-4 text-status-alert-text mt-0.5 shrink-0" strokeWidth={1.75} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-ink truncate">{p.name}</div>
                      <div className="text-2xs text-muted mt-0.5">Stock at or below reorder level ({p.reorder_level} units)</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                  </Link>
                ))}
                {overLimit.map(c => (
                  <Link key={c.id} href={`/customers/${c.id}`} onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-lift border-b border-rule/50 group transition-colors">
                    <Users className="w-4 h-4 text-status-udhaar-text mt-0.5 shrink-0" strokeWidth={1.75} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-ink truncate">{c.name} — credit exceeded</div>
                      <div className="text-2xs text-muted mt-0.5">Balance Rs. {(c.current_balance || 0).toLocaleString()} / limit Rs. {c.credit_limit.toLocaleString()}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
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
