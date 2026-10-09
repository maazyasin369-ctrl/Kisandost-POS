'use client';

import React, { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dataStore } from '@/lib/data-store';
import { resolveRemappedId, isPatternedDemoId } from '@/lib/id-remap';
import { User, Phone, MapPin, Sprout, CreditCard, ArrowLeft, DollarSign, Calendar, FileText, Printer, X } from 'lucide-react';
import Link from 'next/link';
import PrintableReceipt, { FarmerPaymentData } from '@/components/PrintableReceipt';
import { usePrintReceipt } from '@/lib/use-print-receipt';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

export default function CustomerDetailPage({ params }: { params: Promise<{ customerId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const rawCustomerId = resolvedParams.customerId;
  const customerId = resolveRemappedId(rawCustomerId);

  useEffect(() => {
    if (isPatternedDemoId(rawCustomerId)) {
      router.replace(`/customers/${customerId}`);
    }
  }, [rawCustomerId, customerId, router]);

  const customer = dataStore.getCustomerById(customerId);
  const ledgerEntries = dataStore.getLedger(customerId);
  const pagination = usePagination(ledgerEntries, 10);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(5000);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');

  const [receiptData, setReceiptData] = useState<FarmerPaymentData | null>(null);
  const { triggerPrint } = usePrintReceipt();

  if (!customer) {
    return (
      <div className="p-8 text-center text-muted-foreground space-y-4">
        <p className="text-base font-semibold">Farmer / Customer Record Not Found</p>
        <Link href="/customers" className="text-primary underline text-sm font-semibold">
          ← Back to Farmers List
        </Link>
      </div>
    );
  }

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;

    const prevBal = customer.current_balance || 0;
    const newBal = prevBal - paymentAmount;

    dataStore.recordCustomerPayment({
      customer_id: customer.id,
      amount: paymentAmount,
      method: paymentMethod,
      note: paymentNote
    });

    const voucherNo = `VAS-${Date.now().toString().slice(-6)}`;
    setReceiptData({
      voucher_number: voucherNo,
      customer_name: customer.name,
      customer_phone: customer.phone,
      date: new Date().toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' }),
      previous_balance: prevBal,
      amount_paid: paymentAmount,
      new_balance: newBal,
      payment_method: paymentMethod.replace('_', ' '),
      notes: paymentNote,
    });

    setShowPaymentModal(false);
    setPaymentNote('');
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/customers" className="flex items-center space-x-1 text-muted-foreground hover:text-foreground font-semibold text-xs">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Farmers</span>
        </Link>

        <button
          onClick={() => setShowPaymentModal(true)}
          className="bg-primary hover:bg-primary text-primary-foreground text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-[var(--kd-shadow)] flex items-center space-x-1.5 cursor-pointer"
        >
          <DollarSign className="h-4 w-4" />
          <span>COLLECT UDHAAR PAYMENT</span>
        </button>
      </div>

      {/* Customer Profile Header */}
      <div className="bg-[var(--kd-surface)] rounded-xl shadow-[var(--kd-shadow)] border border-border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="bg-[var(--kd-primary-soft)] text-primary p-3 rounded-full">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{customer.name}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-normal">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {customer.phone}
                <span className="mx-2">•</span>
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {customer.address}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
            <span className="bg-background text-foreground px-3 py-1 rounded-md font-medium flex items-center gap-1">
              <Sprout className="h-3.5 w-3.5 text-primary" /> Land: {customer.land_size || 0} Acres ({customer.crop_type})
            </span>
            <span className="bg-background text-foreground px-3 py-1 rounded-md font-medium">
              Credit Limit: Rs. {(customer.credit_limit || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className={`rounded-xl p-4 text-right space-y-1 w-full md:w-auto border ${(customer.current_balance || 0) < 0 ? 'bg-[var(--kd-primary-soft)] border-primary/20' : (customer.current_balance || 0) > 0 ? 'bg-[var(--kd-accent-soft)] border-accent/20' : 'bg-background border-border'}`}>
          <span className={`text-xs font-semibold uppercase tracking-wider block ${(customer.current_balance || 0) < 0 ? 'text-primary' : (customer.current_balance || 0) > 0 ? 'text-accent' : 'text-muted-foreground'}`}>
            {(customer.current_balance || 0) < 0 ? '💳 Advance Prepaid Balance' : (customer.current_balance || 0) > 0 ? 'Current Udhaar Outstanding' : 'Balance Status'}
          </span>
          <div className={`text-3xl font-semibold font-mono ${(customer.current_balance || 0) < 0 ? 'text-primary' : (customer.current_balance || 0) > 0 ? 'text-accent' : 'text-foreground'}`}>
            {(customer.current_balance || 0) < 0 ? `Rs. ${Math.abs(customer.current_balance!).toLocaleString()}` : `Rs. ${(customer.current_balance || 0).toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* Udhaar Ledger Statement */}
      <div className="bg-[var(--kd-surface)] rounded-xl shadow-[var(--kd-shadow)] border border-border overflow-hidden">
        <div className="p-4 bg-background border-b border-border font-semibold text-foreground text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span>Customer Udhaar Statement &amp; Ledger History</span>
          </span>
          <span className="text-xs text-muted-foreground font-normal">{ledgerEntries.length} transactions</span>
        </div>

        <div className="divide-y divide-border">
          {ledgerEntries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-normal text-xs">
              No credit transactions or payments recorded for this farmer.
            </div>
          ) : (
            pagination.pageItems.map((l) => (
              <div key={l.id} className="p-4 hover:bg-[var(--kd-primary-soft)] transition-colors flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                      l.type === 'payment' ? 'bg-[var(--kd-primary-soft)] text-primary border border-primary/20' : 'bg-[var(--kd-accent-soft)] text-accent border border-accent/30'
                    }`}>
                      {l.type === 'payment' ? 'VASOOLI / PAYMENT' : 'CREDIT / UDHAAR'}
                    </span>
                    <span className="font-semibold text-foreground">{l.note || 'Transaction'}</span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1 text-[11px] font-normal">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(l.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right space-y-0.5">
                    <div className={`font-semibold text-sm font-mono ${l.type === 'payment' ? 'text-primary' : 'text-accent'}`}>
                      {l.type === 'payment' ? `- Rs. ${l.amount.toLocaleString()}` : `+ Rs. ${l.amount.toLocaleString()}`}
                    </div>
                    <div className="text-[11px] font-medium text-muted-foreground">
                      Running Bal:{' '}
                      <span className={l.running_balance < 0 ? 'text-primary font-semibold' : l.running_balance > 0 ? 'text-accent font-semibold' : 'text-muted-foreground'}>
                        {l.running_balance < 0
                          ? `Rs. ${Math.abs(l.running_balance).toLocaleString()} (Advance)`
                          : l.running_balance > 0
                          ? `Rs. ${l.running_balance.toLocaleString()} (Udhaar)`
                          : 'Rs. 0 (Clear)'}
                      </span>
                    </div>
                  </div>

                  {l.type === 'payment' && (
                    <button
                      onClick={() => {
                        setReceiptData({
                          voucher_number: `PAY-${l.id.slice(-6)}`,
                          customer_name: customer.name,
                          customer_phone: customer.phone,
                          date: new Date(l.created_at).toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' }),
                          previous_balance: l.running_balance + l.amount,
                          amount_paid: l.amount,
                          new_balance: l.running_balance,
                          payment_method: 'Cash',
                          notes: l.note,
                        });
                      }}
                      className="p-1.5 rounded-lg bg-background hover:bg-[var(--kd-primary-soft)] text-foreground border border-border transition-colors cursor-pointer text-2xs font-semibold flex items-center gap-1"
                      title="Print Farmer Collection Receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Slip</span>
                    </button>
                  )}
                </div>
              </div>
            ))
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

      {/* Collect Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--kd-surface)] rounded-xl shadow-2xl max-w-md w-full border border-border overflow-hidden">
            <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
              <h2 className="text-base font-semibold flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span>Receive Payment from {customer.name}</span>
              </h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-muted-foreground hover:text-white font-semibold text-lg cursor-pointer">×</button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">Amount Received (Rs)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full p-2.5 border border-border rounded font-semibold text-foreground text-base"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border border-border rounded font-medium text-foreground"
                >
                  <option value="cash">Cash Collection</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other / Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Receipt Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared wheat season balance"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full p-2 border border-border rounded font-normal text-foreground"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-background hover:bg-[var(--kd-primary-soft)] text-foreground rounded font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary text-primary-foreground text-white font-semibold rounded shadow-[var(--kd-shadow)] transition-colors cursor-pointer"
                >
                  Record Payment &amp; Print Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--kd-surface)] rounded-[var(--kd-radius)] shadow-2xl max-w-sm w-full border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[var(--kd-surface)] text-foreground p-4 flex items-center justify-between no-print">
              <div className="flex items-center space-x-2">
                <Printer className="h-4 w-4 text-accent" />
                <span className="font-bold text-xs">Farmer Payment Slip ({receiptData.voucher_number})</span>
              </div>
              <button onClick={() => setReceiptData(null)} className="text-muted-foreground hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-background flex justify-center max-h-[70vh] overflow-y-auto">
              <div className="bg-[var(--kd-surface)] p-2 shadow-md border border-border rounded">
                <PrintableReceipt type="farmer_payment" farmerPayment={receiptData} />
              </div>
            </div>

            <div className="p-3 bg-background border-t border-border flex items-center justify-between no-print">
              <button
                onClick={() => setReceiptData(null)}
                className="bg-slate-200 hover:bg-slate-300 text-foreground font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={triggerPrint}
                className="bg-primary text-primary-foreground hover:opacity-90 text-white font-semibold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-[var(--kd-shadow)] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
