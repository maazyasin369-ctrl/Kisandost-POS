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
  Plus,
  User,
  ShieldCheck
} from 'lucide-react';
import { dataStore } from '@/lib/data-store';
import { Supplier, SupplierLedgerEntry } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function SupplierDetailPage({ params }: { params: Promise<{ supplierId: string }> }) {
  const resolvedParams = use(params);
  const supplierId = resolvedParams.supplierId;
  const { showToast } = useToast();

  const [supplier, setSupplier] = useState<Supplier | undefined>(() => dataStore.getSupplierById(supplierId));
  const [ledgerEntries, setLedgerEntries] = useState<SupplierLedgerEntry[]>(() => dataStore.getSupplierLedger(supplierId));

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentNote, setPaymentNote] = useState('');

  const refreshData = () => {
    setSupplier(dataStore.getSupplierById(supplierId));
    setLedgerEntries(dataStore.getSupplierLedger(supplierId));
  };

  useEffect(() => {
    refreshData();
  }, [supplierId]);

  if (!supplier) {
    return (
      <div className="p-8 text-center text-slate-500 space-y-4">
        <p className="text-base font-semibold">Pesticide Supplier / Distributor Record Not Found</p>
        <Link href="/suppliers" className="text-emerald-700 underline text-sm font-semibold inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Suppliers Directory
        </Link>
      </div>
    );
  }

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    dataStore.recordSupplierPayment({
      supplier_id: supplier.id,
      amount,
      payment_method: paymentMethod,
      note: paymentNote.trim() || undefined,
    });

    refreshData();
    showToast(`Rs. ${amount.toLocaleString()} paid to ${supplier.name} via ${paymentMethod}`, 'success');
    setShowPaymentModal(false);
    setPaymentAmount('');
    setPaymentMethod('Cash');
    setPaymentNote('');
  };

  const currentBalance = supplier.current_balance || 0;

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/suppliers" className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 font-semibold text-xs">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Suppliers</span>
        </Link>

        <button
          onClick={() => setShowPaymentModal(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2.5 rounded-lg text-xs shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <Banknote className="h-4 w-4" />
          <span>RECORD PAYMENT TO DISTRIBUTOR</span>
        </button>
      </div>

      {/* Supplier Profile Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100 text-emerald-800 p-3 rounded-xl border border-emerald-200">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-900">{supplier.name}</h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                  Distributor
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 flex-wrap font-normal">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-400" /> Representative: {supplier.contact_person}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-emerald-800 flex items-center gap-1 font-semibold">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> {supplier.phone}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" /> {supplier.address}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Current Payable Balance Summary */}
        <div className={`rounded-xl p-4 text-right space-y-1 w-full md:w-auto border ${currentBalance > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <span className={`text-xs font-semibold uppercase tracking-wider block ${currentBalance > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
            {currentBalance > 0 ? 'Shop Payable Balance (We Owe)' : 'Account Settled / Clear'}
          </span>
          <div className={`text-3xl font-semibold font-mono ${currentBalance > 0 ? 'text-amber-900' : 'text-emerald-800'}`}>
            Rs. {currentBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Supplier Ledger Statement & History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-700" />
            <span>Supplier Account Statement & Ledger History</span>
          </span>
          <span className="text-xs text-slate-500 font-normal">{ledgerEntries.length} transactions recorded</span>
        </div>

        <div className="divide-y divide-slate-100">
          {ledgerEntries.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-normal">
              No purchase orders or payment entries recorded for this supplier.
            </div>
          ) : (
            ledgerEntries.map((l) => {
              const isPayment = l.type === 'payment';
              return (
                <div key={l.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span
                        className={`font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wide ${
                          isPayment
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {isPayment ? 'PAYMENT (PAID)' : 'PURCHASE (STOCK RECEIVED)'}
                      </span>

                      {l.payment_method && (
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200">
                          Method: {l.payment_method}
                        </span>
                      )}

                      {l.purchase_number && (
                        <span className="bg-slate-100 text-slate-900 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200">
                          {l.purchase_number}
                        </span>
                      )}

                      <span className="font-semibold text-slate-900 text-sm">{l.note || (isPayment ? 'Distributor Payment' : 'Stock Purchase Bill')}</span>
                    </div>

                    <div className="text-slate-400 flex items-center gap-1 text-[11px] font-normal">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(l.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-1 shrink-0">
                    <div className={`font-semibold text-base font-mono ${isPayment ? 'text-emerald-700' : 'text-amber-800'}`}>
                      {isPayment ? `- Rs. ${l.amount.toLocaleString()}` : `+ Rs. ${l.amount.toLocaleString()}`}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500">
                      Running Bal:{' '}
                      <span className={l.running_balance > 0 ? 'text-amber-800 font-semibold font-mono' : 'text-emerald-700 font-semibold font-mono'}>
                        Rs. {l.running_balance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-emerald-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-700" />
                <span>Pay Distributor — {supplier.name}</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-sm">
              <span className="text-xs font-medium text-slate-300">
                Current Shop Payable Balance:
              </span>
              <span className="text-lg font-semibold font-mono text-amber-400">
                Rs. {currentBalance.toLocaleString()}
              </span>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-800 mb-1">
                  Enter Payment Amount Paid (Rs.) *
                </label>
                <input
                  type="number"
                  required
                  autoFocus
                  placeholder="e.g. 50000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl font-semibold text-slate-900 text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-800 mb-2">Payment Method *</label>
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
                          ? 'bg-emerald-700 border-emerald-700 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Reference / Note (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Cheque #1234, MCB Ref: 567890"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md transition-all cursor-pointer text-white bg-emerald-700 hover:bg-emerald-800"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Record Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
