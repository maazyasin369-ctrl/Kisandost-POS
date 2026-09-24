'use client';

import React, { useState, useEffect } from 'react';
import { dataStore } from '@/lib/data-store';
import { Supplier } from '@/lib/types';
import Link from 'next/link';
import { Building2, Plus, Phone, MapPin, Search, Pencil, Trash2, Banknote, X, Check, AlertTriangle, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function SuppliersPage() {
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => dataStore.getSuppliers());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSuppliers(dataStore.getSuppliers());
  }, []);

  // Add Supplier Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    phone: '',
    address: '',
    current_balance: '',
  });

  // Edit Supplier Modal state
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    address: '',
    current_balance: '',
  });

  // Delete Supplier state
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Payment to Supplier state
  const [activePaymentSupplier, setActivePaymentSupplier] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentNote, setPaymentNote] = useState('');

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name.trim() || !newSupplier.phone.trim()) return;

    const created = dataStore.addSupplier({
      name: newSupplier.name.trim(),
      contact_person: newSupplier.contact_person.trim() || 'Sales Representative',
      phone: newSupplier.phone.trim(),
      address: newSupplier.address.trim() || 'Main Chemicals Market',
      current_balance: newSupplier.current_balance ? parseFloat(newSupplier.current_balance) : 0,
    });

    setSuppliers([...dataStore.getSuppliers()]);
    setIsAddModalOpen(false);
    setNewSupplier({
      name: '',
      contact_person: '',
      phone: '',
      address: '',
      current_balance: '',
    });
    showToast(`Supplier '${created.name}' added successfully!`, 'success');
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setEditForm({
      name: supplier.name,
      contact_person: supplier.contact_person,
      phone: supplier.phone,
      address: supplier.address,
      current_balance: (supplier.current_balance || 0).toString(),
    });
  };

  const handleUpdateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !editForm.name.trim() || !editForm.phone.trim()) return;

    dataStore.updateSupplier(editingSupplier.id, {
      name: editForm.name.trim(),
      contact_person: editForm.contact_person.trim(),
      phone: editForm.phone.trim(),
      address: editForm.address.trim(),
      current_balance: editForm.current_balance ? parseFloat(editForm.current_balance) : 0,
    });

    setSuppliers([...dataStore.getSuppliers()]);
    setEditingSupplier(null);
    showToast(`Supplier '${editForm.name}' updated!`, 'success');
  };

  const handleConfirmDelete = () => {
    if (!supplierToDelete) return;
    const name = supplierToDelete.name;
    dataStore.deleteSupplier(supplierToDelete.id);
    setSuppliers([...dataStore.getSuppliers()]);
    setSupplierToDelete(null);
    showToast(`Supplier '${name}' deleted!`, 'info');
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentSupplier || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    dataStore.recordSupplierPayment({
      supplier_id: activePaymentSupplier.id,
      amount,
      payment_method: paymentMethod,
      note: paymentNote.trim() || undefined,
    });

    setSuppliers([...dataStore.getSuppliers()]);
    showToast(
      `Rs. ${amount.toLocaleString()} paid to ${activePaymentSupplier.name} via ${paymentMethod}`,
      'success'
    );
    setActivePaymentSupplier(null);
    setPaymentAmount('');
    setPaymentMethod('Cash');
    setPaymentNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2.5 tracking-tight">
            <div className="p-2 bg-slate-950 text-yellow-400 rounded-xl">
              <Building2 className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <span>Pesticide Suppliers &amp; Distributor Payables</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Track company distributors (Bayer, Syngenta, FMC), purchase order payables, and stock receipts.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search supplier by company name, contact person, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
          />
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSuppliers.map((sup) => (
          <div key={sup.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <Link href={`/suppliers/${sup.id}`} className="font-semibold text-base text-slate-900 hover:text-emerald-700 transition-colors">
                    {sup.name}
                  </Link>
                  <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5 font-normal">
                    <span>Contact: <strong className="font-semibold text-slate-700">{sup.contact_person}</strong></span>
                  </p>
                </div>
                <Link
                  href={`/suppliers/${sup.id}`}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-1 rounded border border-emerald-200 flex items-center gap-1 transition-colors"
                >
                  <FileText className="h-3 w-3" />
                  <span>View Ledger</span>
                </Link>
              </div>

              <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-100 font-normal">
                <div className="flex items-center space-x-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{sup.phone}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{sup.address}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between items-center">
                <span className="text-xs text-slate-600 font-medium">Shop Payable Balance:</span>
                <span className="text-base font-semibold text-emerald-800 font-mono">
                  Rs. {(sup.current_balance || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100">
              <Link
                href={`/suppliers/${sup.id}`}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2 px-1.5 rounded-lg text-[11px] flex items-center justify-center space-x-1 transition-colors cursor-pointer text-center"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Ledger</span>
              </Link>
              <button
                onClick={() => setActivePaymentSupplier(sup)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2 px-1.5 rounded-lg text-[11px] flex items-center justify-center space-x-1 shadow-sm transition-colors cursor-pointer"
              >
                <Banknote className="h-3.5 w-3.5" />
                <span>Pay</span>
              </button>
              <button
                onClick={() => openEditModal(sup)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-1.5 rounded-lg text-[11px] flex items-center justify-center space-x-1 transition-colors cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setSupplierToDelete(sup)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold py-2 px-1.5 rounded-lg text-[11px] flex items-center justify-center space-x-1 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
        {filteredSuppliers.length === 0 && (
          <div className="col-span-full bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-500 text-xs font-normal">
            No suppliers found. Click &quot;Add New Supplier&quot; to register a distributor.
          </div>
        )}
      </div>

      {/* Add New Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-emerald-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-emerald-700" />
                <span>Add New Supplier / Distributor</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Company / Supplier Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Syngenta Pakistan"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Usman Ali (TSM)"
                    value={newSupplier.contact_person}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +92 300 8877665"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Opening Payable Balance (Rs.)</label>
                  <input
                    type="number"
                    step="1000"
                    placeholder="e.g. 150000"
                    value={newSupplier.current_balance}
                    onChange={(e) => setNewSupplier({ ...newSupplier, current_balance: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Office / Depot Address</label>
                <input
                  type="text"
                  placeholder="e.g. Plot 12, Chemicals Market, Multan"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Save Supplier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-emerald-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                <Pencil className="h-5 w-5 text-emerald-700" />
                <span>Edit Supplier Details</span>
              </h2>
              <button
                type="button"
                onClick={() => setEditingSupplier(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSupplier} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Company / Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={editForm.contact_person}
                    onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Payable Balance (Rs.)</label>
                  <input
                    type="number"
                    step="1000"
                    value={editForm.current_balance}
                    onChange={(e) => setEditForm({ ...editForm, current_balance: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Office / Depot Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Update Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Supplier Confirmation Modal */}
      {supplierToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-200">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Delete Supplier</h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Are you sure you want to delete <strong className="text-slate-900 font-semibold">{supplierToDelete.name}</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSupplierToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-sm transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {activePaymentSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-emerald-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-700" />
                <span>Pay Distributor — {activePaymentSupplier.name}</span>
              </h2>
              <button
                type="button"
                onClick={() => setActivePaymentSupplier(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-slate-900 flex items-center justify-between shadow-2xs">
              <span className="text-xs font-medium text-slate-700">
                Current Payable Balance:
              </span>
              <span className="text-lg font-semibold font-mono text-emerald-800">
                Rs. {(activePaymentSupplier.current_balance || 0).toLocaleString()}
              </span>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-800 mb-1">
                  Enter Payment Amount Paid (Rs.) *
                </label>
                <input
                  type="number"
                  required
                  autoFocus
                  placeholder="e.g. 50000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl font-semibold text-slate-900 text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-800 mb-2">Payment Method *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '💵 Cash', value: 'Cash' },
                    { label: '🏦 Bank Transfer', value: 'Bank Transfer' },
                    { label: '🧾 Cheque', value: 'Cheque' },
                    { label: '📱 Online Transfer', value: 'Online Transfer' },
                  ].map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPaymentMethod(value)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all cursor-pointer ${
                        paymentMethod === value
                          ? 'bg-emerald-700 border-emerald-700 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Reference / Note (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Cheque #1234, MCB Ref: 567890"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setActivePaymentSupplier(null); setPaymentAmount(''); setPaymentMethod('Cash'); setPaymentNote(''); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md transition-all cursor-pointer text-white bg-emerald-700 hover:bg-emerald-800"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Record Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

