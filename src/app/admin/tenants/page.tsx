'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { dataStore } from '@/lib/data-store';
import {
  Store,
  ChevronRight,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Clock,
  Search,
  Check,
  Calendar,
  CreditCard,
  Settings,
  Leaf,
  LogOut,
  Plus,
  X,
  Trash2,
  User,
  Mail,
  Phone,
  Building2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  MessageCircle,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { SubscriptionStatus } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

interface BranchInput {
  name: string;
  address: string;
  phone?: string;
}

export default function SuperAdminTenantsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [tenants, setTenants] = useState(() => dataStore.getTenants());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SubscriptionStatus>('all');

  // Modal State for "+ Create New Tenant"
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const initialFormState = {
    business_name: '',
    owner_name: '',
    phone: '',
    owner_email: '',
    city: '',
    dealer_license_number: '',
    license_expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subscription_status: 'trial' as SubscriptionStatus,
    branch_setup: 'single' as 'single' | 'multiple',
    branches: [
      { name: 'Main Outlet', address: '', phone: '' }
    ] as BranchInput[]
  };

  const [formData, setFormData] = useState(initialFormState);

  // Credential section state
  const [credForm, setCredForm] = useState({
    username: '',
    password: '',
    email: '',
    force_password_change: true,
    showPassword: false,
  });
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle');
  const usernameDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Post-creation credentials reveal card
  const [credsCard, setCredsCard] = useState<{
    open: boolean;
    tenantId: string;
    businessName: string;
    username: string;
    password: string;
    email: string;
  } | null>(null);

  const generateStrongPassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const specials = '!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    pwd += specials[Math.floor(Math.random() * specials.length)];
    pwd += Math.floor(Math.random() * 90 + 10);
    return pwd.split('').sort(() => Math.random() - 0.5).join('');
  };

  const getPasswordStrength = (pwd: string): { label: string; color: string; bars: number } => {
    if (!pwd) return { label: '', color: 'bg-slate-200', bars: 0 };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', bars: 1 };
    if (score === 2) return { label: 'Fair', color: 'bg-amber-500', bars: 2 };
    if (score === 3) return { label: 'Good', color: 'bg-yellow-400', bars: 3 };
    if (score === 4) return { label: 'Strong', color: 'bg-emerald-500', bars: 4 };
    return { label: 'Very Strong', color: 'bg-emerald-600', bars: 5 };
  };

  const handleUsernameChange = (value: string) => {
    setCredForm(prev => ({ ...prev, username: value }));
    setUsernameStatus('idle');
    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 4) return;
    setUsernameStatus('checking');
    usernameDebounceRef.current = setTimeout(() => {
      const available = dataStore.checkUsernameAvailable(trimmed);
      setUsernameStatus(available ? 'available' : 'taken');
    }, 500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied to clipboard!`, 'success');
    }).catch(() => {
      showToast('Copy failed — please copy manually.', 'info');
    });
  };

  const shareViaWhatsApp = (creds: { businessName: string; username: string; password: string; email: string }) => {
    const msg = `🌿 *KisanDost Login Credentials*\n\n*Shop:* ${creds.businessName}\n*Username:* ${creds.username}${creds.email ? `\n*Email:* ${creds.email}` : ''}\n*Password:* ${creds.password}\n\n⚠️ Please change your password on first login.\n\n_Powered by KisanDost POS_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const reloadTenants = () => {
    setTenants([...dataStore.getTenants()]);
  };

  const handleStatusChange = (tenantId: string, newStatus: SubscriptionStatus) => {
    dataStore.updateTenantStatus(tenantId, newStatus);
    reloadTenants();
    showToast(`Subscription status updated to ${newStatus}`, 'success');
  };

  const handleBranchSetupChange = (setup: 'single' | 'multiple') => {
    if (setup === 'single') {
      setFormData(prev => ({
        ...prev,
        branch_setup: 'single',
        branches: [
          prev.branches[0] || {
            name: prev.business_name ? `${prev.business_name} - Main Outlet` : 'Main Outlet',
            address: prev.city || '',
            phone: prev.phone || ''
          }
        ]
      }));
    } else {
      setFormData(prev => {
        const current = [...prev.branches];
        if (current.length < 2) {
          current.push({
            name: prev.business_name ? `${prev.business_name} - Branch 2` : 'Branch 2 Outlet',
            address: prev.city || '',
            phone: prev.phone || ''
          });
        }
        return {
          ...prev,
          branch_setup: 'multiple',
          branches: current
        };
      });
    }
  };

  const handleAddBranchField = () => {
    setFormData(prev => ({
      ...prev,
      branches: [
        ...prev.branches,
        {
          name: `Branch ${prev.branches.length + 1} Outlet`,
          address: prev.city || '',
          phone: prev.phone || ''
        }
      ]
    }));
  };

  const handleRemoveBranchField = (index: number) => {
    setFormData(prev => {
      const updated = prev.branches.filter((_, i) => i !== index);
      return {
        ...prev,
        branches: updated
      };
    });
  };

  const handleBranchInputChange = (index: number, field: keyof BranchInput, value: string) => {
    setFormData(prev => {
      const updated = [...prev.branches];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, branches: updated };
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Form Field Validations
    if (!formData.business_name.trim()) {
      setFormError('Shop / Business Name is required.');
      return;
    }
    if (!formData.owner_name.trim()) {
      setFormError('Owner Full Name is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Owner Phone Number is required.');
      return;
    }
    if (!formData.city.trim()) {
      setFormError('City is required.');
      return;
    }
    if (!formData.dealer_license_number.trim()) {
      setFormError('Dealer License Number is required.');
      return;
    }
    if (!formData.license_expiry_date) {
      setFormError('License Expiry Date is required.');
      return;
    }

    // Branch validation
    if (formData.branch_setup === 'multiple' && formData.branches.length < 2) {
      setFormError('Multiple Branch mode requires at least 2 branch outlets.');
      return;
    }

    for (let i = 0; i < formData.branches.length; i++) {
      const b = formData.branches[i];
      if (!b.name.trim()) {
        setFormError(`Branch #${i + 1} Name is required.`);
        return;
      }
      if (!b.address.trim()) {
        setFormError(`Branch #${i + 1} Address is required.`);
        return;
      }
    }

    // Attempt Creation via DataStore
    const result = dataStore.createTenant({
      ...formData,
      username: credForm.username.trim() || undefined,
      password: credForm.password.trim() || undefined,
      owner_email: credForm.email.trim() || formData.owner_email.trim(),
      force_password_change: credForm.force_password_change,
    });

    if (!result.success || !result.tenant) {
      setFormError(result.error || 'Failed to create tenant.');
      return;
    }

    // Success! Close the modal and show the one-time credentials card
    reloadTenants();
    setIsCreateModalOpen(false);
    setFormData(initialFormState);
    setCredForm({ username: '', password: '', email: '', force_password_change: true, showPassword: false });
    setUsernameStatus('idle');

    if (result.credentials) {
      setCredsCard({
        open: true,
        tenantId: result.tenant.id,
        businessName: result.tenant.business_name,
        username: result.credentials.username,
        password: result.credentials.password,
        email: result.credentials.email,
      });
    } else {
      showToast(`Tenant shop '${result.tenant.business_name}' created successfully!`, 'success');
      router.push(`/admin/tenants/${result.tenant.id}`);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    if (statusFilter !== 'all' && t.subscription_status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.business_name.toLowerCase().includes(q);
      const matchOwner = t.owner_name.toLowerCase().includes(q);
      const matchCity = t.city.toLowerCase().includes(q);
      const matchLic = t.dealer_license_number.toLowerCase().includes(q);
      if (!matchName && !matchOwner && !matchCity && !matchLic) return false;
    }
    return true;
  });
  const pagination = usePagination(filteredTenants, 10);

  const totalTenants = tenants.length;
  const activeCount = tenants.filter((t) => t.subscription_status === 'active').length;
  const trialCount = tenants.filter((t) => t.subscription_status === 'trial').length;

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <PageHeader
          crumbs={[{ label: 'Super Admin' }, { label: 'Registered shops' }]}
          title="Registered shops"
          description="Create shops, review licenses, and manage subscription status."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Store} label="Registered shops" value={String(totalTenants)} hint="tenants" trend={{ value: 4 }} spark={[1, 1, 2, 2, totalTenants || 1]} />
          <StatCard icon={CheckCircle2} label="Active subscriptions" value={String(activeCount)} hint="paid" trend={{ value: 2 }} spark={[0, 1, 1, activeCount || 0, activeCount || 0]} />
          <StatCard icon={Clock} tone="accent" label="Trial accounts" value={String(trialCount)} hint="shops" trend={{ value: -1 }} spark={[1, 2, 2, trialCount || 1, trialCount || 1]} />
        </div>

        <div className="flex flex-col gap-3 rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] p-3 shadow-[var(--kd-shadow)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-md flex-1 items-center gap-2 rounded-[var(--kd-radius)] border border-border bg-background px-3 py-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search shop, owner, city, or license"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'active', 'trial', 'suspended'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
                  statusFilter === st
                    ? 'bg-[var(--kd-primary-soft)] text-primary'
                    : 'text-muted-foreground hover:bg-[var(--kd-accent-soft)]'
                }`}
              >
                {st}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              <Plus className="size-3.5" />
              Add shop
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] shadow-[var(--kd-shadow)]">
        <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-2">
          {filteredTenants.length === 0 && (
            <p className="col-span-full rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] px-4 py-10 text-center text-sm text-muted-foreground">
              No shops match this filter.
            </p>
          )}
          {pagination.pageItems.map((t) => {
            const branches = dataStore.getBranches(t.id);
            const featureFlags = t.settings?.features ?? {};
            const enabledCount = Object.values(featureFlags).filter(Boolean).length;
            const totalCount = Object.keys(featureFlags).length || 13;
            const isActive = t.subscription_status === 'active';
            const isTrial = t.subscription_status === 'trial';

            return (
              <article
                key={t.id}
                className="flex flex-col gap-4 rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] p-5 shadow-[var(--kd-shadow)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-foreground">{t.business_name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t.owner_name} · {t.city}
                    </p>
                  </div>
                  <StatusBadge status={t.subscription_status} />
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-[var(--kd-radius)] bg-background px-3 py-2">
                    <dt className="text-xs text-muted-foreground">License</dt>
                    <dd className="mt-0.5 font-medium tabular-nums text-foreground">{t.dealer_license_number}</dd>
                  </div>
                  <div className="rounded-[var(--kd-radius)] bg-background px-3 py-2">
                    <dt className="text-xs text-muted-foreground">Expires</dt>
                    <dd className="mt-0.5 font-medium tabular-nums text-foreground">{t.license_expiry_date}</dd>
                  </div>
                  <div className="rounded-[var(--kd-radius)] bg-[var(--kd-primary-soft)] px-3 py-2">
                    <dt className="text-xs text-muted-foreground">Outlets</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{branches.length}</dd>
                  </div>
                  <div className="rounded-[var(--kd-radius)] bg-[var(--kd-accent-soft)] px-3 py-2">
                    <dt className="text-xs text-muted-foreground">Features</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{enabledCount} of {totalCount}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-2">
                  {branches.map((b) => (
                    <span key={b.id} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                      <MapPin className="size-3 text-accent" />
                      {b.name}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(t.id, 'active')}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'border border-border text-foreground'}`}
                    >
                      Set active
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(t.id, 'trial')}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${isTrial ? 'bg-accent text-white' : 'border border-border text-foreground'}`}
                    >
                      Set trial
                    </button>
                  </div>
                  <Link href={`/admin/tenants/${t.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-accent">
                    Manage access
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
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

      {/* Modal: "+ Create New Tenant" Form */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-[var(--kd-surface)] text-foreground shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border bg-[var(--kd-surface)] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Create shop</h3>
                <p className="text-xs text-muted-foreground">Owner, license, and outlet setup</p>
              </div>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="rounded-full p-1.5 text-muted-foreground hover:bg-background" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateSubmit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-5 text-sm">
              
              {/* Inline Error Alert */}
              {formError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs font-semibold text-danger">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Section 1: Shop & Owner Basic Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Building2 className="size-4 text-primary" />
                  <h4 className="text-sm font-medium text-foreground">1. Shop &amp; Owner Profile</h4>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Shop name</label>
                    <input
                      type="text"
                      required
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      className="h-10 w-full rounded-[var(--kd-radius)] border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[var(--kd-primary-soft)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Owner name</label>
                    <input
                      type="text"
                      required
                      value={formData.owner_name}
                      onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                      className="h-10 w-full rounded-[var(--kd-radius)] border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[var(--kd-primary-soft)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Phone</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-10 w-full rounded-[var(--kd-radius)] border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[var(--kd-primary-soft)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.owner_email}
                      onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                      className="h-10 w-full rounded-[var(--kd-radius)] border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[var(--kd-primary-soft)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">City</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="h-10 w-full rounded-[var(--kd-radius)] border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[var(--kd-primary-soft)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Subscription</label>
                    <select
                      value={formData.subscription_status}
                      onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value as SubscriptionStatus })}
                      className="h-10 w-full rounded-[var(--kd-radius)] border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[var(--kd-primary-soft)]"
                    >
                      <option value="trial">Trial</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Dealer License */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <CreditCard className="size-4 text-primary" />
                  <h4 className="text-sm font-medium text-foreground">2. Agri Pesticide Dealer License</h4>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">License number</label>
                    <input
                      type="text"
                      required
                      value={formData.dealer_license_number}
                      onChange={(e) => setFormData({ ...formData, dealer_license_number: e.target.value })}
                      className="h-10 w-full rounded-[var(--kd-radius)] border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[var(--kd-primary-soft)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">License expiry</label>
                    <input
                      type="date"
                      required
                      value={formData.license_expiry_date}
                      onChange={(e) => setFormData({ ...formData, license_expiry_date: e.target.value })}
                      className="h-10 w-full rounded-[var(--kd-radius)] border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[var(--kd-primary-soft)]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Branch Setup & Multi-Branch Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <Store className="size-4 text-primary" />
                    <h4 className="text-sm font-medium text-foreground">3. Outlets &amp; Branch Setup</h4>
                  </div>
                </div>

                {/* Branch Choice Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => handleBranchSetupChange('single')}
                    className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                      formData.branch_setup === 'single'
                        ? 'border-primary bg-[var(--kd-primary-soft)] ring-2 ring-[var(--kd-primary-soft)]'
                        : 'border-border bg-background hover:bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-semibold text-foreground">
                        <span>Single Branch Outlet</span>
                      </span>
                      <input
                        type="radio"
                        name="branch_setup"
                        checked={formData.branch_setup === 'single'}
                        onChange={() => handleBranchSetupChange('single')}
                        className="w-4 h-4 accent-amber-500"
                      />
                    </div>
                  </div>

                  <div
                    onClick={() => handleBranchSetupChange('multiple')}
                    className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                      formData.branch_setup === 'multiple'
                        ? 'border-primary bg-[var(--kd-primary-soft)] ring-2 ring-[var(--kd-primary-soft)]'
                        : 'border-border bg-background hover:bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-semibold text-foreground">
                        <span>Multiple Outlets / Branches</span>
                      </span>
                      <input
                        type="radio"
                        name="branch_setup"
                        checked={formData.branch_setup === 'multiple'}
                        onChange={() => handleBranchSetupChange('multiple')}
                        className="w-4 h-4 accent-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Branch Fields List */}
                <div className="space-y-3 pt-1">
                  {formData.branches.map((b, idx) => (
                    <div key={idx} className="relative space-y-3 rounded-2xl border border-border bg-background p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-foreground">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          <span>Outlet #{idx + 1} Configuration</span>
                        </span>

                        {formData.branch_setup === 'multiple' && formData.branches.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBranchField(idx)}
                            className="flex cursor-pointer items-center gap-1 rounded-lg p-1 text-2xs font-semibold text-danger transition-colors hover:bg-danger/10"
                          >
                            <Trash2 className="size-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-foreground">Branch name</label>
                          <input
                            type="text"
                            required
                            value={b.name}
                            onChange={(e) => handleBranchInputChange(idx, 'name', e.target.value)}
                            className="h-10 w-full rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[var(--kd-primary-soft)]"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-foreground">Address</label>
                          <input
                            type="text"
                            required
                            value={b.address}
                            onChange={(e) => handleBranchInputChange(idx, 'address', e.target.value)}
                            className="h-10 w-full rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[var(--kd-primary-soft)]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.branch_setup === 'multiple' && (
                    <button
                      type="button"
                      onClick={handleAddBranchField}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-[var(--kd-primary-soft)] py-2 text-xs font-semibold text-primary transition-colors"
                    >
                      <Plus className="size-4 text-primary" />
                      <span>+ Add Another Branch Outlet</span>
                    </button>
                  )}
                </div>

              </div>

              {/* Section 4: Owner Login Credentials */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <KeyRound className="size-4 text-primary" />
                  <h4 className="text-sm font-medium text-foreground">4. Owner Login Credentials</h4>
                  <span className="ml-1 text-2xs font-normal text-muted-foreground">(Login works with username OR email)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Username */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Username</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={credForm.username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        className={`h-10 w-full rounded-[var(--kd-radius)] border bg-background px-3 pr-9 text-sm text-foreground outline-none ${
                          usernameStatus === 'taken' ? 'border-danger' :
                          usernameStatus === 'available' ? 'border-primary' :
                          'border-border'
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameStatus === 'checking' && <RefreshCw className="size-3.5 animate-spin text-muted-foreground" />}
                        {usernameStatus === 'available' && <Check className="size-3.5 text-primary" />}
                        {usernameStatus === 'taken' && <X className="size-3.5 text-danger" />}
                      </div>
                    </div>
                    {usernameStatus === 'taken' && (
                      <p className="text-red-600 text-2xs font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Username already taken
                      </p>
                    )}
                    {usernameStatus === 'available' && (
                      <p className="flex items-center gap-1 text-2xs font-semibold text-primary">
                        <Check className="size-3" /> Username available
                      </p>
                    )}
                  </div>

                  {/* Owner Email (optional for recovery) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Recovery email</label>
                    <input
                      type="email"
                      value={credForm.email}
                      onChange={(e) => setCredForm(prev => ({ ...prev, email: e.target.value }))}
                      className="h-10 w-full rounded-[var(--kd-radius)] border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[var(--kd-primary-soft)]"
                    />
                  </div>

                </div>

                {/* Password row with generator */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={credForm.showPassword ? 'text' : 'password'}
                        value={credForm.password}
                        onChange={(e) => setCredForm(prev => ({ ...prev, password: e.target.value }))}
                        className="h-10 w-full rounded-[var(--kd-radius)] border border-border bg-background px-3 pr-10 text-sm text-foreground outline-none focus:ring-2 focus:ring-[var(--kd-primary-soft)]"
                      />
                      <button
                        type="button"
                        onClick={() => setCredForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                        className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground"
                        aria-label={credForm.showPassword ? 'Hide password' : 'Show password'}
                      >
                        {credForm.showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const pwd = generateStrongPassword();
                        setCredForm(prev => ({ ...prev, password: pwd, showPassword: true }));
                      }}
                      className="rounded-[var(--kd-radius)] border border-border px-3 py-2 text-xs font-medium text-foreground"
                    >
                      Generate
                    </button>
                  </div>
                  {/* Strength meter */}
                  {credForm.password && (() => {
                    const s = getPasswordStrength(credForm.password);
                    return (
                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className={`h-1 w-6 rounded-full transition-all ${ i <= s.bars ? s.color : 'bg-slate-200' }`} />
                          ))}
                        </div>
                        <span className={`text-2xs font-semibold ${ s.bars <= 1 ? 'text-red-600' : s.bars <= 2 ? 'text-amber-600' : s.bars <= 3 ? 'text-yellow-600' : 'text-emerald-600' }`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Force password change checkbox */}
                <label className="flex items-start gap-3 rounded-[var(--kd-radius)] border border-border bg-background p-3">
                  <input
                    type="checkbox"
                    checked={credForm.force_password_change}
                    onChange={(e) => setCredForm(prev => ({ ...prev, force_password_change: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-semibold text-foreground">Force password change on first login</div>
                    <div className="mt-0.5 text-2xs font-normal text-muted-foreground">
                      Owner must set their own password when they first sign in. Recommended ON.
                    </div>
                  </div>
                </label>

              </div>

              {/* Modal Footer / Buttons */}
              <div className="flex shrink-0 items-center justify-end space-x-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="cursor-pointer rounded-xl border border-border bg-background px-5 py-2.5 text-xs font-semibold text-foreground transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-[var(--kd-radius)] bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  <Plus className="w-4 h-4" />
                  <span>CREATE TENANT SHOP</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ── ONE-TIME CREDENTIALS REVEAL CARD ─────────────────────────────── */}
      {credsCard?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-[var(--kd-surface)] text-foreground shadow-2xl">

            {/* Header */}
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-base font-semibold text-foreground">Shop login</h3>
              <p className="text-xs text-muted-foreground">Copy these credentials now. They are shown once.</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">

              {/* Shop name banner */}
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-[var(--kd-primary-soft)] p-3">
                <Store className="size-4 shrink-0 text-primary" />
                <div>
                  <div className="text-2xs font-medium uppercase tracking-wider text-primary">New Shop Created</div>
                  <div className="text-sm font-semibold text-foreground">{credsCard.businessName}</div>
                </div>
                <CheckCircle2 className="ml-auto size-5 shrink-0 text-primary" />
              </div>

              {/* Credential rows */}
              <div className="space-y-3">

                {/* Username */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
                  <div>
                    <div className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Username</div>
                    <div className="mt-0.5 font-mono text-sm font-bold text-foreground">{credsCard.username}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credsCard.username, 'Username')}
                    className="cursor-pointer rounded-lg border border-border bg-[var(--kd-surface)] p-2 transition-colors"
                    title="Copy username"
                  >
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Password */}
                <div className="flex items-center justify-between rounded-xl border border-warning/40 bg-warning/10 p-3">
                  <div>
                    <div className="text-2xs font-medium uppercase tracking-wider text-warning">Password (Temporary)</div>
                    <div className="mt-0.5 font-mono text-sm font-bold text-foreground">{credsCard.password}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credsCard.password, 'Password')}
                    className="cursor-pointer rounded-lg border border-warning/40 bg-[var(--kd-surface)] p-2 transition-colors"
                    title="Copy password"
                  >
                    <Copy className="size-4 text-warning" />
                  </button>
                </div>

                {/* Email (if set) */}
                {credsCard.email && (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
                    <div>
                      <div className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Login Email (optional)</div>
                      <div className="mt-0.5 font-mono text-sm font-semibold text-foreground">{credsCard.email}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(credsCard.email, 'Email')}
                      className="cursor-pointer rounded-lg border border-border bg-[var(--kd-surface)] p-2 transition-colors"
                    >
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                )}

              </div>

              {/* Force change note */}
              <div className="flex items-start gap-2 rounded-xl border border-border bg-background p-3 text-xs font-medium text-muted-foreground">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
                <span>The owner will be prompted to change their password on first login. Share these credentials securely.</span>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => shareViaWhatsApp(credsCard)}
                className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Share via WhatsApp
              </button>
              <button
                onClick={() => {
                  setCredsCard(null);
                  showToast(`Tenant '${credsCard.businessName}' created. Credentials saved.`, 'success');
                  router.push(`/admin/tenants/${credsCard.tenantId}`);
                }}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground transition-colors"
              >
                <ShieldCheck className="size-4 text-primary" />
                I've saved these credentials →
              </button>
            </div>

          </div>
        </div>
      )}

    </AdminShell>
  );
}

