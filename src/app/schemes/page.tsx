'use client';

import React, { useState } from 'react';
import { dataStore } from '@/lib/data-store';
import { ShieldCheck, Plus, Award, Calendar, Target, Building2, CheckCircle2 } from 'lucide-react';

export default function SchemesPage() {
  const schemes = dataStore.getSchemes();
  const companies = dataStore.getCompanies();

  const [showModal, setShowModal] = useState(false);
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const [description, setDescription] = useState('');
  const [targetQuantity, setTargetQuantity] = useState<number>(300);
  const [bonusDescription, setBonusDescription] = useState('');
  const [validFrom, setValidFrom] = useState('2026-06-01');
  const [validTo, setValidTo] = useState('2026-10-31');

  const handleCreateScheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !bonusDescription) return;

    dataStore.createScheme({
      company_id: companyId,
      description,
      target_quantity: targetQuantity,
      bonus_description: bonusDescription,
      valid_from: validFrom,
      valid_to: validTo
    });

    setShowModal(false);
    setDescription('');
    setBonusDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2.5 tracking-tight">
            <div className="p-2 bg-slate-950 text-yellow-400 rounded-xl">
              <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <span>Company Schemes &amp; Supplier Bonus Targets</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track pesticide brand volume targets (Bayer, Syngenta, FMC) and supplier rebate bonus programs.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Add New Scheme / Target</span>
        </button>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {schemes.map(sch => (
          <div key={sch.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-block">
                  {sch.company_name}
                </span>
                <h3 className="font-bold text-slate-900 text-base">{sch.description}</h3>
              </div>
              <Award className="h-8 w-8 text-amber-500 flex-shrink-0" />
            </div>

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-1 font-semibold">
                  <Target className="h-3.5 w-3.5 text-blue-600" /> Target Sales Quantity:
                </span>
                <span className="font-extrabold text-slate-900 text-sm">{sch.target_quantity} Packs</span>
              </div>

              <div className="flex justify-between items-center text-slate-700 pt-1 border-t border-slate-200">
                <span className="flex items-center gap-1 font-semibold text-amber-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" /> Reward / Bonus Offer:
                </span>
                <span className="font-bold text-slate-900 text-right">{sch.bonus_description}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Valid: {sch.valid_from} to {sch.valid_to}
              </span>
              <span className="text-blue-600 font-bold">Active Scheme</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Creating Scheme */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h2 className="text-base font-bold flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-amber-400" />
                <span>Track New Company Bonus Scheme</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleCreateScheme} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company / Brand</label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Scheme Title / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Cotton Season Confidor 500 Pack Target"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full p-2 border border-slate-300 rounded font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Quantity (Packs)</label>
                <input
                  type="number"
                  value={targetQuantity}
                  onChange={(e) => setTargetQuantity(parseInt(e.target.value) || 0)}
                  required
                  className="w-full p-2 border border-slate-300 rounded font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bonus Reward Description</label>
                <input
                  type="text"
                  placeholder="e.g. Rs. 50,000 cash bonus + Umrah ticket"
                  value={bonusDescription}
                  onChange={(e) => setBonusDescription(e.target.value)}
                  required
                  className="w-full p-2 border border-slate-300 rounded font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valid From</label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded shadow-sm"
                >
                  Save Scheme Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
