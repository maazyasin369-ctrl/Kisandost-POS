'use client';

import React from 'react';
import { dataStore } from '@/lib/data-store';
import { ArrowLeftRight, Plus, CheckCircle2, Clock, Truck } from 'lucide-react';

export default function BranchesPage() {
  const branches = dataStore.getBranches();
  const transfers = dataStore.getTransfers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <ArrowLeftRight className="h-6 w-6 text-emerald-800" />
            <span>Multi-Branch Stock Transfers (Approval Flow)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Request, approve, and receive spray batch inventory between physical shop branches.
          </p>
        </div>

        <button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center space-x-1.5 shadow-sm">
          <Plus className="h-4 w-4" />
          <span>New Transfer Request</span>
        </button>
      </div>

      {/* Branches Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {branches.map((branch) => (
          <div key={branch.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{branch.name}</h3>
                <p className="text-xs text-slate-500">{branch.address}</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                Active Branch
              </span>
            </div>

            <div className="text-xs text-slate-600 flex justify-between pt-2 border-t border-slate-100">
              <span>Phone: <strong>{branch.phone}</strong></span>
              <span>Manager: <strong>Muhammad Asif</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Stock Transfer History & In-Transit Logs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white font-bold text-sm flex items-center space-x-2">
          <Truck className="h-4 w-4 text-emerald-400" />
          <span>Active Stock Transfer Logs</span>
        </div>

        <div className="divide-y divide-slate-100">
          {transfers.map((trf) => (
            <div key={trf.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-900">{trf.from_branch_name}</span>
                  <span className="text-slate-400">➔</span>
                  <span className="font-extrabold text-emerald-800">{trf.to_branch_name}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Requested by: {trf.requested_by_name} | Date: {new Date(trf.created_at).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded text-xs flex items-center space-x-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="uppercase">{trf.status}</span>
                </span>
                <button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 px-3 rounded text-xs">
                  Mark Received
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
