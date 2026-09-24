'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { Store, Lock, Mail, ArrowRight, Leaf, AlertCircle, KeyRound, Sparkles } from 'lucide-react'
import { login, demoLogin } from '@/actions/auth'

export default function LoginPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('owner@kisandost.pk')
  const [password, setPassword] = useState('KisanDost@2026!')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) setError(result.error)
    })
  }

  const handleDemoLogin = () => {
    setError(null)
    startTransition(async () => {
      const result = await demoLogin()
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">

      <div className="relative w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-400 text-slate-950 rounded-2xl shadow-xl shadow-amber-400/10 mb-4">
            <Store className="w-8 h-8 text-slate-950" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">KisanDost POS</h1>
          <p className="text-slate-400 text-sm mt-1">Pesticide &amp; Agri Shop Management</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
          {/* Card Header */}
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-extrabold text-amber-400">Sign in to your shop account</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-950/80 border border-red-800 text-red-200 rounded-xl p-3.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Quick Demo Access Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Demo Shop Account
                </span>
                <span className="text-2xs bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                  Pre-configured
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-2xs text-slate-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 font-mono">
                <div>
                  <span className="block text-slate-400 font-sans text-3xs uppercase font-bold">Email</span>
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
                className="w-full flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black py-2.5 px-3 rounded-xl text-2xs transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>ONE-CLICK DEMO LOGIN</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 placeholder:text-slate-600 transition-colors"
                    placeholder="you@yourshop.pk"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-bold text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 placeholder:text-slate-600 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-60 text-slate-950 font-black text-sm py-3 rounded-xl shadow-lg shadow-amber-400/10 transition-all active:scale-[0.98] cursor-pointer"
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

            <div className="text-center text-xs text-slate-400 border-t border-slate-800 pt-3">
              Don&apos;t have a shop account yet?{' '}
              <Link href="/signup" className="text-amber-400 font-bold hover:text-amber-300 hover:underline">
                Register New Shop
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          Super Admin operator? <Link href="/admin/login" className="text-amber-400 underline font-bold hover:text-amber-300">Sign in here</Link>
        </p>
      </div>
    </div>
  )
}
