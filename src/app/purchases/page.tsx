'use client';

import React, { useState, useEffect } from 'react';
import { dataStore } from '@/lib/data-store';
import { Purchase, PurchaseItem, FormulationType, PackUnit } from '@/lib/types';
import {
  ShoppingBag,
  Plus,
  Calendar,
  CheckCircle,
  Store,
  Building2,
  Package,
  Pencil,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  Search,
  Check,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface FormItem {
  product_id: string;
  batch_number: string;
  expiry_date: string;
  quantity_ordered: number;
  cost_price: number;
  sale_price: number;
}

export default function PurchasesPage() {
  const { showToast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>(() => dataStore.getPurchases());
  const [suppliers, setSuppliers] = useState(() => dataStore.getSuppliers());
  const [branches, setBranches] = useState(() => dataStore.getBranches());
  const [products, setProducts] = useState(() => dataStore.getProducts());
  const [companies, setCompanies] = useState(() => dataStore.getCompanies());

  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(null);

  // Quick-Add Product inline modal state
  const [showQuickAddProduct, setShowQuickAddProduct] = useState(false);
  const [quickProductTargetIdx, setQuickProductTargetIdx] = useState<number | 'quick_bar' | null>(null);
  const [quickProductForm, setQuickProductForm] = useState({
    name: '',
    active_ingredient: '',
    company_id: '',
    formulation_type: 'EC' as FormulationType,
    pack_size: '1',
    pack_unit: 'L' as PackUnit,
  });

  // Form State
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [items, setItems] = useState<FormItem[]>([]);

  // Current item line input state
  const [curProductId, setCurProductId] = useState('');
  const [curBatchNumber, setCurBatchNumber] = useState('');
  const [curExpiryDate, setCurExpiryDate] = useState('');
  const [curQuantity, setCurQuantity] = useState<number>(100);
  const [curCostPrice, setCurCostPrice] = useState<number>(1400);
  const [curSalePrice, setCurSalePrice] = useState<number>(1800);

  const refreshData = () => {
    setPurchases(dataStore.getPurchases());
    setSuppliers(dataStore.getSuppliers());
    setBranches(dataStore.getBranches());
    setProducts(dataStore.getProducts());
    setCompanies(dataStore.getCompanies());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const openQuickAddProductModal = (targetIdx: number | 'quick_bar') => {
    const curCompanies = dataStore.getCompanies();
    setCompanies(curCompanies);
    setQuickProductTargetIdx(targetIdx);
    setQuickProductForm({
      name: '',
      active_ingredient: '',
      company_id: curCompanies[0]?.id || '',
      formulation_type: 'EC',
      pack_size: '1',
      pack_unit: 'L',
    });
    setShowQuickAddProduct(true);
  };

  const handleSaveQuickProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickProductForm.name.trim() || !quickProductForm.active_ingredient.trim() || !quickProductForm.company_id) return;

    const created = dataStore.addProduct({
      company_id: quickProductForm.company_id,
      name: quickProductForm.name,
      active_ingredient: quickProductForm.active_ingredient,
      formulation_type: quickProductForm.formulation_type,
      pack_size: parseFloat(quickProductForm.pack_size) || 1,
      pack_unit: quickProductForm.pack_unit,
      crop_tags: ['General'],
      reorder_level: 10,
    });

    const updatedProds = dataStore.getProducts();
    setProducts(updatedProds);

    if (quickProductTargetIdx === 'quick_bar') {
      setCurProductId(created.id);
    } else if (typeof quickProductTargetIdx === 'number') {
      handleItemFieldChange(quickProductTargetIdx, 'product_id', created.id);
    }

    showToast(`Product '${created.name}' created and added to catalog!`, 'success');
    setShowQuickAddProduct(false);
  };

  const resetForm = () => {
    const defaultBranch = branches[0]?.id || 'branch-001';
    const defaultSupplier = suppliers[0]?.id || '';
    const defaultProduct = products[0]?.id || '';

    setSelectedBranchId(defaultBranch);
    setSelectedSupplierId(defaultSupplier);
    setCurProductId(defaultProduct);
    setCurBatchNumber('');
    setCurExpiryDate('');
    setCurQuantity(100);
    setCurCostPrice(1400);
    setCurSalePrice(1800);
    setItems([]);
    setEditingPurchase(null);
  };

  const openCreateModal = () => {
    resetForm();
    const defaultProduct = products[0]?.id || '';
    setItems([
      {
        product_id: defaultProduct,
        batch_number: '',
        expiry_date: '',
        quantity_ordered: 100,
        cost_price: 1400,
        sale_price: 1800
      }
    ]);
    setShowModal(true);
  };

  const openEditModal = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setSelectedBranchId(purchase.branch_id);
    setSelectedSupplierId(purchase.supplier_id);

    const formItems: FormItem[] = (purchase.items || []).map(i => ({
      product_id: i.product_id,
      batch_number: i.batch_number,
      expiry_date: i.expiry_date,
      quantity_ordered: i.quantity_ordered,
      cost_price: i.cost_price,
      sale_price: i.sale_price || i.cost_price * 1.2
    }));

    setItems(formItems.length > 0 ? formItems : [
      {
        product_id: products[0]?.id || '',
        batch_number: '',
        expiry_date: '',
        quantity_ordered: 100,
        cost_price: 1400,
        sale_price: 1800
      }
    ]);
    setViewingPurchase(null);
    setShowModal(true);
  };

  const handleAddItemLine = () => {
    if (!curProductId || !curBatchNumber.trim() || !curExpiryDate || curQuantity <= 0) {
      showToast('Please fill in product, batch number, expiry date and valid quantity.', 'error');
      return;
    }

    setItems(prev => [
      ...prev,
      {
        product_id: curProductId,
        batch_number: curBatchNumber.trim().toUpperCase(),
        expiry_date: curExpiryDate,
        quantity_ordered: curQuantity,
        cost_price: curCostPrice,
        sale_price: curSalePrice
      }
    ]);

    setCurBatchNumber('');
    setCurExpiryDate('');
  };

  const handleRemoveItemLine = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleItemFieldChange = <K extends keyof FormItem>(index: number, field: K, value: FormItem[K]) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const calculateTotalCost = () => {
    return items.reduce((sum, item) => sum + item.quantity_ordered * item.cost_price, 0);
  };

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast('Please add at least one line item to the purchase order.', 'error');
      return;
    }

    for (const item of items) {
      if (!item.batch_number.trim() || !item.expiry_date || item.quantity_ordered <= 0 || item.cost_price <= 0) {
        showToast('All items must have a valid batch number, expiry date, quantity, and cost price.', 'error');
        return;
      }
    }

    if (editingPurchase) {
      const res = dataStore.updatePurchase(editingPurchase.id, {
        branch_id: selectedBranchId,
        supplier_id: selectedSupplierId,
        items
      });

      if (!res.success) {
        showToast(res.error || 'Failed to update purchase order.', 'error');
        return;
      }

      showToast(`Purchase Order ${editingPurchase.purchase_number} updated successfully!`, 'success');
    } else {
      const newPo = dataStore.createPurchase({
        branch_id: selectedBranchId,
        supplier_id: selectedSupplierId,
        items
      });

      showToast(`Purchase Order ${newPo.purchase_number} created and stock updated!`, 'success');
    }

    refreshData();
    setShowModal(false);
    resetForm();
  };

  const handleConfirmDelete = () => {
    if (!deletingPurchase) return;

    const res = dataStore.deletePurchase(deletingPurchase.id);
    if (!res.success) {
      showToast(res.error || 'Cannot delete purchase order.', 'error');
      return;
    }

    showToast(`Purchase Order ${deletingPurchase.purchase_number} deleted and stock/ledger reversed.`, 'info');
    setDeletingPurchase(null);
    if (viewingPurchase?.id === deletingPurchase.id) {
      setViewingPurchase(null);
    }
    refreshData();
  };

  const filteredPurchases = purchases.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesPo = p.purchase_number.toLowerCase().includes(q);
    const matchesSupplier = p.supplier_name?.toLowerCase().includes(q);
    const matchesBranch = p.branch_name?.toLowerCase().includes(q);
    const matchesItems = (p.items || []).some(
      i => i.product_name?.toLowerCase().includes(q) || i.batch_number.toLowerCase().includes(q)
    );
    return matchesPo || matchesSupplier || matchesBranch || matchesItems;
  });

  // Check if deleting purchase has sold stock
  const getDeletionCheck = (purchase: Purchase) => {
    const batches = dataStore.getBatches();
    for (const item of purchase.items || []) {
      const batch = batches.find(
        b => b.product_id === item.product_id && b.branch_id === purchase.branch_id && b.batch_number === item.batch_number
      );
      if (batch) {
        const soldQty = batch.quantity_received - batch.quantity_current;
        if (soldQty > 0) {
          return {
            canDelete: false,
            soldQty,
            productName: item.product_name || 'Product',
            batchNumber: item.batch_number
          };
        }
      }
    }
    return { canDelete: true };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2.5 tracking-tight">
            <div className="p-2 bg-slate-950 text-yellow-400 rounded-xl">
              <ShoppingBag className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <span>Supplier Purchases &amp; Order Stocking</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Receive purchase orders from company distributors, view item details, and automatically create or top-up batch inventory.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>New Purchase Order (PO)</span>
        </button>
      </div>

      {/* Toolbar / Search Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search PO by number (e.g. PO-2026-081), supplier, branch, product, or batch number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
          />
        </div>
      </div>

      {/* Purchases List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 text-sm flex items-center justify-between">
          <span>Recent Purchase Orders</span>
          <span className="text-xs text-slate-500 font-normal">{filteredPurchases.length} order(s) found</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredPurchases.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-normal">
              No purchase orders found. Click &quot;New Purchase Order&quot; to add stock.
            </div>
          ) : (
            filteredPurchases.map(p => (
              <div
                key={p.id}
                className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 cursor-pointer" onClick={() => setViewingPurchase(p)}>
                  <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                    <span className="font-semibold text-slate-900 text-base hover:text-emerald-700 transition-colors">
                      {p.purchase_number}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {p.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      {p.supplier_name}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Store className="h-3.5 w-3.5 text-slate-400" />
                      {p.branch_name}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 font-normal">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(p.created_at).toLocaleString()}
                    </span>
                  </div>

                  {/* Summary of Products Ordered */}
                  <div className="text-xs text-slate-500 flex items-center gap-1 flex-wrap font-normal">
                    <span className="font-semibold text-slate-700">Ordered Products:</span>
                    {(p.items || []).map((item, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded">
                        {item.product_name || 'Product'} (Batch: {item.batch_number}) × {item.quantity_ordered}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between md:justify-end w-full md:w-auto gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-500 font-medium">Total Cost Amount</div>
                    <div className="text-lg font-semibold text-emerald-700 font-mono">
                      Rs. {p.total_amount.toLocaleString()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setViewingPurchase(p)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 border border-emerald-200 transition-colors cursor-pointer"
                      title="View Product Item Details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Items</span>
                    </button>

                    <button
                      onClick={() => openEditModal(p)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 border border-slate-200 transition-colors cursor-pointer"
                      title="Edit Purchase Order"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeletingPurchase(p)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 border border-rose-200 transition-colors cursor-pointer"
                      title="Delete Purchase Order"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PO Itemized Detail View Modal */}
      {viewingPurchase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden space-y-0">
            <div className="bg-slate-100 border-b border-slate-200 text-slate-900 p-5 flex justify-between items-center">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-slate-900">{viewingPurchase.purchase_number}</h2>
                  <span className="bg-emerald-600 text-white font-semibold text-[10px] px-2.5 py-0.5 rounded-full">
                    {viewingPurchase.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-normal">
                  Ordered on {new Date(viewingPurchase.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setViewingPurchase(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Supplier & Branch Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium block text-[11px]">SUPPLIER DISTRIBUTOR</span>
                  <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-emerald-700" />
                    <span>{viewingPurchase.supplier_name}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium block text-[11px]">RECEIVING BRANCH</span>
                  <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                    <Store className="h-4 w-4 text-emerald-700" />
                    <span>{viewingPurchase.branch_name}</span>
                  </div>
                </div>
              </div>

              {/* Itemized Products Table */}
              <div className="space-y-2">
                <div className="font-semibold text-slate-900 text-sm flex items-center space-x-1">
                  <Package className="h-4 w-4 text-emerald-700" />
                  <span>Itemized Order Breakdown</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-medium border-b border-slate-200">
                      <tr>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Batch #</th>
                        <th className="p-3">Expiry</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Cost Price</th>
                        <th className="p-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(viewingPurchase.items || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-900">
                            {item.product_name}
                          </td>
                          <td className="p-3 font-mono font-semibold text-slate-700">
                            {item.batch_number}
                          </td>
                          <td className="p-3 text-slate-600 font-normal">
                            {item.expiry_date}
                          </td>
                          <td className="p-3 text-center font-semibold text-slate-900">
                            {item.quantity_ordered} units
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-slate-800">
                            Rs. {item.cost_price.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-emerald-800">
                            Rs. {(item.quantity_ordered * item.cost_price).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PO Total Summary */}
              <div className="bg-emerald-50 border border-emerald-200 text-slate-900 p-4 rounded-xl flex items-center justify-between shadow-2xs">
                <span className="font-semibold text-slate-700">Total Purchase Order Amount:</span>
                <span className="text-xl font-semibold font-mono text-emerald-800">
                  Rs. {viewingPurchase.total_amount.toLocaleString()}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openEditModal(viewingPurchase)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                >
                  <Pencil className="h-4 w-4" />
                  <span>Edit Purchase Order</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingPurchase(null)}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Purchase Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-emerald-700 text-white p-5 flex justify-between items-center shrink-0">
              <h2 className="text-base font-semibold flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5 text-emerald-200" />
                <span>{editingPurchase ? `Edit Purchase Order (${editingPurchase.purchase_number})` : 'Record New Supplier Purchase'}</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-white font-semibold text-lg cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
              {/* Header Fields: Branch & Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Receiving Branch *</label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-800 bg-white"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Supplier Distributor *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-800 bg-white"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add / Edit Line Items */}
              <div className="space-y-3">
                <div className="font-semibold text-slate-900 text-sm flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Package className="h-4 w-4 text-emerald-600" />
                    <span>Purchase Order Line Items</span>
                  </span>
                  <span className="text-xs text-slate-500 font-normal">{items.length} line item(s)</span>
                </div>

                {/* Line Items Table with horizontal overflow handling */}
                <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-2xs">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-100 text-slate-700 font-medium border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 min-w-[180px]">Product Name</th>
                        <th className="p-2.5 w-28">Batch #</th>
                        <th className="p-2.5 w-32">Expiry Date</th>
                        <th className="p-2.5 w-20 text-center">Qty</th>
                        <th className="p-2.5 w-24 text-right">Cost (Rs)</th>
                        <th className="p-2.5 w-24 text-right">Sale (Rs)</th>
                        <th className="p-2.5 w-28 text-right">Line Total</th>
                        <th className="p-2.5 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2">
                            <select
                              value={item.product_id}
                              onChange={(e) => handleItemFieldChange(idx, 'product_id', e.target.value)}
                              className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white font-medium"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              value={item.batch_number}
                              onChange={(e) => handleItemFieldChange(idx, 'batch_number', e.target.value.toUpperCase())}
                              placeholder="Batch #"
                              required
                              className="w-full p-1.5 border border-slate-300 rounded font-mono font-semibold uppercase text-xs"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="date"
                              value={item.expiry_date}
                              onChange={(e) => handleItemFieldChange(idx, 'expiry_date', e.target.value)}
                              required
                              className="w-full p-1.5 border border-slate-300 rounded text-xs font-normal"
                            />
                          </td>

                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity_ordered}
                              onChange={(e) => handleItemFieldChange(idx, 'quantity_ordered', parseInt(e.target.value) || 0)}
                              required
                              className="w-full p-1.5 border border-slate-300 rounded font-semibold text-center text-xs"
                            />
                          </td>

                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.cost_price}
                              onChange={(e) => handleItemFieldChange(idx, 'cost_price', parseFloat(e.target.value) || 0)}
                              required
                              className="w-full p-1.5 border border-slate-300 rounded font-mono text-right text-xs"
                            />
                          </td>

                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.sale_price}
                              onChange={(e) => handleItemFieldChange(idx, 'sale_price', parseFloat(e.target.value) || 0)}
                              required
                              className="w-full p-1.5 border border-slate-300 rounded font-mono text-right text-xs"
                            />
                          </td>

                          <td className="p-2 text-right font-mono font-semibold text-emerald-800">
                            Rs. {(item.quantity_ordered * item.cost_price).toLocaleString()}
                          </td>

                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemLine(idx)}
                              className="text-rose-600 hover:text-rose-800 font-semibold p-1 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Remove Line Item"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add New Line Item Quick Bar */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                    <Plus className="h-4 w-4 text-emerald-700" />
                    <span>Quick Add Another Product Line</span>
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    <div className="sm:col-span-4">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-medium text-slate-600">Select Product</label>
                        <button
                          type="button"
                          onClick={() => openQuickAddProductModal('quick_bar')}
                          className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>New Product</span>
                        </button>
                      </div>
                      <select
                        value={curProductId}
                        onChange={(e) => setCurProductId(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium text-xs"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Batch #</label>
                      <input
                        type="text"
                        placeholder="e.g. BAT-99"
                        value={curBatchNumber}
                        onChange={(e) => setCurBatchNumber(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono uppercase font-semibold text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={curExpiryDate}
                        onChange={(e) => setCurExpiryDate(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs font-normal"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Qty</label>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={curQuantity}
                        onChange={(e) => setCurQuantity(parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-300 rounded-lg font-semibold text-xs"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Cost</label>
                      <input
                        type="number"
                        placeholder="Cost"
                        value={curCostPrice}
                        onChange={(e) => setCurCostPrice(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono font-semibold text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddItemLine}
                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2 rounded-lg shadow-sm flex items-center justify-center space-x-1 transition-colors cursor-pointer text-xs"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Line Item</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Order Total Box */}
                <div className="bg-emerald-50 border border-emerald-200 text-slate-900 p-3.5 rounded-xl flex items-center justify-between shadow-2xs">
                  <span className="font-medium text-slate-700 text-xs">Total Purchase Order Value:</span>
                  <span className="text-lg font-semibold font-mono text-emerald-800">
                    Rs. {calculateTotalCost().toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={items.length === 0}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>{editingPurchase ? 'Update Purchase Order' : 'Save & Update Stock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPurchase && (() => {
        const check = getDeletionCheck(deletingPurchase);
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-200 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h2 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                  <span>Confirm Delete Purchase Order</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setDeletingPurchase(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-900 text-sm">
                    {deletingPurchase.purchase_number}
                  </div>
                  <div className="text-slate-600 font-normal">
                    Supplier: <strong className="font-semibold">{deletingPurchase.supplier_name}</strong> | Amount: <strong className="text-emerald-800 font-semibold">Rs. {deletingPurchase.total_amount.toLocaleString()}</strong>
                  </div>
                </div>

                {!check.canDelete ? (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl space-y-2 text-rose-900">
                    <div className="font-semibold flex items-center gap-1.5 text-rose-800">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>Deletion Blocked (Stock Already Sold)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-rose-700 font-normal">
                      Cannot delete PO <strong>{deletingPurchase.purchase_number}</strong> because <strong>{check.soldQty} units</strong> of <strong>{check.productName}</strong> (Batch: {check.batchNumber}) have already been sold in customer sales orders.
                    </p>
                    <p className="text-[11px] italic font-semibold text-rose-800">
                      To correct errors, please use the Edit option instead of deleting.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 space-y-1 text-[11px]">
                    <div className="font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-amber-700" />
                      <span>Reversal Warning</span>
                    </div>
                    <p className="font-normal">
                      This will automatically <strong>remove the batch stock added by this PO</strong> and <strong>reverse the Rs. {deletingPurchase.total_amount.toLocaleString()} payable</strong> from supplier <em>{deletingPurchase.supplier_name}</em>&apos;s ledger.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setDeletingPurchase(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!check.canDelete}
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center space-x-1"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Yes, Delete PO</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Quick-Add Product Modal inside PO Screen */}
      {showQuickAddProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-emerald-200 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-emerald-700" />
                <h3 className="text-base font-semibold text-slate-900">Quick Add Product to Catalog</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddProduct(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Belt Expert 480 SC"
                  value={quickProductForm.name}
                  onChange={(e) => setQuickProductForm({ ...quickProductForm, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Chemical Active Ingredient *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flubendiamide + Thiacloprid"
                  value={quickProductForm.active_ingredient}
                  onChange={(e) => setQuickProductForm({ ...quickProductForm, active_ingredient: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-normal"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Company Brand *</label>
                <select
                  value={quickProductForm.company_id}
                  onChange={(e) => setQuickProductForm({ ...quickProductForm, company_id: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Formulation</label>
                  <select
                    value={quickProductForm.formulation_type}
                    onChange={(e) => setQuickProductForm({ ...quickProductForm, formulation_type: e.target.value as FormulationType })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    {['EC', 'WP', 'SL', 'SC', 'granules', 'powder', 'other'].map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Pack Size</label>
                  <input
                    type="number"
                    step="any"
                    value={quickProductForm.pack_size}
                    onChange={(e) => setQuickProductForm({ ...quickProductForm, pack_size: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unit</label>
                  <select
                    value={quickProductForm.pack_unit}
                    onChange={(e) => setQuickProductForm({ ...quickProductForm, pack_unit: e.target.value as PackUnit })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    {['ml', 'L', 'g', 'kg'].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickAddProduct(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!quickProductForm.name.trim() || !quickProductForm.active_ingredient.trim()}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Save to Catalog</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
