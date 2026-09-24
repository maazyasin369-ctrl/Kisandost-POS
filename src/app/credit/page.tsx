'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, AlertTriangle, ArrowRight, DollarSign, CreditCard, UserCheck } from 'lucide-react';
import { dataStore } from '@/lib/data-store';
import { Customer } from '@/lib/types';

export default function CreditLedgerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    setCustomers(dataStore.getCustomers());
  }, []);
  const sales = dataStore.getSales();

  const totalCreditLimit = customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0);
  const totalOutstanding = customers.reduce((sum, c) => sum + ((c.current_balance || 0) > 0 ? c.current_balance! : 0), 0);
  const totalAdvanceHeld = customers.reduce((sum, c) => sum + ((c.current_balance || 0) < 0 ? Math.abs(c.current_balance!) : 0), 0);
  const overdueCount = customers.filter(c => (c.current_balance || 0) > c.credit_limit).length;
  const advanceCount = customers.filter(c => (c.current_balance || 0) < 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <div className="p-2 bg-slate-950 rounded-xl text-yellow-400">
              <Users className="h-5 w-5" />
            </div>
            <span>Udhaar Credit Ledger Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Monitor farmer credit limits, outstanding balances, advance deposits, and payment collections.
          </p>
        </div>

        <Link
          href="/customers"
          className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
        >
          <span>Manage All Farmers</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Total Outstanding Udhaar</span>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-semibold text-slate-900 mt-2 font-mono">Rs. {totalOutstanding.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-normal">Actual debt owed to shop by farmers</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center text-emerald-800 text-xs font-medium">
            <span>Total Advance Held</span>
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-semibold text-emerald-700 mt-2 font-mono">Rs. {totalAdvanceHeld.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 font-normal mt-1">Prepaid deposits from {advanceCount} farmers</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Combined Authorized Limit</span>
            <CreditCard className="h-4 w-4 text-slate-600" />
          </div>
          <p className="text-2xl font-semibold text-slate-900 mt-2 font-mono">Rs. {totalCreditLimit.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-normal">Sanctioned credit capacity</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Over-Limit Warnings</span>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl font-semibold text-red-600 mt-2">{overdueCount} Farmers</p>
          <p className="text-[11px] text-slate-500 mt-1 font-normal">Exceeding safe credit limit</p>
        </div>
      </div>

      {/* Farmers Ledger Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-700" />
            <span>Farmers Credit Balances</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Farmer Name</th>
                <th className="py-3 px-4">Contact / City</th>
                <th className="py-3 px-4">Land Size</th>
                <th className="py-3 px-4">Credit Limit</th>
                <th className="py-3 px-4">Current Udhaar / Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {customers.map((c) => {
                const balance = c.current_balance || 0;
                const isOverLimit = balance > c.credit_limit;
                const isAdvance = balance < 0;
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 font-normal">{c.phone}<br /><span className="text-[10px] text-slate-400">{c.address}</span></td>
                    <td className="py-3 px-4 font-normal">{c.land_size} ({c.crop_type})</td>
                    <td className="py-3 px-4 text-slate-600 font-normal">Rs. {c.credit_limit.toLocaleString()}</td>
                    <td className={`py-3 px-4 font-semibold font-mono ${isAdvance ? 'text-emerald-700' : balance > 0 ? 'text-amber-800' : 'text-slate-600'}`}>
                      {isAdvance ? `Rs. ${Math.abs(balance).toLocaleString()} (Advance)` : `Rs. ${balance.toLocaleString()}`}
                    </td>
                    <td className="py-3 px-4">
                      {isAdvance ? (
                        <span className="bg-amber-400 text-slate-950 font-semibold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                          💳 Advance
                        </span>
                      ) : isOverLimit ? (
                        <span className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                          Over Limit
                        </span>
                      ) : balance === 0 ? (
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                          Clear
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/customers/${c.id}`}
                        className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
                      >
                        View Ledger & Pay →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
