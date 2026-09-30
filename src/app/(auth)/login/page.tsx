'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Store, Lock, Mail, ArrowRight, Leaf, AlertCircle, KeyRound, Sparkles, Clock, UserCheck } from 'lucide-react'
import { dataStore } from '@/lib/data-store'

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isPendingApproval, setIsPendingApproval] = useState(false)
  const [identifier, setIdentifier] = useState('owner@kisandost.pk')
  const [password, setPassword] = useState('KisanDost@2026!')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsPendingApproval(false)

    startTransition(() => {
      const res = dataStore.authenticateUser(identifier, password)

      if (!res.success) {
        if (res.isPendingApproval) {
          setIsPendingApproval(true)
        }
        setError(res.error || 'Authentication failed.')
        return
      }

      if (typeof window !== 'undefined' && res.profile) {
        localStorage.setItem('pesticide_authenticated_user', JSON.stringify(res.profile))
        localStorage.setItem('pesticide_current_tenant_id', res.profile.tenant_id)
        document.cookie = `pesticide_authenticated=true; path=/`
      }

      router.push('/dashboard')
    })
  }

  const handleDemoLogin = () => {
    setError(null)
    setIsPendingApproval(false)
    startTransition(() => {
      const res = dataStore.authenticateUser('owner@kisandost.pk', 'KisanDost@2026!')
      if (!res.success) {
        setError(res.error || 'Demo login failed')
        return
      }
      if (typeof window !== 'undefined' && res.profile) {
        localStorage.setItem('pesticide_authenticated_user', JSON.stringify(res.profile))
        localStorage.setItem('pesticide_current_tenant_id', res.profile.tenant_id)
        document.cookie = `pesticide_authenticated=true; path=/`
      }
      router.push('/dashboard')
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-[url('/images/real_grass_bg.png')] bg-cover bg-center bg-fixed relative flex items-center justify-center p-4 text-slate-900 font-jakarta overflow-hidden">
      {/* Real Grass overlay gradient for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-emerald-950/50 to-slate-950/80 backdrop-blur-[1px] pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-400 text-slate-950 rounded-2xl shadow-2xl shadow-amber-400/30 ring-4 ring-slate-950/50 mb-4">
            <Store className="w-8 h-8 text-slate-950" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">KisanDost POS</h1>
          <p className="text-amber-200 text-sm mt-1 font-bold drop-shadow">Pesticide &amp; Agri Shop Management</p>
        </div>

        {/* Light Card with Black & Yellow Scheme over Real Grass */}
        <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Card Header (Black & Yellow) */}
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-extrabold text-amber-400">Sign in to your shop account</span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            {error && !isPendingApproval && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 text-xs shadow-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {isPendingApproval && (
              <div className="bg-amber-50 border border-amber-300 text-amber-950 rounded-xl p-4 text-xs space-y-2 shadow-xs">
                <div className="flex items-center gap-2 font-black text-amber-900">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Registration Pending Approval</span>
                </div>
                <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                  {error}
                </p>
                <div className="text-[10px] text-amber-800 font-mono pt-1 border-t border-amber-200">
                  Contact Super Admin for instant approval &amp; verification.
                </div>
              </div>
            )}

            {/* Quick Demo Access Box (Black container with Yellow badge & button) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2.5 text-white">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Demo Shop Account
                </span>
                <span className="text-2xs bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black">
                  Pre-configured
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-2xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono">
                <div>
                  <span className="block text-slate-400 font-sans text-3xs uppercase font-bold">Email / Handle</span>
                  <strong className="text-white select-all">owner@kisandost.pk</strong>
                </div>
                <div>
                  <span className="block text-slate-400 font-sans text-3xs uppercase font-bold">Password</span>
                  <strong className="text-white select-all">KisanDost@2026!</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-2.5 px-3 rounded-xl text-2xs transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>ONE-CLICK DEMO LOGIN</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label htmlFor="identifier" className="block text-xs font-extrabold text-slate-900">
                  Username or Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 placeholder:text-slate-400 transition-colors"
                    placeholder="Username (@handle) or email@shop.pk"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-extrabold text-slate-900">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 placeholder:text-slate-400 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 disabled:opacity-60 text-slate-950 font-black text-sm py-3 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    <span>SIGN IN TO DASHBOARD</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-slate-600 border-t border-slate-100 pt-3">
              Don&apos;t have a shop account yet?{' '}
              <Link href="/signup" className="text-amber-600 font-extrabold hover:text-amber-700 hover:underline">
                Register New Shop
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-amber-200 font-bold drop-shadow text-xs mt-6">
          Super Admin operator? <Link href="/admin/login" className="text-amber-300 underline font-black hover:text-amber-200">Sign in here</Link>
        </p>
      </div>
    </div>
  )
}
