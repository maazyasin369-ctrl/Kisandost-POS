'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/layout/AdminShell';
import { dataStore } from '@/lib/data-store';
import {
  Store,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal,
  ShoppingCart,
  Users,
  Package,
  ArrowLeftRight,
  FileBarChart2,
  Settings2,
  Eye,
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
  LayoutDashboard,
  ArrowLeft,
  CreditCard,
  Plus,
  Calendar,
  Receipt,
  Check,
  Clock,
  ShieldAlert,
  Edit3,
  History,
  FileText,
  DollarSign,
  AlertCircle,
  Wrench,
  RefreshCw,
  KeyRound,
  EyeOff,
  Copy,
  UserCheck,
  UserX,
  LogOut,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';
import { SubscriptionStatus, Tenant, TenantBillingTerms, TenantPaymentRecord } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export interface TenantFeatureFlags {
  pos: boolean;
  udhaar: boolean;
  sales_history: boolean;
  inventory: boolean;
  purchases: boolean;
  suppliers: boolean;
  multi_branch: boolean;
  schemes: boolean;
  reports: boolean;
  day_closing: boolean;
  staff_accounts: boolean;
  branch_management: boolean;
  company_catalog: boolean;
}

interface FeatureToggleConfig {
  key: keyof TenantFeatureFlags;
  label: string;
  desc: string;
  offNote: string;
  sidebarItem: string;
  routes: string[];
}

interface FeatureCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  toggles: FeatureToggleConfig[];
}

const DEFAULT_FEATURES: TenantFeatureFlags = {
  pos: true,
  udhaar: true,
  sales_history: true,
  inventory: true,
  purchases: true,
  suppliers: true,
  multi_branch: true,
  schemes: true,
  reports: true,
  day_closing: true,
  staff_accounts: true,
  branch_management: true,
  company_catalog: true,
};

