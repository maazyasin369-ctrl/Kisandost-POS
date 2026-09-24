'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, Users, ShoppingCart, ArrowRight, X } from 'lucide-react';
import { dataStore } from '@/lib/data-store';

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const products = dataStore.getProducts();
  const customers = dataStore.getCustomers();
  const sales = dataStore.getSales();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 30);
    else setQuery('');
  }, [isOpen]);

  const q = query.toLowerCase().trim();

  const filteredProducts = q
    ? products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.active_ingredient.toLowerCase().includes(q) ||
        p.company_name?.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const filteredCustomers = q
    ? customers.filter(c =>
        c.name.toLowerCase().includes(q) || c.phone.includes(q)
      ).slice(0, 4)
    : [];

  const filteredSales = q
    ? sales.filter(s =>
        s.sale_number.toLowerCase().includes(q) ||
        s.customer_name?.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const navigate = (url: string) => { setIsOpen(false); router.push(url); };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-medium px-3.5 h-10 rounded-full w-44 sm:w-64 transition-all shadow-xs group shrink-0"
      >
        <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0 transition-colors" strokeWidth={2} />
        <span className="h-3.5 w-px bg-slate-200 shrink-0"></span>
        <span className="flex-1 text-left truncate text-slate-500 font-medium group-hover:text-slate-700">Search products, farmers…</span>
        <span className="hidden sm:inline-block h-3.5 w-px bg-slate-200 shrink-0"></span>
        <kbd className="hidden sm:inline-block text-2xs font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 tracking-tight shadow-2xs shrink-0">⌘K</kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 sm:pt-28 px-4" onClick={() => setIsOpen(false)}>
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50/50 text-slate-900">
              <Search className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Product name, ingredient, farmer phone, receipt number…"
                className="flex-1 text-sm font-medium text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-2xs font-bold text-slate-600 bg-slate-200/80 rounded px-2 py-0.5 hover:bg-slate-300 transition-colors">ESC</button>
            </div>

            {/* Results */}
            <div className="max-h-[58vh] overflow-y-auto divide-y divide-rule">
              {!q && (
                <div className="py-10 text-center text-muted text-xs">
                  Try searching for a product name, active ingredient, farmer name, or receipt number.
                </div>
              )}
              {q && (filteredProducts.length + filteredCustomers.length + filteredSales.length) === 0 && (
                <div className="py-10 text-center text-muted text-xs">No results for &quot;{query}&quot;</div>
              )}

              {filteredProducts.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 text-2xs font-extrabold uppercase tracking-widest text-muted">
                    <Package className="w-3.5 h-3.5 text-sarson-600" strokeWidth={2} />
                    <span>Inventory Products</span>
                  </div>
                  {filteredProducts.map(p => (
                    <button key={p.id} onClick={() => navigate(`/inventory/${p.id}`)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-sarson-50 group transition-colors text-left">
                      <div>
                        <div className="text-xs font-bold text-ink group-hover:text-sarson-700">{p.name}</div>
                        <div className="text-2xs text-muted mt-0.5">{p.company_name} · {p.active_ingredient}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 group-hover:text-sarson-600 transition-all" strokeWidth={2} />
                    </button>
                  ))}
                </div>
              )}

              {filteredCustomers.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 text-2xs font-extrabold uppercase tracking-widest text-muted">
                    <Users className="w-3.5 h-3.5 text-status-udhaar-text" strokeWidth={2} />
                    <span>Farmers & Udhaar</span>
                  </div>
                  {filteredCustomers.map(c => (
                    <button key={c.id} onClick={() => navigate(`/customers/${c.id}`)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-status-udhaar-bg group transition-colors text-left">
                      <div>
                        <div className="text-xs font-bold text-ink group-hover:text-status-udhaar-text">{c.name}</div>
                        <div className="text-2xs text-muted mt-0.5">{c.phone} · Balance: Rs. {(c.current_balance || 0).toLocaleString()}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 group-hover:text-status-udhaar-text transition-all" strokeWidth={2} />
                    </button>
                  ))}
                </div>
              )}

              {filteredSales.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 text-2xs font-extrabold uppercase tracking-widest text-muted">
                    <ShoppingCart className="w-3.5 h-3.5 text-status-cash-text" strokeWidth={2} />
                    <span>Sales Receipts</span>
                  </div>
                  {filteredSales.map(s => (
                    <button key={s.id} onClick={() => navigate('/reports/sales-history')}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-lift group transition-colors text-left">
                      <div>
                        <div className="text-xs font-bold text-ink font-mono">{s.sale_number} — {s.customer_name}</div>
                        <div className="text-2xs text-muted mt-0.5">Rs. {s.grand_total.toLocaleString()} · {s.payment_type.toUpperCase()}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-all" strokeWidth={2} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
