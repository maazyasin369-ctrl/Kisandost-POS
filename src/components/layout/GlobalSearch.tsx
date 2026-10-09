'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Search, Package, Users, ShoppingCart, ArrowRight, X } from 'lucide-react';
import { searchShop } from '@/actions/sales';

type SearchResults = Awaited<ReturnType<typeof searchShop>>;

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<SearchResults>({ products: [], customers: [], sales: [] });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults({ products: [], customers: [], sales: [] });
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      searchShop(q).then((data) => {
        if (active) setResults(data);
      }).catch(() => {});
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

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
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const q = query.trim();
  const filteredProducts = results.products;
  const filteredCustomers = results.customers;
  const filteredSales = results.sales;

  const navigate = (url: string) => { setIsOpen(false); router.push(url); };

  const overlay = isOpen && mounted
    ? createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center bg-black/40 px-4 pt-20 backdrop-blur-[2px] sm:pt-28"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] shadow-[var(--kd-shadow)] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3 text-foreground">
              <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Product name, ingredient, farmer phone, receipt number…"
                className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-muted-foreground transition-colors hover:text-foreground">
                  <X className="size-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded bg-background px-2 py-0.5 text-2xs font-semibold text-muted-foreground hover:text-foreground"
              >
                ESC
              </button>
            </div>

            <div className="max-h-[58vh] divide-y divide-border overflow-y-auto">
              {!q && (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  Try searching for a product name, active ingredient, farmer name, or receipt number.
                </div>
              )}
              {q && (filteredProducts.length + filteredCustomers.length + filteredSales.length) === 0 && (
                <div className="py-10 text-center text-xs text-muted-foreground">No results for &quot;{query}&quot;</div>
              )}

              {filteredProducts.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <Package className="size-3.5 text-primary" strokeWidth={2} />
                    <span>Inventory Products</span>
                  </div>
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => navigate(`/inventory/${p.id}`)}
                      className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--kd-primary-soft)]"
                    >
                      <div>
                        <div className="text-xs font-semibold text-foreground group-hover:text-primary">{p.name}</div>
                        <div className="mt-0.5 text-2xs text-muted-foreground">{p.detail}</div>
                      </div>
                      <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:text-primary" strokeWidth={2} />
                    </button>
                  ))}
                </div>
              )}

              {filteredCustomers.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <Users className="size-3.5 text-accent" strokeWidth={2} />
                    <span>Farmers & Udhaar</span>
                  </div>
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => navigate(`/customers/${c.id}`)}
                      className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--kd-accent-soft)]"
                    >
                      <div>
                        <div className="text-xs font-semibold text-foreground group-hover:text-accent">{c.name}</div>
                        <div className="mt-0.5 text-2xs text-muted-foreground">{c.phone}</div>
                      </div>
                      <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:text-accent" strokeWidth={2} />
                    </button>
                  ))}
                </div>
              )}

              {filteredSales.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <ShoppingCart className="size-3.5 text-primary" strokeWidth={2} />
                    <span>Sales Receipts</span>
                  </div>
                  {filteredSales.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => navigate('/reports/sales-history')}
                      className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-background"
                    >
                      <div>
                        <div className="font-mono text-xs font-semibold text-foreground">
                          {s.saleNumber}{s.customerName ? ` — ${s.customerName}` : ''}
                        </div>
                        <div className="mt-0.5 text-2xs text-muted-foreground">Rs. {Number(s.total).toLocaleString()}</div>
                      </div>
                      <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100" strokeWidth={2} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group flex h-10 w-44 shrink-0 items-center gap-2.5 rounded-full border border-border bg-background px-3.5 text-xs font-medium text-muted-foreground shadow-[var(--kd-shadow)] transition-all hover:bg-[var(--kd-primary-soft)] hover:text-foreground sm:w-64"
      >
        <Search className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" strokeWidth={2} />
        <span className="h-3.5 w-px shrink-0 bg-border" />
        <span className="flex-1 truncate text-left font-medium text-muted-foreground group-hover:text-foreground">Search products, farmers…</span>
        <span className="hidden h-3.5 w-px shrink-0 bg-border sm:inline-block" />
        <kbd className="hidden shrink-0 rounded border border-border bg-[var(--kd-surface)] px-1.5 py-0.5 text-2xs font-semibold tracking-tight text-muted-foreground sm:inline-block">⌘K</kbd>
      </button>
      {overlay}
    </>
  );
}