export default function TenantDetailPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = React.use(params);
  const { showToast } = useToast();

  const [tenant, setTenant] = useState<Tenant>(() => dataStore.getTenant(tenantId));
  const [status, setStatus] = useState<SubscriptionStatus>(tenant.subscription_status);
  const [activeTab, setActiveTab] = useState<'details' | 'features' | 'billing' | 'credentials'>('features');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Credentials & Login Management State
  const [ownerProfile, setOwnerProfile] = useState(() => dataStore.getOwnerProfile(tenantId));
  const [credAuditLog, setCredAuditLog] = useState(() => (ownerProfile ? dataStore.getCredentialAuditLog(ownerProfile.id) : []));

  // Credential Modal States
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isChangeUsernameOpen, setIsChangeUsernameOpen] = useState(false);
  const [isDisableAccountOpen, setIsDisableAccountOpen] = useState(false);
  const [isSignOutAllOpen, setIsSignOutAllOpen] = useState(false);

  // Credential Action Forms
  const [resetPasswordForm, setResetPasswordForm] = useState({
    password: '',
    showPassword: false,
    forceChange: true,
  });

  const [changeUsernameForm, setChangeUsernameForm] = useState({
    username: '',
    status: 'idle' as 'idle' | 'checking' | 'available' | 'taken',
  });

  const [disableAccountReason, setDisableAccountReason] = useState('');

  const usernameDebounceRef = React.useRef<NodeJS.Timeout | null>(null);

  const reloadCredentials = () => {
    const p = dataStore.getOwnerProfile(tenantId);
    setOwnerProfile(p ? { ...p } : undefined);
    if (p) {
      setCredAuditLog([...dataStore.getCredentialAuditLog(p.id)]);
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    const u = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    const l = 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    const n = '0123456789'[Math.floor(Math.random() * 10)];
    const s = '!@#$%^&*'[Math.floor(Math.random() * 8)];
    for (let i = 0; i < 8; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    const finalPass = pass + u + l + n + s;
    setResetPasswordForm((prev) => ({ ...prev, password: finalPass, showPassword: true }));
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Moderate', color: 'bg-amber-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  };

  const handleUsernameChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9._]/g, '');
    setChangeUsernameForm((prev) => ({ ...prev, username: cleaned, status: 'idle' }));

    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);

    if (cleaned.length >= 4) {
      setChangeUsernameForm((prev) => ({ ...prev, status: 'checking' }));
      usernameDebounceRef.current = setTimeout(() => {
        const available = dataStore.checkUsernameAvailable(cleaned, ownerProfile?.id);
        setChangeUsernameForm((prev) => ({
          ...prev,
          status: available ? 'available' : 'taken',
        }));
      }, 400);
    }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerProfile) return;
    if (!resetPasswordForm.password || resetPasswordForm.password.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }
    const res = dataStore.resetProfilePassword(
      ownerProfile.id,
      resetPasswordForm.password,
      resetPasswordForm.forceChange,
      'Super Admin'
    );
    if (res.success) {
      showToast('Password successfully reset for tenant owner.', 'success');
      setIsResetPasswordOpen(false);
      setResetPasswordForm({ password: '', showPassword: false, forceChange: true });
      reloadCredentials();
    } else {
      showToast(res.error || 'Failed to reset password', 'error');
    }
  };

  const handleChangeUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerProfile) return;
    const uname = changeUsernameForm.username.trim().toLowerCase();
    if (!/^[a-z0-9._]{4,30}$/.test(uname)) {
      showToast('Username must be 4-30 chars (lowercase letters, numbers, dot, underscore)', 'error');
      return;
    }
    const res = dataStore.updateProfileUsername(ownerProfile.id, uname, 'Super Admin');
    if (res.success) {
      showToast(`Username updated to @${uname}`, 'success');
      setIsChangeUsernameOpen(false);
      setChangeUsernameForm({ username: '', status: 'idle' });
      reloadCredentials();
    } else {
      showToast(res.error || 'Failed to update username', 'error');
    }
  };

  const handleToggleAccountDisabledSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerProfile) return;
    const isCurrentlyDisabled = !!ownerProfile.account_disabled_at;
    if (isCurrentlyDisabled) {
      const res = dataStore.enableProfile(ownerProfile.id, 'Super Admin');
      if (res.success) {
        showToast('Account re-enabled successfully', 'success');
        setIsDisableAccountOpen(false);
        reloadCredentials();
      } else {
        showToast(res.error || 'Failed to enable account', 'error');
      }
    } else {
      const res = dataStore.disableProfile(
        ownerProfile.id,
        disableAccountReason.trim() || 'Disabled by Super Admin',
        'Super Admin'
      );
      if (res.success) {
        showToast('Account disabled successfully', 'success');
        setIsDisableAccountOpen(false);
        setDisableAccountReason('');
        reloadCredentials();
      } else {
        showToast(res.error || 'Failed to disable account', 'error');
      }
    }
  };

  const handleSignOutAllSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerProfile) return;
    const res = dataStore.signOutAllSessions(ownerProfile.id, 'Super Admin');
    if (res.success) {
      showToast('All active user sessions invalidated', 'success');
      setIsSignOutAllOpen(false);
      reloadCredentials();
    } else {
      showToast(res.error || 'Failed to sign out sessions', 'error');
    }
  };

  // Billing & Commercial Terms state for this tenant
  const [billingTerms, setBillingTerms] = useState<TenantBillingTerms>(() => dataStore.getBillingTerms(tenantId));
  const [tenantPayments, setTenantPayments] = useState<TenantPaymentRecord[]>(() => dataStore.getTenantPayments(tenantId));

  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditTermsModalOpen, setIsEditTermsModalOpen] = useState(false);

  // Payment Form state
  const [paymentForm, setPaymentForm] = useState({
    payment_type: 'recurring' as 'installation' | 'recurring',
    amount: billingTerms?.recurring_amount || 5000,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer' as 'cash' | 'bank_transfer' | 'cheque' | 'other',
    reference_number: '',
    notes: '',
  });

  // Terms Form state — we track a 'custom' interval mode separately
  const PRESET_INTERVALS = [1, 3, 4, 6, 12];
  const getIntervalMode = (months: number | null) => {
    if (months === null) return 'none';
    if (PRESET_INTERVALS.includes(months)) return String(months);
    return 'custom';
  };

  const [termsForm, setTermsForm] = useState({
    installation_charges: billingTerms?.installation_charges ?? 0,
    installation_date: billingTerms?.installation_date ?? '',
    recurring_amount: billingTerms?.recurring_amount ?? 5000,
    interval_mode: getIntervalMode(billingTerms?.recurring_interval_months ?? 1), // '1','3','4','6','12','custom','none'
    custom_interval_months: (!PRESET_INTERVALS.includes(billingTerms?.recurring_interval_months ?? 1) && billingTerms?.recurring_interval_months !== null)
      ? (billingTerms?.recurring_interval_months ?? 2)
      : 2,
    first_recurring_date: billingTerms?.first_recurring_date ?? '',
    notes: billingTerms?.notes ?? '',
  });

  // Check URL query search param for ?tab=billing or ?tab=features or ?tab=details
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'billing' || tab === 'details' || tab === 'features' || tab === 'credentials') {
        setActiveTab(tab);
      }
    }
  }, []);

  const reloadBilling = () => {
    const terms = dataStore.getBillingTerms(tenantId);
    setBillingTerms({ ...terms });
    setTenantPayments([...dataStore.getTenantPayments(tenantId)]);
    setPaymentForm((prev) => ({
      ...prev,
      payment_type: 'recurring',
      amount: terms.recurring_amount,
    }));
    setTermsForm({
      installation_charges: terms.installation_charges,
      installation_date: terms.installation_date ?? '',
      recurring_amount: terms.recurring_amount,
      interval_mode: getIntervalMode(terms.recurring_interval_months),
      custom_interval_months: (!PRESET_INTERVALS.includes(terms.recurring_interval_months ?? 1) && terms.recurring_interval_months !== null)
        ? (terms.recurring_interval_months ?? 2)
        : 2,
      first_recurring_date: terms.first_recurring_date ?? '',
      notes: terms.notes ?? '',
    });
  };

  // Initialize features specifically for this tenant
  const [features, setFeatures] = useState<TenantFeatureFlags>(() => {
    return (tenant.settings?.features as unknown as TenantFeatureFlags) ?? DEFAULT_FEATURES;
  });

  // Reload if tenantId changes
  useEffect(() => {
    const t = dataStore.getTenant(tenantId);
    setTenant(t);
    setStatus(t.subscription_status);
    setFeatures((t.settings?.features as unknown as TenantFeatureFlags) ?? DEFAULT_FEATURES);
    reloadBilling();
  }, [tenantId]);

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dataStore.addTenantPayment({
      tenant_id: tenant.id,
      payment_type: paymentForm.payment_type,
      amount: Number(paymentForm.amount),
      payment_date: paymentForm.payment_date,
      payment_method: paymentForm.payment_method,
      reference_number: paymentForm.reference_number || undefined,
      received_by: 'Super Admin',
      notes: paymentForm.notes || undefined,
    });

    reloadBilling();
    setIsPaymentModalOpen(false);
    showToast(
      `Payment of Rs. ${Number(paymentForm.amount).toLocaleString()} logged for ${tenant.business_name}! ${paymentForm.payment_type === 'recurring' ? 'Next due date advanced.' : 'Recorded as one-time installation.'}`,
      'success'
    );
  };

  const handleUpdateTermsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Resolve final interval months
    let intervalMonths: number | null = null;
    if (termsForm.interval_mode === 'none') {
      intervalMonths = null;
    } else if (termsForm.interval_mode === 'custom') {
      intervalMonths = Number(termsForm.custom_interval_months);
    } else {
      intervalMonths = Number(termsForm.interval_mode);
    }

    // Recalculate next_due_date from first_recurring_date + interval if interval changed
    let nextDueDate: string | null = billingTerms.next_due_date;
    if (intervalMonths !== null && termsForm.first_recurring_date) {
      // Recompute: advance first_recurring_date by interval until >= today, or keep as-is
      // Simple: keep existing next_due_date if it hasn't changed, else set to first_recurring_date
      if (termsForm.first_recurring_date !== billingTerms.first_recurring_date ||
          intervalMonths !== billingTerms.recurring_interval_months) {
        nextDueDate = termsForm.first_recurring_date;
      }
    } else if (intervalMonths === null) {
      nextDueDate = null;
    }

    dataStore.updateBillingTerms(tenant.id, {
      installation_charges: Number(termsForm.installation_charges),
      installation_date: termsForm.installation_date || null,
      recurring_amount: Number(termsForm.recurring_amount),
      recurring_interval_months: intervalMonths,
      first_recurring_date: termsForm.first_recurring_date || null,
      next_due_date: nextDueDate,
      notes: termsForm.notes,
    });

    reloadBilling();
    setIsEditTermsModalOpen(false);
    showToast(`Billing terms updated for ${tenant.business_name}.`, 'success');
  };

  // Helpers
  const getIntervalLabel = (months: number | null): string => {
    if (months === null) return 'No recurring charge';
    if (months === 1) return 'Every 1 month (monthly)';
    if (months === 3) return 'Every 3 months';
    if (months === 4) return 'Every 4 months';
    if (months === 6) return 'Every 6 months';
    if (months === 12) return 'Every 12 months (yearly)';
    return `Every ${months} months`;
  };

  const getDueStatus = (dateStr: string | null, thresholdDays: number) => {
    if (!dateStr) return { status: 'none', text: 'No charge', days: 0 };
    const today = new Date('2026-09-24');
    const due = new Date(dateStr);
    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'overdue', text: `🔴 OVERDUE (${Math.abs(diffDays)}d ago)`, days: diffDays };
    } else if (diffDays === 0) {
      return { status: 'due_today', text: `⚠️ DUE TODAY`, days: 0 };
    } else if (diffDays <= thresholdDays) {
      return { status: 'due_soon', text: `🕒 DUE SOON (in ${diffDays}d)`, days: diffDays };
    } else {
      return { status: 'ok', text: `🟢 UP TO DATE (${dateStr})`, days: diffDays };
    }
  };

  const branches = dataStore.getBranches(tenant.id);

  const featureCategories: FeatureCategory[] = [
    {
      id: 'sales_udhaar',
      title: 'Sales & Udhaar',
      icon: ShoppingCart,
      description: 'Point-of-sale checkout counter, farmer credit ledgers, and transaction history.',
      toggles: [
        {
          key: 'pos',
          label: 'POS Counter & Billing',
          desc: "Hides the 'POS Counter' sidebar item and blocks access to /pos for this tenant.",
          offNote: "Salesmen and managers will not be able to open the counter checkout screen or issue new sale receipts.",
          sidebarItem: 'POS Counter',
          routes: ['/pos'],
        },
        {
          key: 'udhaar',
          label: 'Farmers & Udhaar Ledger',
          desc: "Hides the 'Farmers / Ledger' and 'Udhaar Register' sidebar items and blocks access to /customers and /credit for this tenant.",
          offNote: "Farmer accounts, credit limit enforcement, and debt recovery payment entries will be hidden and blocked.",
          sidebarItem: 'Farmers / Ledger, Udhaar Register',
          routes: ['/customers', '/credit'],
        },
        {
          key: 'sales_history',
          label: 'Sales History & Receipts',
          desc: "Hides the 'Sales History' sidebar item and blocks access to /reports/sales-history for this tenant.",
          offNote: "Thermal receipt re-printing, historical audit log, and manager void/return workflows will be hidden.",
          sidebarItem: 'Sales History',
          routes: ['/reports/sales-history'],
        },
      ],
    },
    {
      id: 'inventory_purchasing',
      title: 'Inventory & Purchasing',
      icon: Package,
      description: 'FEFO batch tracking, supplier purchase orders, and vendor balance ledgers.',
      toggles: [
        {
          key: 'inventory',
          label: 'Stock & FEFO Batches',
          desc: "Hides the 'Stock & FEFO Batches' sidebar item and blocks access to /inventory for this tenant.",
          offNote: "Batch expiry dates, stock quantities, and cost/sale price catalog will be hidden and inaccessible.",
          sidebarItem: 'Stock & FEFO Batches',
          routes: ['/inventory'],
        },
        {
          key: 'purchases',
          label: 'Purchase Orders & Receiving',
          desc: "Hides the 'Purchase Orders' sidebar item and blocks access to /purchases for this tenant.",
          offNote: "Creating POs against suppliers and receiving new stock batches into inventory will be disabled.",
          sidebarItem: 'Purchase Orders',
          routes: ['/purchases'],
        },
        {
          key: 'suppliers',
          label: 'Suppliers Catalog & Ledgers',
          desc: "Hides the 'Suppliers' sidebar item and blocks access to /suppliers for this tenant.",
          offNote: "Supplier database, vendor contact persons, and payable balance ledgers will be hidden.",
          sidebarItem: 'Suppliers',
          routes: ['/suppliers'],
        },
      ],
    },
    {
      id: 'operations_logistics',
      title: 'Operations & Logistics',
      icon: ArrowLeftRight,
      description: 'Multi-outlet switching, inter-branch stock transfers, and company trade schemes.',
      toggles: [
        {
          key: 'multi_branch',
          label: 'Multi-Branch & Cross-Branch Transfers',
          desc: "Hides the branch switcher dropdown, 'Branch Transfers' sidebar item, and blocks access to /transfers for this tenant.",
          offNote: `${branches[0]?.name ?? 'Main Outlet'} and ${branches.length > 1 ? `${branches.length - 1} other branch` : 'other outlets'} will remain active, but branch switching, transfer requests, and cross-outlet stock moves will be hidden.`,
          sidebarItem: 'Branch Transfers, Branch Switcher',
          routes: ['/transfers'],
        },
        {
          key: 'schemes',
          label: 'Trade Schemes & Supplier Bonuses',
          desc: "Hides the 'Trade Schemes' sidebar item and blocks access to /schemes for this tenant.",
          offNote: "Pesticide company volume targets, season bonus schemes, and reward tracking will be hidden.",
          sidebarItem: 'Trade Schemes',
          routes: ['/schemes'],
        },
      ],
    },
    {
      id: 'reports_analytics',
      title: 'Reports & Analytics',
      icon: FileBarChart2,
      description: 'Daily counter summaries, monthly company breakdowns, and day-end cash closing wizards.',
      toggles: [
        {
          key: 'reports',
          label: 'Reports & Analytics Hub',
          desc: "Hides the 'Reports Hub', 'Daily Sales', and 'Monthly / Company' sidebar items and blocks access to /reports for this tenant.",
          offNote: "Daily sales summaries, monthly company sales charts, and CSV analytics exports will be hidden.",
          sidebarItem: 'Reports Hub, Daily Sales, Monthly / Company',
          routes: ['/reports', '/reports/daily', '/reports/monthly'],
        },
        {
          key: 'day_closing',
          label: 'Day-End Cash Reconciliation',
          desc: "Hides the 'Day Closing' sidebar item and blocks access to /reports/day-closing for this tenant.",
          offNote: "End-of-day cash drawer counting wizard, discrepancy logging, and daily register locking will be hidden.",
          sidebarItem: 'Day Closing',
          routes: ['/reports/day-closing'],
        },
      ],
    },
    {
      id: 'system_settings',
      title: 'System Settings',
      icon: Settings2,
      description: 'User access controls, branch physical profiles, and pesticide company catalogs.',
      toggles: [
        {
          key: 'staff_accounts',
          label: 'Multi-User & Staff Accounts',
          desc: "Hides the 'Users & Roles' sidebar item in Settings, blocks access to /settings/users, and prevents adding staff logins.",
          offNote: "Only the primary owner login will function. Adding new salesman or branch manager accounts will be blocked server-side.",
          sidebarItem: 'Users & Roles',
          routes: ['/settings/users'],
        },
        {
          key: 'branch_management',
          label: 'Branch Locations Management',
          desc: "Hides the 'Branch Locations' sidebar item in Settings and blocks access to /branches for this tenant.",
          offNote: "The tenant cannot view or edit physical outlet addresses, phones, or branch configuration.",
          sidebarItem: 'Branch Locations',
          routes: ['/branches'],
        },
        {
          key: 'company_catalog',
          label: 'Company Catalog Management',
          desc: "Hides the 'Company Catalog' sidebar item in Settings and blocks access to /settings/companies for this tenant.",
          offNote: "The tenant cannot add or edit pesticide brand portfolios (Bayer, Syngenta, FMC, local manufacturers).",
          sidebarItem: 'Company Catalog',
          routes: ['/settings/companies'],
        },
      ],
    },
  ];

  const handleStatusChange = (newStatus: SubscriptionStatus) => {
    setStatus(newStatus);
    dataStore.updateTenantStatus(tenant.id, newStatus);
    showToast(`Subscription status for ${tenant.business_name} updated to ${newStatus.toUpperCase()}`, 'success');
  };

  const handleToggleFeature = (featureKey: keyof TenantFeatureFlags) => {
    const nextState = !features[featureKey];
    const updatedFeatures = { ...features, [featureKey]: nextState };
    setFeatures(updatedFeatures);

    // Save strictly for THIS tenantId
    dataStore.updateTenantSettings(tenant.id, {
      branch_mode: updatedFeatures.multi_branch ? 'consolidated' : 'independent',
      features: updatedFeatures,
    });

    showToast(
      `[${tenant.business_name}] Feature flag '${featureKey.replace('_', ' ').toUpperCase()}' set to ${nextState ? 'ENABLED' : 'DISABLED'}`,
      nextState ? 'success' : 'info'
    );
  };

  return (
    <AdminShell>
      <div className="space-y-7">

        {/* Page Header with Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <nav className="flex items-center gap-1.5 text-2xs font-medium text-slate-400 mb-1">
              <Link href="/admin/tenants" className="hover:underline text-slate-500">Registered Tenant Shops</Link>
              <ChevronRight className="w-3 h-3 text-slate-400" strokeWidth={2} />
              <span className="text-slate-900 font-semibold">{tenant.business_name}</span>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/tenants"
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {tenant.business_name}
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-1">
              Per-tenant server-enforced feature module toggles, outlet settings, and license configuration (ID: <code className="font-mono text-emerald-800">{tenant.id}</code>)
            </p>
          </div>
        </div>

        {/* Tenant Business Details Card */}
        <div className="bg-gradient-to-br from-slate-50/90 via-white to-emerald-50/30 border border-slate-200 rounded-2xl p-6 shadow-card space-y-6">
          
          {/* Header Row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-semibold text-slate-900">{tenant.business_name}</h2>
                <span className={`text-2xs font-semibold px-3 py-1 rounded-md shadow-sm border ${
                  status === 'active'
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : status === 'trial'
                    ? 'bg-amber-500 text-slate-950 border-amber-600'
                    : 'bg-red-600 text-white border-red-700'
                }`}>
                  SUBSCRIPTION: {status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-normal mt-1">
                Owner: <strong className="text-slate-900 font-semibold">{tenant.owner_name}</strong> | City: <strong className="text-slate-900 font-semibold">{tenant.city}</strong> | Phone: <strong className="text-slate-900 font-semibold">{tenant.phone}</strong>
              </p>
            </div>

            {/* Status Switcher */}
            <div className="flex items-center space-x-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-2xs font-medium uppercase text-slate-500 px-2">Subscription:</span>
              <button
                onClick={() => handleStatusChange('active')}
                className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer ${
                  status === 'active'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                ACTIVE
              </button>

              <button
                onClick={() => handleStatusChange('trial')}
                className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer ${
                  status === 'trial'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                TRIAL
              </button>

              <button
                onClick={() => handleStatusChange('suspended')}
                className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer ${
                  status === 'suspended'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                SUSPENDED
              </button>
            </div>
          </div>

          {/* Section Selector Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold max-w-4xl">
            <button
              onClick={() => setActiveTab('features')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'features' ? 'bg-slate-950 text-white shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span>Feature Access (Toggles)</span>
            </button>

            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'details' ? 'bg-slate-950 text-white shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span>Outlets &amp; License</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'billing' ? 'bg-slate-950 text-amber-400 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Billing &amp; Commercial Terms</span>
            </button>

            <button
              onClick={() => setActiveTab('credentials')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'credentials' ? 'bg-slate-950 text-amber-400 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Login &amp; Access</span>
            </button>
          </div>

          {activeTab === 'details' ? (
            <div className="space-y-6 animate-fade-in-up">
              {/* License & Verification Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-2xs font-medium uppercase text-slate-500">Agri-Input Dealer License</span>
                  <div className="text-sm font-semibold text-amber-700 font-mono">{tenant.dealer_license_number}</div>
                  <span className="text-[11px] text-slate-500 font-normal block">Punjab Agriculture Dept Verified</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-2xs font-medium uppercase text-slate-500">License Expiry Date</span>
                  <div className="text-sm font-semibold text-slate-900 font-mono">{tenant.license_expiry_date}</div>
                  <span className="text-[11px] text-emerald-800 font-semibold block">Valid License Registered</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-2xs font-medium uppercase text-slate-500">Branch Mode</span>
                  <div className="text-sm font-semibold text-slate-900 uppercase">{tenant.settings.branch_mode}</div>
                  <span className="text-[11px] text-slate-500 font-normal block">Multi-Outlet Inventory Sync</span>
                </div>
              </div>

              {/* Registered Branch Outlets */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-emerald-700" />
                  <span>Registered Branch Outlets ({branches.length})</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {branches.map((b) => (
                    <div key={b.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{b.name}</div>
                          <div className="text-xs text-slate-500 font-normal">{b.address}</div>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          ACTIVE OUTLET
                        </span>
                      </div>
                      <div className="text-2xs text-slate-500 font-mono pt-2 border-t border-slate-100 flex justify-between">
                        <span>Contact: {b.phone}</span>
                        <span>ID: {b.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'billing' ? (
            /* ===== TENANT BILLING & COMMERCIAL TERMS SECTION ===== */
            <div className="space-y-6 animate-fade-in-up">

              {/* Top Commercial Terms Overview Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5 text-amber-600" />
                      <h3 className="text-base font-semibold text-slate-900">
                        Billing &amp; Commercial Terms
                      </h3>
                      {billingTerms.recurring_interval_months !== null && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-2xs font-semibold px-2.5 py-0.5 rounded-full uppercase">
                          {getIntervalLabel(billingTerms.recurring_interval_months)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-normal">
                      Installation charge, recurring fee, and payment history for <strong className="text-slate-900">{tenant.business_name}</strong>
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setTermsForm({
                          installation_charges: billingTerms.installation_charges,
                          installation_date: billingTerms.installation_date ?? '',
                          recurring_amount: billingTerms.recurring_amount,
                          interval_mode: getIntervalMode(billingTerms.recurring_interval_months),
                          custom_interval_months: (!PRESET_INTERVALS.includes(billingTerms.recurring_interval_months ?? 1) && billingTerms.recurring_interval_months !== null)
                            ? (billingTerms.recurring_interval_months ?? 2) : 2,
                          first_recurring_date: billingTerms.first_recurring_date ?? '',
                          notes: billingTerms.notes ?? ''
                        });
                        setIsEditTermsModalOpen(true);
                      }}
                      className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit Terms</span>
                    </button>

                    <button
                      onClick={() => {
                        setPaymentForm({
                          payment_type: 'recurring',
                          amount: billingTerms.recurring_amount,
                          payment_date: new Date().toISOString().split('T')[0],
                          payment_method: 'bank_transfer',
                          reference_number: '',
                          notes: ''
                        });
                        setIsPaymentModalOpen(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>+ Log Payment</span>
                    </button>
                  </div>
                </div>

                {/* 3 Metric Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* Box 1: Installation Charge (one-time) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-2xs font-medium uppercase text-slate-500">Installation (One-Time)</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 font-mono">
                      {billingTerms.installation_charges > 0
                        ? `Rs. ${billingTerms.installation_charges.toLocaleString()}`
                        : <span className="text-slate-400 font-normal text-xs">No installation charge</span>
                      }
                    </div>
                    <div className="text-xs text-slate-500 font-normal">
                      {billingTerms.installation_date
                        ? `Installed: ${billingTerms.installation_date}`
                        : <span className="text-slate-400">No date set</span>
                      }
                    </div>
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded uppercase">One-Time Only — Never Recurring</span>
                  </div>

                  {/* Box 2: Recurring Charge */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-2xs font-medium uppercase text-slate-500">Recurring Charge</span>
                    </div>
                    {billingTerms.recurring_interval_months !== null ? (
                      <>
                        <div className="text-sm font-semibold text-amber-700 font-mono">
                          Rs. {billingTerms.recurring_amount.toLocaleString()}
                        </div>
                        <div className="text-xs font-semibold text-slate-600 uppercase">
                          {getIntervalLabel(billingTerms.recurring_interval_months)}
                        </div>
                        {billingTerms.first_recurring_date && (
                          <div className="text-[11px] text-slate-500 font-normal">Start date: {billingTerms.first_recurring_date}</div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-slate-400 font-normal">No recurring charge set</div>
                    )}
                  </div>

                  {/* Box 3: Next Due Date Status */}
                  {(() => {
                    const interval = billingTerms.recurring_interval_months ?? 1;
                    const threshold = interval <= 1 ? 3 : interval <= 6 ? 7 : 14;
                    const dueStatus = getDueStatus(billingTerms.next_due_date, threshold);
                    const isOverdue = dueStatus.status === 'overdue';
                    const isDueSoon = dueStatus.status === 'due_soon' || dueStatus.status === 'due_today';
                    const isNone = dueStatus.status === 'none';

                    return (
                      <div className={`p-4 rounded-xl border space-y-1.5 ${
                        isNone
                          ? 'bg-slate-50 border-slate-200 text-slate-500'
                          : isOverdue
                          ? 'bg-red-50/90 border-red-300 text-red-950'
                          : isDueSoon
                          ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                          : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-2xs font-medium uppercase text-slate-600">Next Due Date</span>
                          {!isNone && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              isOverdue ? 'bg-red-600 text-white' : isDueSoon ? 'bg-amber-400 text-slate-950' : 'bg-emerald-600 text-white'
                            }`}>
                              {dueStatus.text}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-semibold font-mono">
                          {billingTerms.next_due_date ?? '—'}
                        </div>
                        <p className="text-[11px] text-slate-600 font-normal">
                          {isNone ? 'No recurring charge configured'
                            : isOverdue ? 'Overdue — log payment to clear'
                            : isDueSoon ? 'Due window active (bell notified)'
                            : 'Recurring charge active & verified'}
                        </p>
                      </div>
                    );
                  })()}

                </div>

                {billingTerms.notes && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-normal flex items-start gap-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 font-semibold">Terms Note:</strong> {billingTerms.notes}
                    </div>
                  </div>
                )}

              </div>

              {/* Payment Ledger History Table (100% Tenant Isolated) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        Payment Received History — {tenant.business_name}
                      </h3>
                      <p className="text-2xs text-slate-500 font-normal">
                        Showing all recorded payments strictly for Tenant ID: <code className="font-mono text-emerald-800">{tenant.id}</code>
                      </p>
                    </div>
                  </div>

                  <span className="bg-slate-950 text-amber-400 text-2xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    Tenant Isolated Ledger
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                        <th className="py-3 px-4">Payment Date</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Payment Method</th>
                        <th className="py-3 px-4">Reference # / Cheque</th>
                        <th className="py-3 px-4">Recorded By</th>
                        <th className="py-3 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal text-slate-800">
                      {tenantPayments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 font-normal">
                            No payment records logged yet. Use "+ Log Payment" to record a payment.
                          </td>
                        </tr>
                      ) : (
                        tenantPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-slate-900">{p.payment_date}</td>
                            <td className="py-3 px-4">
                              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase ${
                                p.payment_type === 'recurring'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                {p.payment_type === 'recurring' ? '↻ Recurring' : '🔧 Installation'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-emerald-700 font-mono">
                              Rs. {p.amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 capitalize font-medium text-slate-700">
                              {p.payment_method.replace('_', ' ')}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {p.reference_number || '—'}
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-medium">
                              {p.received_by || 'Super Admin'}
                            </td>
                            <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                              {p.notes || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : activeTab === 'credentials' ? (
            /* ===== TENANT LOGIN & CREDENTIAL MANAGEMENT SECTION ===== */
            <div className="space-y-6 animate-fade-in-up">

              {/* Owner Account & Credentials Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <KeyRound className="w-5 h-5 text-amber-600" />
                      <h3 className="text-base font-semibold text-slate-900">
                        Login Credential Management
                      </h3>
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-2xs font-semibold px-2.5 py-0.5 rounded-full uppercase">
                        Owner Auth Access
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-normal">
                      Manage username, password, login status, and active sessions for <strong className="text-slate-900">{tenant.business_name}</strong>
                    </p>
                  </div>
                </div>

                {/* Account Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                  {/* Username */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-2xs font-medium uppercase text-slate-500 block">Username</span>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {ownerProfile?.username ? `@${ownerProfile.username}` : <span className="text-slate-400 font-normal">Not configured</span>}
                    </div>
                    <span className="text-[11px] text-slate-500 block">Unique Platform Identifier</span>
                  </div>

                  {/* Email */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-2xs font-medium uppercase text-slate-500 block">Recovery Email</span>
                    <div className="text-sm font-semibold text-slate-900 font-mono truncate">
                      {ownerProfile?.email || <span className="text-slate-400 font-normal">No email set</span>}
                    </div>
                    <span className="text-[11px] text-slate-500 block">Optional Recovery Contact</span>
                  </div>

                  {/* Account Status */}
                  <div className={`p-4 rounded-xl border space-y-1 ${
                    ownerProfile?.account_disabled_at ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <span className="text-2xs font-medium uppercase text-slate-600 block">Account Status</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                        ownerProfile?.account_disabled_at ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {ownerProfile?.account_disabled_at ? 'DISABLED' : 'ACTIVE'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600 block">
                      {ownerProfile?.account_disabled_at ? `Disabled: ${new Date(ownerProfile.account_disabled_at).toLocaleDateString()}` : 'Can log in & use platform'}
                    </span>
                  </div>

                  {/* Password & Session Flags */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-2xs font-medium uppercase text-slate-500 block">Security Flags</span>
                    <div className="space-y-1">
                      {ownerProfile?.force_password_change ? (
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded uppercase">
                          Force Pwd Change On Login
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded uppercase">
                          Standard Credentials
                        </span>
                      )}
                      {ownerProfile?.sessions_invalidated_at && (
                        <span className="text-[10px] text-slate-500 block font-mono">
                          Invalidated: {new Date(ownerProfile.sessions_invalidated_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* 4 Action Buttons Grid */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Security Actions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                    {/* Action 1: Reset Password */}
                    <button
                      onClick={() => {
                        setResetPasswordForm({ password: '', showPassword: false, forceChange: true });
                        setIsResetPasswordOpen(true);
                      }}
                      className="p-3 bg-amber-50/80 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-amber-700" />
                        <span>Reset Password</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-600" />
                    </button>

                    {/* Action 2: Change Username */}
                    <button
                      onClick={() => {
                        setChangeUsernameForm({ username: ownerProfile?.username || '', status: 'idle' });
                        setIsChangeUsernameOpen(true);
                      }}
                      className="p-3 bg-blue-50/80 hover:bg-blue-100 text-blue-950 border border-blue-300 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-blue-700" />
                        <span>Change Username</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-blue-600" />
                    </button>

                    {/* Action 3: Disable / Enable Account */}
                    <button
                      onClick={() => {
                        setDisableAccountReason('');
                        setIsDisableAccountOpen(true);
                      }}
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer shadow-2xs border ${
                        ownerProfile?.account_disabled_at
                          ? 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-950 border-emerald-300'
                          : 'bg-red-50/80 hover:bg-red-100 text-red-950 border-red-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {ownerProfile?.account_disabled_at ? (
                          <>
                            <UserCheck className="w-4 h-4 text-emerald-700" />
                            <span>Enable Account</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-4 h-4 text-red-700" />
                            <span>Disable Account</span>
                          </>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </button>

                    {/* Action 4: Sign Out All Sessions */}
                    <button
                      onClick={() => setIsSignOutAllOpen(true)}
                      className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <LogOut className="w-4 h-4 text-slate-700" />
                        <span>Sign Out All Sessions</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>

                  </div>
                </div>

              </div>

              {/* Credential Audit Log Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        Platform Credential Audit Log
                      </h3>
                      <p className="text-2xs text-slate-500 font-normal">
                        Security audit history of credential changes, password resets, and login status changes.
                      </p>
                    </div>
                  </div>

                  <span className="bg-slate-950 text-amber-400 text-2xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    Immutable Audit Log
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Details / Notes</th>
                        <th className="py-3 px-4">Performed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal text-slate-800">
                      {credAuditLog.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400 font-normal">
                            No credential security events recorded yet.
                          </td>
                        </tr>
                      ) : (
                        credAuditLog.map((log) => {
                          const actionColors: Record<string, string> = {
                            RESET_PASSWORD: 'bg-amber-100 text-amber-900 border-amber-300',
                            CHANGE_USERNAME: 'bg-blue-100 text-blue-900 border-blue-300',
                            DISABLE_ACCOUNT: 'bg-red-100 text-red-900 border-red-300',
                            ENABLE_ACCOUNT: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                            SIGN_OUT_ALL: 'bg-purple-100 text-purple-900 border-purple-300',
                            CREATED: 'bg-slate-100 text-slate-900 border-slate-300',
                          };
                          const color = actionColors[log.action] || 'bg-slate-100 text-slate-800 border-slate-200';

                          return (
                            <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                                {new Date(log.created_at).toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${color}`}>
                                  {log.action.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-700 font-medium">
                                {log.details || '—'}
                              </td>
                              <td className="py-3 px-4 text-slate-600 font-semibold font-mono">
                                {log.performed_by}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            /* Consolidated Tenant Feature Access Section */
            <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in-up">
              
              {/* Header Toolbar with Preview Button */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-emerald-700" />
                    <span>Granular Server-Enforced Feature Controls for {tenant.business_name}</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">
                    Super Admin controls sidebar item visibility and route access specifically for this tenant.
                  </p>
                </div>

                <button
                  onClick={() => setIsPreviewOpen(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <Eye className="w-4 h-4 text-sarson-300" />
                  <span>PREVIEW AS THIS TENANT</span>
                </button>
              </div>

              {/* Grouped Categories */}
              <div className="space-y-8">
                {featureCategories.map((category) => {
                  const CategoryIcon = category.icon;
                  return (
                    <div key={category.id} className="space-y-3">
                      
                      {/* Category Header */}
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <div className="p-1.5 bg-emerald-100 text-emerald-900 rounded-lg">
                          <CategoryIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">{category.title}</h4>
                          <p className="text-2xs text-slate-500 font-normal">{category.description}</p>
                        </div>
                      </div>

                      {/* Toggles Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {category.toggles.map((t) => {
                          const enabled = features[t.key];
                          return (
                            <div
                              key={t.key}
                              className={`p-4 rounded-xl border transition-all space-y-3 flex flex-col justify-between ${
                                enabled
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-2xs'
                                  : 'bg-slate-50/90 border-slate-300 text-slate-700'
                              }`}
                            >
                              <div className="space-y-2">
                                {/* Title & Switch */}
                                <div
                                  onClick={() => handleToggleFeature(t.key)}
                                  className="flex items-start justify-between gap-2 cursor-pointer select-none"
                                >
                                  <div>
                                    <span className="text-xs font-semibold text-slate-900 block">{t.label}</span>
                                    <span className="text-[10px] font-mono text-emerald-800 font-medium">
                                      Sidebar: &quot;{t.sidebarItem}&quot;
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleFeature(t.key);
                                    }}
                                    className="shrink-0 cursor-pointer"
                                  >
                                    {enabled ? (
                                      <ToggleRight className="w-7 h-7 text-emerald-700" />
                                    ) : (
                                      <ToggleLeft className="w-7 h-7 text-slate-400" />
                                    )}
                                  </button>
                                </div>

                                {/* Explicit Description */}
                                <p className="text-2xs text-slate-600 leading-relaxed font-normal">
                                  {t.desc}
                                </p>

                                {/* Inline Consequence Note when OFF */}
                                {!enabled && (
                                  <div className="bg-amber-50 border border-amber-200/90 rounded-lg p-2 text-[10px] text-amber-900 space-y-0.5 animate-fade-in-up">
                                    <div className="font-semibold flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                      <span>Effect when OFF:</span>
                                    </div>
                                    <p className="text-[10px] leading-tight font-normal text-amber-800">
                                      {t.offNote}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Footer Status Badge & Route Tag */}
                              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold">
                                <span className="text-2xs text-slate-500 font-mono font-medium">
                                  {t.routes.join(', ')}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                                    enabled ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {enabled ? 'ENABLED' : 'DISABLED'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

        {/* Modal: "Preview as this tenant" */}
        {isPreviewOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center space-x-2.5">
                  <Eye className="w-5 h-5 text-sarson-400" />
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider">Live Sidebar &amp; Route Access Preview</h3>
                    <p className="text-2xs text-slate-400 font-normal">
                      Simulated tenant layout for <strong className="font-semibold">{tenant.business_name}</strong> ({tenant.city})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 bg-slate-50/60 text-xs">
                
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 flex items-center justify-between text-2xs">
                  <div className="font-normal">
                    💡 This preview reflects real-time feature flags specifically configured for <strong className="font-semibold">{tenant.business_name}</strong>. Green items are visible to shop staff; greyed out items with lock icons are hidden/blocked.
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                  
                  {/* Overview Group */}
                  <div className="space-y-1.5">
                    <div className="text-2xs font-medium uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Overview</span>
                    </div>
                    <div className="p-2 bg-emerald-50 text-emerald-950 rounded-lg font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-emerald-700" />
                        Dashboard (/dashboard)
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-700 text-white">
                        ALWAYS ACTIVE
                      </span>
                    </div>
                  </div>

                  {/* Sales & Udhaar Group */}
                  <div className="space-y-1.5">
                    <div className="text-2xs font-medium uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Sales &amp; Udhaar</span>
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: 'POS Counter (/pos)', enabled: features.pos },
                        { label: 'Sales History (/reports/sales-history)', enabled: features.sales_history },
                        { label: 'Farmers / Ledger (/customers)', enabled: features.udhaar },
                        { label: 'Udhaar Register (/credit)', enabled: features.udhaar },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg font-semibold flex items-center justify-between border ${
                            item.enabled
                              ? 'bg-emerald-50/80 text-emerald-950 border-emerald-200'
                              : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {item.enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                            {item.label}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${item.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {item.enabled ? 'VISIBLE' : 'HIDDEN / BLOCKED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Inventory & Stock Group */}
                  <div className="space-y-1.5">
                    <div className="text-2xs font-medium uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      <span>Inventory &amp; Stock</span>
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: 'Stock & FEFO Batches (/inventory)', enabled: features.inventory },
                        { label: 'Purchase Orders (/purchases)', enabled: features.purchases },
                        { label: 'Suppliers Catalog (/suppliers)', enabled: features.suppliers },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg font-semibold flex items-center justify-between border ${
                            item.enabled
                              ? 'bg-emerald-50/80 text-emerald-950 border-emerald-200'
                              : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {item.enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                            {item.label}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${item.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {item.enabled ? 'VISIBLE' : 'HIDDEN / BLOCKED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operations Group */}
                  <div className="space-y-1.5">
                    <div className="text-2xs font-medium uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Operations</span>
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: 'Branch Transfers (/transfers)', enabled: features.multi_branch },
                        { label: 'Trade Schemes (/schemes)', enabled: features.schemes },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg font-semibold flex items-center justify-between border ${
                            item.enabled
                              ? 'bg-emerald-50/80 text-emerald-950 border-emerald-200'
                              : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {item.enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                            {item.label}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${item.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {item.enabled ? 'VISIBLE' : 'HIDDEN / BLOCKED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reports & Audit Group */}
                  <div className="space-y-1.5">
                    <div className="text-2xs font-medium uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <FileBarChart2 className="w-3.5 h-3.5" />
                      <span>Reports &amp; Audit</span>
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: 'Reports Hub (/reports)', enabled: features.reports },
                        { label: 'Daily Sales (/reports/daily)', enabled: features.reports },
                        { label: 'Monthly / Company (/reports/monthly)', enabled: features.reports },
                        { label: 'Day Closing (/reports/day-closing)', enabled: features.day_closing },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg font-semibold flex items-center justify-between border ${
                            item.enabled
                              ? 'bg-emerald-50/80 text-emerald-950 border-emerald-200'
                              : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {item.enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                            {item.label}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${item.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {item.enabled ? 'VISIBLE' : 'HIDDEN / BLOCKED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Settings Group */}
                  <div className="space-y-1.5">
                    <div className="text-2xs font-medium uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>System Settings</span>
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: 'Users & Roles (/settings/users)', enabled: features.staff_accounts },
                        { label: 'Branch Locations (/branches)', enabled: features.branch_management },
                        { label: 'Company Catalog (/settings/companies)', enabled: features.company_catalog },
                        { label: 'Shop Settings (/settings)', enabled: true },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg font-semibold flex items-center justify-between border ${
                            item.enabled
                              ? 'bg-emerald-50/80 text-emerald-950 border-emerald-200'
                              : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {item.enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                            {item.label}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${item.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {item.enabled ? 'VISIBLE' : 'HIDDEN / BLOCKED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-100 border-t border-slate-200 text-right shrink-0">
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2 rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Close Preview
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Modal: Record Payment Received */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-slate-950 text-white p-5 px-6 flex items-center justify-between border-b border-slate-900">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
                    <Plus className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Log Payment Received</h3>
                    <p className="text-2xs text-slate-400 font-normal">Record installation or recurring charge for {tenant.business_name}</p>
                  </div>
                </div>
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block font-medium text-slate-800">Payment Type *</label>
                  <select
                    value={paymentForm.payment_type}
                    onChange={(e) => {
                      const type = e.target.value as 'installation' | 'recurring';
                      setPaymentForm({
                        ...paymentForm,
                        payment_type: type,
                        amount: type === 'recurring' ? billingTerms.recurring_amount : billingTerms.installation_charges
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="recurring">↻ Recurring Charge (Rs. {billingTerms.recurring_amount.toLocaleString()}{billingTerms.recurring_interval_months ? ` / ${getIntervalLabel(billingTerms.recurring_interval_months)}` : ''})</option>
                    <option value="installation">🔧 Installation / One-Time (Rs. {billingTerms.installation_charges.toLocaleString()})</option>
                  </select>
                  {paymentForm.payment_type === 'recurring' && billingTerms.recurring_interval_months && (
                    <p className="text-[11px] text-emerald-700 font-medium mt-0.5">✓ Logging this will advance the next due date by {billingTerms.recurring_interval_months} month(s).</p>
                  )}
                  {paymentForm.payment_type === 'installation' && (
                    <p className="text-[11px] text-blue-700 font-medium mt-0.5">ℹ Installation payments are one-time and do not affect any due date.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-medium text-slate-800">Amount Received (Rs.) *</label>
                    <input
                      type="number"
                      required
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-medium text-slate-800">Payment Date *</label>
                    <input
                      type="date"
                      required
                      value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-medium text-slate-800">Payment Method *</label>
                    <select
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="bank_transfer">🏦 Bank Transfer</option>
                      <option value="cash">💵 Cash</option>
                      <option value="cheque">📜 Cheque</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-medium text-slate-800">Reference # / Cheque #</label>
                    <input
                      type="text"
                      placeholder="e.g. HBL-991204"
                      value={paymentForm.reference_number}
                      onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-medium text-slate-800">Notes / Remarks</label>
                  <input
                    type="text"
                    placeholder="Optional payment notes..."
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-2xs text-emerald-900 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Logging a recurring payment automatically advances the next due date and clears active notifications!</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
                  <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-600/20 cursor-pointer">
                    CONFIRM PAYMENT
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Commercial Terms */}
        {isEditTermsModalOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
              <div className="bg-slate-950 text-white p-5 px-6 flex items-center justify-between border-b border-slate-900 sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
                    <Edit3 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Edit Billing Terms</h3>
                    <p className="text-2xs text-slate-400 font-normal">Configure installation and recurring charges for {tenant.business_name}</p>
                  </div>
                </div>
                <button onClick={() => setIsEditTermsModalOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateTermsSubmit} className="p-6 space-y-5 text-xs">

                {/* ─── INSTALLATION CHARGE ─── */}
                <div className="space-y-3 p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-blue-700" />
                    <h4 className="font-semibold text-blue-900 text-xs uppercase tracking-wide">Installation Charge (One-Time)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-medium text-slate-800">Installation Charges (Rs.)</label>
                      <input
                        type="number"
                        min={0}
                        value={termsForm.installation_charges}
                        onChange={(e) => setTermsForm({ ...termsForm, installation_charges: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-medium text-slate-800">Installation Date</label>
                      <input
                        type="date"
                        value={termsForm.installation_date}
                        onChange={(e) => setTermsForm({ ...termsForm, installation_date: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-blue-700 font-normal">Recorded once — never generates a recurring due date.</p>
                </div>

                {/* ─── RECURRING CHARGE ─── */}
                <div className="space-y-3 p-4 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-amber-700" />
                    <h4 className="font-semibold text-amber-900 text-xs uppercase tracking-wide">Recurring Charge</h4>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-medium text-slate-800">Charge Frequency</label>
                    <select
                      value={termsForm.interval_mode}
                      onChange={(e) => setTermsForm({ ...termsForm, interval_mode: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-400"
                    >
                      <option value="none">🚫 No recurring charge</option>
                      <option value="1">📅 Every 1 month (monthly)</option>
                      <option value="3">📅 Every 3 months</option>
                      <option value="4">📅 Every 4 months</option>
                      <option value="6">📅 Every 6 months</option>
                      <option value="12">📅 Every 12 months (yearly)</option>
                      <option value="custom">✏️ Custom interval (months)</option>
                    </select>
                  </div>

                  {termsForm.interval_mode === 'custom' && (
                    <div className="space-y-1">
                      <label className="block font-medium text-slate-800">Custom Interval (months)</label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        required
                        value={termsForm.custom_interval_months}
                        onChange={(e) => setTermsForm({ ...termsForm, custom_interval_months: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-amber-400"
                        placeholder="e.g. 2 for every 2 months"
                      />
                    </div>
                  )}

                  {termsForm.interval_mode !== 'none' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block font-medium text-slate-800">Recurring Amount (Rs.) *</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={termsForm.recurring_amount}
                          onChange={(e) => setTermsForm({ ...termsForm, recurring_amount: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-medium text-slate-800">First Recurring Charge Date *</label>
                        <input
                          type="date"
                          required={termsForm.interval_mode !== 'none'}
                          value={termsForm.first_recurring_date}
                          onChange={(e) => setTermsForm({ ...termsForm, first_recurring_date: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-amber-400"
                        />
                        <p className="text-[10px] text-slate-500">Next due date is auto-calculated from here.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── NOTES ─── */}
                <div className="space-y-1">
                  <label className="block font-medium text-slate-800">Terms Notes</label>
                  <input
                    type="text"
                    value={termsForm.notes}
                    onChange={(e) => setTermsForm({ ...termsForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-400"
                    placeholder="Optional notes about this tenant's billing arrangement..."
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
                  <button type="button" onClick={() => setIsEditTermsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold rounded-xl text-xs shadow-xs cursor-pointer">
                    SAVE BILLING TERMS
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 1: Reset Password */}
        {isResetPasswordOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-slate-950 text-white p-5 px-6 flex items-center justify-between border-b border-slate-900">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
                    <KeyRound className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Reset Password</h3>
                    <p className="text-2xs text-slate-400 font-normal">Set new owner password for {tenant.business_name}</p>
                  </div>
                </div>
                <button onClick={() => setIsResetPasswordOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-medium text-slate-800">New Password *</label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-2xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Generate Strong Password
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={resetPasswordForm.showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={resetPasswordForm.password}
                      onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, password: e.target.value })}
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-amber-400"
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setResetPasswordForm({ ...resetPasswordForm, showPassword: !resetPasswordForm.showPassword })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {resetPasswordForm.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {resetPasswordForm.password && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-medium">Strength:</span>
                        <span className="font-bold text-slate-800">{getPasswordStrength(resetPasswordForm.password).label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-300 ${getPasswordStrength(resetPasswordForm.password).color}`}
                          style={{ width: `${(getPasswordStrength(resetPasswordForm.password).score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={resetPasswordForm.forceChange}
                      onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, forceChange: e.target.checked })}
                      className="mt-0.5 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block">Force password change on next login</span>
                      <span className="text-[11px] text-slate-500 block">User will be required to choose a new password upon logging in.</span>
                    </div>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                  <button type="button" onClick={() => setIsResetPasswordOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold rounded-xl text-xs shadow-xs cursor-pointer">
                    RESET PASSWORD NOW
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Change Username */}
        {isChangeUsernameOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-slate-950 text-white p-5 px-6 flex items-center justify-between border-b border-slate-900">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
                    <Edit3 className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Change Username</h3>
                    <p className="text-2xs text-slate-400 font-normal">Update platform handle for {tenant.business_name}</p>
                  </div>
                </div>
                <button onClick={() => setIsChangeUsernameOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleChangeUsernameSubmit} className="p-6 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block font-medium text-slate-800">New Username *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">@</span>
                    <input
                      type="text"
                      required
                      value={changeUsernameForm.username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className="w-full pl-8 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                      placeholder="e.g. greenfield_pesticides"
                    />
                  </div>
                  {changeUsernameForm.status === 'checking' && (
                    <p className="text-[10px] text-blue-600 font-medium">Checking username availability...</p>
                  )}
                  {changeUsernameForm.status === 'available' && (
                    <p className="text-[10px] text-emerald-600 font-semibold">✓ Username is available!</p>
                  )}
                  {changeUsernameForm.status === 'taken' && (
                    <p className="text-[10px] text-red-600 font-semibold">✕ Username is already taken across platform.</p>
                  )}
                  <p className="text-[10px] text-slate-500">4-30 chars: lowercase letters, numbers, dot (.), underscore (_).</p>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                  <button type="button" onClick={() => setIsChangeUsernameOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changeUsernameForm.status === 'taken' || changeUsernameForm.status === 'checking'}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer"
                  >
                    UPDATE USERNAME
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 3: Disable / Enable Account */}
        {isDisableAccountOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className={`p-5 px-6 flex items-center justify-between text-white border-b ${
                ownerProfile?.account_disabled_at ? 'bg-emerald-950 border-emerald-900' : 'bg-red-950 border-red-900'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-md ${
                    ownerProfile?.account_disabled_at ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {ownerProfile?.account_disabled_at ? <UserCheck className="w-6 h-6 stroke-[2.5]" /> : <UserX className="w-6 h-6 stroke-[2.5]" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {ownerProfile?.account_disabled_at ? 'Enable Tenant Account' : 'Disable Tenant Account'}
                    </h3>
                    <p className="text-2xs text-slate-400 font-normal">Account login control for {tenant.business_name}</p>
                  </div>
                </div>
                <button onClick={() => setIsDisableAccountOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleToggleAccountDisabledSubmit} className="p-6 space-y-4 text-xs">
                {ownerProfile?.account_disabled_at ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                    <p className="font-semibold">Re-enable Login Access?</p>
                    <p className="text-[11px] text-emerald-700 mt-1">This shop owner will be able to log in and use their POS system again immediately.</p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 space-y-1">
                      <p className="font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Warning: Account Disablement</span>
                      </p>
                      <p className="text-[11px] text-red-700">This will block the owner and all shop staff from logging in until re-enabled.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-medium text-slate-800">Reason for Disabling *</label>
                      <input
                        type="text"
                        required
                        value={disableAccountReason}
                        onChange={(e) => setDisableAccountReason(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600"
                        placeholder="e.g. Non-payment of invoice #1024, License check pending..."
                      />
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                  <button type="button" onClick={() => setIsDisableAccountOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 font-semibold text-white rounded-xl text-xs shadow-xs cursor-pointer ${
                      ownerProfile?.account_disabled_at ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {ownerProfile?.account_disabled_at ? 'RE-ENABLE ACCOUNT' : 'DISABLE ACCOUNT NOW'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 4: Sign Out All Sessions */}
        {isSignOutAllOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-slate-950 text-white p-5 px-6 flex items-center justify-between border-b border-slate-900">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md">
                    <LogOut className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Sign Out All Sessions</h3>
                    <p className="text-2xs text-slate-400 font-normal">Invalidate active tokens for {tenant.business_name}</p>
                  </div>
                </div>
                <button onClick={() => setIsSignOutAllOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSignOutAllSubmit} className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-purple-700 shrink-0" />
                    <span>Global Session Invalidation</span>
                  </p>
                  <p className="text-[11px] text-purple-800">
                    This action invalidates all active JWT / auth sessions across devices for this account. User will be prompted to log in again on their next request.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                  <button type="button" onClick={() => setIsSignOutAllOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer">
                    INVALIDATE ALL SESSIONS NOW
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminShell>
  );
}
