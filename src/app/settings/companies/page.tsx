'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Plus, ArrowLeft, Phone, Search, Pencil, Power, X, Check, ShieldCheck } from 'lucide-react';
import { dataStore } from '@/lib/data-store';
import { Company } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

export default function CompaniesManagementPage() {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState<Company[]>(() => dataStore.getCompanies());
  const [products, setProducts] = useState(() => dataStore.getProducts());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCompanies(dataStore.getCompanies());
    setProducts(dataStore.getProducts());
  }, []);

  // Add Company Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    contact_person: '',
    phone: '',
    notes: '',
  });

  // Edit Company Modal State
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    notes: '',
  });

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.phone.includes(searchQuery)
  );
  const pagination = usePagination(filteredCompanies, 10);

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCompany.name.trim();
    if (!trimmedName || isSaving) return;
    setIsSaving(true);
    try {
      const created = dataStore.addCompany({
        name: trimmedName,
        contact_person: newCompany.contact_person.trim(),
        phone: newCompany.phone.trim(),
        notes: newCompany.notes.trim(),
      });
      setCompanies(dataStore.getCompanies().slice());
      setIsAddModalOpen(false);
      setNewCompany({ name: '', contact_person: '', phone: '', notes: '' });
      showToast(`Company '${created.name}' created successfully!`, 'success');
    } catch (err) {
      console.error('Failed to save company:', err);
      showToast('Failed to save company. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (company: Company) => {
    setEditingCompany(company);
    setEditForm({
      name: company.name,
      contact_person: company.contact_person,
      phone: company.phone,
      notes: company.notes || '',
    });
  };

  const handleUpdateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany || !editForm.name.trim()) return;
    try {
      dataStore.updateCompany(editingCompany.id, {
        name: editForm.name.trim(),
        contact_person: editForm.contact_person.trim(),
        phone: editForm.phone.trim(),
        notes: editForm.notes.trim(),
      });
      setCompanies(dataStore.getCompanies().slice());
      setEditingCompany(null);
      showToast(`Company '${editForm.name}' updated!`, 'success');
    } catch (err) {
      console.error('Failed to update company:', err);
      showToast('Failed to update company. Please try again.', 'error');
    }
  };

  const handleToggleStatus = (company: Company) => {
    const updated = dataStore.toggleCompanyStatus(company.id);
    setCompanies([...dataStore.getCompanies()]);
    if (updated) {
      const isDeactivated = updated.is_active === false;
      showToast(
        `Company '${company.name}' ${isDeactivated ? 'deactivated' : 'activated'}`,
        isDeactivated ? 'info' : 'success'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--kd-surface)] p-6 rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-1 font-semibold">
            <Link href="/settings" className="hover:text-foreground font-bold flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Settings
            </Link>
            <span>/</span>
            <span>Pesticide Brand Companies</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center space-x-2.5">
            <div className="p-2 bg-foreground rounded-xl text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <span>Pesticide & Agri Company Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
            Manage manufacturer brand catalogs (Bayer, Syngenta, FMC, local pesticide brands) and representative contacts.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary text-primary-foreground hover:opacity-90 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-[var(--kd-shadow)] transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4 text-foreground" />
          <span>Add New Company</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-[var(--kd-surface)] p-4 rounded-xl shadow-[var(--kd-shadow)] border border-border flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search company by brand name, representative, phone number, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Companies Grid */}
      <div className="overflow-hidden rounded-xl border border-border bg-[var(--kd-surface)] shadow-[var(--kd-shadow)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
        {pagination.pageItems.map((c) => {
          const companyProducts = products.filter(p => p.company_id === c.id);
          const isActive = c.is_active !== false;

          return (
            <div
              key={c.id}
              className={`bg-[var(--kd-surface)] p-6 rounded-xl shadow-[var(--kd-shadow)] border space-y-4 flex flex-col justify-between hover:shadow-md transition-all ${
                !isActive ? 'border-border bg-background/80 opacity-75' : 'border-border'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-bold text-foreground">{c.name}</h2>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          isActive
                            ? 'bg-[var(--kd-primary-soft)] text-primary'
                            : 'bg-slate-200 text-muted-foreground'
                        }`}
                      >
                        {isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{c.notes || 'No notes provided'}</p>
                  </div>
                  <span className="bg-[var(--kd-primary-soft)] text-primary font-semibold text-[10px] px-2.5 py-1 rounded-full border border-primary/20/80 shrink-0">
                    {companyProducts.length} Registered Products
                  </span>
                </div>

                <div className="pt-3 border-t border-border space-y-1.5 text-xs bg-background p-3 rounded-lg">
                  <div className="flex justify-between text-foreground">
                    <span className="font-semibold text-muted-foreground">Representative:</span>
                    <span className="font-bold text-foreground">{c.contact_person || '-'}</span>
                  </div>
                  <div className="flex justify-between text-foreground">
                    <span className="font-semibold text-muted-foreground">Phone Number:</span>
                    <span className="font-mono font-bold text-primary flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {c.phone || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => openEditModal(c)}
                  className="flex-1 bg-background hover:bg-[var(--kd-primary-soft)] text-foreground font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit Company</span>
                </button>

                <button
                  onClick={() => handleToggleStatus(c)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[var(--kd-accent-soft)] hover:bg-[var(--kd-accent-soft)] text-accent border border-accent/20'
                      : 'bg-[var(--kd-primary-soft)] hover:bg-[var(--kd-primary-soft)] text-primary border border-primary/20'
                  }`}
                  title={isActive ? 'Deactivate Company' : 'Reactivate Company'}
                >
                  <Power className="h-3.5 w-3.5" />
                  <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                </button>
              </div>
            </div>
          );
        })}
        {filteredCompanies.length === 0 && (
          <div className="col-span-full bg-[var(--kd-surface)] p-8 text-center rounded-xl border border-border text-muted-foreground text-xs">
            No companies found. Click &quot;Add New Company&quot; to register a brand.
          </div>
        )}
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

      {/* Add New Company Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--kd-surface)] rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-primary/20">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span>Add New Pesticide Company</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-[var(--kd-primary-soft)] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddCompany} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">Company / Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corteva Agriscience"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Contact Person / Representative</label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Aslam (Territory Manager)"
                  value={newCompany.contact_person}
                  onChange={(e) => setNewCompany({ ...newCompany, contact_person: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +92 300 1122334"
                  value={newCompany.phone}
                  onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Notes / Product Portfolio Summary</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Weedicides & insecticides specialist brand"
                  value={newCompany.notes}
                  onChange={(e) => setNewCompany({ ...newCompany, notes: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setNewCompany({ name: '', contact_person: '', phone: '', notes: '' }); }}
                  className="flex-1 bg-background hover:bg-[var(--kd-primary-soft)] text-foreground font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !newCompany.name.trim()}
                  className="flex-1 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-[var(--kd-shadow)] transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Company'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {editingCompany && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--kd-surface)] rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-primary/20">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                <Pencil className="h-5 w-5 text-primary" />
                <span>Edit Company Details</span>
              </h2>
              <button
                type="button"
                onClick={() => setEditingCompany(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-[var(--kd-primary-soft)] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCompany} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">Company / Brand Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Contact Person / Representative</label>
                <input
                  type="text"
                  value={editForm.contact_person}
                  onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Notes / Product Portfolio Summary</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="flex-1 bg-background hover:bg-[var(--kd-primary-soft)] text-foreground font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground hover:opacity-90 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-[var(--kd-shadow)] transition-colors cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Update Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

