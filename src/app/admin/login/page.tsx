'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, KeyRound, Mail, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@kisandost.pk');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (email.trim() === 'admin@kisandost.pk' && password === 'admin123') {
        localStorage.setItem('super_admin_authenticated', 'true');
        router.push('/admin/dashboard');
      } else {
        setError('Invalid Super Admin credentials. Try email: admin@kisandost.pk | pass: admin123');
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 via-slate-100 to-amber-50/70 relative flex flex-col items-center justify-center p-4 text-slate-900 font-jakarta overflow-hidden">
      {/* Soft ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-200/40 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-emerald-200/30 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-md w-full space-y-6 relative z-10">

        {/* Logo & Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 bg-amber-400 text-slate-950 rounded-2xl shadow-xl shadow-amber-500/20">
            <ShieldAlert className="w-8 h-8 text-slate-950" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            KisanDost Super Admin
          </h1>
          <p className="text-xs text-slate-600 max-w-xs mx-auto font-medium">
            Dedicated Operator Portal for Multi-Tenant Pesticide Shop SaaS Platform
          </p>
        </div>

        {/* Login Card (Kept Black & Yellow) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 text-amber-400 font-bold text-xs">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Platform Operator Authentication</span>
          </div>

          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Operator Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kisandost.pk"
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Security Access Key</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black py-3 rounded-xl text-xs shadow-lg shadow-amber-400/10 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.98]"
            >
              <span>{loading ? 'Authenticating...' : 'AUTHENTICATE SUPER ADMIN'}</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </form>

          {/* Preset Demo Credentials Box */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-2xs space-y-1 text-slate-400">
            <div className="font-bold text-amber-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Demo Super Admin Login:</span>
            </div>
            <div>Email: <strong className="text-white font-mono">admin@kisandost.pk</strong></div>
            <div>Password: <strong className="text-white font-mono">admin123</strong></div>
          </div>
        </div>

      </div>
    </div>
  );
}
