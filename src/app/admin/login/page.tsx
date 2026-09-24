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
    <div className="min-h-screen bg-slate-950 bg-[url('/images/real_grass_bg.png')] bg-cover bg-center bg-fixed relative flex flex-col items-center justify-center p-4 text-slate-900 font-jakarta overflow-hidden">
      {/* Real Grass overlay gradient for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-emerald-950/50 to-slate-950/80 backdrop-blur-[1px] pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">

        {/* Logo & Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 bg-amber-400 text-slate-950 rounded-2xl shadow-2xl shadow-amber-400/30 ring-4 ring-slate-950/50">
            <ShieldAlert className="w-8 h-8 text-slate-950" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
            KisanDost Super Admin
          </h1>
          <p className="text-xs text-amber-200 font-bold drop-shadow max-w-xs mx-auto">
            Dedicated Operator Portal for Multi-Tenant Pesticide Shop SaaS Platform
          </p>
        </div>

        {/* Light Card with Black & Yellow Scheme over Real Grass */}
        <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Black & Yellow Header Bar */}
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-900 flex items-center space-x-2 text-amber-400 font-extrabold text-xs">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Platform Operator Authentication</span>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-900">Operator Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@kisandost.pk"
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-900">Security Access Key</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-black py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.98]"
              >
                <span>{loading ? 'Authenticating...' : 'AUTHENTICATE SUPER ADMIN'}</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </form>

            {/* Preset Demo Credentials Box (Black accent box with Yellow highlights) */}
            <div className="p-3.5 bg-slate-950 rounded-xl text-2xs space-y-1 text-slate-300 border border-slate-800">
              <div className="font-extrabold text-amber-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Demo Super Admin Login:</span>
              </div>
              <div>Email: <strong className="text-white font-mono select-all">admin@kisandost.pk</strong></div>
              <div>Password: <strong className="text-white font-mono select-all">admin123</strong></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
