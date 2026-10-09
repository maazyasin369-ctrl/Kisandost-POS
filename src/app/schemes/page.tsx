'use client';

import React, { useState } from 'react';
import { dataStore } from '@/lib/data-store';
import { ShieldCheck, Plus, Award, Calendar, Target, Building2, CheckCircle2 } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

export default function SchemesPage() {
  const schemes = dataStore.getSchemes();
  const companies = dataStore.getCompanies();
  const pagination = usePagination(schemes, 10);

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
      <div className="bg-[var(--kd-surface)] p-6 rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center space-x-2.5 tracking-tight">
            <div className="rounded-xl bg-[var(--kd-primary-soft)] p-2 text-primary">
              <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <span>Company Schemes &amp; Supplier Bonus Targets</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track pesticide brand volume targets (Bayer, Syngenta, FMC) and supplier rebate bonus programs.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-primary-foreground hover:opacity-90 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-[var(--kd-shadow)] transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Add New Scheme / Target</span>
        </button>
      </div>

      {/* Schemes Grid */}
      <div className="overflow-hidden rounded-xl border border-border bg-[var(--kd-surface)] shadow-[var(--kd-shadow)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
        {pagination.pageItems.map(sch => (
          <div key={sch.id} className="bg-[var(--kd-surface)] rounded-xl shadow-[var(--kd-shadow)] border border-border p-5 space-y-4 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-block">
                  {sch.company_name}
                </span>
                <h3 className="font-bold text-foreground text-base">{sch.description}</h3>
              </div>
              <Award className="h-8 w-8 text-accent flex-shrink-0" />
            </div>

            <div className="bg-background rounded-lg p-3 border border-border space-y-2 text-xs">
              <div className="flex justify-between items-center text-foreground">
                <span className="flex items-center gap-1 font-semibold">
                  <Target className="h-3.5 w-3.5 text-blue-600" /> Target Sales Quantity:
                </span>
                <span className="font-semibold text-foreground text-sm">{sch.target_quantity} Packs</span>
              </div>

              <div className="flex justify-between items-center text-foreground pt-1 border-t border-border">
                <span className="flex items-center gap-1 font-semibold text-accent">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" /> Reward / Bonus Offer:
                </span>
                <span className="font-bold text-foreground text-right">{sch.bonus_description}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Valid: {sch.valid_from} to {sch.valid_to}
              </span>
              <span className="text-blue-600 font-bold">Active Scheme</span>
            </div>
          </div>
        ))}
      </div>
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        from={pagination.from}
        to={pagination.to}
        pageSize={pagination.pageSize}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />
      </div>

      {/* Modal for Creating Scheme */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--kd-surface)] rounded-xl shadow-2xl max-w-md w-full border border-border overflow-hidden">
            <div className="bg-[var(--kd-surface)] text-foreground border-b border-border p-4 flex justify-between items-center">
              <h2 className="text-base font-bold flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <span>Track New Company Bonus Scheme</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleCreateScheme} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">Company / Brand</label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full p-2 border border-border rounded font-semibold text-foreground"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Scheme Title / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Cotton Season Confidor 500 Pack Target"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full p-2 border border-border rounded font-bold text-foreground"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Target Quantity (Packs)</label>
                <input
                  type="number"
                  value={targetQuantity}
                  onChange={(e) => setTargetQuantity(parseInt(e.target.value) || 0)}
                  required
                  className="w-full p-2 border border-border rounded font-bold text-foreground"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Bonus Reward Description</label>
                <input
                  type="text"
                  placeholder="e.g. Rs. 50,000 cash bonus + Umrah ticket"
                  value={bonusDescription}
                  onChange={(e) => setBonusDescription(e.target.value)}
                  required
                  className="w-full p-2 border border-border rounded font-bold text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-foreground mb-1">Valid From</label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full p-2 border border-border rounded font-bold text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-bold text-foreground mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                    className="w-full p-2 border border-border rounded font-bold text-foreground"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-background hover:bg-[var(--kd-primary-soft)] text-foreground rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow-[var(--kd-shadow)]"
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
