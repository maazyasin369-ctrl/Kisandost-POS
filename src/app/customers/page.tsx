'use client';

import React, { useState, useEffect } from 'react';
import { dataStore } from '@/lib/data-store';
import { Customer } from '@/lib/types';
import { Users, Search, Plus, Banknote, Phone, MapPin, Check, X, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

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
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2.5 tracking-tight">
            <div className="p-2 bg-slate-950 text-yellow-400 rounded-xl">
              <Users className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <span>Farmers &amp; Udhaar Credit Ledger</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Track farmer balances, credit limits, transaction histories, and record cash collections.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Add New Farmer</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search farmer by name, phone number, village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCustomers.map((cust) => {
          const balance = cust.current_balance || 0;

          return (
            <div key={cust.id} className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-base text-slate-900">{cust.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                      <Phone className="h-3 w-3" />
                      <span>{cust.phone}</span>
                    </p>
                  </div>
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200/70">
                    {cust.crop_type}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{cust.address}</span>
                  </div>
                  <div>Land Size: <strong className="font-semibold">{cust.land_size} Acres</strong></div>
                </div>

                {/* Balance & Limit */}
                <div className="bg-slate-950 border border-slate-900 text-white p-3.5 rounded-xl space-y-1 shadow-xs">
                  <div className="flex justify-between text-2xs text-slate-400 font-medium uppercase tracking-wider">
                    <span>{balance < 0 ? '💳 Advance Prepaid:' : 'Udhaar Owed Balance:'}</span>
                    <span>Credit Limit:</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-lg font-semibold ${balance < 0 ? 'text-emerald-300 font-mono' : balance > 0 ? 'text-yellow-400 font-mono' : 'text-slate-300'}`}>
                      {balance < 0 ? `Rs. ${Math.abs(balance).toLocaleString()} (Advance)` : `Rs. ${balance.toLocaleString()}`}
                    </span>
                    <span className="text-xs font-semibold text-slate-300 font-mono">
                      Rs. {cust.credit_limit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Equal Action Buttons Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(cust)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-2 rounded-lg text-xs flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setActivePaymentCustomer(cust)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-semibold py-2 px-2 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-2xs transition-colors cursor-pointer"
                >
                  <Banknote className="h-3.5 w-3.5" />
                  <span>Payment</span>
                </button>
                <button
                  onClick={() => setCustomerToDelete(cust)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold py-2 px-2 rounded-lg text-xs flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Farmer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-emerald-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                <Users className="h-5 w-5 text-emerald-700" />
                <span>Add New Farmer Profile</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddFarmer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Farmer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chaudhry Asghar Ali"
                    value={newFarmer.name}
                    onChange={(e) => setNewFarmer({ ...newFarmer, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +92 300 1234567"
                    value={newFarmer.phone}
                    onChange={(e) => setNewFarmer({ ...newFarmer, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Village / Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mouza Shahpur, Tehsil Multan"
                  value={newFarmer.address}
                  onChange={(e) => setNewFarmer({ ...newFarmer, address: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Land Size (Acres)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 25"
                    value={newFarmer.land_size}
                    onChange={(e) => setNewFarmer({ ...newFarmer, land_size: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Main Crop Type</label>
                  <select
                    value={newFarmer.crop_type}
                    onChange={(e) => setNewFarmer({ ...newFarmer, crop_type: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  <label className="block font-medium text-slate-700 mb-1">Credit Limit (Rs.)</label>
                  <input
                    type="number"
                    step="5000"
                    placeholder="50000"
                    value={newFarmer.credit_limit}
                    onChange={(e) => setNewFarmer({ ...newFarmer, credit_limit: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
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
                  <span>Save Farmer Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Farmer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-emerald-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                <Pencil className="h-5 w-5 text-emerald-700" />
                <span>Edit Farmer Details</span>
              </h2>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateFarmer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Farmer Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Village / Address *</label>
                <input
                  type="text"
                  required
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Land Size (Acres)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editForm.land_size}
                    onChange={(e) => setEditForm({ ...editForm, land_size: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Main Crop Type</label>
                  <select
                    value={editForm.crop_type}
                    onChange={(e) => setEditForm({ ...editForm, crop_type: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  <label className="block font-medium text-slate-700 mb-1">Credit Limit (Rs.)</label>
                  <input
                    type="number"
                    step="5000"
                    value={editForm.credit_limit}
                    onChange={(e) => setEditForm({ ...editForm, credit_limit: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-sm transition-colors cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-200">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Delete Farmer Profile</h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 font-semibold">{customerToDelete.name}</strong>? All credit ledger records associated with this farmer profile will be removed. This action cannot be undone.
            </p>

            <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
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

      {/* Record Payment / Add Udhaar Modal */}
      {activePaymentCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-emerald-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-700" />
                <span>Farmer Ledger — {activePaymentCustomer.name}</span>
              </h2>
              <button
                type="button"
                onClick={() => setActivePaymentCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Balance Pill */}
            <div className={`p-3.5 rounded-xl flex items-center justify-between shadow-sm ${activePaymentCustomer.current_balance && activePaymentCustomer.current_balance < 0 ? 'bg-emerald-900 border border-emerald-700 text-white' : 'bg-emerald-950 text-white'}`}>
              <span className="text-xs font-medium text-emerald-200">
                {activePaymentCustomer.current_balance && activePaymentCustomer.current_balance < 0 ? '💳 Advance Prepaid Balance:' : 'Current Udhaar Balance:'}
              </span>
              <span className={`text-lg font-semibold font-mono ${activePaymentCustomer.current_balance && activePaymentCustomer.current_balance < 0 ? 'text-emerald-300' : 'text-amber-400'}`}>
                {activePaymentCustomer.current_balance && activePaymentCustomer.current_balance < 0
                  ? `Rs. ${Math.abs(activePaymentCustomer.current_balance).toLocaleString()} (Advance)`
                  : `Rs. ${(activePaymentCustomer.current_balance || 0).toLocaleString()}`}
              </span>
            </div>

            {/* Transaction Mode Selector: Receive Payment (Vasooli) vs Add Udhaar */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTxnType('payment')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${txnType === 'payment' ? 'bg-emerald-700 text-white shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Banknote className="w-4 h-4" />
                <span>Receive Payment</span>
              </button>
              <button
                type="button"
                onClick={() => setTxnType('credit')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${txnType === 'credit' ? 'bg-amber-600 text-white shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Naya Udhaar</span>
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-800 mb-1">
                  {txnType === 'payment' ? 'Enter Amount Received (Rs) *' : 'Enter New Udhaar Amount (Rs) *'}
                </label>
                <input
                  type="number"
                  required
                  autoFocus
                  placeholder="e.g. 15000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl font-semibold text-slate-900 text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white shadow-2xs"
                />
              </div>

              {txnType === 'payment' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Payment Method:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-800"
                  >
                    <option value="cash">💵 Cash in Drawer</option>
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                    <option value="other">📝 Other / Cheque</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Note / Reference (Optional):</label>
                <input
                  type="text"
                  placeholder={txnType === 'payment' ? 'e.g. Received via cash counter' : 'e.g. Chemical purchase credit'}
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActivePaymentCustomer(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md transition-all cursor-pointer text-white ${txnType === 'payment' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-amber-600 hover:bg-amber-700'}`}
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
