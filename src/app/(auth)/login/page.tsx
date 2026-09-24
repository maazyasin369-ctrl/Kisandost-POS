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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">

      <div className="relative w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-md mb-4">
            <Store className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">KisanDost POS</h1>
          <p className="text-slate-600 text-sm mt-1">Pesticide &amp; Agri Shop Management</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
          {/* Card Header */}
          <div className="bg-blue-600 px-6 py-4 border-b border-blue-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-blue-100" />
                <span className="text-sm font-extrabold text-white">Sign in to your shop account</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Quick Demo Access Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Demo Shop Account
                </span>
                <span className="text-2xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                  Pre-configured
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-2xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 font-mono">
                <div>
                  <span className="block text-slate-400 font-sans text-3xs uppercase font-bold">Email</span>
                  <strong className="text-slate-900 select-all">owner@kisandost.pk</strong>
                </div>
                <div>
                  <span className="block text-slate-400 font-sans text-3xs uppercase font-bold">Password</span>
                  <strong className="text-slate-900 select-all">KisanDost@2026!</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold py-2 px-3 rounded-lg text-2xs transition-all shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>ONE-CLICK DEMO LOGIN</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white placeholder:text-slate-400 transition-colors"
                    placeholder="you@yourshop.pk"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-bold text-slate-700">
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
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-extrabold text-sm py-3 rounded-xl shadow-sm transition-all active:scale-[0.98]"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    <span>SIGN IN TO DASHBOARD</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-slate-600 border-t border-slate-100 pt-3">
              Don&apos;t have a shop account yet?{' '}
              <Link href="/signup" className="text-blue-600 font-bold hover:text-blue-800 hover:underline">
                Register New Shop
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Super Admin operator? <Link href="/admin/login" className="text-blue-600 underline font-bold">Sign in here</Link>
        </p>
      </div>
    </div>
  )
}
