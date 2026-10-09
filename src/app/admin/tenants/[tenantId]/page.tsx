'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/layout/AdminShell';
import { dataStore } from '@/lib/data-store';
import { updateTenantFeature } from '@/actions/admin';
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
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

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
  const paymentsPagination = usePagination(tenantPayments, 10);
  const auditPagination = usePagination(credAuditLog, 10);

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

  const handleToggleFeature = async (featureKey: keyof TenantFeatureFlags) => {
    const nextState = !features[featureKey];
    const updatedFeatures = { ...features, [featureKey]: nextState };
    const persist = (flags: TenantFeatureFlags) => {
      dataStore.updateTenantSettings(tenant.id, {
        branch_mode: flags.multi_branch ? 'consolidated' : 'independent',
        features: flags,
      });
    };
    setFeatures(updatedFeatures);
    persist(updatedFeatures);

    const savedToShop = ['multi_branch', 'schemes', 'purchases', 'suppliers', 'reports'] as const;
    if ((savedToShop as readonly string[]).includes(featureKey)) {
      const res = await updateTenantFeature(
        tenant.id,
        featureKey as (typeof savedToShop)[number],
        nextState,
        tenant.id,
      );
      if (!res.success) {
        const reverted = { ...updatedFeatures, [featureKey]: !nextState };
        setFeatures(reverted);
        persist(reverted);
        showToast(res.error || 'Could not save this access on the shop.', 'error');
        return;
      }
    }

    showToast(
      `${tenant.business_name}: ${featureKey.replaceAll('_', ' ')} is ${nextState ? 'on' : 'off'}`,
      nextState ? 'success' : 'info'
    );
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link href="/admin/tenants" className="hover:text-foreground">Registered shops</Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">{tenant.business_name}</span>
          </nav>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/admin/tenants" className="rounded-[var(--kd-radius)] border border-border p-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" />
              </Link>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">{tenant.business_name}</h1>
                <p className="text-sm text-muted-foreground">{tenant.owner_name} · {tenant.city}</p>
              </div>
            </div>
            <div className="flex rounded-full border border-border bg-[var(--kd-surface)] p-1 text-xs">
              {(['active', 'trial', 'suspended'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleStatusChange(key)}
                  className={`rounded-full px-3 py-1.5 font-medium capitalize ${status === key ? 'bg-[var(--kd-primary-soft)] text-primary' : 'text-muted-foreground'}`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tenant Business Details Card */}
        <div className="space-y-6 rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] p-5 shadow-[var(--kd-shadow)]">
          
          {/* Section Selector Tabs */}
          <div className="flex flex-wrap gap-1 rounded-[var(--kd-radius)] border border-border bg-background p-1 text-sm">
            <button
              onClick={() => setActiveTab('features')}
              className={`whitespace-nowrap rounded-lg px-3 py-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'features' ? 'bg-[var(--kd-primary-soft)] text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <SlidersHorizontal className="size-4" />
              <span>Feature Access (Toggles)</span>
            </button>

            <button
              onClick={() => setActiveTab('details')}
              className={`whitespace-nowrap rounded-lg px-3 py-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'details' ? 'bg-[var(--kd-primary-soft)] text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Store className="size-4" />
              <span>Outlets &amp; License</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`whitespace-nowrap rounded-lg px-3 py-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'billing' ? 'bg-[var(--kd-primary-soft)] text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CreditCard className="size-4" />
              <span>Billing &amp; Commercial Terms</span>
            </button>

            <button
              onClick={() => setActiveTab('credentials')}
              className={`whitespace-nowrap rounded-lg px-3 py-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'credentials' ? 'bg-[var(--kd-primary-soft)] text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <KeyRound className="size-4" />
              <span>Login &amp; Access</span>
            </button>
          </div>

          {activeTab === 'details' ? (
            <div className="space-y-6 animate-fade-in-up">
              {/* License & Verification Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-background p-4 rounded-xl border border-border space-y-1">
                  <span className="text-2xs font-medium uppercase text-muted-foreground">Agri-Input Dealer License</span>
                  <div className="text-sm font-semibold text-warning font-mono">{tenant.dealer_license_number}</div>
                  <span className="text-[11px] text-muted-foreground font-normal block">Punjab Agriculture Dept Verified</span>
                </div>

                <div className="bg-background p-4 rounded-xl border border-border space-y-1">
                  <span className="text-2xs font-medium uppercase text-muted-foreground">License Expiry Date</span>
                  <div className="text-sm font-semibold text-foreground font-mono">{tenant.license_expiry_date}</div>
                  <span className="text-[11px] text-success font-semibold block">Valid License Registered</span>
                </div>

                <div className="bg-background p-4 rounded-xl border border-border space-y-1">
                  <span className="text-2xs font-medium uppercase text-muted-foreground">Branch Mode</span>
                  <div className="text-sm font-semibold text-foreground uppercase">{tenant.settings.branch_mode}</div>
                  <span className="text-[11px] text-muted-foreground font-normal block">Multi-Outlet Inventory Sync</span>
                </div>
              </div>

              {/* Registered Branch Outlets */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-success" />
                  <span>Registered Branch Outlets ({branches.length})</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {branches.map((b) => (
                    <div key={b.id} className="p-4 bg-background border border-border rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-foreground text-sm">{b.name}</div>
                          <div className="text-xs text-muted-foreground font-normal">{b.address}</div>
                        </div>
                        <span className="border border-success/30 bg-success/15 text-success text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          ACTIVE OUTLET
                        </span>
                      </div>
                      <div className="text-2xs text-muted-foreground font-mono pt-2 border-t border-border flex justify-between">
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
              <div className="bg-background p-6 rounded-2xl border border-border space-y-6">

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="size-5 text-primary" />
                      <h3 className="text-base font-semibold text-foreground">
                        Billing &amp; Commercial Terms
                      </h3>
                      {billingTerms.recurring_interval_months !== null && (
                        <span className="border border-warning/40 bg-warning/15 text-warning text-2xs font-semibold px-2.5 py-0.5 rounded-full uppercase">
                          {getIntervalLabel(billingTerms.recurring_interval_months)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-normal">
                      Installation charge, recurring fee, and payment history for <strong className="text-foreground">{tenant.business_name}</strong>
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
                      className="bg-background hover:bg-[var(--kd-primary-soft)] text-foreground border border-border font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
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
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-all"
                    >
                      <Plus className="size-3.5" />
                      <span>Log Payment</span>
                    </button>
                  </div>
                </div>

                {/* 3 Metric Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* Box 1: Installation Charge (one-time) */}
                  <div className="bg-background p-4 rounded-xl border border-border space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-2xs font-medium uppercase text-muted-foreground">Installation (One-Time)</span>
                    </div>
                    <div className="text-sm font-semibold text-foreground font-mono">
                      {billingTerms.installation_charges > 0
                        ? `Rs. ${billingTerms.installation_charges.toLocaleString()}`
                        : <span className="text-muted-foreground font-normal text-xs">No installation charge</span>
                      }
                    </div>
                    <div className="text-xs text-muted-foreground font-normal">
                      {billingTerms.installation_date
                        ? `Installed: ${billingTerms.installation_date}`
                        : <span className="text-muted-foreground">No date set</span>
                      }
                    </div>
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 bg-border text-foreground rounded uppercase">One-Time Only — Never Recurring</span>
                  </div>

                  {/* Box 2: Recurring Charge */}
                  <div className="bg-background p-4 rounded-xl border border-border space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <RefreshCw className="size-3.5 text-muted-foreground" />
                      <span className="text-2xs font-medium uppercase text-muted-foreground">Recurring Charge</span>
                    </div>
                    {billingTerms.recurring_interval_months !== null ? (
                      <>
                        <div className="text-sm font-semibold text-warning font-mono">
                          Rs. {billingTerms.recurring_amount.toLocaleString()}
                        </div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase">
                          {getIntervalLabel(billingTerms.recurring_interval_months)}
                        </div>
                        {billingTerms.first_recurring_date && (
                          <div className="text-[11px] text-muted-foreground font-normal">Start date: {billingTerms.first_recurring_date}</div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground font-normal">No recurring charge set</div>
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
                          ? 'bg-background border-border text-muted-foreground'
                          : isOverdue
                          ? 'border-danger/40 bg-danger/10 text-danger'
                          : isDueSoon
                          ? 'border-warning/40 bg-warning/10 text-warning'
                          : 'border-success/40 bg-success/10 text-success'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-2xs font-medium uppercase text-muted-foreground">Next Due Date</span>
                          {!isNone && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              isOverdue ? 'bg-danger text-white' : isDueSoon ? 'bg-warning text-primary-foreground' : 'bg-success text-white'
                            }`}>
                              {dueStatus.text}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-semibold font-mono">
                          {billingTerms.next_due_date ?? '—'}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-normal">
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
                  <div className="p-3.5 bg-background border border-border rounded-xl text-xs text-muted-foreground font-normal flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground font-semibold">Terms Note:</strong> {billingTerms.notes}
                    </div>
                  </div>
                )}

              </div>

              {/* Payment Ledger History Table (100% Tenant Isolated) */}
              <div className="bg-background rounded-2xl border border-border p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-success/15 text-success rounded-xl">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Payment Received History — {tenant.business_name}
                      </h3>
                      <p className="text-2xs text-muted-foreground font-normal">
                        Showing all recorded payments strictly for Tenant ID: <code className="font-mono text-success">{tenant.id}</code>
                      </p>
                    </div>
                  </div>

                  <span className="bg-accent/15 text-accent text-2xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    Tenant Isolated Ledger
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-background text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                        <th className="py-3 px-4">Payment Date</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Payment Method</th>
                        <th className="py-3 px-4">Reference # / Cheque</th>
                        <th className="py-3 px-4">Recorded By</th>
                        <th className="py-3 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-normal text-foreground">
                      {tenantPayments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground font-normal">
                            No payment records logged yet. Use "+ Log Payment" to record a payment.
                          </td>
                        </tr>
                      ) : (
                        paymentsPagination.pageItems.map((p) => (
                          <tr key={p.id} className="hover:bg-[var(--kd-primary-soft)] transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-foreground">{p.payment_date}</td>
                            <td className="py-3 px-4">
                              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase ${
                                p.payment_type === 'recurring'
                                  ? 'border border-success/30 bg-success/15 text-success'
                                  : 'border border-accent/30 bg-accent/15 text-accent'
                              }`}>
                                {p.payment_type === 'recurring' ? '↻ Recurring' : '🔧 Installation'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-success font-mono">
                              Rs. {p.amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 capitalize font-medium text-foreground">
                              {p.payment_method.replace('_', ' ')}
                            </td>
                            <td className="py-3 px-4 font-mono text-muted-foreground">
                              {p.reference_number || '—'}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground font-medium">
                              {p.received_by || 'Super Admin'}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                              {p.notes || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={paymentsPagination.page}
                  totalPages={paymentsPagination.totalPages}
                  totalItems={paymentsPagination.totalItems}
                  from={paymentsPagination.from}
                  to={paymentsPagination.to}
                  pageSize={paymentsPagination.pageSize}
                  onPageChange={paymentsPagination.setPage}
                  onPageSizeChange={paymentsPagination.setPageSize}
                />
              </div>

            </div>
          ) : activeTab === 'credentials' ? (
            /* ===== TENANT LOGIN & CREDENTIAL MANAGEMENT SECTION ===== */
            <div className="space-y-6 animate-fade-in-up">

              {/* Owner Account & Credentials Card */}
              <div className="bg-background p-6 rounded-2xl border border-border space-y-6">
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <KeyRound className="size-5 text-primary" />
                      <h3 className="text-base font-semibold text-foreground">
                        Login Credential Management
                      </h3>
                      <span className="border border-warning/40 bg-warning/15 text-warning text-2xs font-semibold px-2.5 py-0.5 rounded-full uppercase">
                        Owner Auth Access
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-normal">
                      Manage username, password, login status, and active sessions for <strong className="text-foreground">{tenant.business_name}</strong>
                    </p>
                  </div>
                </div>

                {/* Account Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                  {/* Username */}
                  <div className="bg-background p-4 rounded-xl border border-border space-y-1">
                    <span className="text-2xs font-medium uppercase text-muted-foreground block">Username</span>
                    <div className="text-sm font-bold text-foreground font-mono">
                      {ownerProfile?.username ? `@${ownerProfile.username}` : <span className="text-muted-foreground font-normal">Not configured</span>}
                    </div>
                    <span className="text-[11px] text-muted-foreground block">Unique Platform Identifier</span>
                  </div>

                  {/* Email */}
                  <div className="bg-background p-4 rounded-xl border border-border space-y-1">
                    <span className="text-2xs font-medium uppercase text-muted-foreground block">Recovery Email</span>
                    <div className="text-sm font-semibold text-foreground font-mono truncate">
                      {ownerProfile?.email || <span className="text-muted-foreground font-normal">No email set</span>}
                    </div>
                    <span className="text-[11px] text-muted-foreground block">Optional Recovery Contact</span>
                  </div>

                  {/* Account Status */}
                  <div className={`p-4 rounded-xl border space-y-1 ${
                    ownerProfile?.account_disabled_at ? 'border-danger/40 bg-danger/10' : 'border-success/40 bg-success/10'
                  }`}>
                    <span className="text-2xs font-medium uppercase text-muted-foreground block">Account Status</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                        ownerProfile?.account_disabled_at ? 'bg-danger text-white' : 'bg-success text-white'
                      }`}>
                        {ownerProfile?.account_disabled_at ? 'DISABLED' : 'ACTIVE'}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground block">
                      {ownerProfile?.account_disabled_at ? `Disabled: ${new Date(ownerProfile.account_disabled_at).toLocaleDateString()}` : 'Can log in & use platform'}
                    </span>
                  </div>

                  {/* Password & Session Flags */}
                  <div className="bg-background p-4 rounded-xl border border-border space-y-1">
                    <span className="text-2xs font-medium uppercase text-muted-foreground block">Security Flags</span>
                    <div className="space-y-1">
                      {ownerProfile?.force_password_change ? (
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 border border-warning/40 bg-warning/15 text-warning rounded uppercase">
                          Force Pwd Change On Login
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 bg-border text-foreground rounded uppercase">
                          Standard Credentials
                        </span>
                      )}
                      {ownerProfile?.sessions_invalidated_at && (
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          Invalidated: {new Date(ownerProfile.sessions_invalidated_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* 4 Action Buttons Grid */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Security Actions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                    {/* Action 1: Reset Password */}
                    <button
                      onClick={() => {
                        setResetPasswordForm({ password: '', showPassword: false, forceChange: true });
                        setIsResetPasswordOpen(true);
                      }}
                      className="p-3 border border-warning/40 bg-warning/10 text-warning hover:bg-warning/15 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-warning" />
                        <span>Reset Password</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-warning" />
                    </button>

                    {/* Action 2: Change Username */}
                    <button
                      onClick={() => {
                        setChangeUsernameForm({ username: ownerProfile?.username || '', status: 'idle' });
                        setIsChangeUsernameOpen(true);
                      }}
                      className="p-3 border border-accent/40 bg-accent/10 text-accent hover:bg-accent/15 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-accent" />
                        <span>Change Username</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-accent" />
                    </button>

                    {/* Action 3: Disable / Enable Account */}
                    <button
                      onClick={() => {
                        setDisableAccountReason('');
                        setIsDisableAccountOpen(true);
                      }}
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer border ${
                        ownerProfile?.account_disabled_at
                          ? 'border-success/40 bg-success/10 text-success hover:bg-success/15'
                          : 'border-danger/40 bg-danger/10 text-danger hover:bg-danger/15'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {ownerProfile?.account_disabled_at ? (
                          <>
                            <UserCheck className="w-4 h-4 text-success" />
                            <span>Enable Account</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-4 h-4 text-danger" />
                            <span>Disable Account</span>
                          </>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </button>

                    {/* Action 4: Sign Out All Sessions */}
                    <button
                      onClick={() => setIsSignOutAllOpen(true)}
                      className="p-3 bg-background hover:bg-[var(--kd-primary-soft)] text-foreground border border-border rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <LogOut className="w-4 h-4 text-foreground" />
                        <span>Sign Out All Sessions</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>

                  </div>
                </div>

              </div>

              {/* Credential Audit Log Table */}
              <div className="bg-background rounded-2xl border border-border p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-warning/15 text-warning rounded-xl">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Platform Credential Audit Log
                      </h3>
                      <p className="text-2xs text-muted-foreground font-normal">
                        Security audit history of credential changes, password resets, and login status changes.
                      </p>
                    </div>
                  </div>

                  <span className="bg-accent/15 text-accent text-2xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    Immutable Audit Log
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-background text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Details / Notes</th>
                        <th className="py-3 px-4">Performed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-normal text-foreground">
                      {credAuditLog.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-muted-foreground font-normal">
                            No credential security events recorded yet.
                          </td>
                        </tr>
                      ) : (
                        auditPagination.pageItems.map((log) => {
                          const actionColors: Record<string, string> = {
                            RESET_PASSWORD: 'border border-warning/40 bg-warning/15 text-warning',
                            CHANGE_USERNAME: 'border border-accent/40 bg-accent/15 text-accent',
                            DISABLE_ACCOUNT: 'border border-danger/40 bg-danger/15 text-danger',
                            ENABLE_ACCOUNT: 'border border-success/40 bg-success/15 text-success',
                            SIGN_OUT_ALL: 'border border-border bg-background text-foreground',
                            CREATED: 'border border-border bg-background text-foreground',
                          };
                          const color = actionColors[log.action] || 'border border-border bg-background text-foreground';

                          return (
                            <tr key={log.id} className="hover:bg-[var(--kd-primary-soft)] transition-colors">
                              <td className="py-3 px-4 font-mono font-semibold text-foreground">
                                {new Date(log.created_at).toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${color}`}>
                                  {log.action.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-foreground font-medium">
                                {log.note || '—'}
                              </td>
                              <td className="py-3 px-4 text-muted-foreground font-semibold font-mono">
                                {log.performed_by}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={auditPagination.page}
                  totalPages={auditPagination.totalPages}
                  totalItems={auditPagination.totalItems}
                  from={auditPagination.from}
                  to={auditPagination.to}
                  pageSize={auditPagination.pageSize}
                  onPageChange={auditPagination.setPage}
                  onPageSizeChange={auditPagination.setPageSize}
                />
              </div>

            </div>
          ) : (
            /* Consolidated Tenant Feature Access Section */
            <div className="animate-fade-in-up space-y-6">
              
              {/* Header Toolbar with Preview Button */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Feature access</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">Controls which modules this shop can open.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="rounded-[var(--kd-radius)] bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                >
                  Preview as shop
                </button>
              </div>

              {/* Grouped Categories */}
              <div className="space-y-8">
                {featureCategories.map((category) => {
                  const CategoryIcon = category.icon;
                  return (
                    <div key={category.id} className="space-y-3">
                      
                      {/* Category Header */}
                      <div className="flex items-center gap-2 border-b border-border pb-2">
                        <div className="rounded-lg bg-[var(--kd-primary-soft)] p-1.5 text-primary">
                          <CategoryIcon className="size-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{category.title}</h4>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                      </div>

                      {/* Toggles Grid */}
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {category.toggles.map((t) => {
                          const enabled = features[t.key];
                          return (
                            <button
                              key={t.key}
                              type="button"
                              onClick={() => handleToggleFeature(t.key)}
                              className={`flex w-full items-center justify-between gap-3 rounded-[var(--kd-radius)] border p-4 text-left transition-colors ${
                                enabled
                                  ? 'border-primary/35 bg-[color-mix(in_srgb,var(--kd-primary)_14%,var(--kd-surface))]'
                                  : 'border-border bg-[color-mix(in_srgb,var(--kd-background)_35%,var(--kd-surface))] hover:border-primary/25'
                              }`}
                            >
                              <div className="min-w-0">
                                <span className="block truncate text-sm font-medium text-foreground">{t.label}</span>
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{t.sidebarItem}</span>
                              </div>
                              <span className="flex shrink-0 items-center gap-2">
                                <span className={`text-xs font-medium ${enabled ? 'text-primary' : 'text-muted-foreground'}`}>
                                  {enabled ? 'On' : 'Off'}
                                </span>
                                {enabled ? (
                                  <ToggleRight className="size-7 text-primary" />
                                ) : (
                                  <ToggleLeft className="size-7 text-muted-foreground" />
                                )}
                              </span>
                            </button>
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-[var(--kd-surface)] text-foreground shadow-2xl">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Sidebar preview</h3>
                  <p className="text-xs text-muted-foreground">{tenant.business_name}</p>
                </div>
                <button type="button" onClick={() => setIsPreviewOpen(false)} className="text-muted-foreground" aria-label="Close">
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-5 overflow-y-auto bg-background p-5 text-sm">
                
                <div className="rounded-xl border border-border bg-[var(--kd-primary-soft)] p-3 text-foreground flex items-center justify-between text-2xs">
                  <div className="font-normal">
                    💡 This preview reflects real-time feature flags specifically configured for <strong className="font-semibold">{tenant.business_name}</strong>. Green items are visible to shop staff; greyed out items with lock icons are hidden/blocked.
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-border bg-background p-4">
                  
                  {/* Overview Group */}
                  <div className="space-y-1.5">
                    <div className="text-2xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Overview</span>
                    </div>
                    <div className="rounded-lg bg-[var(--kd-primary-soft)] p-2 text-foreground font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-primary" />
                        Dashboard (/dashboard)
                      </span>
                      <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
                        ALWAYS ACTIVE
                      </span>
                    </div>
                  </div>

                  {/* Sales & Udhaar Group */}
                  <div className="space-y-1.5">
                    <div className="text-2xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
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
                              ? 'border-border bg-[var(--kd-primary-soft)] text-foreground'
                              : 'border-border bg-background text-muted-foreground line-through'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {item.enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                            {item.label}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${item.enabled ? 'bg-primary text-primary-foreground' : 'bg-border text-muted-foreground'}`}>
                            {item.enabled ? 'VISIBLE' : 'HIDDEN / BLOCKED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Inventory & Stock Group */}
                  <div className="space-y-1.5">
                    <div className="text-2xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
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
                              ? 'border-border bg-[var(--kd-primary-soft)] text-foreground'
                              : 'border-border bg-background text-muted-foreground line-through'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {item.enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                            {item.label}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${item.enabled ? 'bg-primary text-primary-foreground' : 'bg-border text-muted-foreground'}`}>
                            {item.enabled ? 'VISIBLE' : 'HIDDEN / BLOCKED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operations Group */}
                  <div className="space-y-1.5">
                    <div className="text-2xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
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
                              ? 'border-border bg-[var(--kd-primary-soft)] text-foreground'
                              : 'border-border bg-background text-muted-foreground line-through'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {item.enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                            {item.label}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${item.enabled ? 'bg-primary text-primary-foreground' : 'bg-border text-muted-foreground'}`}>
                            {item.enabled ? 'VISIBLE' : 'HIDDEN / BLOCKED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reports & Audit Group */}
                  <div className="space-y-1.5">
                    <div className="text-2xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
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
                              ? 'border-border bg-[var(--kd-primary-soft)] text-foreground'
                              : 'border-border bg-background text-muted-foreground line-through'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {item.enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                            {item.label}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${item.enabled ? 'bg-primary text-primary-foreground' : 'bg-border text-muted-foreground'}`}>
                            {item.enabled ? 'VISIBLE' : 'HIDDEN / BLOCKED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Settings Group */}
                  <div className="space-y-1.5">
                    <div className="text-2xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
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
                              ? 'border-border bg-[var(--kd-primary-soft)] text-foreground'
                              : 'border-border bg-background text-muted-foreground line-through'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {item.enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                            {item.label}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${item.enabled ? 'bg-primary text-primary-foreground' : 'bg-border text-muted-foreground'}`}>
                            {item.enabled ? 'VISIBLE' : 'HIDDEN / BLOCKED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="shrink-0 border-t border-border bg-background p-4 text-right">
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="cursor-pointer rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground"
                >
                  Close Preview
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Modal: Record Payment Received */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-[var(--kd-surface)] text-foreground shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <div className="flex items-center space-x-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground">
                    <Plus className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">Log Payment Received</h3>
                    <p className="text-xs text-muted-foreground">Record installation or recurring charge for {tenant.business_name}</p>
                  </div>
                </div>
                <button onClick={() => setIsPaymentModalOpen(false)} className="cursor-pointer rounded-xl p-1.5 text-muted-foreground hover:bg-background hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-foreground">Payment Type *</label>
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
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="recurring">↻ Recurring Charge (Rs. {billingTerms.recurring_amount.toLocaleString()}{billingTerms.recurring_interval_months ? ` / ${getIntervalLabel(billingTerms.recurring_interval_months)}` : ''})</option>
                    <option value="installation">🔧 Installation / One-Time (Rs. {billingTerms.installation_charges.toLocaleString()})</option>
                  </select>
                  {paymentForm.payment_type === 'recurring' && billingTerms.recurring_interval_months && (
                    <p className="text-[11px] text-primary font-medium mt-0.5">✓ Logging this will advance the next due date by {billingTerms.recurring_interval_months} month(s).</p>
                  )}
                  {paymentForm.payment_type === 'installation' && (
                    <p className="text-[11px] text-accent font-medium mt-0.5">ℹ Installation payments are one-time and do not affect any due date.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-foreground">Amount Received (Rs.) *</label>
                    <input
                      type="number"
                      required
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-mono font-semibold text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-foreground">Payment Date *</label>
                    <input
                      type="date"
                      required
                      value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-mono font-semibold text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-foreground">Payment Method *</label>
                    <select
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value as any })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="bank_transfer">🏦 Bank Transfer</option>
                      <option value="cash">💵 Cash</option>
                      <option value="cheque">📜 Cheque</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-foreground">Reference # / Cheque #</label>
                    <input
                      type="text"
                      placeholder="e.g. HBL-991204"
                      value={paymentForm.reference_number}
                      onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-mono font-semibold text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-foreground">Notes / Remarks</label>
                  <input
                    type="text"
                    placeholder="Optional payment notes..."
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-border bg-[var(--kd-primary-soft)] p-3 text-xs font-medium text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Logging a recurring payment automatically advances the next due date and clears active notifications!</span>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end space-x-3">
                  <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="cursor-pointer rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground">
                    Cancel
                  </button>
                  <button type="submit" className="cursor-pointer rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground">
                    CONFIRM PAYMENT
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Commercial Terms */}
        {isEditTermsModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto overflow-hidden rounded-3xl border border-border bg-[var(--kd-surface)] text-foreground shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-[var(--kd-surface)] px-6 py-5">
                <div className="flex items-center space-x-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground">
                    <Edit3 className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">Edit Billing Terms</h3>
                    <p className="text-xs text-muted-foreground">Configure installation and recurring charges for {tenant.business_name}</p>
                  </div>
                </div>
                <button onClick={() => setIsEditTermsModalOpen(false)} className="cursor-pointer rounded-xl p-1.5 text-muted-foreground hover:bg-background hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateTermsSubmit} className="p-6 space-y-5 text-xs">

                {/* ─── INSTALLATION CHARGE ─── */}
                <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="size-4 text-muted-foreground" />
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">Installation Charge (One-Time)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-foreground">Installation Charges (Rs.)</label>
                      <input
                        type="number"
                        min={0}
                        value={termsForm.installation_charges}
                        onChange={(e) => setTermsForm({ ...termsForm, installation_charges: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-mono font-semibold text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-foreground">Installation Date</label>
                      <input
                        type="date"
                        value={termsForm.installation_date}
                        onChange={(e) => setTermsForm({ ...termsForm, installation_date: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-mono font-semibold text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] font-normal text-muted-foreground">Recorded once — never generates a recurring due date.</p>
                </div>

                {/* ─── RECURRING CHARGE ─── */}
                <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="size-4 text-muted-foreground" />
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">Recurring Charge</h4>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-foreground">Charge Frequency</label>
                    <select
                      value={termsForm.interval_mode}
                      onChange={(e) => setTermsForm({ ...termsForm, interval_mode: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
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
                      <label className="block text-sm font-medium text-foreground">Custom Interval (months)</label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        required
                        value={termsForm.custom_interval_months}
                        onChange={(e) => setTermsForm({ ...termsForm, custom_interval_months: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-mono font-semibold text-foreground focus:outline-none focus:border-primary"
                        placeholder="e.g. 2 for every 2 months"
                      />
                    </div>
                  )}

                  {termsForm.interval_mode !== 'none' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-foreground">Recurring Amount (Rs.) *</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={termsForm.recurring_amount}
                          onChange={(e) => setTermsForm({ ...termsForm, recurring_amount: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-mono font-semibold text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-foreground">First Recurring Charge Date *</label>
                        <input
                          type="date"
                          required={termsForm.interval_mode !== 'none'}
                          value={termsForm.first_recurring_date}
                          onChange={(e) => setTermsForm({ ...termsForm, first_recurring_date: e.target.value })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-mono font-semibold text-foreground focus:outline-none focus:border-primary"
                        />
                        <p className="text-[10px] text-muted-foreground">Next due date is auto-calculated from here.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── NOTES ─── */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-foreground">Terms Notes</label>
                  <input
                    type="text"
                    value={termsForm.notes}
                    onChange={(e) => setTermsForm({ ...termsForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground focus:outline-none focus:border-primary"
                    placeholder="Optional notes about this tenant's billing arrangement..."
                  />
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end space-x-3">
                  <button type="button" onClick={() => setIsEditTermsModalOpen(false)} className="cursor-pointer rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground">
                    Cancel
                  </button>
                  <button type="submit" className="cursor-pointer rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground">
                    SAVE BILLING TERMS
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 1: Reset Password */}
        {isResetPasswordOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-[var(--kd-surface)] text-foreground shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <div className="flex items-center space-x-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground">
                    <KeyRound className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">Reset Password</h3>
                    <p className="text-xs text-muted-foreground">Set new owner password for {tenant.business_name}</p>
                  </div>
                </div>
                <button onClick={() => setIsResetPasswordOpen(false)} className="cursor-pointer rounded-xl p-1.5 text-muted-foreground hover:bg-background hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-foreground">New Password *</label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="flex cursor-pointer items-center gap-1 text-2xs font-semibold text-primary hover:opacity-80"
                    >
                      <RefreshCw className="size-3" />
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
                      className="w-full pl-3 pr-10 py-2 bg-background border border-border rounded-xl text-xs font-mono font-semibold text-foreground focus:outline-none focus:border-primary"
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setResetPasswordForm({ ...resetPasswordForm, showPassword: !resetPasswordForm.showPassword })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground cursor-pointer"
                    >
                      {resetPasswordForm.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {resetPasswordForm.password && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground font-medium">Strength:</span>
                        <span className="font-bold text-foreground">{getPasswordStrength(resetPasswordForm.password).label}</span>
                      </div>
                      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-border">
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
                      className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="font-semibold text-foreground block">Force password change on next login</span>
                      <span className="text-[11px] text-muted-foreground block">User will be required to choose a new password upon logging in.</span>
                    </div>
                  </label>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-end space-x-3">
                  <button type="button" onClick={() => setIsResetPasswordOpen(false)} className="cursor-pointer rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground">
                    Cancel
                  </button>
                  <button type="submit" className="cursor-pointer rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground">
                    RESET PASSWORD NOW
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Change Username */}
        {isChangeUsernameOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-[var(--kd-surface)] text-foreground shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <div className="flex items-center space-x-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground">
                    <Edit3 className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">Change Username</h3>
                    <p className="text-xs text-muted-foreground">Update platform handle for {tenant.business_name}</p>
                  </div>
                </div>
                <button onClick={() => setIsChangeUsernameOpen(false)} className="cursor-pointer rounded-xl p-1.5 text-muted-foreground hover:bg-background hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleChangeUsernameSubmit} className="p-6 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-foreground">New Username *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold">@</span>
                    <input
                      type="text"
                      required
                      value={changeUsernameForm.username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className="w-full pl-8 pr-10 py-2 bg-background border border-border rounded-xl text-xs font-mono font-semibold text-foreground focus:outline-none focus:border-primary"
                      placeholder="e.g. greenfield_pesticides"
                    />
                  </div>
                  {changeUsernameForm.status === 'checking' && (
                    <p className="text-[10px] text-blue-600 font-medium">Checking username availability...</p>
                  )}
                  {changeUsernameForm.status === 'available' && (
                    <p className="text-[10px] text-primary font-semibold">✓ Username is available!</p>
                  )}
                  {changeUsernameForm.status === 'taken' && (
                    <p className="text-[10px] text-red-600 font-semibold">✕ Username is already taken across platform.</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">4-30 chars: lowercase letters, numbers, dot (.), underscore (_).</p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-end space-x-3">
                  <button type="button" onClick={() => setIsChangeUsernameOpen(false)} className="cursor-pointer rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changeUsernameForm.status === 'taken' || changeUsernameForm.status === 'checking'}
                    className="cursor-pointer rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-[var(--kd-surface)] text-foreground shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <div className="flex items-center space-x-3">
                  <div className={`flex size-10 items-center justify-center rounded-2xl font-bold ${
                    ownerProfile?.account_disabled_at ? 'bg-primary text-primary-foreground' : 'bg-danger text-white'
                  }`}>
                    {ownerProfile?.account_disabled_at ? <UserCheck className="w-6 h-6 stroke-[2.5]" /> : <UserX className="w-6 h-6 stroke-[2.5]" />}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {ownerProfile?.account_disabled_at ? 'Enable Tenant Account' : 'Disable Tenant Account'}
                    </h3>
                    <p className="text-xs text-muted-foreground">Account login control for {tenant.business_name}</p>
                  </div>
                </div>
                <button onClick={() => setIsDisableAccountOpen(false)} className="cursor-pointer rounded-xl p-1.5 text-muted-foreground hover:bg-background hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleToggleAccountDisabledSubmit} className="p-6 space-y-4 text-xs">
                {ownerProfile?.account_disabled_at ? (
                  <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-success">
                    <p className="font-semibold">Re-enable Login Access?</p>
                    <p className="text-[11px] text-primary mt-1">This shop owner will be able to log in and use their POS system again immediately.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1 rounded-xl border border-danger/30 bg-danger/10 p-3 text-danger">
                      <p className="font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Warning: Account Disablement</span>
                      </p>
                      <p className="text-[11px] text-danger">This will block the owner and all shop staff from logging in until re-enabled.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-foreground">Reason for Disabling *</label>
                      <input
                        type="text"
                        required
                        value={disableAccountReason}
                        onChange={(e) => setDisableAccountReason(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground focus:outline-none focus:border-danger"
                        placeholder="e.g. Non-payment of invoice #1024, License check pending..."
                      />
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-border flex items-center justify-end space-x-3">
                  <button type="button" onClick={() => setIsDisableAccountOpen(false)} className="cursor-pointer rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 font-semibold text-white rounded-xl text-xs shadow-xs cursor-pointer ${
                      ownerProfile?.account_disabled_at ? 'bg-primary hover:opacity-90' : 'bg-danger hover:opacity-90'
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-[var(--kd-surface)] text-foreground shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <div className="flex items-center space-x-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground">
                    <LogOut className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">Sign Out All Sessions</h3>
                    <p className="text-xs text-muted-foreground">Invalidate active tokens for {tenant.business_name}</p>
                  </div>
                </div>
                <button onClick={() => setIsSignOutAllOpen(false)} className="cursor-pointer rounded-xl p-1.5 text-muted-foreground hover:bg-background hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSignOutAllSubmit} className="p-6 space-y-4 text-xs">
                <div className="space-y-1 rounded-xl border border-border bg-background p-3 text-foreground">
                  <p className="font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-purple-700 shrink-0" />
                    <span>Global Session Invalidation</span>
                  </p>
                  <p className="text-[11px] text-purple-800">
                    This action invalidates all active JWT / auth sessions across devices for this account. User will be prompted to log in again on their next request.
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-end space-x-3">
                  <button type="button" onClick={() => setIsSignOutAllOpen(false)} className="cursor-pointer rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground">
                    Cancel
                  </button>
                  <button type="submit" className="cursor-pointer rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground">
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
