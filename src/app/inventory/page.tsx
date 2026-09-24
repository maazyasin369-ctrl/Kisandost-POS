'use client';

import React, { useState, useEffect } from 'react';
import { dataStore } from '@/lib/data-store';
import { Product, Company, Batch, FormulationType, PackUnit } from '@/lib/types';
import { Package, Search, Plus, Building2, X, Check, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

const FORMULATION_TYPES: FormulationType[] = ['EC', 'WP', 'SL', 'SC', 'granules', 'powder', 'other'];
const PACK_UNITS: PackUnit[] = ['ml', 'L', 'g', 'kg'];
const CROP_OPTIONS = ['Cotton', 'Wheat', 'Sugarcane', 'Mango', 'Rice', 'Maize', 'Vegetables', 'Citrus', 'General'];

const emptyForm = {
  company_id: '',
  name: '',
  active_ingredient: '',
  formulation_type: 'EC' as FormulationType,
  pack_size: '',
  pack_unit: 'L' as PackUnit,
  crop_tags: [] as string[],
  reorder_level: '10',
};

export default function InventoryPage() {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState<Company[]>(() => dataStore.getCompanies());
  const [products, setProducts] = useState<(Product & { company_name?: string })[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');

  // Add / Edit Product Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Edit Batch Modal state
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [batchForm, setBatchForm] = useState({
    batch_number: '',
    expiry_date: '',
    cost_price: '',
    sale_price: '',
  });

  const refreshData = () => {
    setCompanies(dataStore.getCompanies());
    setProducts(dataStore.getProducts());
    setBatches(dataStore.getBatches());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.active_ingredient.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCompany = selectedCompanyId === 'all' || p.company_id === selectedCompanyId;
    return matchSearch && matchCompany;
  });

  function openAddModal() {
    const currentCompanies = dataStore.getCompanies();
    setCompanies(currentCompanies);
    setEditingProduct(null);
    setForm({ ...emptyForm, company_id: currentCompanies[0]?.id || '' });
    setShowModal(true);
  }

  function openEditModal(prod: Product) {
    const currentCompanies = dataStore.getCompanies();
    setCompanies(currentCompanies);
    setEditingProduct(prod);
    setForm({
      company_id: prod.company_id,
      name: prod.name,
      active_ingredient: prod.active_ingredient,
      formulation_type: prod.formulation_type,
      pack_size: prod.pack_size.toString(),
      pack_unit: prod.pack_unit,
      crop_tags: prod.crop_tags || [],
      reorder_level: (prod.reorder_level || 10).toString(),
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProduct(null);
    setForm(emptyForm);
  }

  function toggleCropTag(tag: string) {
    setForm(prev => ({
      ...prev,
      crop_tags: prev.crop_tags.includes(tag)
        ? prev.crop_tags.filter(t => t !== tag)
        : [...prev.crop_tags, tag],
    }));
  }

  function handleSubmitProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.active_ingredient.trim() || !form.company_id) return;
    setSubmitting(true);

    if (editingProduct) {
      dataStore.updateProduct(editingProduct.id, {
        company_id: form.company_id,
        name: form.name,
        active_ingredient: form.active_ingredient,
        formulation_type: form.formulation_type,
        pack_size: parseFloat(form.pack_size) || 1,
        pack_unit: form.pack_unit,
        crop_tags: form.crop_tags,
        reorder_level: parseInt(form.reorder_level) || 10,
      });
      showToast(`Product '${form.name}' updated!`, 'success');
    } else {
      dataStore.addProduct({
        company_id: form.company_id,
        name: form.name,
        active_ingredient: form.active_ingredient,
        formulation_type: form.formulation_type,
        pack_size: parseFloat(form.pack_size) || 1,
        pack_unit: form.pack_unit,
        crop_tags: form.crop_tags,
        reorder_level: parseInt(form.reorder_level) || 10,
      });
      showToast(`Product '${form.name}' added to catalog!`, 'success');
    }

    refreshData();
    setSubmitting(false);
    closeModal();
  }

  function handleDeleteProduct(prod: Product) {
    const res = dataStore.deleteProduct(prod.id);
    if (!res.success) {
      showToast(res.error || 'Cannot delete product.', 'error');
      return;
    }
    showToast(`Product '${prod.name}' deleted from catalog.`, 'info');
    refreshData();
  }

  // Batch actions
  function openEditBatchModal(batch: Batch) {
    setEditingBatch(batch);
    setBatchForm({
      batch_number: batch.batch_number,
      expiry_date: batch.expiry_date,
      cost_price: batch.cost_price.toString(),
      sale_price: batch.sale_price.toString(),
    });
  }

  function handleSaveBatchEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBatch || !batchForm.batch_number.trim() || !batchForm.expiry_date) return;

    dataStore.updateBatch(editingBatch.id, {
      batch_number: batchForm.batch_number,
      expiry_date: batchForm.expiry_date,
      cost_price: parseFloat(batchForm.cost_price) || editingBatch.cost_price,
      sale_price: parseFloat(batchForm.sale_price) || editingBatch.sale_price,
    });

    showToast(`Batch ${batchForm.batch_number} updated!`, 'success');
    setEditingBatch(null);
    refreshData();
  }

  function handleDeleteBatch(batch: Batch) {
    const res = dataStore.deleteBatch(batch.id);
    if (!res.success) {
      showToast(res.error || 'Cannot delete batch.', 'error');
      return;
    }
    showToast(`Batch ${batch.batch_number} deleted.`, 'info');
    refreshData();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2.5 tracking-tight">
            <div className="p-2 bg-slate-950 text-yellow-400 rounded-xl">
              <Package className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <span>Inventory &amp; FEFO Batch Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Manage pesticide product catalogs (EC, WP, SL, SC) and view/edit batch stock expiry dates.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Add New Product (Catalog)</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by product name, chemical active ingredient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
          />
        </div>

        <select
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          className="border border-slate-300 text-slate-700 text-xs sm:text-sm rounded-lg px-3 py-2 bg-slate-50 focus:outline-none font-medium"
        >
          <option value="all">All Brand Companies</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Product & Batch Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-medium uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Product &amp; Formulation</th>
                <th className="p-3.5">Company Brand</th>
                <th className="p-3.5">Pack Size</th>
                <th className="p-3.5 min-w-[300px]">Batches in Stock (FEFO)</th>
                <th className="p-3.5 text-center">Total Stock</th>
                <th className="p-3.5 text-right">Product Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-sm font-normal">
                    No products found. Click &quot;Add New Product&quot; to register a product.
                  </td>
                </tr>
              ) : filteredProducts.map((prod) => {
                const prodBatches = batches.filter(b => b.product_id === prod.id);
                const totalStock = prodBatches.reduce((s, b) => s + b.quantity_current, 0);

                return (
                  <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 space-y-1">
                      <div className="font-semibold text-slate-900 text-sm">{prod.name}</div>
                      <div className="text-[11px] text-slate-500 font-normal">{prod.active_ingredient}</div>
                      <div className="flex items-center flex-wrap gap-1">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                          {prod.formulation_type}
                        </span>
                        {prod.crop_tags.map((t, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-600 text-[9px] font-medium px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-3.5 font-medium text-slate-700">
                      <div className="flex items-center space-x-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{prod.company_name}</span>
                      </div>
                    </td>

                    <td className="p-3.5 font-semibold text-slate-800">
                      {prod.pack_size} {prod.pack_unit}
                    </td>

                    <td className="p-3.5 space-y-1.5">
                      {prodBatches.length === 0 ? (
                        <span className="text-slate-400 italic text-[11px] font-normal">No active stock batches</span>
                      ) : prodBatches.map(b => (
                        <div key={b.id} className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-center justify-between text-[11px] gap-2">
                          <div>
                            <span className="font-semibold text-slate-900">Batch: {b.batch_number}</span>
                            <span className="text-slate-500 ml-2 font-normal">(Exp: {b.expiry_date})</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-emerald-800 font-mono">
                              Rs. {b.sale_price} | {b.quantity_current} units
                            </span>
                            <button
                              onClick={() => openEditBatchModal(b)}
                              className="text-slate-600 hover:text-emerald-700 p-1 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                              title="Edit Batch Details"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteBatch(b)}
                              className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete Batch"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </td>

                    <td className="p-3.5 text-center font-semibold text-sm text-slate-900">
                      <span className={totalStock <= prod.reorder_level ? 'text-red-600 font-semibold' : 'text-slate-900'}>
                        {totalStock} units
                      </span>
                    </td>

                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="text-slate-700 hover:text-emerald-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Edit Product Details"
                      >
                        <Pencil className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod)}
                        className="text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Delete Product"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Catalog Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-emerald-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Package className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {editingProduct ? `Edit Product — ${editingProduct.name}` : 'Add New Product to Catalog'}
                  </h2>
                  <p className="text-xs text-amber-700 font-medium mt-0.5">
                    ℹ️ This adds the product to your catalog. To add actual stock, create a Purchase Order.
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitProduct} className="p-5 space-y-4 text-xs">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chlorpyrifos 40% EC"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
                  autoFocus
                />
              </div>

              {/* Active Ingredient */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Chemical Active Ingredient <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chlorpyrifos (Organophosphate)"
                  value={form.active_ingredient}
                  onChange={e => setForm(prev => ({ ...prev, active_ingredient: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
                />
              </div>

              {/* Company Brand */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Company Brand <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.company_id}
                  onChange={e => setForm(prev => ({ ...prev, company_id: e.target.value }))}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-800"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Formulation & Pack Size */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Formulation</label>
                  <select
                    value={form.formulation_type}
                    onChange={e => setForm(prev => ({ ...prev, formulation_type: e.target.value as FormulationType }))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  >
                    {FORMULATION_TYPES.map(ft => (
                      <option key={ft} value={ft}>{ft}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pack Size</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="1"
                    value={form.pack_size}
                    onChange={e => setForm(prev => ({ ...prev, pack_size: e.target.value }))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Unit</label>
                  <select
                    value={form.pack_unit}
                    onChange={e => setForm(prev => ({ ...prev, pack_unit: e.target.value as PackUnit }))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  >
                    {PACK_UNITS.map(pu => (
                      <option key={pu} value={pu}>{pu}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Crop Tags */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Suitable Crops</label>
                <div className="flex flex-wrap gap-1.5">
                  {CROP_OPTIONS.map(crop => {
                    const selected = form.crop_tags.includes(crop);
                    return (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => toggleCropTag(crop)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                          selected
                            ? 'bg-emerald-700 border-emerald-700 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {crop}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reorder Level */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Low Stock Reorder Alert Level (Units)</label>
                <input
                  type="number"
                  placeholder="10"
                  value={form.reorder_level}
                  onChange={e => setForm(prev => ({ ...prev, reorder_level: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>{editingProduct ? 'Update Catalog Product' : 'Save Product to Catalog'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Batch Modal */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Pencil className="h-5 w-5 text-emerald-700" />
                <span>Edit Batch Details</span>
              </h2>
              <button onClick={() => setEditingBatch(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatchEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Batch Number *</label>
                <input
                  type="text"
                  required
                  value={batchForm.batch_number}
                  onChange={e => setBatchForm({ ...batchForm, batch_number: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-semibold uppercase"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={batchForm.expiry_date}
                  onChange={e => setBatchForm({ ...batchForm, expiry_date: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cost Price (Rs)</label>
                  <input
                    type="number"
                    value={batchForm.cost_price}
                    onChange={e => setBatchForm({ ...batchForm, cost_price: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Sale Price (Rs)</label>
                  <input
                    type="number"
                    value={batchForm.sale_price}
                    onChange={e => setBatchForm({ ...batchForm, sale_price: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-semibold text-emerald-800"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-sm cursor-pointer"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Update Batch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
