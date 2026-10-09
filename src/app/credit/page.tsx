'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, AlertTriangle, ArrowRight, DollarSign, CreditCard, UserCheck } from 'lucide-react';
import { dataStore } from '@/lib/data-store';
import { Customer } from '@/lib/types';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

export default function CreditLedgerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    setCustomers(dataStore.getCustomers());
  }, []);
  const sales = dataStore.getSales();
  const pagination = usePagination(customers, 10);

  const totalCreditLimit = customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0);
  const totalOutstanding = customers.reduce((sum, c) => sum + ((c.current_balance || 0) > 0 ? c.current_balance! : 0), 0);
  const totalAdvanceHeld = customers.reduce((sum, c) => sum + ((c.current_balance || 0) < 0 ? Math.abs(c.current_balance!) : 0), 0);
  const overdueCount = customers.filter(c => (c.current_balance || 0) > c.credit_limit).length;
  const advanceCount = customers.filter(c => (c.current_balance || 0) < 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--kd-surface)] p-6 rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center space-x-2.5">
            <div className="p-2 bg-foreground rounded-xl text-primary">
              <Users className="h-5 w-5" />
            </div>
            <span>Udhaar Credit Ledger Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-normal mt-1">
            Monitor farmer credit limits, outstanding balances, advance deposits, and payment collections.
          </p>
        </div>

        <Link
          href="/customers"
          className="bg-primary text-primary-foreground hover:opacity-90 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-[var(--kd-shadow)] transition-colors"
        >
          <span>Manage All Farmers</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--kd-surface)] p-5 rounded-xl shadow-[var(--kd-shadow)] border border-border">
          <div className="flex justify-between items-center text-muted-foreground text-xs font-medium">
            <span>Total Outstanding Udhaar</span>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-semibold text-foreground mt-2 font-mono">Rs. {totalOutstanding.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground mt-1 font-normal">Actual debt owed to shop by farmers</p>
        </div>

        <div className="bg-[var(--kd-surface)] p-5 rounded-xl shadow-[var(--kd-shadow)] border border-border">
          <div className="flex justify-between items-center text-primary text-xs font-medium">
            <span>Total Advance Held</span>
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-semibold text-primary mt-2 font-mono">Rs. {totalAdvanceHeld.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground font-normal mt-1">Prepaid deposits from {advanceCount} farmers</p>
        </div>

        <div className="bg-[var(--kd-surface)] p-5 rounded-xl shadow-[var(--kd-shadow)] border border-border">
          <div className="flex justify-between items-center text-muted-foreground text-xs font-medium">
            <span>Combined Authorized Limit</span>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold text-foreground mt-2 font-mono">Rs. {totalCreditLimit.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground mt-1 font-normal">Sanctioned credit capacity</p>
        </div>

        <div className="bg-[var(--kd-surface)] p-5 rounded-xl shadow-[var(--kd-shadow)] border border-border">
          <div className="flex justify-between items-center text-muted-foreground text-xs font-medium">
            <span>Over-Limit Warnings</span>
            <AlertTriangle className="h-4 w-4 text-danger" />
          </div>
          <p className="text-2xl font-semibold text-danger mt-2">{overdueCount} Farmers</p>
          <p className="text-[11px] text-muted-foreground mt-1 font-normal">Exceeding safe credit limit</p>
        </div>
      </div>

      {/* Farmers Ledger Table */}
      <div className="bg-[var(--kd-surface)] rounded-xl shadow-[var(--kd-shadow)] border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" />
            <span>Farmers Credit Balances</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-background text-muted-foreground font-medium border-b border-border">
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
            <tbody className="divide-y divide-border">
              {pagination.pageItems.map((c) => {
                const balance = c.current_balance || 0;
                const isOverLimit = balance > c.credit_limit;
                const isAdvance = balance < 0;
                return (
                  <tr key={c.id} className="hover:bg-[var(--kd-primary-soft)]">
                    <td className="py-3 px-4 font-semibold text-foreground">{c.name}</td>
                    <td className="py-3 px-4 font-normal">{c.phone}<br /><span className="text-[10px] text-muted-foreground">{c.address}</span></td>
                    <td className="py-3 px-4 font-normal">{c.land_size} ({c.crop_type})</td>
                    <td className="py-3 px-4 text-muted-foreground font-normal">Rs. {c.credit_limit.toLocaleString()}</td>
                    <td className={`py-3 px-4 font-semibold font-mono ${isAdvance ? 'text-primary' : balance > 0 ? 'text-accent' : 'text-muted-foreground'}`}>
                      {isAdvance ? `Rs. ${Math.abs(balance).toLocaleString()} (Advance)` : `Rs. ${balance.toLocaleString()}`}
                    </td>
                    <td className="py-3 px-4">
                      {isAdvance ? (
                        <span className="bg-[var(--kd-primary-soft)] text-primary font-semibold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                          Advance
                        </span>
                      ) : isOverLimit ? (
                        <span className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                          Over Limit
                        </span>
                      ) : balance === 0 ? (
                        <span className="bg-background text-foreground border border-border text-[10px] font-semibold px-2 py-0.5 rounded">
                          Clear
                        </span>
                      ) : (
                        <span className="bg-[var(--kd-primary-soft)] text-primary border border-primary/20 text-[10px] font-semibold px-2 py-0.5 rounded">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/customers/${c.id}`}
                        className="text-primary hover:text-primary font-semibold hover:underline"
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
    </div>
  );
}
