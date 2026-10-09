'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Building2,
  Phone,
  MapPin,
  ArrowLeft,
  Banknote,
  Calendar,
  FileText,
  Check,
  X,
  User,
  Printer
} from 'lucide-react';
import { dataStore } from '@/lib/data-store';
import { Supplier, SupplierLedgerEntry } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import PrintableReceipt, { SupplierPaymentData } from '@/components/PrintableReceipt';
import { usePrintReceipt } from '@/lib/use-print-receipt';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

export default function SupplierDetailPage({ params }: { params: Promise<{ supplierId: string }> }) {
  const resolvedParams = use(params);
  const supplierId = resolvedParams.supplierId;
  const { showToast } = useToast();

  const [supplier, setSupplier] = useState<Supplier | undefined>(() => dataStore.getSupplierById(supplierId));
  const [ledgerEntries, setLedgerEntries] = useState<SupplierLedgerEntry[]>(() => dataStore.getSupplierLedger(supplierId));
  const pagination = usePagination(ledgerEntries, 10);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentNote, setPaymentNote] = useState('');

  // Thermal print receipt state
  const [supplierReceiptData, setSupplierReceiptData] = useState<SupplierPaymentData | null>(null);
  const { triggerPrint } = usePrintReceipt();

  const refreshData = () => {
    setSupplier(dataStore.getSupplierById(supplierId));
    setLedgerEntries(dataStore.getSupplierLedger(supplierId));
  };

  useEffect(() => {
    refreshData();
  }, [supplierId]);

  if (!supplier) {
    return (
      <div className="p-8 text-center text-muted-foreground space-y-4">
        <p className="text-base font-semibold">Pesticide Supplier / Distributor Record Not Found</p>
        <Link href="/suppliers" className="text-primary underline text-sm font-semibold inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Suppliers Directory
        </Link>
      </div>
    );
  }

  const currentBalance = supplier.current_balance || 0;

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    const prevBal = currentBalance;
    const newBal = prevBal - amount;

    dataStore.recordSupplierPayment({
      supplier_id: supplier.id,
      amount,
      payment_method: paymentMethod,
      note: paymentNote.trim() || undefined,
    });

    refreshData();
    showToast(`Rs. ${amount.toLocaleString()} paid to ${supplier.name} via ${paymentMethod}`, 'success');

    // Show thermal print slip modal
    setSupplierReceiptData({
      voucher_number: `SUP-PAY-${Date.now().toString().slice(-6)}`,
      supplier_name: supplier.name,
      date: new Date().toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' }),
      previous_balance: prevBal,
      amount_paid: amount,
      new_balance: newBal,
      payment_method: paymentMethod,
      reference_number: paymentNote.trim() || undefined,
      notes: paymentNote.trim() || undefined,
    });

    setShowPaymentModal(false);
    setPaymentAmount('');
    setPaymentMethod('Cash');
    setPaymentNote('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/suppliers" className="flex items-center space-x-1 text-muted-foreground hover:text-foreground font-semibold text-xs">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Suppliers</span>
        </Link>

        <button
          onClick={() => setShowPaymentModal(true)}
          className="bg-primary text-primary-foreground hover:opacity-90 text-white font-semibold px-4 py-2.5 rounded-lg text-xs shadow-[var(--kd-shadow)] flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <Banknote className="h-4 w-4" />
          <span>RECORD PAYMENT TO DISTRIBUTOR</span>
        </button>
      </div>

      {/* Supplier Profile Info Card */}
      <div className="bg-[var(--kd-surface)] rounded-xl shadow-[var(--kd-shadow)] border border-border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="bg-[var(--kd-primary-soft)] text-primary p-3 rounded-xl border border-primary/20">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-semibold text-foreground">{supplier.name}</h1>
                <span className="bg-[var(--kd-primary-soft)] text-primary text-[10px] font-semibold px-2 py-0.5 rounded">
                  Distributor
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 flex-wrap font-normal">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-muted-foreground" /> Representative: {supplier.contact_person}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-primary flex items-center gap-1 font-semibold">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {supplier.phone}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {supplier.address}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Current Payable Balance Summary */}
        <div className={`rounded-xl p-4 text-right space-y-1 w-full md:w-auto border ${currentBalance > 0 ? 'bg-[var(--kd-accent-soft)] border-accent/20' : 'bg-[var(--kd-primary-soft)] border-primary/20'}`}>
          <span className={`text-xs font-semibold uppercase tracking-wider block ${currentBalance > 0 ? 'text-accent' : 'text-primary'}`}>
            {currentBalance > 0 ? 'Shop Payable Balance (We Owe)' : 'Account Settled / Clear'}
          </span>
          <div className={`text-3xl font-semibold font-mono ${currentBalance > 0 ? 'text-accent' : 'text-primary'}`}>
            Rs. {currentBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Supplier Ledger Statement & History */}
      <div className="bg-[var(--kd-surface)] rounded-xl shadow-[var(--kd-shadow)] border border-border overflow-hidden">
        <div className="p-4 bg-background border-b border-border font-semibold text-foreground text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span>Supplier Account Statement &amp; Ledger History</span>
          </span>
          <span className="text-xs text-muted-foreground font-normal">{ledgerEntries.length} transactions recorded</span>
        </div>

        <div className="divide-y divide-border">
          {ledgerEntries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs font-normal">
              No purchase orders or payment entries recorded for this supplier.
            </div>
          ) : (
            pagination.pageItems.map((l) => {
              const isPayment = l.type === 'payment';
              return (
                <div key={l.id} className="p-4 hover:bg-[var(--kd-primary-soft)] transition-colors flex items-center justify-between text-xs gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span
                        className={`font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wide ${
                          isPayment
                            ? 'bg-[var(--kd-primary-soft)] text-primary border border-primary/20'
                            : 'bg-[var(--kd-accent-soft)] text-accent border border-accent/30'
                        }`}
                      >
                        {isPayment ? 'PAYMENT (PAID)' : 'PURCHASE (STOCK RECEIVED)'}
                      </span>

                      {l.payment_method && (
                        <span className="bg-background text-foreground text-[10px] font-medium px-2 py-0.5 rounded border border-border">
                          Method: {l.payment_method}
                        </span>
                      )}

                      {l.purchase_number && (
                        <span className="bg-background text-foreground text-[10px] font-medium px-2 py-0.5 rounded border border-border">
                          {l.purchase_number}
                        </span>
                      )}

                      <span className="font-semibold text-foreground text-sm">{l.note || (isPayment ? 'Distributor Payment' : 'Stock Purchase Bill')}</span>
                    </div>

                    <div className="text-muted-foreground flex items-center gap-1 text-[11px] font-normal">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(l.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right space-y-1">
                      <div className={`font-semibold text-base font-mono ${isPayment ? 'text-primary' : 'text-accent'}`}>
                        {isPayment ? `- Rs. ${l.amount.toLocaleString()}` : `+ Rs. ${l.amount.toLocaleString()}`}
                      </div>
                      <div className="text-[11px] font-medium text-muted-foreground">
                        Running Bal:{' '}
                        <span className={l.running_balance > 0 ? 'text-accent font-semibold font-mono' : 'text-primary font-semibold font-mono'}>
                          Rs. {l.running_balance.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {isPayment && (
                      <button
                        onClick={() => {
                          setSupplierReceiptData({
                            voucher_number: `SUP-PAY-${l.id.slice(-6)}`,
                            supplier_name: supplier.name,
                            date: new Date(l.created_at).toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' }),
                            previous_balance: l.running_balance + l.amount,
                            amount_paid: l.amount,
                            new_balance: l.running_balance,
                            payment_method: l.payment_method || 'Cash',
                            reference_number: l.note,
                          });
                        }}
                        className="p-1.5 rounded-lg bg-background hover:bg-[var(--kd-primary-soft)] text-foreground border border-border transition-colors cursor-pointer text-2xs font-semibold flex items-center gap-1"
                        title="Print Supplier Payment Slip"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Slip</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          from={pagination.from}
          to={pagination.to}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--kd-surface)] rounded-[var(--kd-radius)] shadow-2xl max-w-md w-full p-6 space-y-4 border border-primary/20">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />
                <span>Pay Distributor — {supplier.name}</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-[var(--kd-primary-soft)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--kd-surface)] text-foreground border-b border-border flex items-center justify-between shadow-[var(--kd-shadow)]">
              <span className="text-xs font-medium text-slate-300">
                Current Shop Payable Balance:
              </span>
              <span className="text-lg font-semibold font-mono text-accent">
                Rs. {currentBalance.toLocaleString()}
              </span>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Enter Payment Amount Paid (Rs.) *
                </label>
                <input
                  type="number"
                  required
                  autoFocus
                  placeholder="e.g. 50000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-3 border border-border rounded-xl font-semibold text-foreground text-base focus:ring-2 focus:ring-primary focus:outline-none bg-[var(--kd-surface)] shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-2">Payment Method *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '💵 Cash', value: 'Cash' },
                    { label: '🏦 Bank Transfer', value: 'Bank Transfer' },
                    { label: '🧾 Cheque', value: 'Cheque' },
                    { label: '📱 Online Transfer', value: 'Online Transfer' },
                  ].map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPaymentMethod(value)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all cursor-pointer ${
                        paymentMethod === value
                          ? 'bg-primary text-primary-foreground border-emerald-700 text-white shadow-[var(--kd-shadow)]'
                          : 'bg-[var(--kd-surface)] border-border text-muted-foreground hover:border-emerald-400 hover:text-primary'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Reference / Note (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Cheque #1234, MCB Ref: 567890"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-normal"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-background hover:bg-[var(--kd-primary-soft)] text-foreground font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md transition-all cursor-pointer text-white bg-primary text-primary-foreground hover:opacity-90"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Record Payment &amp; Print Slip</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Payment Thermal Slip Modal */}
      {supplierReceiptData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--kd-surface)] rounded-[var(--kd-radius)] shadow-2xl max-w-sm w-full border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[var(--kd-surface)] text-foreground p-4 flex items-center justify-between no-print">
              <div className="flex items-center space-x-2">
                <Printer className="h-4 w-4 text-accent" />
                <span className="font-bold text-xs">Supplier Payment Slip ({supplierReceiptData.voucher_number})</span>
              </div>
              <button onClick={() => setSupplierReceiptData(null)} className="text-muted-foreground hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-background flex justify-center max-h-[70vh] overflow-y-auto">
              <div className="bg-[var(--kd-surface)] p-2 shadow-md border border-border rounded">
                <PrintableReceipt type="supplier_payment" supplierPayment={supplierReceiptData} />
              </div>
            </div>

            <div className="p-3 bg-background border-t border-border flex items-center justify-between no-print">
              <button
                onClick={() => setSupplierReceiptData(null)}
                className="bg-slate-200 hover:bg-slate-300 text-foreground font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={triggerPrint}
                className="bg-primary text-primary-foreground hover:opacity-90 text-white font-semibold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-[var(--kd-shadow)] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
