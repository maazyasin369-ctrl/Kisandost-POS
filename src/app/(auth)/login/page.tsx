'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { AlertCircle, Clock, Eye, EyeOff } from 'lucide-react'
import { demoLogin, loginWithCredentials } from '@/actions/auth'

export default function LoginPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isPendingApproval, setIsPendingApproval] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [identifier, setIdentifier] = useState('owner@kisandost.pk')
  const [password, setPassword] = useState('KisanDost@2026!')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsPendingApproval(false)

    startTransition(async () => {
      const res = await loginWithCredentials(identifier, password)
      if (res?.error) {
        if (res.error.toLowerCase().includes('pending')) {
          setIsPendingApproval(true)
        }
        setError(res.error)
      }
    })
  }

  const handleDemoLogin = () => {
    setError(null)
    setIsPendingApproval(false)
    startTransition(async () => {
      const res = await demoLogin()
      if (res?.error) {
        setError(res.error)
      }
    })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[url('/images/real_grass_bg.png')] bg-cover bg-center bg-fixed p-4 font-jakarta">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-emerald-950/30 to-black/50" />

      <div className="relative z-10 w-full max-w-[420px] animate-[fadeUp_0.55s_ease-out]">
        <div className="mb-7 text-center">
          <h1 className="text-[2rem] font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
            KisanDost
          </h1>
          <p className="mt-1.5 text-[15px] font-medium text-white/80">
            Sign in to your shop
          </p>
        </div>

        {/* iOS-style liquid glass card */}
        <div
          className="relative overflow-hidden rounded-[28px] border border-white/35 p-7 shadow-[0_8px_40px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.55)] sm:p-8"
          style={{
            background:
              'linear-gradient(165deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.18) 45%, rgba(255,255,255,0.12) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          }}
        >
          {/* top sheen */}
          <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-40 w-[85%] -translate-x-1/2 rounded-full bg-white/25 blur-2xl" />

          <div className="relative">
            {error && !isPendingApproval && (
              <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200/50 bg-red-500/15 px-3.5 py-3 text-xs text-red-950 backdrop-blur-md">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {isPendingApproval && (
              <div className="mb-5 rounded-2xl border border-amber-200/40 bg-amber-400/15 px-3.5 py-3 text-xs text-amber-950 backdrop-blur-md">
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <Clock className="size-4 shrink-0" />
                  Registration pending approval
                </div>
                <p className="leading-relaxed text-amber-950/80">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="identifier" className="text-[13px] font-medium text-white/90 drop-shadow-sm">
                  Email
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="email"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-2xl border border-white/40 bg-white/35 px-4 py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-600/55 focus:border-white/70 focus:bg-white/50 focus:ring-2 focus:ring-white/30"
                  placeholder="you@shop.pk"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-[13px] font-medium text-white/90 drop-shadow-sm">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/40 bg-white/35 py-3 pl-4 pr-12 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-600/55 focus:border-white/70 focus:bg-white/50 focus:ring-2 focus:ring-white/30"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-700/70 transition hover:bg-white/30 hover:text-slate-900"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="mt-2 w-full rounded-2xl bg-white/90 px-4 py-3 text-[15px] font-semibold text-emerald-950 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_8px_24px_rgba(0,0,0,0.12)] transition hover:bg-white active:scale-[0.98] disabled:opacity-60"
              >
                {isPending ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-3 border-t border-white/25 pt-5 text-center text-sm text-white/80">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isPending}
                className="font-medium text-white underline-offset-4 transition hover:underline disabled:opacity-60"
              >
                Try demo account
              </button>
              <p>
                New shop?{' '}
                <Link href="/signup" className="font-semibold text-white underline-offset-4 hover:underline">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="mt-7 text-center text-sm text-white/65">
          Super Admin?{' '}
          <Link href="/admin/login" className="font-medium text-white underline-offset-4 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}
