'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { dataStore } from '@/lib/data-store';
import { createSale } from '@/actions/sales';
import { getTenantContext } from '@/actions/auth';
import { Batch, Sale, PaymentType, Tenant } from '@/lib/types';
import {
  Search,
  ShoppingCart,
  User,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Banknote,
  SplitSquareHorizontal,
  Clock,
  ChevronRight,
  Minus,
} from 'lucide-react';
import ReceiptModal from '@/components/ReceiptModal';
import { useToast } from '@/components/ui/Toast';

interface CartItem {
  batch: Batch;
  quantity: number;
  unit_price: number;
  discount_type?: 'fixed' | 'percent';
  discount_val?: number;
  discount: number;
  line_total: number;
}

// ---- Black & Yellow Payment Mode Pill ----
function PaymentModePill({ active, disabled, onClick, icon: Icon, label, activeClass }: {
  mode?: PaymentType; active: boolean; disabled?: boolean;
  onClick: () => void; icon: React.ElementType; label: string; activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold shadow-[var(--kd-shadow)] transition-all focus-visible:outline-primary
        ${active ? (activeClass || 'bg-[var(--kd-surface)] text-foreground border-2 border-primary shadow-[var(--kd-shadow)]') : 'border border-border bg-[var(--kd-surface)] text-foreground hover:border-primary hover:bg-[var(--kd-primary-soft)]'}
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
      `}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={2} />
      <span>{label}</span>
    </button>
  );
}

export default function POSPage() {
  const { showToast } = useToast();
  const branches = dataStore.getBranches();
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [shopTenant, setShopTenant] = useState<Tenant | null>(null);
  const [shopUserId, setShopUserId] = useState<string>('');
  const [shopTenantId, setShopTenantId] = useState<string>('');

  const products = dataStore.getProducts();
  const batches = dataStore.getBatches(branchId);
  const customers = dataStore.getCustomers();

  const [searchQ, setSearchQ] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [customerId, setCustomerId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [amountPaidStr, setAmountPaidStr] = useState('');
  const [billDiscountInput, setBillDiscountInput] = useState<string>('0');
  const [billDiscountType, setBillDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [applyAdvance, setApplyAdvance] = useState(false);
  const [activeSale, setActiveSale] = useState<Sale | null>(null);

  useEffect(() => {
    void (async () => {
      const ctx = await getTenantContext();
      if (!ctx?.tenant || !ctx.profile) return;
      const tenant = ctx.tenant as Tenant;
      setShopTenant(tenant);
      setShopUserId(ctx.profile.id);
      setShopTenantId(tenant.id);
      // Prefer a real shop branch id when local mock branch list is out of sync
      const liveBranches = dataStore.getBranches().filter((b) => b.tenant_id === tenant.id);
      if (liveBranches[0]?.id) setBranchId(liveBranches[0].id);
    })();
  }, []);

  const customer = useMemo(() => customers.find(c => c.id === customerId), [customers, customerId]);

  const filteredBatches = useMemo(() => {
    const q = searchQ.toLowerCase();
    return batches
      .filter(b => {
        const matchSearch = !q || b.product_name?.toLowerCase().includes(q) || b.company_name?.toLowerCase().includes(q) || b.batch_number.toLowerCase().includes(q);
        const matchCo = companyFilter === 'all' || products.find(p => p.id === b.product_id)?.company_id === companyFilter;
        return matchSearch && matchCo && b.quantity_current > 0;
      });
  }, [batches, searchQ, companyFilter, products]);

  const addToCart = (batch: Batch) => {
    const idx = cart.findIndex(i => i.batch.id === batch.id);
    if (idx > -1) {
      if (cart[idx].quantity >= batch.quantity_current) {
        showToast(`Stock limit reached: ${batch.quantity_current} units`, 'error');
        return;
      }
      const u = [...cart];
      u[idx].quantity += 1;
      const itemTotal = u[idx].quantity * u[idx].unit_price;
      const discType = u[idx].discount_type || 'fixed';
      const val = u[idx].discount_val || 0;
      const discRs = discType === 'percent' ? Math.round(itemTotal * (val / 100)) : val;
      u[idx].discount = Math.min(itemTotal, Math.max(0, discRs));
      u[idx].line_total = Math.max(0, itemTotal - u[idx].discount);
      setCart(u);
    } else {
      setCart([...cart, {
        batch,
        quantity: 1,
        unit_price: batch.sale_price,
        discount_type: 'fixed',
        discount_val: 0,
        discount: 0,
        line_total: batch.sale_price
      }]);
    }
  };

  const setQty = (idx: number, q: number) => {
    if (q <= 0) { const u = [...cart]; u.splice(idx, 1); setCart(u); return; }
    if (q > cart[idx].batch.quantity_current) { showToast(`Cannot exceed stock: ${cart[idx].batch.quantity_current}`, 'error'); return; }
    const u = [...cart];
    u[idx].quantity = q;
    const itemTotal = q * u[idx].unit_price;
    const discType = u[idx].discount_type || 'fixed';
    const val = u[idx].discount_val || 0;
    const discRs = discType === 'percent' ? Math.round(itemTotal * (val / 100)) : val;
    u[idx].discount = Math.min(itemTotal, Math.max(0, discRs));
    u[idx].line_total = Math.max(0, itemTotal - u[idx].discount);
    setCart(u);
  };

  const setItemDiscount = (idx: number, val: number, type?: 'fixed' | 'percent') => {
    const u = [...cart];
    const itemTotal = u[idx].quantity * u[idx].unit_price;
    const discType = type || u[idx].discount_type || 'fixed';
    const safeVal = Math.max(0, val);
    u[idx].discount_type = discType;
    u[idx].discount_val = safeVal;

    const discRs = discType === 'percent' ? Math.round(itemTotal * (safeVal / 100)) : safeVal;
    u[idx].discount = Math.min(itemTotal, Math.max(0, discRs));
    u[idx].line_total = Math.max(0, itemTotal - u[idx].discount);
    setCart(u);
  };

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.quantity * i.unit_price, 0), [cart]);
  const itemDiscounts = useMemo(() => cart.reduce((s, i) => s + i.discount, 0), [cart]);

  const billDiscAmt = useMemo(() => {
    const num = parseFloat(billDiscountInput) || 0;
    const netSubtotal = Math.max(0, subtotal - itemDiscounts);
    if (billDiscountType === 'percent') {
      return Math.round(netSubtotal * (num / 100));
    }
    return num;
  }, [billDiscountInput, billDiscountType, subtotal, itemDiscounts]);

  const grandTotal = Math.max(0, subtotal - itemDiscounts - billDiscAmt);

  const advanceAvailable = useMemo(() => {
    return customer && (customer.current_balance || 0) < 0 ? Math.abs(customer.current_balance!) : 0;
  }, [customer]);

  const advanceUsed = useMemo(() => {
    if (!applyAdvance || !advanceAvailable) return 0;
    return Math.min(grandTotal, advanceAvailable);
  }, [applyAdvance, advanceAvailable, grandTotal]);

  const netPayableAfterAdvance = Math.max(0, grandTotal - advanceUsed);

  const cashPaidNow = paymentType === 'cash' ? netPayableAfterAdvance : paymentType === 'credit' ? 0 : parseFloat(amountPaidStr) || 0;
  const totalAmountPaidForSale = advanceUsed + cashPaidNow;

  const pendingCredit = grandTotal - totalAmountPaidForSale;
  const creditExceeded = customer && pendingCredit > 0 && ((customer.current_balance || 0) + pendingCredit) > customer.credit_limit;

  const handleCheckout = async () => {
    if (!cart.length) return;

    // 1. Update client local dataStore for immediate UI feedback & receipt
    if (!shopTenantId || !shopUserId || !branchId) {
      showToast('Shop session not ready. Refresh and sign in again.', 'error');
      return;
    }

    const sale = dataStore.createSale({
      branch_id: branchId,
      customer_id: customerId || undefined,
      sold_by: shopUserId,
      payment_type: paymentType,
      subtotal,
      discount_total: itemDiscounts + billDiscAmt,
      grand_total: grandTotal,
      amount_paid: totalAmountPaidForSale,
      advance_used: advanceUsed,
      cash_paid: cashPaidNow,
      items: cart.map(i => ({
        batch_id: i.batch.id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount: i.discount,
        line_total: i.line_total,
      })),
    });

    setActiveSale(sale);
    showToast(`Sale ${sale.sale_number} completed successfully!`, 'success');

    // Store cart snapshot before resetting
    const itemsSnapshot = cart.map(i => ({
      batchId: i.batch.id,
      productNameSnapshot: i.batch.product_name || 'Pesticide Spray',
      quantity: i.quantity,
      unitPrice: i.unit_price,
      discount: i.discount,
      lineTotal: i.line_total,
    }));

    setCart([]); setAmountPaidStr(''); setBillDiscountInput('0'); setBillDiscountType('fixed'); setCustomerId(''); setApplyAdvance(false);

    // 2. Persist to Supabase for the signed-in shop (not hardcoded demo tenant)
    try {
      const result = await createSale({
        tenantId: shopTenantId,
        branchId: branchId,
        customerId: customerId || undefined,
        soldBy: shopUserId,
        paymentType,
        subtotal,
        discountTotal: itemDiscounts + billDiscAmt,
        grandTotal,
        amountPaid: totalAmountPaidForSale,
        items: itemsSnapshot,
      });
      if (result && 'error' in result) {
        console.error('Failed to sync sale to database:', result.error);
        showToast(`Sale saved locally but cloud sync failed: ${result.error}`, 'error');
      }
    } catch (err) {
      console.error('Failed to sync sale to database:', err);
    }
  };

  return (
    <div className="space-y-5 pb-24">

      {/* Page Header — H1 Title is font-bold */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1.5 text-2xs font-medium text-muted-foreground mb-1">
            <span>Sales</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground" strokeWidth={2} />
            <span className="text-foreground font-semibold">POS Counter Work Surface</span>
          </nav>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Fast Counter Billing (FEFO Batch Picker)
          </h1>
          <p className="text-xs text-muted-foreground font-normal mt-0.5">
            Automated batch sorting by nearest expiry date. Real-time farmer credit validation.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-full border border-primary bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[var(--kd-shadow)]">
          <span className="text-2xs font-medium uppercase tracking-widest text-primary-foreground">Active Counter:</span>
          <select
            value={branchId}
            onChange={e => { setBranchId(e.target.value); setCart([]); }}
            className="cursor-pointer bg-transparent text-xs font-semibold text-primary-foreground focus:outline-none"
          >
            {branches.map(b => <option key={b.id} value={b.id} className="bg-[var(--kd-surface)] font-semibold text-foreground">{b.name}</option>)}
          </select>
        </div>
      </div>

      {/* Main Two-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: Product & Batch Picker (7 cols) */}
        <div className="lg:col-span-7 space-y-4">

          {/* Light Search Toolbar */}
          <div className="bg-[var(--kd-surface)] border border-border rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] p-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={2} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search spray name, active ingredient (e.g. Imidacloprid), batch #..."
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-normal text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-primary bg-[var(--kd-surface)] placeholder:text-muted-foreground"
                />
              </div>
              <select
                value={companyFilter}
                onChange={e => setCompanyFilter(e.target.value)}
                className="text-xs font-medium text-foreground border border-border rounded-xl px-3 py-2 bg-[var(--kd-surface)] focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
              >
                <option value="all">All Brands (Bayer, Syngenta...)</option>
                {dataStore.getCompanies().map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between text-2xs font-medium text-muted-foreground">
              <span>Showing <strong className="text-foreground font-semibold">{filteredBatches.length}</strong> available batches in stock</span>
              <span className="text-foreground font-semibold flex items-center gap-1">Nearest Expiry First (FEFO)</span>
            </div>
          </div>

          {/* Batches List Container */}
          <div className="bg-[var(--kd-surface)] border border-border rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] overflow-hidden">
            <div className="max-h-[520px] overflow-y-auto divide-y divide-border">
              {filteredBatches.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs font-normal">
                  No matching product batches available in stock.
                </div>
              ) : (
                filteredBatches.map(batch => {
                  const days = Math.ceil((new Date(batch.expiry_date).getTime() - Date.now()) / 86400000);
                  const nearExpiry = days < 90;
                  return (
                    <div
                      key={batch.id}
                      onClick={() => addToCart(batch)}
                      className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-[var(--kd-primary-soft)] cursor-pointer group transition-colors"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground group-hover:text-foreground transition-colors truncate">{batch.product_name}</span>
                          <span className="text-2xs font-medium text-foreground bg-background px-2 py-0.5 rounded-full border border-border shrink-0">{batch.company_name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-2xs text-muted-foreground font-normal">
                          <span className="font-mono">Batch: <strong className="text-foreground font-medium">{batch.batch_number}</strong></span>
                          <span className={`flex items-center gap-1 font-medium ${nearExpiry ? 'text-danger bg-[color-mix(in_srgb,var(--kd-danger)_12%,transparent)] px-2 py-0.5 rounded-full border border-danger/30' : 'text-muted-foreground'}`}>
                            <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                            Exp: {batch.expiry_date} ({days}d left)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-foreground tabular-nums">Rs. {batch.sale_price.toLocaleString()}</div>
                          <div className="text-2xs text-muted-foreground font-normal tabular-nums">Stock: {batch.quantity_current} units</div>
                        </div>
                        {/* Signature Yellow Add Button */}
                        <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary group-hover:opacity-90 text-primary-foreground shadow-[var(--kd-shadow)] shrink-0 active:scale-95 transition-all cursor-pointer">
                          <Plus className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Billing Terminal (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-[var(--kd-surface)] border border-border rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] overflow-hidden flex flex-col">

            {/* Solid Header Strip */}
            <div className="bg-[var(--kd-surface)] text-foreground px-4 py-3.5 flex items-center justify-between shrink-0 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary fill-primary" strokeWidth={2} />
                <span className="text-sm font-semibold">Current Sale Cart</span>
              </div>
              <span className="text-2xs font-semibold bg-primary text-primary-foreground px-2.5 py-1 rounded-full border border-primary/30">
                {cart.length} line items
              </span>
            </div>

            {/* Customer Udhaar Selector */}
            <div className="border-b border-border px-4 py-3 bg-background space-y-2 shrink-0">
              <div className="flex items-center justify-between text-2xs font-medium uppercase tracking-wider text-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-foreground" strokeWidth={2} />
                  <span>Farmer / Customer Record</span>
                </div>
                {customer && (
                  <span className="text-amber-700 font-semibold">Limit: Rs. {customer.credit_limit.toLocaleString()}</span>
                )}
              </div>
              <select
                value={customerId}
                onChange={e => {
                  const id = e.target.value;
                  setCustomerId(id);
                  const selected = customers.find(c => c.id === id);
                  setApplyAdvance(selected ? (selected.current_balance || 0) < 0 : false);
                }}
                className="w-full text-xs font-semibold text-foreground border border-border rounded-xl px-3 py-2 bg-[var(--kd-surface)] focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
              >
                <option value="">👤 Walk-in Farmer (Cash Only)</option>
                {customers.map(c => {
                  const bal = c.current_balance || 0;
                  return (
                    <option key={c.id} value={c.id}>
                      👨‍🌾 {c.name} ({c.phone}) — {bal < 0 ? `💳 Advance: Rs. ${Math.abs(bal).toLocaleString()}` : bal > 0 ? `⚠️ Udhaar: Rs. ${bal.toLocaleString()}` : 'Clear (Rs. 0)'}
                    </option>
                  );
                })}
              </select>

              {customer && (
                <div className="space-y-1.5">
                  {customer.current_balance && customer.current_balance < 0 ? (
                    <div className="bg-[var(--kd-accent-soft)] border border-accent/20 rounded-xl p-2.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <span className="flex items-center gap-1.5">
                          💳 Advance Available:
                        </span>
                        <span className="font-mono text-sm text-foreground font-semibold">
                          Rs. {Math.abs(customer.current_balance).toLocaleString()}
                        </span>
                      </div>
                      
                      <label className="flex items-center gap-2 cursor-pointer pt-1.5 border-t border-accent/20/80 text-2xs font-semibold text-foreground">
                        <input
                          type="checkbox"
                          checked={applyAdvance}
                          onChange={e => setApplyAdvance(e.target.checked)}
                          className="h-4 w-4 cursor-pointer rounded accent-primary"
                        />
                        <span>Apply advance balance to this sale</span>
                      </label>

                      {applyAdvance && advanceUsed > 0 && (
                        <div className="text-[11px] font-normal text-foreground bg-[var(--kd-surface)] p-1.5 rounded-lg border border-accent/20 flex justify-between">
                          <span>Advance Applied to Sale:</span>
                          <span className="font-mono font-semibold text-foreground">- Rs. {advanceUsed.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-2xs px-3 py-2 bg-[var(--kd-surface)] rounded-xl border border-border">
                      <span className="text-muted-foreground font-medium">
                        {customer.current_balance && customer.current_balance > 0 ? 'Current Udhaar Owed:' : 'Account Status:'}
                      </span>
                      <span className={`font-semibold font-mono text-xs ${customer.current_balance && customer.current_balance > 0 ? 'text-amber-700' : 'text-foreground'}`}>
                        Rs. {(customer.current_balance || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 min-h-[180px] max-h-[260px] overflow-y-auto divide-y divide-border px-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-10 text-muted-foreground space-y-2">
                  <ShoppingCart className="w-9 h-9 text-slate-300" strokeWidth={1} />
                  <p className="text-xs font-normal">Click items on the left to add to bill</p>
                </div>
              ) : cart.map((item, idx) => (
                <div key={idx} className="px-3 py-2.5 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{item.batch.product_name}</p>
                    </div>
                    <button onClick={() => { const u=[...cart]; u.splice(idx,1); setCart(u); }} className="text-muted-foreground hover:text-danger transition-colors p-0.5 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setQty(idx, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-200 hover:bg-slate-300 text-foreground font-semibold text-xs active:scale-95 transition-all">
                        <Minus className="w-3 h-3" strokeWidth={2} />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => setQty(idx, parseInt(e.target.value) || 0)}
                        className="w-10 text-center text-xs font-semibold border border-border rounded-md py-0.5 focus:outline-none focus:border-primary bg-[var(--kd-surface)]"
                      />
                      <button onClick={() => setQty(idx, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-200 hover:bg-slate-300 text-foreground font-semibold text-xs active:scale-95 transition-all">
                        <Plus className="w-3 h-3" strokeWidth={2} />
                      </button>
                    </div>

                    {/* Item Discount Input with Rs / % Mode Toggle */}
                    <div className="flex items-center gap-1.5 text-2xs">
                      <span className="text-muted-foreground font-medium">Disc:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="0"
                          value={item.discount_val !== undefined && item.discount_val !== 0 ? item.discount_val : (item.discount || '')}
                          onChange={e => setItemDiscount(idx, parseFloat(e.target.value) || 0)}
                          className="w-12 text-right text-xs font-semibold px-1.5 py-1 rounded-lg border border-border bg-[var(--kd-surface)] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <div
                          className="flex rounded-lg border border-border bg-lift p-0.5"
                          role="group"
                          aria-label="Item discount unit"
                        >
                          <button
                            type="button"
                            onClick={() => setItemDiscount(idx, item.discount_val || item.discount || 0, 'fixed')}
                            className={`min-w-[2rem] rounded-md px-2 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                              (item.discount_type || 'fixed') === 'fixed'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'border border-border/80 bg-[var(--kd-surface)] text-foreground/70 hover:text-foreground'
                            }`}
                            title="Discount in Rupees"
                          >
                            Rs
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemDiscount(idx, item.discount_val || item.discount || 0, 'percent')}
                            className={`min-w-[2rem] rounded-md px-2 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                              item.discount_type === 'percent'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'border border-border/80 bg-[var(--kd-surface)] text-foreground/70 hover:text-foreground'
                            }`}
                            title="Discount as Percentage"
                          >
                            %
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-semibold text-foreground tabular-nums">Rs. {item.line_total.toLocaleString()}</span>
                      {item.discount > 0 && item.discount_type === 'percent' && (
                        <span className="block text-[10px] font-medium text-accent">-Rs. {item.discount.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals & Payment Summary */}
            <div className="border-t border-border px-4 py-4 space-y-3 bg-background shrink-0">
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between font-normal">
                  <span>Subtotal:</span>
                  <span className="tabular-nums font-semibold text-foreground">Rs. {subtotal.toLocaleString()}</span>
                </div>

                {itemDiscounts > 0 && (
                  <div className="flex justify-between text-amber-700 font-normal">
                    <span>Items Discount:</span>
                    <span className="tabular-nums font-semibold">- Rs. {itemDiscounts.toLocaleString()}</span>
                  </div>
                )}

                {/* Overall Bill Discount Field (Rs or %) */}
                <div className="space-y-2 bg-[var(--kd-accent-soft)] p-3 rounded-xl border border-accent/20 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-foreground text-xs flex items-center gap-1">
                        Overall Bill Discount:
                      </span>
                      {billDiscountType === 'percent' && billDiscAmt > 0 && (
                        <span className="text-[10px] text-foreground font-normal block">
                          = Rs. {billDiscAmt.toLocaleString()} off
                        </span>
                      )}
                      {billDiscountType === 'fixed' && billDiscAmt > 0 && (subtotal - itemDiscounts) > 0 && (
                        <span className="text-[10px] text-foreground font-normal block">
                          = {((billDiscAmt / (subtotal - itemDiscounts)) * 100).toFixed(1)}% off
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Rs / % Mode Toggle Pill */}
                      <div
                        className="flex rounded-lg border border-border bg-lift p-0.5 text-2xs font-bold"
                        role="group"
                        aria-label="Bill discount unit"
                      >
                        <button
                          type="button"
                          onClick={() => setBillDiscountType('fixed')}
                          className={`min-w-[2.25rem] rounded-md px-2.5 py-1 transition-all cursor-pointer ${
                            billDiscountType === 'fixed'
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'border border-border/80 bg-[var(--kd-surface)] text-foreground/70 hover:text-foreground'
                          }`}
                        >
                          Rs
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillDiscountType('percent')}
                          className={`min-w-[2.25rem] rounded-md px-2.5 py-1 transition-all cursor-pointer ${
                            billDiscountType === 'percent'
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'border border-border/80 bg-[var(--kd-surface)] text-foreground/70 hover:text-foreground'
                          }`}
                        >
                          %
                        </button>
                      </div>

                      {/* Custom Input Field */}
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          value={billDiscountInput}
                          onChange={e => setBillDiscountInput(e.target.value)}
                          placeholder="0"
                          className="w-24 text-right text-xs font-semibold border border-accent/30 rounded-lg pr-7 pl-2 py-1 bg-[var(--kd-surface)] focus:outline-none focus:ring-2 focus:ring-yellow-400 text-foreground shadow-2xs"
                        />
                        <span className="absolute right-2 text-2xs font-medium text-amber-700 pointer-events-none">
                          {billDiscountType === 'fixed' ? 'Rs' : '%'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1 justify-end pt-1 border-t border-accent/20">
                    <span className="text-[10px] text-muted-foreground font-medium mr-auto">Presets:</span>
                    <button
                      type="button"
                      onClick={() => { setBillDiscountType('fixed'); setBillDiscountInput('50'); }}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--kd-surface)] hover:bg-[var(--kd-accent-soft)] text-foreground border border-accent/30 shadow-2xs cursor-pointer"
                    >
                      Rs 50
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBillDiscountType('fixed'); setBillDiscountInput('100'); }}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--kd-surface)] hover:bg-[var(--kd-accent-soft)] text-foreground border border-accent/30 shadow-2xs cursor-pointer"
                    >
                      Rs 100
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBillDiscountType('fixed'); setBillDiscountInput('500'); }}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--kd-surface)] hover:bg-[var(--kd-accent-soft)] text-foreground border border-accent/30 shadow-2xs cursor-pointer"
                    >
                      Rs 500
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBillDiscountType('percent'); setBillDiscountInput('5'); }}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--kd-surface)] hover:bg-[var(--kd-accent-soft)] text-foreground border border-accent/30 shadow-2xs cursor-pointer"
                    >
                      5%
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBillDiscountType('percent'); setBillDiscountInput('10'); }}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--kd-surface)] hover:bg-[var(--kd-accent-soft)] text-foreground border border-accent/30 shadow-2xs cursor-pointer"
                    >
                      10%
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBillDiscountInput('0'); }}
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[color-mix(in_srgb,var(--kd-danger)_12%,transparent)] hover:bg-red-100 text-danger border border-red-200 shadow-2xs cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="flex justify-between font-semibold text-base text-foreground border-t border-border pt-2 mt-1">
                  <span>Grand Total:</span>
                  <span className="tabular-nums text-foreground font-semibold font-mono">Rs. {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Black & Yellow Payment Mode Pills */}
              <div className="space-y-2">
                <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Payment Type:</p>
                <div className="flex gap-2">
                  <PaymentModePill mode="cash" active={paymentType === 'cash'} onClick={() => setPaymentType('cash')} icon={Banknote} label="Cash" />
                  <PaymentModePill mode="credit" active={paymentType === 'credit'} disabled={!customer} onClick={() => setPaymentType('credit')} icon={CreditCard} label="Full Udhaar" />
                  <PaymentModePill mode="partial" active={paymentType === 'partial'} disabled={!customer} onClick={() => setPaymentType('partial')} icon={SplitSquareHorizontal} label="Partial" />
                </div>
              </div>

              {paymentType === 'partial' && (
                <div>
                  <label className="text-2xs font-medium text-foreground block mb-1">Cash Received Now (Rs):</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={amountPaidStr}
                    onChange={e => setAmountPaidStr(e.target.value)}
                    className="w-full text-sm font-semibold border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-primary bg-[var(--kd-surface)]"
                  />
                </div>
              )}

              {creditExceeded && (
                <div className="flex items-start gap-2 bg-[color-mix(in_srgb,var(--kd-danger)_12%,transparent)] border border-danger/30 text-danger p-2.5 rounded-xl text-xs">
                  <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" strokeWidth={2} />
                  <div>
                    <p className="font-semibold">Credit Limit Warning!</p>
                    <p className="text-[11px] font-normal">Exceeds farmer limit of Rs. {customer?.credit_limit.toLocaleString()}. (Manager approval required).</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Sticky Bottom Action Bar with Solid Yellow CTA */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-[var(--kd-surface)] text-foreground shadow-2xl no-print transition-transform duration-200 ${cart.length ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-2xs font-medium uppercase tracking-widest text-muted-foreground">Items in Cart</p>
              <p className="text-lg font-semibold text-white tabular-nums">{cart.length}</p>
            </div>
            <div>
              <p className="text-2xs font-medium uppercase tracking-widest text-muted-foreground">Grand Total Amount</p>
              <p className="text-2xl font-semibold text-primary tabular-nums font-mono">Rs. {grandTotal.toLocaleString()}</p>
            </div>
          </div>

          {/* Solid Yellow Action Button */}
          <button
            onClick={handleCheckout}
            disabled={!cart.length}
            className="flex items-center gap-2 bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-semibold text-sm px-6 sm:px-8 py-3.5 rounded-xl shadow-md transition-all focus-visible:outline-primary active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-foreground" strokeWidth={2} />
            <span>COMPLETE SALE &amp; PRINT PARCHI</span>
          </button>
        </div>
      </div>

      {activeSale && (
        <ReceiptModal
          sale={activeSale}
          tenantOverride={shopTenant}
          onClose={() => setActiveSale(null)}
        />
      )}
    </div>
  );
}
