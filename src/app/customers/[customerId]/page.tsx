'use client';

import React, { useState, use } from 'react';
import { dataStore } from '@/lib/data-store';
import { User, Phone, MapPin, Sprout, CreditCard, ArrowLeft, DollarSign, Calendar, FileText, Printer, X } from 'lucide-react';
import Link from 'next/link';
import PrintableReceipt, { FarmerPaymentData } from '@/components/PrintableReceipt';
import { usePrintReceipt } from '@/lib/use-print-receipt';

export default function CustomerDetailPage({ params }: { params: Promise<{ customerId: string }> }) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.customerId;

  const customer = dataStore.getCustomerById(customerId);
  const ledgerEntries = dataStore.getLedger(customerId);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(5000);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');

  const [receiptData, setReceiptData] = useState<FarmerPaymentData | null>(null);
  const { triggerPrint } = usePrintReceipt();

  if (!customer) {
    return (
      <div className="p-8 text-center text-slate-500 space-y-4">
        <p className="text-base font-semibold">Farmer / Customer Record Not Found</p>
        <Link href="/customers" className="text-emerald-700 underline text-sm font-semibold">
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
        <Link href="/customers" className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 font-semibold text-xs">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Farmers</span>
        </Link>

        <button
          onClick={() => setShowPaymentModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer"
        >
          <DollarSign className="h-4 w-4" />
          <span>COLLECT UDHAAR PAYMENT</span>
        </button>
      </div>

      {/* Customer Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100 text-emerald-800 p-3 rounded-full">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-normal">
                <Phone className="h-3.5 w-3.5 text-slate-400" /> {customer.phone}
                <span className="mx-2">•</span>
                <MapPin className="h-3.5 w-3.5 text-slate-400" /> {customer.address}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md font-medium flex items-center gap-1">
              <Sprout className="h-3.5 w-3.5 text-emerald-600" /> Land: {customer.land_size || 0} Acres ({customer.crop_type})
            </span>
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md font-medium">
              Credit Limit: Rs. {(customer.credit_limit || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className={`rounded-xl p-4 text-right space-y-1 w-full md:w-auto border ${(customer.current_balance || 0) < 0 ? 'bg-emerald-50 border-emerald-300' : (customer.current_balance || 0) > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`text-xs font-semibold uppercase tracking-wider block ${(customer.current_balance || 0) < 0 ? 'text-emerald-800' : (customer.current_balance || 0) > 0 ? 'text-amber-800' : 'text-slate-600'}`}>
            {(customer.current_balance || 0) < 0 ? '💳 Advance Prepaid Balance' : (customer.current_balance || 0) > 0 ? 'Current Udhaar Outstanding' : 'Balance Status'}
          </span>
          <div className={`text-3xl font-semibold font-mono ${(customer.current_balance || 0) < 0 ? 'text-emerald-800' : (customer.current_balance || 0) > 0 ? 'text-amber-900' : 'text-slate-700'}`}>
            {(customer.current_balance || 0) < 0 ? `Rs. ${Math.abs(customer.current_balance!).toLocaleString()}` : `Rs. ${(customer.current_balance || 0).toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* Udhaar Ledger Statement */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-700" />
            <span>Customer Udhaar Statement &amp; Ledger History</span>
          </span>
          <span className="text-xs text-slate-500 font-normal">{ledgerEntries.length} transactions</span>
        </div>

        <div className="divide-y divide-slate-100">
          {ledgerEntries.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-normal text-xs">
              No credit transactions or payments recorded for this farmer.
            </div>
          ) : (
            ledgerEntries.map((l) => (
              <div key={l.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                      l.type === 'payment' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {l.type === 'payment' ? 'VASOOLI / PAYMENT' : 'CREDIT / UDHAAR'}
                    </span>
                    <span className="font-semibold text-slate-900">{l.note || 'Transaction'}</span>
                  </div>
                  <div className="text-slate-400 flex items-center gap-1 text-[11px] font-normal">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(l.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right space-y-0.5">
                    <div className={`font-semibold text-sm font-mono ${l.type === 'payment' ? 'text-emerald-700' : 'text-amber-800'}`}>
                      {l.type === 'payment' ? `- Rs. ${l.amount.toLocaleString()}` : `+ Rs. ${l.amount.toLocaleString()}`}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500">
                      Running Bal:{' '}
                      <span className={l.running_balance < 0 ? 'text-emerald-700 font-semibold' : l.running_balance > 0 ? 'text-amber-800 font-semibold' : 'text-slate-600'}>
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
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer text-2xs font-semibold flex items-center gap-1"
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
      </div>

      {/* Collect Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-emerald-950 text-white p-4 flex justify-between items-center">
              <h2 className="text-base font-semibold flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                <span>Receive Payment from {customer.name}</span>
              </h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white font-semibold text-lg cursor-pointer">×</button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Amount Received (Rs)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded font-semibold text-slate-900 text-base"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-medium text-slate-800"
                >
                  <option value="cash">Cash Collection</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other / Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Receipt Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared wheat season balance"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-normal text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded shadow-sm transition-colors cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-4 flex items-center justify-between no-print">
              <div className="flex items-center space-x-2">
                <Printer className="h-4 w-4 text-amber-400" />
                <span className="font-bold text-xs">Farmer Payment Slip ({receiptData.voucher_number})</span>
              </div>
              <button onClick={() => setReceiptData(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-100 flex justify-center max-h-[70vh] overflow-y-auto">
              <div className="bg-white p-2 shadow-md border border-slate-300 rounded">
                <PrintableReceipt type="farmer_payment" farmerPayment={receiptData} />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print">
              <button
                onClick={() => setReceiptData(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={triggerPrint}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
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
