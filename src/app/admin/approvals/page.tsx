'use client';

import React, { useState, useEffect } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
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
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

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
  const regsPagination = usePagination(pendingRegistrations, 10);
  const structPagination = usePagination(structuralRequests, 10);

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <PageHeader
          crumbs={[{ label: 'Super Admin' }, { label: 'Approvals' }]}
          title="Pending approvals"
          description={`${totalPending} request${totalPending === 1 ? '' : 's'} waiting for review.`}
        />

        <section className="overflow-hidden rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] shadow-[var(--kd-shadow)]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold tracking-tight">Shop registrations</h2>
            <span className="text-xs text-muted-foreground">{pendingSelfRegsCount} awaiting review</span>
          </div>

          {loading ? (
            <div className="h-28 animate-pulse bg-[var(--kd-primary-soft)]" />
          ) : pendingRegistrations.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No pending shop registrations.</p>
          ) : (
            <>
            <ul>
              {regsPagination.pageItems.map((reg) => {
                const isPending = reg.status === 'pending'
                return (
                  <li key={reg.id} className="border-b border-border px-5 py-4 last:border-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <StatusBadge status={reg.status} />
                          <span className="text-xs text-muted-foreground">{new Date(reg.created_at).toLocaleString()}</span>
                        </div>
                        <h3 className="text-base font-semibold text-foreground">{reg.business_name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{reg.full_name} · {reg.city}</p>
                      </div>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <div><dt className="text-xs text-muted-foreground">Username</dt><dd className="font-medium">@{reg.username}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Phone</dt><dd className="font-medium">{reg.phone}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Email</dt><dd className="font-medium">{reg.email || 'None'}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">City</dt><dd className="font-medium">{reg.city}</dd></div>
                    </dl>
                    {isPending && (
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button type="button" onClick={() => handleApproveRegistration(reg.id)} className="rounded-[var(--kd-radius)] bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                          Approve
                        </button>
                        {rejectingId === reg.id ? (
                          <div className="flex flex-1 flex-col gap-2">
                            <input
                              type="text"
                              placeholder="Reason for rejection"
                              value={rejectNote[reg.id] || ''}
                              onChange={(e) => setRejectNote({ ...rejectNote, [reg.id]: e.target.value })}
                              className="rounded-[var(--kd-radius)] border border-border bg-background px-3 py-2 text-sm outline-none"
                            />
                            <div className="flex gap-2">
                              <button type="button" onClick={() => handleRejectRegistration(reg.id)} className="rounded-[var(--kd-radius)] bg-danger px-3 py-2 text-sm font-medium text-white">Confirm reject</button>
                              <button type="button" onClick={() => setRejectingId(null)} className="rounded-[var(--kd-radius)] border border-border px-3 py-2 text-sm">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setRejectingId(reg.id)} className="rounded-[var(--kd-radius)] border border-border px-3 py-2 text-sm font-medium text-danger">
                            Reject
                          </button>
                        )}
                      </div>
                    )}
                    {reg.review_note && <p className="mt-3 text-sm text-danger">Note: {reg.review_note}</p>}
                  </li>
                )
              })}
            </ul>
            <Pagination
              page={regsPagination.page}
              totalPages={regsPagination.totalPages}
              totalItems={regsPagination.totalItems}
              from={regsPagination.from}
              to={regsPagination.to}
              pageSize={regsPagination.pageSize}
              onPageChange={regsPagination.setPage}
              onPageSizeChange={regsPagination.setPageSize}
            />
            </>
          )}
        </section>

        {structuralRequests.length > 0 && (
          <section className="overflow-hidden rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] shadow-[var(--kd-shadow)]">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold tracking-tight">Module and staff requests</h2>
            </div>
            <ul>
              {structPagination.pageItems.map((r) => {
                const tenantObj = Array.isArray(r.tenants) ? r.tenants[0] : r.tenants
                const profileObj = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
                return (
                  <li key={r.id} className="border-b border-border px-5 py-4 last:border-0">
                    <div className="mb-1 flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    <h3 className="text-sm font-semibold capitalize text-foreground">{r.request_type.replaceAll('_', ' ')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tenantObj?.business_name} · {tenantObj?.city} · {profileObj?.full_name ?? 'Owner'}
                    </p>
                    <pre className="mt-3 overflow-x-auto rounded-[var(--kd-radius)] bg-background p-3 text-xs text-foreground">{JSON.stringify(r.request_details, null, 2)}</pre>
                    {r.status === 'pending' && (
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button type="button" onClick={() => handleApproveStructural(r.id)} className="rounded-[var(--kd-radius)] bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                          Approve
                        </button>
                        {rejectingId === r.id ? (
                          <div className="flex flex-1 flex-col gap-2">
                            <input
                              type="text"
                              placeholder="Reason for rejection"
                              value={rejectNote[r.id] || ''}
                              onChange={(e) => setRejectNote({ ...rejectNote, [r.id]: e.target.value })}
                              className="rounded-[var(--kd-radius)] border border-border bg-background px-3 py-2 text-sm outline-none"
                            />
                            <div className="flex gap-2">
                              <button type="button" onClick={() => handleRejectStructural(r.id)} className="rounded-[var(--kd-radius)] bg-danger px-3 py-2 text-sm font-medium text-white">Confirm reject</button>
                              <button type="button" onClick={() => setRejectingId(null)} className="rounded-[var(--kd-radius)] border border-border px-3 py-2 text-sm">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setRejectingId(r.id)} className="rounded-[var(--kd-radius)] border border-border px-3 py-2 text-sm font-medium text-danger">
                            Reject
                          </button>
                        )}
                      </div>
                    )}
                    {r.review_note && <p className="mt-3 text-sm text-danger">Note: {r.review_note}</p>}
                  </li>
                )
              })}
            </ul>
            <Pagination
              page={structPagination.page}
              totalPages={structPagination.totalPages}
              totalItems={structPagination.totalItems}
              from={structPagination.from}
              to={structPagination.to}
              pageSize={structPagination.pageSize}
              onPageChange={structPagination.setPage}
              onPageSizeChange={structPagination.setPageSize}
            />
          </section>
        )}
      </div>
    </AdminShell>
  )
}
