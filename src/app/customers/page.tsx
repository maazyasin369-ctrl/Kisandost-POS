'use client';

import React, { useState, useEffect } from 'react';
import { dataStore } from '@/lib/data-store';
import { Customer } from '@/lib/types';
import { Users, Search, Plus, Banknote, Phone, MapPin, Check, X, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

export default function CustomersPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>(() => dataStore.getCustomers());

  useEffect(() => {
    setCustomers(dataStore.getCustomers());
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [activePaymentCustomer, setActivePaymentCustomer] = useState<Customer | null>(null);
  const [txnType, setTxnType] = useState<'payment' | 'credit'>('payment');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');

  // Add Farmer Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFarmer, setNewFarmer] = useState({
    name: '',
    phone: '',
    address: '',
    land_size: '',
    crop_type: 'Cotton & Wheat',
    credit_limit: '50000',
  });

  // Edit Farmer Modal state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    land_size: '',
    crop_type: 'Cotton & Wheat',
    credit_limit: '50000',
  });

  // Delete Farmer Modal state
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pagination = usePagination(filteredCustomers, 10);

  const handleRecordPayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activePaymentCustomer || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (txnType === 'payment') {
      dataStore.recordCustomerPayment({
        customer_id: activePaymentCustomer.id,
        amount,
        method: paymentMethod,
        note: paymentNote
      });
      showToast(`Payment of Rs. ${amount.toLocaleString()} received for ${activePaymentCustomer.name}`, 'success');
    } else {
      dataStore.addCustomerCredit({
        customer_id: activePaymentCustomer.id,
        amount,
        note: paymentNote
      });
      showToast(`Udhaar of Rs. ${amount.toLocaleString()} added for ${activePaymentCustomer.name}`, 'success');
    }

    setCustomers(dataStore.getCustomers().map(c => ({ ...c })));
    setActivePaymentCustomer(null);
    setPaymentAmount('');
    setPaymentNote('');
    setTxnType('payment');
  };

  const handleAddFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmer.name || !newFarmer.phone || !newFarmer.address) return;

    dataStore.addCustomer({
      name: newFarmer.name.trim(),
      phone: newFarmer.phone.trim(),
      address: newFarmer.address.trim(),
      land_size: newFarmer.land_size ? parseFloat(newFarmer.land_size) : 0,
      crop_type: newFarmer.crop_type || 'Cotton & Wheat',
      credit_limit: newFarmer.credit_limit ? parseFloat(newFarmer.credit_limit) : 50000,
    });

    setCustomers([...dataStore.getCustomers()]);
    setIsAddModalOpen(false);
    setNewFarmer({
      name: '',
      phone: '',
      address: '',
      land_size: '',
      crop_type: 'Cotton & Wheat',
      credit_limit: '50000',
    });
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      land_size: customer.land_size ? customer.land_size.toString() : '',
      crop_type: customer.crop_type || 'Cotton & Wheat',
      credit_limit: customer.credit_limit ? customer.credit_limit.toString() : '50000',
    });
  };

  const handleUpdateFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editForm.name || !editForm.phone || !editForm.address) return;

    dataStore.updateCustomer(editingCustomer.id, {
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      address: editForm.address.trim(),
      land_size: editForm.land_size ? parseFloat(editForm.land_size) : 0,
      crop_type: editForm.crop_type || 'Cotton & Wheat',
      credit_limit: editForm.credit_limit ? parseFloat(editForm.credit_limit) : 50000,
    });

    setCustomers([...dataStore.getCustomers()]);
    setEditingCustomer(null);
  };

  const handleConfirmDelete = () => {
    if (!customerToDelete) return;
    dataStore.deleteCustomer(customerToDelete.id);
    setCustomers([...dataStore.getCustomers()]);
    setCustomerToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--kd-surface)] p-6 rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center space-x-2.5 tracking-tight">
            <div className="rounded-xl bg-[var(--kd-primary-soft)] p-2 text-primary">
              <Users className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <span>Farmers &amp; Udhaar Credit Ledger</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-normal">
            Track farmer balances, credit limits, transaction histories, and record cash collections.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary text-primary-foreground hover:opacity-90 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-[var(--kd-shadow)] transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Add New Farmer</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-[var(--kd-surface)] p-4 rounded-xl shadow-[var(--kd-shadow)] border border-border flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search farmer by name, phone number, village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pagination.pageItems.map((cust) => {
          const balance = cust.current_balance || 0;

          return (
            <div key={cust.id} className="bg-[var(--kd-surface)] p-5 rounded-[var(--kd-radius)] shadow-[var(--kd-shadow)] border border-border space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-base text-foreground">{cust.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center space-x-1 mt-0.5">
                      <Phone className="h-3 w-3" />
                      <span>{cust.phone}</span>
                    </p>
                  </div>
                  <span className="bg-background text-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border">
                    {cust.crop_type}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground space-y-1 bg-background p-2.5 rounded-xl border border-border">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{cust.address}</span>
                  </div>
                  <div>Land Size: <strong className="font-semibold">{cust.land_size} Acres</strong></div>
                </div>

                {/* Balance & Limit */}
                <div
                  className={`rounded-xl border bg-[var(--kd-surface)] p-3.5 space-y-1 ${
                    balance < 0
                      ? 'border-primary/40'
                      : balance > 0
                        ? 'border-warning/50'
                        : 'border-border'
                  }`}
                >
                  <div className="flex justify-between text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                    <span>{balance < 0 ? 'Advance Prepaid' : 'Udhaar Owed Balance'}</span>
                    <span>Credit Limit</span>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <span
                      className={`text-lg font-semibold tabular-nums ${
                        balance < 0
                          ? 'text-primary'
                          : balance > 0
                            ? 'text-warning'
                            : 'text-foreground'
                      }`}
                    >
                      {balance < 0
                        ? `Rs. ${Math.abs(balance).toLocaleString()} (Advance)`
                        : `Rs. ${balance.toLocaleString()}`}
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-foreground/70">
                      Rs. {cust.credit_limit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Equal Action Buttons Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => openEditModal(cust)}
                  className="rounded-lg border border-border bg-[var(--kd-surface)] py-2 px-2 text-xs font-semibold text-foreground hover:bg-[var(--kd-primary-soft)] hover:text-primary transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setActivePaymentCustomer(cust)}
                  className="rounded-lg bg-primary py-2 px-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Banknote className="h-3.5 w-3.5" />
                  <span>Payment</span>
                </button>
                <button
                  onClick={() => setCustomerToDelete(cust)}
                  className="rounded-lg border border-danger/25 bg-[color-mix(in_srgb,var(--kd-danger)_10%,transparent)] py-2 px-2 text-xs font-semibold text-danger hover:bg-[color-mix(in_srgb,var(--kd-danger)_16%,transparent)] transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] overflow-hidden shadow-[var(--kd-shadow)]">
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

      {/* Add New Farmer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--kd-surface)] rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-primary/20">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Add New Farmer Profile</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-[var(--kd-primary-soft)] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddFarmer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground mb-1">Farmer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chaudhry Asghar Ali"
                    value={newFarmer.name}
                    onChange={(e) => setNewFarmer({ ...newFarmer, name: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +92 300 1234567"
                    value={newFarmer.phone}
                    onChange={(e) => setNewFarmer({ ...newFarmer, phone: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Village / Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mouza Shahpur, Tehsil Multan"
                  value={newFarmer.address}
                  onChange={(e) => setNewFarmer({ ...newFarmer, address: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-foreground mb-1">Land Size (Acres)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 25"
                    value={newFarmer.land_size}
                    onChange={(e) => setNewFarmer({ ...newFarmer, land_size: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Main Crop Type</label>
                  <select
                    value={newFarmer.crop_type}
                    onChange={(e) => setNewFarmer({ ...newFarmer, crop_type: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm bg-[var(--kd-surface)] focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="Cotton & Wheat">Cotton & Wheat</option>
                    <option value="Mango Orchard & Maize">Mango Orchard & Maize</option>
                    <option value="Sugarcane & Rice">Sugarcane & Rice</option>
                    <option value="Vegetables (Tomato/Chillies)">Vegetables</option>
                    <option value="Citrus & Wheat">Citrus & Wheat</option>
                    <option value="Other / General">Other / General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Credit Limit (Rs.)</label>
                  <input
                    type="number"
                    step="5000"
                    placeholder="50000"
                    value={newFarmer.credit_limit}
                    onChange={(e) => setNewFarmer({ ...newFarmer, credit_limit: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-background hover:bg-[var(--kd-primary-soft)] text-foreground font-semibold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground hover:opacity-90 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-[var(--kd-shadow)] transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Save Farmer Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Farmer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--kd-surface)] rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-primary/20">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                <Pencil className="h-5 w-5 text-primary" />
                <span>Edit Farmer Details</span>
              </h2>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-[var(--kd-primary-soft)] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateFarmer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground mb-1">Farmer Name *</label>
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
                  <label className="block font-medium text-foreground mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Village / Address *</label>
                <input
                  type="text"
                  required
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-foreground mb-1">Land Size (Acres)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editForm.land_size}
                    onChange={(e) => setEditForm({ ...editForm, land_size: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Main Crop Type</label>
                  <select
                    value={editForm.crop_type}
                    onChange={(e) => setEditForm({ ...editForm, crop_type: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm bg-[var(--kd-surface)] focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="Cotton & Wheat">Cotton & Wheat</option>
                    <option value="Mango Orchard & Maize">Mango Orchard & Maize</option>
                    <option value="Sugarcane & Rice">Sugarcane & Rice</option>
                    <option value="Vegetables (Tomato/Chillies)">Vegetables</option>
                    <option value="Citrus & Wheat">Citrus & Wheat</option>
                    <option value="Other / General">Other / General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Credit Limit (Rs.)</label>
                  <input
                    type="number"
                    step="5000"
                    value={editForm.credit_limit}
                    onChange={(e) => setEditForm({ ...editForm, credit_limit: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="flex-1 bg-background hover:bg-[var(--kd-primary-soft)] text-foreground font-semibold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground hover:opacity-90 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-[var(--kd-shadow)] transition-colors cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Update Farmer Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Farmer Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--kd-surface)] rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-200">
            <div className="flex items-center space-x-3 text-danger">
              <div className="p-2.5 bg-rose-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-danger" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Delete Farmer Profile</h2>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground font-semibold">{customerToDelete.name}</strong>? All credit ledger records associated with this farmer profile will be removed. This action cannot be undone.
            </p>

            <div className="flex items-center space-x-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="flex-1 bg-background hover:bg-[var(--kd-primary-soft)] text-foreground font-semibold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 bg-danger hover:bg-rose-700 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-[var(--kd-shadow)] transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment / Add Udhaar Modal */}
      {activePaymentCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--kd-surface)] rounded-[var(--kd-radius)] shadow-2xl max-w-md w-full p-6 space-y-4 border border-primary/20">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />
                <span>Farmer Ledger — {activePaymentCustomer.name}</span>
              </h2>
              <button
                type="button"
                onClick={() => setActivePaymentCustomer(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-[var(--kd-primary-soft)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Balance Pill */}
            <div className={`p-3.5 rounded-xl flex items-center justify-between shadow-[var(--kd-shadow)] ${activePaymentCustomer.current_balance && activePaymentCustomer.current_balance < 0 ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground'}`}>
              <span className="text-xs font-medium text-primary-foreground">
                {activePaymentCustomer.current_balance && activePaymentCustomer.current_balance < 0 ? '💳 Advance Prepaid Balance:' : 'Current Udhaar Balance:'}
              </span>
              <span className="font-mono text-lg font-semibold text-primary-foreground">
                {activePaymentCustomer.current_balance && activePaymentCustomer.current_balance < 0
                  ? `Rs. ${Math.abs(activePaymentCustomer.current_balance).toLocaleString()} (Advance)`
                  : `Rs. ${(activePaymentCustomer.current_balance || 0).toLocaleString()}`}
              </span>
            </div>

            {/* Transaction Mode Selector: Receive Payment (Vasooli) vs Add Udhaar */}
            <div className="flex bg-background p-1 rounded-xl gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTxnType('payment')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${txnType === 'payment' ? 'bg-primary text-primary-foreground text-white shadow-[var(--kd-shadow)] font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Banknote className="w-4 h-4" />
                <span>Receive Payment</span>
              </button>
              <button
                type="button"
                onClick={() => setTxnType('credit')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${txnType === 'credit' ? 'bg-amber-600 text-white shadow-[var(--kd-shadow)] font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Naya Udhaar</span>
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  {txnType === 'payment' ? 'Enter Amount Received (Rs) *' : 'Enter New Udhaar Amount (Rs) *'}
                </label>
                <input
                  type="number"
                  required
                  autoFocus
                  placeholder="e.g. 15000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-3 border border-border rounded-xl font-semibold text-foreground text-base focus:ring-2 focus:ring-primary focus:outline-none bg-[var(--kd-surface)] shadow-2xs"
                />
              </div>

              {txnType === 'payment' && (
                <div>
                  <label className="block font-medium text-foreground mb-1">Payment Method:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl bg-[var(--kd-surface)] focus:ring-2 focus:ring-primary focus:outline-none font-medium text-foreground"
                  >
                    <option value="cash">💵 Cash in Drawer</option>
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                    <option value="other">📝 Other / Cheque</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-medium text-foreground mb-1">Note / Reference (Optional):</label>
                <input
                  type="text"
                  placeholder={txnType === 'payment' ? 'e.g. Received via cash counter' : 'e.g. Chemical purchase credit'}
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-normal"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setActivePaymentCustomer(null)}
                  className="flex-1 bg-background hover:bg-[var(--kd-primary-soft)] text-foreground font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md transition-all cursor-pointer text-white ${txnType === 'payment' ? 'bg-primary text-primary-foreground hover:opacity-90' : 'bg-amber-600 hover:bg-amber-700'}`}
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>{txnType === 'payment' ? 'Save Payment' : 'Add Udhaar Balance'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
