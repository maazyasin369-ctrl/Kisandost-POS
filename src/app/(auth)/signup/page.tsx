'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { Store, Lock, Mail, User, Phone, MapPin, Building2, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { signup } from '@/actions/auth'

export default function SignupPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await signup(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-md mb-4">
            <Store className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register Your Agri Shop</h1>
          <p className="text-slate-600 text-sm mt-1">Start your 30-day free trial — no credit card required</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4 border-b border-blue-700">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-100" />
              <span className="text-sm font-extrabold text-white">New Shop Account Registration</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Features Checklist */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-2">
              <p className="text-xs font-extrabold text-blue-950 mb-2">What you&apos;ll get:</p>
              {[
                'Fast POS counter with 80mm thermal receipt printing',
                'FEFO batch inventory with expiry alerts',
                'Farmer udhaar (credit) ledger management',
                'Daily & monthly sales reports',
              ].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Your Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="full_name" type="text" required
                    placeholder="Chaudhry Tariq Mehmood"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Shop Business Name *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="business_name" type="text" required
                    placeholder="Kisan Dost Agri Services"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="email" type="email" required
                    placeholder="you@shop.pk"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="phone" type="tel" required
                    placeholder="+92 300 1234567"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">City *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="city" type="text" required
                    placeholder="Multan, Faisalabad..."
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="password" type="password" required minLength={8}
                    placeholder="Min. 8 characters"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold text-sm py-3 rounded-xl shadow-sm transition-all active:scale-[0.98] mt-2"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating your shop...
                </span>
              ) : (
                <>
                  <span>CREATE MY SHOP & START FREE TRIAL</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center text-xs text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 font-bold hover:underline">
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
