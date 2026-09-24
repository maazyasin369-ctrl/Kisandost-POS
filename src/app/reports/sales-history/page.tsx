'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { getSalesHistory, getBranches, returnSaleAction, getSaleWithItems } from '@/actions/sales';
import { dataStore } from '@/lib/data-store';
import { Sale, PaymentType } from '@/lib/types';
import ReceiptModal from '@/components/ReceiptModal';
import {
  FileSpreadsheet,
  RotateCcw,
  Calendar,
  Filter,
  Download,
  Printer,
  ChevronDown,
  ChevronRight,
  Search,
  DollarSign,
  CreditCard,
  CheckCircle2,
  X,
  Layers
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

const DEMO_TENANT = '11111111-1111-1111-1111-111111111111';

type SaleRow = Awaited<ReturnType<typeof getSalesHistory>>[number];
type BranchRow = Awaited<ReturnType<typeof getBranches>>[number];

// Normalize nested Supabase row into flat display fields
function normalizeSale(s: SaleRow) {
  const custObj = Array.isArray(s.customers) ? s.customers[0] : s.customers;
  const profObj = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
  const branchObj = Array.isArray(s.branches) ? s.branches[0] : s.branches;
  return {
    ...s,
    customer_name: custObj?.name ?? 'Walk-in Farmer',
    customer_phone: custObj?.phone ?? '',
    sold_by_name: profObj?.full_name ?? '',
    branch_name: branchObj?.name ?? '',
    remaining_balance: s.grand_total - s.amount_paid,
  };
}

type NormalizedSale = ReturnType<typeof normalizeSale>;

type DatePreset = 'today' | '7days' | '30days' | '6months' | '1year' | 'custom' | 'all';

export default function SalesHistoryPage() {
  const { showToast } = useToast();
  const [rawSales, setRawSales] = useState<SaleRow[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState<ReturnType<typeof normalizeSale> | null>(null);
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [restockStock, setRestockStock] = useState(true);
  const [isPending, startTransition] = useTransition();

  const handleOpenReceipt = (saleId: string) => {
    startTransition(async () => {
      const fullSale = await getSaleWithItems(saleId);
      if (fullSale) {
        const custObj = Array.isArray(fullSale.customers) ? fullSale.customers[0] : fullSale.customers;
        const profObj = Array.isArray(fullSale.profiles) ? fullSale.profiles[0] : fullSale.profiles;
        const branchObj = Array.isArray(fullSale.branches) ? fullSale.branches[0] : fullSale.branches;

        const formattedSale: Sale = {
          id: fullSale.id,
          tenant_id: '11111111-1111-1111-1111-111111111111',
          branch_id: '',
          branch_name: branchObj?.name ?? 'Main Outlet',
          sale_number: fullSale.sale_number,
          customer_name: custObj?.name ?? 'Walk-in Farmer',
          customer_phone: custObj?.phone ?? '',
          sold_by: '',
          sold_by_name: profObj?.full_name ?? 'Staff',
          payment_type: fullSale.payment_type as PaymentType,
          subtotal: fullSale.subtotal,
          discount_total: fullSale.discount_total,
          grand_total: fullSale.grand_total,
          amount_paid: fullSale.amount_paid,
          remaining_balance: fullSale.grand_total - fullSale.amount_paid,
          status: fullSale.status as 'completed' | 'void' | 'returned',
          created_at: fullSale.created_at,
          items: ((fullSale.sale_items as unknown as any[]) ?? []).map((item: any) => {
            const batchObj = Array.isArray(item.batches) ? item.batches[0] : item.batches;
            return {
              id: item.id,
              sale_id: fullSale.id,
              batch_id: item.batch_id,
              product_name_snapshot: item.product_name_snapshot,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount: item.discount ?? 0,
              line_total: item.line_total,
              batch_number: batchObj?.batch_number ?? 'BCH-001',
              expiry_date: batchObj?.expiry_date ?? '2026-12-31',
            };
          }),
        };
        setActiveReceiptSale(formattedSale);
      } else {
        const localSale = dataStore.getSales().find(s => s.id === saleId);
        if (localSale) setActiveReceiptSale(localSale);
      }
    });
  };

  // Filter States
  const [datePreset, setDatePreset] = useState<DatePreset>('30days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collapsible Groups State (date string YYYY-MM-DD => isExpanded boolean)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Printable Report Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Load sales & branches on mount
  useEffect(() => {
    startTransition(async () => {
      const [salesData, branchesData] = await Promise.all([
        getSalesHistory(DEMO_TENANT, undefined, 500),
        getBranches(DEMO_TENANT),
      ]);
      setRawSales(salesData);
      setBranches(branchesData);
    });
  }, []);

  const sales = useMemo(() => rawSales.map(normalizeSale), [rawSales]);

  // Compute Filter Date Limits
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (datePreset === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      return { start, end: todayEnd };
    }
    if (datePreset === '7days') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      return { start, end: todayEnd };
    }
    if (datePreset === '30days') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      return { start, end: todayEnd };
    }
    if (datePreset === '6months') {
      const start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate(), 0, 0, 0, 0);
      return { start, end: todayEnd };
    }
    if (datePreset === '1year') {
      const start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0, 0);
      return { start, end: todayEnd };
    }
    if (datePreset === 'custom') {
      const start = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null;
      const end = customEndDate ? new Date(`${customEndDate}T23:59:59.999`) : null;
      return { start, end };
    }
    return { start: null, end: null }; // 'all'
  }, [datePreset, customStartDate, customEndDate]);

  // Filter Sales Logic
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const saleDate = new Date(s.created_at);

      // Date range filter
      if (dateRangeBounds.start && saleDate < dateRangeBounds.start) return false;
      if (dateRangeBounds.end && saleDate > dateRangeBounds.end) return false;

      // Branch filter
      if (selectedBranchId !== 'all' && s.branch_id !== selectedBranchId) return false;

      // Payment type filter
      if (selectedPaymentType !== 'all' && s.payment_type !== selectedPaymentType) return false;

      // Status filter
      if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = s.sale_number.toLowerCase().includes(q);
        const matchesCust = s.customer_name?.toLowerCase().includes(q);
        const matchesSoldBy = s.sold_by_name?.toLowerCase().includes(q);
        const matchesBranch = s.branch_name?.toLowerCase().includes(q);
        if (!matchesNum && !matchesCust && !matchesSoldBy && !matchesBranch) return false;
      }

      return true;
    });
  }, [sales, dateRangeBounds, selectedBranchId, selectedPaymentType, selectedStatus, searchQuery]);

  // Group Filtered Sales by Date (YYYY-MM-DD)
  const groupedSales = useMemo(() => {
    const map: Record<string, { dateKey: string; dateObj: Date; sales: NormalizedSale[]; dayTotal: number; dayCount: number }> = {};

    filteredSales.forEach(s => {
      const d = new Date(s.created_at);
      const dateKey = d.toISOString().slice(0, 10);

      if (!map[dateKey]) {
        map[dateKey] = {
          dateKey,
          dateObj: d,
          sales: [],
          dayTotal: 0,
          dayCount: 0
        };
      }
      map[dateKey].sales.push(s);
      map[dateKey].dayCount += 1;
      if (s.status === 'completed') {
        map[dateKey].dayTotal += s.grand_total;
      }
    });

    // Sort groups newest date first
    const sortedGroupKeys = Object.keys(map).sort((a, b) => b.localeCompare(a));

    // Sort sales within each group newest first
    sortedGroupKeys.forEach(key => {
      map[key].sales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });

    return sortedGroupKeys.map(key => map[key]);
  }, [filteredSales]);

  // Initialize/Update default expansion (default top 3 expanded)
  useEffect(() => {
    if (groupedSales.length > 0) {
      setExpandedGroups(prev => {
        const next = { ...prev };
        groupedSales.forEach((group, idx) => {
          if (next[group.dateKey] === undefined) {
            next[group.dateKey] = idx < 3; // Expand top 3 days by default
          }
        });
        return next;
      });
    }
  }, [groupedSales]);

  const toggleGroup = (dateKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };

  const expandAllGroups = () => {
    const next: Record<string, boolean> = {};
    groupedSales.forEach(g => { next[g.dateKey] = true; });
    setExpandedGroups(next);
  };

  const collapseAllGroups = () => {
    const next: Record<string, boolean> = {};
    groupedSales.forEach(g => { next[g.dateKey] = false; });
    setExpandedGroups(next);
  };

  // KPI Metrics for Filtered Result
  const totalRevenue = useMemo(() => {
    return filteredSales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.grand_total, 0);
  }, [filteredSales]);

  const totalCashCollected = useMemo(() => {
    return filteredSales.filter(s => s.status === 'completed').reduce((sum, s) => sum + (s.amount_paid || 0), 0);
  }, [filteredSales]);

  const totalUdhaarIssued = useMemo(() => {
    return filteredSales.filter(s => s.status === 'completed').reduce((sum, s) => sum + (s.remaining_balance || 0), 0);
  }, [filteredSales]);

  const returnedCount = useMemo(() => {
    return filteredSales.filter(s => s.status === 'returned').length;
  }, [filteredSales]);

  // Handle Process Return
  const handleCompleteReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleForReturn || !returnReason.trim()) return;

    startTransition(async () => {
      const res = await returnSaleAction(selectedSaleForReturn.id, returnReason.trim(), restockStock);
      if (res.success) {
        showToast('Sale return processed successfully!', 'success');
        // Refresh sales
        const salesData = await getSalesHistory(DEMO_TENANT, undefined, 500);
        setRawSales(salesData);
      } else {
        showToast(res.error ?? 'Return failed', 'error');
      }
      setSelectedSaleForReturn(null);
      setReturnReason('');
    });
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      showToast('No sales matching current filter to export', 'info');
      return;
    }

    const headers = [
      'Sale Number',
      'Date',
      'Time',
      'Customer Name',
      'Customer Phone',
      'Salesman',
      'Branch Name',
      'Payment Type',
      'Subtotal (Rs)',
      'Discount (Rs)',
      'Grand Total (Rs)',
      'Amount Paid (Rs)',
      'Remaining Balance (Rs)',
      'Status'
    ];

    const rows = filteredSales.map(s => {
      const d = new Date(s.created_at);
      const dateStr = d.toLocaleDateString('en-PK');
      const timeStr = d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

      return [
        s.sale_number,
        dateStr,
        timeStr,
        `"${(s.customer_name ?? 'Walk-in Farmer').replace(/"/g, '""')}"`,
        `"${(s.customer_phone ?? '').replace(/"/g, '""')}"`,
        `"${(s.sold_by_name ?? '').replace(/"/g, '""')}"`,
        `"${(s.branch_name ?? '').replace(/"/g, '""')}"`,
        s.payment_type.toUpperCase(),
        s.subtotal,
        s.discount_total,
        s.grand_total,
        s.amount_paid,
        s.remaining_balance,
        s.status.toUpperCase()
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sales_History_${datePreset}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for Formatting Date Header Label
  const formatDateHeaderLabel = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    let prefix = '';
    if (dateStr === todayStr) prefix = 'Today — ';
    else if (dateStr === yesterdayStr) prefix = 'Yesterday — ';

    const formattedDate = d.toLocaleDateString('en-PK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return `${prefix}${formattedDate}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-slate-950 text-yellow-400 rounded-xl">
              <FileSpreadsheet className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales History &amp; Audit Registry</h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Filter date ranges, group daily transactions, process manager returns, and export official audit reports
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-semibold text-xs px-4.5 py-2.5 rounded-full border border-slate-800 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Download className="w-4 h-4 text-yellow-400" strokeWidth={2.2} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              if (filteredSales.length === 0) {
                showToast('No sales matching current filter to preview', 'info');
                return;
              }
              setShowPrintModal(true);
            }}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-semibold text-xs px-5 py-2.5 rounded-full shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4 text-slate-950" strokeWidth={2.5} />
            <span>Printable PDF Audit Report</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Card */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-slate-700" />
            <span>Date Range &amp; Filter Controls</span>
          </div>

          <div className="text-2xs font-extrabold text-slate-500">
            Showing <span className="text-slate-900 font-semibold">{filteredSales.length}</span> of {sales.length} total transactions
          </div>
        </div>

        {/* Date Preset Buttons Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider mr-1">Presets:</span>
          {[
            { id: 'today', label: 'Today' },
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
            { id: '6months', label: 'Last 6 Months' },
            { id: '1year', label: 'Last Year' },
            { id: 'custom', label: 'Custom Range' },
            { id: 'all', label: 'All Time' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setDatePreset(p.id as DatePreset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                datePreset === p.id
                  ? 'bg-slate-950 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers (Shown if 'custom' preset is selected) */}
        {datePreset === 'custom' && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <label className="font-extrabold text-slate-700">Start Date:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-extrabold text-slate-700">End Date:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Secondary Filter Dropdowns & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search sale #, farmer, salesman..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={selectedBranchId}
              onChange={e => setSelectedBranchId(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 border border-slate-300 rounded-xl px-3 py-2 bg-slate-50/50 focus:ring-2 focus:ring-yellow-400 focus:outline-none cursor-pointer"
            >
              <option value="all">All Outlets / Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Type Filter */}
          <div>
            <select
              value={selectedPaymentType}
              onChange={e => setSelectedPaymentType(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 border border-slate-300 rounded-xl px-3 py-2 bg-slate-50/50 focus:ring-2 focus:ring-yellow-400 focus:outline-none cursor-pointer"
            >
              <option value="all">All Payment Types</option>
              <option value="cash">Cash Only</option>
              <option value="credit">Full Udhaar / Credit</option>
              <option value="partial">Partial Cash &amp; Udhaar</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 border border-slate-300 rounded-xl px-3 py-2 bg-slate-50/50 focus:ring-2 focus:ring-yellow-400 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed Sales</option>
              <option value="returned">Manager Returned / Void</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Summary Strip for Filtered Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Filtered Revenue</div>
            <div className="text-xl font-semibold text-slate-900 font-mono mt-0.5">Rs. {totalRevenue.toLocaleString()}</div>
            <div className="text-2xs text-slate-500 font-semibold mt-0.5">{filteredSales.length} total sales matching</div>
          </div>
          <div className="p-2.5 bg-slate-950 text-yellow-400 rounded-xl">
            <DollarSign className="w-4 h-4" strokeWidth={2.5} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Cash Collected</div>
            <div className="text-xl font-semibold text-slate-900 font-mono mt-0.5">Rs. {totalCashCollected.toLocaleString()}</div>
            <div className="text-2xs text-slate-500 font-semibold mt-0.5">Direct counter cash</div>
          </div>
          <div className="p-2.5 bg-slate-950 text-yellow-400 rounded-xl">
            <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Udhaar Issued</div>
            <div className="text-xl font-semibold text-slate-900 font-mono mt-0.5">Rs. {totalUdhaarIssued.toLocaleString()}</div>
            <div className="text-2xs text-slate-500 font-semibold mt-0.5">Added to farmer ledgers</div>
          </div>
          <div className="p-2.5 bg-slate-950 text-yellow-400 rounded-xl">
            <CreditCard className="w-4 h-4" strokeWidth={2.5} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Returns / Voids</div>
            <div className="text-xl font-semibold text-rose-600 font-mono mt-0.5">{returnedCount} Sales</div>
            <div className="text-2xs text-slate-500 font-semibold mt-0.5">Manager approved voids</div>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 border border-rose-200/70 rounded-xl">
            <RotateCcw className="w-4 h-4" strokeWidth={2.2} />
          </div>
        </div>
      </div>

      {/* Date-Grouped Sales List */}
      <div className="space-y-4">
        {/* Controls Bar for Collapsing / Expanding */}
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-extrabold text-slate-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-950" />
            <span>Daily Grouped Sales ({groupedSales.length} Days)</span>
          </div>

          {groupedSales.length > 0 && (
            <div className="flex items-center gap-2 text-2xs font-extrabold">
              <button
                onClick={expandAllGroups}
                className="text-slate-900 hover:text-slate-950 font-bold bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Expand All
              </button>
              <button
                onClick={collapseAllGroups}
                className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {groupedSales.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200 space-y-3">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" strokeWidth={1.5} />
            <h3 className="font-extrabold text-slate-700 text-base">No Sales Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No transactions match your currently selected date range or filter criteria. Try adjusting your filters above.
            </p>
            <button
              onClick={() => {
                setDatePreset('all');
                setSelectedBranchId('all');
                setSelectedPaymentType('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="mt-2 text-xs font-semibold bg-yellow-400 hover:bg-yellow-500 text-slate-950 px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : (
          groupedSales.map((group) => {
            const isExpanded = !!expandedGroups[group.dateKey];

            return (
              <div
                key={group.dateKey}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all"
              >
                {/* Date Group Header Bar */}
                <div
                  onClick={() => toggleGroup(group.dateKey)}
                  className="w-full bg-slate-50/80 hover:bg-slate-100/70 p-4 border-b border-slate-200/80 flex items-center justify-between cursor-pointer transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-950 text-yellow-400 rounded-xl">
                      <Calendar className="w-4 h-4" strokeWidth={2.2} />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-900 text-sm">
                        {formatDateHeaderLabel(group.dateKey)}
                      </h2>
                      <p className="text-2xs text-slate-500 font-semibold mt-0.5">
                        {group.dateKey}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Summary Badge */}
                    <div className="text-right">
                      <div className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">
                        {group.dayCount} {group.dayCount === 1 ? 'sale' : 'sales'}
                      </div>
                      <div className="text-sm font-semibold text-slate-900 font-mono">
                        Rs. {group.dayTotal.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                      ) : (
                        <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Date Group Items List */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100">
                    {group.sales.map((s) => (
                      <div
                        key={s.id}
                        className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2.5">
                            <span className="font-semibold text-slate-900 text-sm font-mono">{s.sale_number}</span>
                            
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                              s.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : s.status === 'returned'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-red-100 text-red-800 border-red-300'
                            }`}>
                              {s.status.toUpperCase()}
                            </span>

                            <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-slate-200">
                              {s.payment_type.toUpperCase()}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-slate-600 text-2xs">
                            <span>Farmer: <strong className="text-slate-900">{s.customer_name}</strong></span>
                            <span>Salesman: <strong className="text-slate-900">{s.sold_by_name}</strong></span>
                            <span>Outlet: <strong className="text-slate-900">{s.branch_name || 'Main Counter'}</strong></span>
                            <span>Time: <strong className="text-slate-900">{new Date(s.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</strong></span>
                          </div>

                          {/* Show return reason if returned */}
                          {s.status === 'returned' && s.return_reason && (
                            <div className="text-2xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-1 font-semibold">
                              ⚠️ Return Reason: {s.return_reason}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <div className="text-right">
                            <div className="text-2xs text-slate-400 font-bold uppercase tracking-wider">Grand Total</div>
                            <div className="text-base font-semibold text-emerald-900 font-mono">
                              Rs. {s.grand_total.toLocaleString()}
                            </div>
                            {(s.remaining_balance || 0) > 0 && (
                              <div className="text-[10px] font-bold text-amber-700">
                                (Udhaar: Rs. {(s.remaining_balance || 0).toLocaleString()})
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleOpenReceipt(s.id)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-2xs px-3 py-2 rounded-xl border border-slate-300 cursor-pointer transition-all shadow-2xs"
                            >
                              View Receipt
                            </button>

                            {s.status === 'completed' && (
                              <button
                                onClick={() => { setSelectedSaleForReturn(s); setReturnReason(''); }}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-2xs px-3 py-2 rounded-xl border border-amber-300 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Return / Void</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Full Thermal Receipt Modal */}
      {activeReceiptSale && (
        <ReceiptModal
          sale={activeReceiptSale}
          onClose={() => setActiveReceiptSale(null)}
        />
      )}

      {/* Return / Void Modal */}
      {selectedSaleForReturn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-amber-950 text-white p-4 flex justify-between items-center border-b border-amber-900">
              <h2 className="text-sm font-semibold flex items-center space-x-2">
                <RotateCcw className="h-4 w-4 text-amber-400" />
                <span>Process Sale Return ({selectedSaleForReturn.sale_number})</span>
              </h2>
              <button onClick={() => setSelectedSaleForReturn(null)} className="text-slate-400 hover:text-white font-semibold text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleCompleteReturn} className="p-6 space-y-4 text-xs">
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <div className="font-extrabold text-xs">Manager Authorization Required</div>
                <p className="text-2xs font-medium">Returning this sale will mark it as RETURNED. Amount: <strong>Rs. {selectedSaleForReturn.grand_total.toLocaleString()}</strong></p>
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">
                  Reason for Return / Void <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Farmer returned unopened bottle due to wrong crop spray recommendation"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="restock"
                  checked={restockStock}
                  onChange={(e) => setRestockStock(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-500 h-4 w-4 accent-emerald-700 cursor-pointer"
                />
                <label htmlFor="restock" className="font-bold text-slate-800 cursor-pointer">
                  Automatically Restock Returned Items back to Batch Inventory
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedSaleForReturn(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Confirm Sale Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable PDF Audit Report Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header controls bar */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">Printable Official Audit Report Preview</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Printable Report Content Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-900 print:p-0 print:overflow-visible">
              {/* Report Letterhead Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold text-emerald-950 uppercase tracking-tight">PAK AGRO CHEMICAL &amp; PESTICIDE NETWORK</h1>
                  <p className="text-xs text-slate-600 font-bold mt-0.5">Dealer License: LIC-PK-MULTAN-2026/8849 | Branch Operations Audit</p>
                  <p className="text-2xs text-slate-500 font-medium">Headquarters: Main Grains Market, Multan, Punjab, Pakistan</p>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-slate-100 border border-slate-300 text-slate-900 text-xs font-semibold px-3 py-1 rounded-lg uppercase tracking-wider">
                    AUDIT REPORT
                  </div>
                  <div className="text-2xs text-slate-500 font-semibold mt-1">
                    Generated: {new Date().toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Filter Metadata Summary Banner */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-2xs">
                <div>
                  <span className="text-slate-400 font-extrabold uppercase block">Date Range Preset</span>
                  <span className="font-semibold text-slate-900 text-xs uppercase">{datePreset}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-extrabold uppercase block">Selected Branch</span>
                  <span className="font-semibold text-slate-900 text-xs">{selectedBranchId === 'all' ? 'All Branches' : branches.find(b => b.id === selectedBranchId)?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-extrabold uppercase block">Payment Filter</span>
                  <span className="font-semibold text-slate-900 text-xs uppercase">{selectedPaymentType}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-extrabold uppercase block">Matching Sales</span>
                  <span className="font-semibold text-emerald-800 text-xs">{filteredSales.length} Transactions</span>
                </div>
              </div>

              {/* Audit Financial Summary KPIs */}
              <div className="grid grid-cols-3 gap-4 bg-emerald-950 text-white p-4 rounded-xl">
                <div>
                  <span className="text-2xs font-extrabold text-emerald-300 uppercase block">Total Net Revenue</span>
                  <span className="text-lg font-semibold text-amber-400 font-mono">Rs. {totalRevenue.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-2xs font-extrabold text-emerald-300 uppercase block">Cash Received</span>
                  <span className="text-lg font-semibold text-emerald-300 font-mono">Rs. {totalCashCollected.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-2xs font-extrabold text-emerald-300 uppercase block">Udhaar / Credit Issued</span>
                  <span className="text-lg font-semibold text-amber-200 font-mono">Rs. {totalUdhaarIssued.toLocaleString()}</span>
                </div>
              </div>

              {/* Transaction Detail Table */}
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-slate-700 font-semibold uppercase tracking-wider">
                    <th className="py-2 px-2">Sale #</th>
                    <th className="py-2 px-2">Date &amp; Time</th>
                    <th className="py-2 px-2">Farmer Customer</th>
                    <th className="py-2 px-2">Salesman</th>
                    <th className="py-2 px-2">Type</th>
                    <th className="py-2 px-2 text-right">Grand Total</th>
                    <th className="py-2 px-2 text-right">Paid</th>
                    <th className="py-2 px-2 text-right">Balance</th>
                    <th className="py-2 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredSales.map(s => (
                    <tr key={s.id}>
                      <td className="py-2 px-2 font-semibold font-mono">{s.sale_number}</td>
                      <td className="py-2 px-2 text-slate-600">{new Date(s.created_at).toLocaleString()}</td>
                      <td className="py-2 px-2 font-bold">{s.customer_name}</td>
                      <td className="py-2 px-2 text-slate-600">{s.sold_by_name}</td>
                      <td className="py-2 px-2 uppercase font-extrabold text-slate-700">{s.payment_type}</td>
                      <td className="py-2 px-2 text-right font-semibold font-mono">Rs. {s.grand_total.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right font-bold text-emerald-800 font-mono">Rs. {s.amount_paid.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right font-bold text-amber-800 font-mono">Rs. {(s.remaining_balance || 0).toLocaleString()}</td>
                      <td className="py-2 px-2 text-center font-extrabold uppercase text-2xs">{s.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures Block */}
              <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs font-bold text-slate-700">
                <div>
                  <div className="border-t border-slate-400 pt-2 w-48 mx-auto">Shop Manager Signature</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-2 w-48 mx-auto">Internal Auditor Approval</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
