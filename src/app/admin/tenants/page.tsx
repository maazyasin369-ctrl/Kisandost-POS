'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/layout/AdminShell';
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
  Sparkles,
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
    showToast(`Subscription status updated to ${newStatus.toUpperCase()}`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('super_admin_authenticated');
    router.push('/admin/login');
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

  const totalTenants = tenants.length;
  const activeCount = tenants.filter((t) => t.subscription_status === 'active').length;
  const trialCount = tenants.filter((t) => t.subscription_status === 'trial').length;

  return (
    <AdminShell>
      <div className="space-y-6">

        {/* Hero Header Banner matching Screenshot 1:1 */}
        <div className="bg-gradient-to-r from-amber-50 via-white to-emerald-50 border border-amber-100 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-6">
          
          {/* Top Row inside Hero Banner: Navigation & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <nav className="flex items-center gap-1.5 text-2xs font-medium text-amber-700">
              <span>Super Admin</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
              <span className="text-slate-900 font-medium">Dashboard</span>
            </nav>

            {/* Quick Actions & Primary "+ Create New Tenant" Button */}
            <div className="flex flex-wrap items-center space-x-3 gap-y-2">
              <button
                onClick={() => {
                  setFormError(null);
                  setIsCreateModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-2xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
                <span>+ Create New Tenant</span>
              </button>

              <Link
                href="/dashboard"
                className="bg-white hover:bg-slate-50 text-slate-800 text-2xs font-semibold px-4 py-2 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2 transition-all"
              >
                <Store className="w-3.5 h-3.5 text-amber-600" />
                <span>Switch to Shop Counter</span>
              </Link>

              <button
                onClick={handleLogout}
                className="bg-slate-950 hover:bg-slate-800 text-white text-2xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Middle Row inside Hero Banner: Title & Subtitle + Isolation Active Box */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="space-y-1 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Registered Tenant Shops Catalog
              </h1>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                Multi-tenant management portal: Create new shop tenants, view registered pesticide shops, subscription status, and per-tenant server-enforced feature flags.
              </p>
            </div>

            {/* Dark Green Badge matching Screenshot Right Side */}
            <div className="bg-[#00875A] text-white p-3.5 px-5 rounded-2xl flex items-center space-x-3.5 shadow-md border border-[#006C48] shrink-0">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold text-white flex items-center gap-1">
                  <span>Multi-Tenant Isolation Active</span>
                </div>
                <div className="text-[11px] font-medium text-emerald-100 flex items-center gap-1 mt-0.5">
                  <span>{totalTenants} Shop Accounts Registered</span>
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Top 3 KPI Summary Cards with Upward Trendlines matching Screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          
          {/* Card 1: Total Registered Shops */}
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5 shadow-2xs flex items-center justify-between group hover:shadow-md transition-all relative overflow-hidden">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xs font-medium text-amber-900/80 uppercase tracking-wider block">Total Registered Shops</span>
                <div className="text-xl font-semibold text-amber-950 mt-0.5">{totalTenants} Tenants</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Upward Amber Trendline Graphic */}
              <svg className="w-12 h-6 text-amber-500" viewBox="0 0 50 25" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M2 20 L 15 15 L 30 18 L 48 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 2: Active Paid Subscriptions */}
          <div className="bg-[#ECFDF5] border border-emerald-100 rounded-3xl p-5 shadow-2xs flex items-center justify-between group hover:shadow-md transition-all relative overflow-hidden">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 rounded-2xl bg-[#10B981] text-white flex items-center justify-center shadow-xs shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xs font-medium text-emerald-900/80 uppercase tracking-wider block">Active Paid Subscriptions</span>
                <div className="text-xl font-semibold text-emerald-950 mt-0.5">{activeCount} Shops</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Upward Green Trendline Graphic */}
              <svg className="w-12 h-6 text-emerald-500" viewBox="0 0 50 25" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M2 20 L 15 15 L 30 18 L 48 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <ChevronRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 3: Trial Accounts */}
          <div className="bg-slate-100 border border-slate-200 rounded-3xl p-5 shadow-2xs flex items-center justify-between group hover:shadow-md transition-all relative overflow-hidden">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 rounded-2xl bg-slate-700 text-white flex items-center justify-center shadow-xs shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xs font-medium text-slate-700 uppercase tracking-wider block">Trial Accounts</span>
                <div className="text-xl font-semibold text-slate-950 mt-0.5">{trialCount} Shops</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Upward Slate Trendline Graphic */}
              <svg className="w-12 h-6 text-slate-500" viewBox="0 0 50 25" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M2 20 L 15 15 L 30 18 L 48 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

        </div>

        {/* Search & Status Filter Bar matching Screenshot */}
        <div className="bg-white p-3.5 px-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
          
          {/* Search Input */}
          <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus-within:ring-2 focus-within:ring-amber-400 transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search shop name, owner, city, or license #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {/* Status Filter Pills + Create Button */}
          <div className="flex flex-wrap items-center space-x-2 gap-y-2">
            <span className="font-medium text-slate-500 uppercase text-2xs mr-1">Status:</span>
            {(['all', 'active', 'trial', 'suspended'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-1.5 rounded-xl font-semibold text-2xs uppercase transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-950 text-amber-400 shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st === 'all' ? 'All' : st === 'active' ? 'Active' : st === 'trial' ? 'Trial' : 'Suspended'}
              </button>
            ))}

            <button
              onClick={() => {
                setFormError(null);
                setIsCreateModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-2xs font-semibold px-3.5 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer ml-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Shop</span>
            </button>
          </div>
        </div>

        {/* Tenant Shop Cards Grid (2 Columns matching Screenshot) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTenants.map((t) => {
            const branches = dataStore.getBranches(t.id);
            const featureFlags = t.settings?.features ?? {};
            const enabledCount = Object.values(featureFlags).filter(Boolean).length;
            const totalCount = Object.keys(featureFlags).length || 13;
            const isActive = t.subscription_status === 'active';
            const isTrial = t.subscription_status === 'trial';

            return (
              <div
                key={t.id}
                className={`bg-white border rounded-3xl p-6 shadow-xs hover:shadow-md transition-all space-y-5 flex flex-col justify-between ${
                  isActive ? 'border-emerald-500 border-t-4' : 'border-amber-400 border-t-4'
                }`}
              >
                <div className="space-y-4">
                  
                  {/* Card Header Row matching Screenshot */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#DCFCE7] text-[#10B981] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Leaf className="w-5 h-5 fill-[#10B981]" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-slate-900 tracking-tight">{t.business_name}</h2>
                        <p className="text-xs text-slate-600 font-normal mt-0.5">
                          Owner: <strong className="text-slate-900 font-semibold">{t.owner_name}</strong> &nbsp;|&nbsp; City: <strong className="text-slate-900 font-semibold">{t.city}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-2xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#DCFCE7] text-[#15803D] border border-emerald-300'
                          : isTrial
                          ? 'bg-[#FEF3C7] text-[#B45309] border border-amber-300'
                          : 'bg-red-100 text-red-950 border border-red-300'
                      }`}
                    >
                      <span>{isActive ? '• ACTIVE' : isTrial ? '🕒 TRIAL' : 'SUSPENDED'}</span>
                    </span>
                  </div>

                  {/* 4 Soft Pastel Metric Boxes matching Screenshot 1:1 */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    
                    {/* Box 1: Dealer License (Soft Amber) */}
                    <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 space-y-1">
                      <div className="flex items-center space-x-1.5 text-amber-700">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium uppercase text-slate-500">Dealer License</span>
                      </div>
                      <div className="font-semibold text-slate-900 font-mono text-xs">{t.dealer_license_number}</div>
                    </div>

                    {/* Box 2: License Expiry (Soft Slate) */}
                    <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 space-y-1">
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium uppercase text-slate-500">License Expiry</span>
                      </div>
                      <div className="font-semibold text-slate-900 font-mono text-xs">{t.license_expiry_date}</div>
                    </div>

                    {/* Box 3: Outlets / Branches (Soft Green) */}
                    <div className="bg-[#ECFDF5] p-3 rounded-2xl border border-emerald-100 space-y-1">
                      <div className="flex items-center space-x-1.5 text-emerald-600">
                        <Store className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium uppercase text-slate-500">Outlets / Branches</span>
                      </div>
                      <div className="font-semibold text-emerald-950 text-xs">{branches.length} Registered Outlets</div>
                    </div>

                    {/* Box 4: Feature Toggles (Soft Amber) */}
                    <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 space-y-1">
                      <div className="flex items-center space-x-1.5 text-amber-700">
                        <Settings className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium uppercase text-slate-500">Feature Toggles</span>
                      </div>
                      <div className="font-semibold text-amber-950 text-xs">{enabledCount} of {totalCount} Enabled</div>
                    </div>

                  </div>

                  {/* Registered Outlets list */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-2xs font-medium uppercase text-slate-500 tracking-wider">Outlets:</span>
                    <div className="flex flex-wrap gap-2">
                      {branches.map((b) => (
                        <span key={b.id} className="bg-amber-50 text-amber-950 border border-amber-200 text-2xs font-medium px-3 py-1 rounded-xl flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{b.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Card Action Buttons matching Screenshot 1:1 */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleStatusChange(t.id, 'active')}
                      className={`px-4 py-2 rounded-xl text-2xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#00875A] text-white shadow-xs'
                          : 'bg-[#F8FAFC] text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      <span>Set Active</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(t.id, 'trial')}
                      className={`px-4 py-2 rounded-xl text-2xs font-semibold transition-all cursor-pointer ${
                        isTrial
                          ? 'bg-[#F59E0B] text-slate-950 shadow-xs'
                          : 'bg-[#F8FAFC] text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Set Trial
                    </button>
                  </div>

                  <Link
                    href={`/admin/tenants/${t.id}`}
                    className="bg-[#051329] hover:bg-[#0B2347] active:bg-[#020A17] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Manage Feature Access</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Modal: "+ Create New Tenant" Form */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-5 px-6 flex items-center justify-between border-b border-slate-900 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
                  <Plus className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Create New Tenant Shop</h3>
                  <p className="text-2xs text-slate-400 font-normal">
                    Register a new shop, owner profile account, dealer license, and outlet configuration
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              
              {/* Inline Error Alert */}
              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Section 1: Shop & Owner Basic Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">1. Shop &amp; Owner Profile</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Shop Business Name */}
                  <div className="space-y-1">
                    <label className="block font-medium text-slate-800">Shop / Business Name *</label>
                    <div className="relative">
                      <Store className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Al-Madina Agri Services"
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  {/* Owner Full Name */}
                  <div className="space-y-1">
                    <label className="block font-medium text-slate-800">Owner Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chaudhry Tariq Mehmood"
                        value={formData.owner_name}
                        onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  {/* Owner Phone */}
                  <div className="space-y-1">
                    <label className="block font-medium text-slate-800">Owner Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="+92 300 1234567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  {/* Owner Email */}
                  <div className="space-y-1">
                    <label className="block font-medium text-slate-800">Owner Email Address * (For Auth Account)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="owner@almadina-agri.pk"
                        value={formData.owner_email}
                        onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div className="space-y-1">
                    <label className="block font-medium text-slate-800">City *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Multan, Sahiwal, Faisalabad..."
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  {/* Subscription Status */}
                  <div className="space-y-1">
                    <label className="block font-medium text-slate-800">Initial Subscription Status</label>
                    <select
                      value={formData.subscription_status}
                      onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value as SubscriptionStatus })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="trial">🕒 Trial (30 Days Free)</option>
                      <option value="active">🟢 Active (Paid Subscription)</option>
                      <option value="suspended">🔴 Suspended</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Section 2: Dealer License */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">2. Agri Pesticide Dealer License</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dealer License # */}
                  <div className="space-y-1">
                    <label className="block font-medium text-slate-800">Dealer License Number * (Must be Unique)</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. PB-MLT-2026-889"
                        value={formData.dealer_license_number}
                        onChange={(e) => setFormData({ ...formData, dealer_license_number: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  {/* License Expiry Date */}
                  <div className="space-y-1">
                    <label className="block font-medium text-slate-800">License Expiry Date *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="date"
                        required
                        value={formData.license_expiry_date}
                        onChange={(e) => setFormData({ ...formData, license_expiry_date: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Branch Setup & Multi-Branch Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">3. Outlets &amp; Branch Setup</h4>
                  </div>
                </div>

                {/* Branch Choice Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => handleBranchSetupChange('single')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                      formData.branch_setup === 'single'
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 flex items-center gap-2">
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
                    <p className="text-2xs text-slate-500 leading-tight font-normal">
                      One main outlet. Multi-branch features disabled by default for this tenant.
                    </p>
                  </div>

                  <div
                    onClick={() => handleBranchSetupChange('multiple')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                      formData.branch_setup === 'multiple'
                        ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/30'
                        : 'bg-[#F8FAFC] border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 flex items-center gap-2">
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
                    <p className="text-2xs text-slate-500 leading-tight font-normal">
                      2 or more outlets. Multi-branch feature toggle ON by default.
                    </p>
                  </div>
                </div>

                {/* Branch Fields List */}
                <div className="space-y-3 pt-1">
                  {formData.branches.map((b, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 text-2xs uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          <span>Outlet #{idx + 1} Configuration</span>
                        </span>

                        {formData.branch_setup === 'multiple' && formData.branches.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBranchField(idx)}
                            className="text-red-500 hover:text-red-700 text-2xs font-semibold flex items-center gap-1 p-1 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-2xs font-medium text-slate-700">Branch Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Main Outlet / Grain Market Branch"
                            value={b.name}
                            onChange={(e) => handleBranchInputChange(idx, 'name', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-2xs font-medium text-slate-700">Branch Address *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Shop #14, Grain Market, Vehari Road"
                            value={b.address}
                            onChange={(e) => handleBranchInputChange(idx, 'address', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.branch_setup === 'multiple' && (
                    <button
                      type="button"
                      onClick={handleAddBranchField}
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold border border-dashed border-emerald-300 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4 text-emerald-700" />
                      <span>+ Add Another Branch Outlet</span>
                    </button>
                  )}
                </div>

              </div>

              {/* Section 4: Owner Login Credentials */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">4. Owner Login Credentials</h4>
                  <span className="text-2xs text-slate-400 font-normal ml-1">(Login works with username OR email)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Username */}
                  <div className="space-y-1">
                    <label className="block font-medium text-slate-800">
                      Username * <span className="text-slate-400 font-normal">(4–30 chars, a–z 0–9 . _)</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. tariq.mehmood"
                        value={credForm.username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        className={`w-full pl-9 pr-8 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 ${
                          usernameStatus === 'taken' ? 'border-red-400 focus:ring-red-500/20' :
                          usernameStatus === 'available' ? 'border-emerald-500 focus:ring-emerald-500/20' :
                          'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                        }`}
                      />
                      {/* Status indicator */}
                      <div className="absolute right-2.5 top-2.5">
                        {usernameStatus === 'checking' && <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
                        {usernameStatus === 'available' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        {usernameStatus === 'taken' && <X className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                    </div>
                    {usernameStatus === 'taken' && (
                      <p className="text-red-600 text-2xs font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Username already taken
                      </p>
                    )}
                    {usernameStatus === 'available' && (
                      <p className="text-emerald-700 text-2xs font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Username available
                      </p>
                    )}
                  </div>

                  {/* Owner Email (optional for recovery) */}
                  <div className="space-y-1">
                    <label className="block font-medium text-slate-800">
                      Owner Email <span className="text-slate-400 font-normal">(optional — for recovery)</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        placeholder="owner@shop.pk (optional)"
                        value={credForm.email}
                        onChange={(e) => setCredForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <p className="text-2xs text-slate-400 font-normal">Login works with username OR email if provided</p>
                  </div>

                </div>

                {/* Password row with generator */}
                <div className="space-y-1">
                  <label className="block font-medium text-slate-800">Password *</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type={credForm.showPassword ? 'text' : 'password'}
                        placeholder="Min. 8 characters"
                        value={credForm.password}
                        onChange={(e) => setCredForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setCredForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                      >
                        {credForm.showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const pwd = generateStrongPassword();
                        setCredForm(prev => ({ ...prev, password: pwd, showPassword: true }));
                      }}
                      className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold text-2xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
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
                <label className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={credForm.force_password_change}
                    onChange={(e) => setCredForm(prev => ({ ...prev, force_password_change: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                  <div>
                    <div className="font-semibold text-amber-900 text-xs">Force password change on first login</div>
                    <div className="text-2xs text-amber-700 font-normal mt-0.5">
                      Owner must set their own password when they first sign in. Recommended ON.
                    </div>
                  </div>
                </label>

              </div>

              {/* Modal Footer / Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
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
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">

            {/* Header */}
            <div className="bg-slate-950 text-white p-5 px-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Owner Login Credentials — Show Once</h3>
                <p className="text-2xs text-amber-300 font-medium mt-0.5">⚠️ Copy or share now — this screen will not be shown again</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">

              {/* Shop name banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5">
                <Store className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-2xs font-medium text-emerald-700 uppercase tracking-wider">New Shop Created</div>
                  <div className="font-semibold text-emerald-950 text-sm">{credsCard.businessName}</div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 ml-auto shrink-0" />
              </div>

              {/* Credential rows */}
              <div className="space-y-3">

                {/* Username */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <div className="text-2xs font-medium uppercase text-slate-500 tracking-wider">Username</div>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{credsCard.username}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credsCard.username, 'Username')}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Copy username"
                  >
                    <Copy className="w-4 h-4 text-slate-600" />
                  </button>
                </div>

                {/* Password */}
                <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div>
                    <div className="text-2xs font-medium uppercase text-amber-700 tracking-wider">Password (Temporary)</div>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{credsCard.password}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credsCard.password, 'Password')}
                    className="p-2 bg-white hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                    title="Copy password"
                  >
                    <Copy className="w-4 h-4 text-amber-700" />
                  </button>
                </div>

                {/* Email (if set) */}
                {credsCard.email && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <div className="text-2xs font-medium uppercase text-slate-500 tracking-wider">Login Email (optional)</div>
                      <div className="font-mono font-semibold text-slate-900 text-sm mt-0.5">{credsCard.email}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(credsCard.email, 'Email')}
                      className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                )}

              </div>

              {/* Force change note */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
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
                className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                I've saved these credentials →
              </button>
            </div>

          </div>
        </div>
      )}

    </AdminShell>
  );
}

