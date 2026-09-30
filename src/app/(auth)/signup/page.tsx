'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { Store, Lock, Mail, User, Phone, MapPin, Building2, ArrowRight, AlertCircle, CheckCircle2, Clock, KeyRound, ShieldAlert } from 'lucide-react'
import { dataStore } from '@/lib/data-store'
import { PendingRegistration } from '@/lib/types'

export default function SignupPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [submittedReg, setSubmittedReg] = useState<PendingRegistration | null>(null)

  const [formState, setFormState] = useState({
    full_name: '',
    business_name: '',
    phone: '',
    email: '',
    city: '',
    username: '',
    password: '',
  })

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const usernameDebounceRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleUsernameChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9._]/g, '')
    setFormState(prev => ({ ...prev, username: cleaned }))
    setUsernameStatus('idle')

    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current)

    if (cleaned.length >= 4) {
      setUsernameStatus('checking')
      usernameDebounceRef.current = setTimeout(() => {
        const avail = dataStore.checkUsernameAvailable(cleaned)
        setUsernameStatus(avail ? 'available' : 'taken')
      }, 400)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (usernameStatus === 'taken') {
      setError('Username is already taken. Please choose another username.')
      return
    }

    startTransition(() => {
      const res = dataStore.submitSelfSignup(formState)
      if (!res.success || !res.pendingRegistration) {
        setError(res.error || 'Failed to submit registration.')
        return
      }

      setSubmittedReg(res.pendingRegistration)
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-[url('/images/real_grass_bg.png')] bg-cover bg-center bg-fixed relative flex items-center justify-center p-4 text-slate-900 font-jakarta overflow-hidden">
      {/* Real Grass overlay gradient for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-emerald-950/50 to-slate-950/80 backdrop-blur-[1px] pointer-events-none" />

      <div className="relative w-full max-w-lg z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-400 text-slate-950 rounded-2xl shadow-2xl shadow-amber-400/30 ring-4 ring-slate-950/50 mb-4">
            <Store className="w-8 h-8 text-slate-950" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">Register Your Agri Shop</h1>
          <p className="text-amber-200 text-sm mt-1 font-bold drop-shadow">Pesticide &amp; Seed Store Digitalization</p>
        </div>

        {submittedReg ? (
          /* Confirmation Screen: Pending Super Admin Approval */
          <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-extrabold text-amber-400">Registration Submitted</span>
              </div>
              <span className="bg-amber-400 text-slate-950 font-black text-2xs px-2.5 py-0.5 rounded-full uppercase">
                PENDING APPROVAL
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-5 text-slate-900">
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-black text-amber-900 text-sm">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Pending Super Admin Verification</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  Thank you <strong className="font-extrabold">{submittedReg.full_name}</strong>! Your registration request for <strong className="font-extrabold">{submittedReg.business_name}</strong> has been submitted.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs font-mono">
                <div className="text-2xs uppercase text-slate-400 font-bold font-sans tracking-wider border-b border-slate-200 pb-1.5">
                  Registration Details Summary
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-800">
                  <div>
                    <span className="block text-slate-500 font-sans text-3xs">Shop Name:</span>
                    <strong className="font-semibold">{submittedReg.business_name}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-sans text-3xs">Owner Name:</span>
                    <strong className="font-semibold">{submittedReg.full_name}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-sans text-3xs">Username Handle:</span>
                    <strong className="font-semibold text-amber-700">@{submittedReg.username}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-sans text-3xs">City:</span>
                    <strong className="font-semibold">{submittedReg.city}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-sans text-3xs">Phone Number:</span>
                    <strong className="font-semibold">{submittedReg.phone}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-sans text-3xs">Email:</span>
                    <strong className="font-semibold">{submittedReg.email || '—'}</strong>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Super Admin will review your shop credentials and license information shortly. Once approved, you can sign in to your dashboard with your handle <strong className="text-slate-900">@{submittedReg.username}</strong>.
              </p>

              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm py-3 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>RETURN TO LOGIN PAGE</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </Link>
            </div>
          </div>
        ) : (
          /* Signup Form */
          <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            {/* Black & Yellow Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-extrabold text-amber-400">New Shop Account Registration</span>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 text-xs shadow-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              {/* Features Checklist */}
              <div className="bg-slate-950 rounded-xl p-4 space-y-2 text-white border border-slate-800">
                <p className="text-xs font-extrabold text-amber-400 mb-2">What you&apos;ll get:</p>
                {[
                  'Fast POS counter with 80mm thermal receipt printing',
                  'FEFO batch inventory with expiry alerts',
                  'Farmer udhaar (credit) ledger management',
                  'Daily & monthly sales reports',
                ].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">Your Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="full_name"
                      type="text"
                      required
                      value={formState.full_name}
                      onChange={(e) => setFormState({ ...formState, full_name: e.target.value })}
                      placeholder="Chaudhry Tariq Mehmood"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 placeholder:text-slate-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">Shop Business Name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="business_name"
                      type="text"
                      required
                      value={formState.business_name}
                      onChange={(e) => setFormState({ ...formState, business_name: e.target.value })}
                      placeholder="Kisan Dost Agri Services"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 placeholder:text-slate-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-900">Choose Owner Username Handle *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">@</span>
                    <input
                      name="username"
                      type="text"
                      required
                      value={formState.username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="tariq_agri"
                      className="w-full pl-8 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 placeholder:text-slate-400 transition-colors"
                    />
                  </div>
                  {usernameStatus === 'checking' && (
                    <p className="text-[10px] text-blue-600 font-medium">Checking username availability...</p>
                  )}
                  {usernameStatus === 'available' && (
                    <p className="text-[10px] text-emerald-600 font-semibold">✓ Username @{formState.username} is available!</p>
                  )}
                  {usernameStatus === 'taken' && (
                    <p className="text-[10px] text-red-600 font-semibold">✕ Username @{formState.username} is already taken across platform.</p>
                  )}
                  <p className="text-[10px] text-slate-500">You will use this handle or email to log in.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">Email Address (Optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="email"
                      type="email"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      placeholder="you@shop.pk"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 placeholder:text-slate-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="phone"
                      type="tel"
                      required
                      value={formState.phone}
                      onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                      placeholder="+92 300 1234567"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 placeholder:text-slate-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">City *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="city"
                      type="text"
                      required
                      value={formState.city}
                      onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                      placeholder="Multan, Faisalabad..."
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 placeholder:text-slate-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="password"
                      type="password"
                      required
                      minLength={8}
                      value={formState.password}
                      onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                      placeholder="Min. 8 characters"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 placeholder:text-slate-400 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending || usernameStatus === 'taken'}
                className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 disabled:opacity-60 text-slate-950 font-black text-sm py-3 rounded-xl shadow-md transition-all active:scale-[0.98] mt-2 cursor-pointer"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    Submitting Registration...
                  </span>
                ) : (
                  <>
                    <span>SUBMIT REGISTRATION FOR APPROVAL</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </>
                )}
              </button>

              <div className="text-center text-xs text-slate-600 border-t border-slate-100 pt-3">
                Already have an account?{' '}
                <Link href="/login" className="text-amber-600 font-extrabold hover:text-amber-700 hover:underline">
                  Sign In
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
