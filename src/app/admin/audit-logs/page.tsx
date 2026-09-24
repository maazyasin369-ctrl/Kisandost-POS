'use client';

import React from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { dataStore } from '@/lib/data-store';
import { FileText, ShieldCheck, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

export default function SuperAdminAuditLogsPage() {
  const sales = dataStore.getSales();
  const transfers = dataStore.getTransfers();

  const auditEvents = [
    {
      id: 'log-1',
      time: '2026-08-27 16:30:00',
      type: 'SUPER_ADMIN_SESSION',
      action: 'Operator Session Verified',
      detail: 'Super Admin logged into Platform Control Center from 192.168.1.11',
      status: 'SECURE',
    },
    {
      id: 'log-2',
      time: '2026-08-27 15:45:12',
      type: 'COUNTER_SALE',
      action: 'POS Sale Executed',
      detail: `Receipt ${sales[0]?.sale_number || 'REC-2026-001'} processed for Rs. ${(sales[0]?.grand_total || 24500).toLocaleString()}`,
      status: 'COMPLETED',
    },
    {
      id: 'log-3',
      time: '2026-08-27 14:10:00',
      type: 'BRANCH_TRANSFER',
      action: 'Inventory Transfer Initiated',
      detail: `Transfer ${transfers[0]?.id || 'TRF-001'} initiated between Main Outlet and Ghalla Mandi Branch`,
      status: 'IN_TRANSIT',
    },
    {
      id: 'log-4',
      time: '2026-08-27 12:00:00',
      type: 'SUBSCRIPTION_AUDIT',
      action: 'Dealer License Validated',
      detail: 'License PB-MLT-2024-8891 status verified active with Department of Agriculture',
      status: 'VERIFIED',
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-7">

        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <nav className="flex items-center gap-1.5 text-2xs font-bold text-slate-400 mb-1">
              <span>Super Admin</span>
              <ChevronRight className="w-3 h-3 text-slate-400" strokeWidth={2} />
              <span className="text-slate-900 font-extrabold">Audit & Security</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Platform Security & System Audit Logs
            </h1>
          </div>
        </div>

        {/* Audit Log Solid Table Container */}
        <div className="bg-gradient-to-br from-slate-50/90 via-white to-emerald-50/30 border border-slate-200 rounded-2xl shadow-card overflow-hidden p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
            <div className="p-2 bg-emerald-700 text-white rounded-lg">
              <FileText className="w-4 h-4" strokeWidth={2} />
            </div>
            <h2 className="font-extrabold text-base text-slate-900">System Security Activity Trail</h2>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
            {auditEvents.map((log) => (
              <div key={log.id} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-slate-900 text-amber-400 font-mono">
                      {log.type}
                    </span>
                    <span className="font-extrabold text-slate-900 text-xs">{log.action}</span>
                  </div>
                  <p className="text-xs text-slate-600">{log.detail}</p>
                </div>

                <div className="flex items-center space-x-4 text-2xs">
                  <span className="text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {log.time}
                  </span>
                  <span className="bg-emerald-600 text-white font-semibold px-2.5 py-1 rounded-md shadow-sm">
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AdminShell>
  );
}
