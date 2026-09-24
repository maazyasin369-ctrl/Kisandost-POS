'use client';

import React, { useState, useEffect } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { getPendingRequests, approveRequest, rejectRequest } from '@/actions/admin';
import { useToast } from '@/components/ui/Toast';

type PendingRequestData = Awaited<ReturnType<typeof getPendingRequests>>;

export default function SuperAdminApprovalsPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<PendingRequestData>([]);
  const [loading, setLoading] = useState(true);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    const data = await getPendingRequests();
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id: string) => {
    const res = await approveRequest(id, 'super-admin-id');
    if (res.success) {
      showToast('Request approved & underlying change activated automatically!', 'success');
      loadRequests();
    } else {
      showToast(res.error || 'Approval failed', 'error');
    }
  };

  const handleReject = async (id: string) => {
    const note = rejectNote[id] || 'Request rejected by platform operator.';
    const res = await rejectRequest(id, 'super-admin-id', note);
    if (res.success) {
      showToast('Request rejected.', 'success');
      setRejectingId(null);
      loadRequests();
    } else {
      showToast(res.error || 'Rejection failed', 'error');
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <nav className="flex items-center gap-1.5 text-2xs font-bold text-slate-400 mb-1">
              <span>Super Admin</span>
              <ChevronRight className="w-3 h-3 text-slate-400" strokeWidth={2} />
              <span className="text-slate-900 font-extrabold">Pending Structural Approvals</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Pending Approvals Queue
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review and approve/reject structural requests (staff creation, new branch requests, module activations)
            </p>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="bg-white p-12 rounded-xl text-center text-slate-400 text-xs shadow-sm border border-slate-200">
            Loading approval requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-50/90 via-white to-emerald-50/30 border border-slate-200 rounded-2xl p-12 text-center space-y-2 shadow-card">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-extrabold text-slate-900">No Pending Requests</h3>
            <p className="text-xs text-slate-500">
              All structural requests across tenant shops have been reviewed. normal daily operations proceed independently.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => {
              const tenantObj = Array.isArray(r.tenants) ? r.tenants[0] : r.tenants;
              const profileObj = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
              return (
                <div key={r.id} className="bg-white rounded-2xl shadow-card border border-slate-200 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className={`text-2xs font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                        r.status === 'pending' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        r.status === 'approved' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-100 text-red-900 border border-red-300'
                      }`}>
                        STATUS: {r.status.toUpperCase()}
                      </span>
                      <h3 className="text-base font-semibold text-slate-900 mt-1.5 flex items-center gap-2">
                        <span>Request Type: {r.request_type.replace('_', ' ').toUpperCase()}</span>
                      </h3>
                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        Shop: <strong className="text-slate-900">{tenantObj?.business_name}</strong> ({tenantObj?.city}) | Requested by: {profileObj?.full_name ?? 'Owner'}
                      </p>
                    </div>
                  <div className="text-2xs text-slate-500 font-mono">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Details box */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 space-y-1">
                  <span className="text-2xs font-extrabold text-slate-500 uppercase block font-sans">Request Payload Details:</span>
                  <pre className="text-2xs overflow-x-auto">{JSON.stringify(r.request_details, null, 2)}</pre>
                </div>

                {r.status === 'pending' && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleApprove(r.id)}
                      className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>APPROVE &amp; ACTIVATE CHANGE</span>
                    </button>

                    {rejectingId === r.id ? (
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder="Reason for rejection..."
                          value={rejectNote[r.id] || ''}
                          onChange={(e) => setRejectNote({ ...rejectNote, [r.id]: e.target.value })}
                          className="w-full text-xs p-2 border border-red-300 rounded-lg focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(r.id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => setRejectingId(null)}
                            className="bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRejectingId(r.id)}
                        className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-rose-200 transition-all cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>REJECT REQUEST</span>
                      </button>
                    )}
                  </div>
                )}

                {r.review_note && (
                  <p className="text-2xs text-rose-700 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    Rejection Note: {r.review_note}
                  </p>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
