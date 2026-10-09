'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function SuperAdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@kisandost.pk')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      if (email.trim() === 'admin@kisandost.pk' && password === 'admin123') {
        localStorage.setItem('super_admin_authenticated', 'true')
        router.push('/admin/dashboard')
      } else {
        setError('Invalid Super Admin credentials. Try email: admin@kisandost.pk | pass: admin123')
        setLoading(false)
      }
    }, 300)
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
            Super Admin portal
          </p>
        </div>

        <div
          className="relative overflow-hidden rounded-[28px] border border-white/35 p-7 shadow-[0_8px_40px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.55)] sm:p-8"
          style={{
            background:
              'linear-gradient(165deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.18) 45%, rgba(255,255,255,0.12) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          }}
        >
          <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-40 w-[85%] -translate-x-1/2 rounded-full bg-white/25 blur-2xl" />

          <div className="relative">
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200/50 bg-red-500/15 px-3.5 py-3 text-xs text-red-950 backdrop-blur-md">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="admin-email" className="text-[13px] font-medium text-white/90 drop-shadow-sm">
                  Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kisandost.pk"
                  required
                  className="w-full rounded-2xl border border-white/40 bg-white/35 px-4 py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-600/55 focus:border-white/70 focus:bg-white/50 focus:ring-2 focus:ring-white/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="admin-password" className="text-[13px] font-medium text-white/90 drop-shadow-sm">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-2xl border border-white/40 bg-white/35 py-3 pl-4 pr-12 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-600/55 focus:border-white/70 focus:bg-white/50 focus:ring-2 focus:ring-white/30"
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
                disabled={loading}
                className="mt-2 w-full rounded-2xl bg-white/90 px-4 py-3 text-[15px] font-semibold text-emerald-950 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_8px_24px_rgba(0,0,0,0.12)] transition hover:bg-white active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 border-t border-white/25 pt-5 text-center text-sm text-white/80">
              <p>
                Shop owner?{' '}
                <Link href="/login" className="font-semibold text-white underline-offset-4 hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
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
