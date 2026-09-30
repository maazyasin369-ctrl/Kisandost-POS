'use client';

import React, { useState, useEffect } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { getPendingRequests, approveRequest, rejectRequest } from '@/actions/admin';
import { dataStore } from '@/lib/data-store';
import { PendingRegistration } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

type PendingRequestData = Awaited<ReturnType<typeof getPendingRequests>>;

export default function SuperAdminApprovalsPage() {
  const { showToast } = useToast();
  const [structuralRequests, setStructuralRequests] = useState<PendingRequestData>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    // Load local mock pending self-registrations
    const regs = dataStore.getPendingRegistrations();
    setPendingRegistrations([...regs]);

    // Load server-side structural requests
    try {
      const data = await getPendingRequests();
      setStructuralRequests(data || []);
    } catch (e) {
      console.log('No server-side pending requests API:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveRegistration = (regId: string) => {
    const res = dataStore.approveRegistration(regId, 'Super Admin');
    if (res.success) {
      showToast('Shop registration approved! Account activated and ready for login.', 'success');
      loadData();
    } else {
      showToast(res.error || 'Failed to approve registration.', 'error');
    }
  };

  const handleRejectRegistration = (regId: string) => {
    const note = rejectNote[regId] || 'Registration rejected by Super Admin.';
    const res = dataStore.rejectRegistration(regId, note, 'Super Admin');
    if (res.success) {
      showToast('Shop registration request rejected.', 'success');
      setRejectingId(null);
      loadData();
    } else {
      showToast(res.error || 'Failed to reject registration.', 'error');
    }
  };

  const handleApproveStructural = async (id: string) => {
    const res = await approveRequest(id, 'super-admin-id');
    if (res.success) {
      showToast('Request approved & underlying change activated automatically!', 'success');
      loadData();
    } else {
      showToast(res.error || 'Approval failed', 'error');
    }
  };

  const handleRejectStructural = async (id: string) => {
    const note = rejectNote[id] || 'Request rejected by platform operator.';
    const res = await rejectRequest(id, 'super-admin-id', note);
    if (res.success) {
      showToast('Request rejected.', 'success');
      setRejectingId(null);
      loadData();
    } else {
      showToast(res.error || 'Rejection failed', 'error');
    }
  };

  const pendingSelfRegsCount = pendingRegistrations.filter(r => r.status === 'pending').length;
  const pendingStructCount = structuralRequests.filter(r => r.status === 'pending').length;
  const totalPending = pendingSelfRegsCount + pendingStructCount;

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <nav className="flex items-center gap-1.5 text-2xs font-medium text-slate-400 mb-1">
              <span>Super Admin</span>
              <ChevronRight className="w-3 h-3 text-slate-400" strokeWidth={2} />
              <span className="text-slate-900 font-semibold">Pending Approvals Queue</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Pending Approvals Queue</span>
              {totalPending > 0 && (
                <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full">
                  {totalPending} PENDING
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 font-normal mt-1">
              Review and approve/reject self-signup shop registrations and structural tenant requests.
            </p>
          </div>
        </div>

        {/* Section 1: Self-Signup Shop Registrations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              <span>Self-Signup Shop Registrations ({pendingRegistrations.length})</span>
            </h2>
            <span className="text-xs font-medium text-slate-500">
              {pendingSelfRegsCount} awaiting review
            </span>
          </div>

          {loading ? (
            <div className="bg-white p-8 rounded-xl text-center text-slate-400 text-xs">
              Loading pending registrations...
            </div>
          ) : pendingRegistrations.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-900">No Pending Shop Registrations</h3>
              <p className="text-xs text-slate-500 font-normal">
                When new shop owners register via the signup link, their verification requests will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRegistrations.map((reg) => {
                const isPending = reg.status === 'pending';
                const isApproved = reg.status === 'approved';
                const isRejected = reg.status === 'rejected';

                return (
                  <div key={reg.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xs font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                            isPending ? 'bg-amber-100 text-amber-900 border-amber-300' :
                            isApproved ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-red-100 text-red-900 border-red-300'
                          }`}>
                            REGISTRATION STATUS: {reg.status.toUpperCase()}
                          </span>
                          <span className="text-2xs font-mono text-slate-400">ID: {reg.id}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mt-1.5">
                          {reg.business_name}
                        </h3>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          Owner: <strong className="text-slate-900">{reg.full_name}</strong> | City: <strong className="text-slate-900">{reg.city}</strong>
                        </p>
                      </div>

                      <div className="text-2xs text-slate-500 font-mono font-medium">
                        Submitted: {new Date(reg.created_at).toLocaleString()}
                      </div>
                    </div>

                    {/* Registration Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-2xs uppercase text-slate-400 font-bold block">Username Handle</span>
                        <strong className="font-mono text-amber-700 font-bold">@{reg.username}</strong>
                      </div>
                      <div>
                        <span className="text-2xs uppercase text-slate-400 font-bold block">Phone Number</span>
                        <strong className="font-mono text-slate-900">{reg.phone}</strong>
                      </div>
                      <div>
                        <span className="text-2xs uppercase text-slate-400 font-bold block">Email Address</span>
                        <strong className="font-mono text-slate-900">{reg.email || 'None provided'}</strong>
                      </div>
                      <div>
                        <span className="text-2xs uppercase text-slate-400 font-bold block">Shop City / Location</span>
                        <strong className="text-slate-900">{reg.city}</strong>
                      </div>
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleApproveRegistration(reg.id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>APPROVE &amp; ACTIVATE SHOP</span>
                        </button>

                        {rejectingId === reg.id ? (
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              placeholder="Reason for rejection (e.g. invalid phone/address)..."
                              value={rejectNote[reg.id] || ''}
                              onChange={(e) => setRejectNote({ ...rejectNote, [reg.id]: e.target.value })}
                              className="w-full text-xs font-normal p-2 border border-red-300 rounded-lg focus:outline-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRejectRegistration(reg.id)}
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                              >
                                Confirm Reject
                              </button>
                              <button
                                onClick={() => setRejectingId(null)}
                                className="bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRejectingId(reg.id)}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-red-200 transition-all cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>REJECT REGISTRATION</span>
                          </button>
                        )}
                      </div>
                    )}

                    {reg.review_note && (
                      <p className="text-2xs text-red-700 font-semibold bg-red-50 p-2.5 rounded-xl border border-red-200">
                        Rejection Note: {reg.review_note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Structural Requests */}
        {structuralRequests.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Structural Module &amp; Staff Requests ({structuralRequests.length})</span>
              </h2>
            </div>

            <div className="space-y-4">
              {structuralRequests.map((r) => {
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
                        <p className="text-xs text-slate-600 font-normal mt-0.5">
                          Shop: <strong className="text-slate-900 font-semibold">{tenantObj?.business_name}</strong> ({tenantObj?.city}) | Requested by: {profileObj?.full_name ?? 'Owner'}
                        </p>
                      </div>
                      <div className="text-2xs text-slate-500 font-mono font-medium">
                        {new Date(r.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 space-y-1">
                      <span className="text-2xs font-medium text-slate-500 uppercase block font-sans">Request Payload Details:</span>
                      <pre className="text-2xs overflow-x-auto font-medium">{JSON.stringify(r.request_details, null, 2)}</pre>
                    </div>

                    {r.status === 'pending' && (
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleApproveStructural(r.id)}
                          className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
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
                              className="w-full text-xs font-normal p-2 border border-red-300 rounded-lg focus:outline-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRejectStructural(r.id)}
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                              >
                                Confirm Reject
                              </button>
                              <button
                                onClick={() => setRejectingId(null)}
                                className="bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRejectingId(r.id)}
                            className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-rose-200 transition-all cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>REJECT REQUEST</span>
                          </button>
                        )}
                      </div>
                    )}

                    {r.review_note && (
                      <p className="text-2xs text-rose-700 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                        Rejection Note: {r.review_note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
