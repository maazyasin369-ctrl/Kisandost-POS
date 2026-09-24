'use client';

import React, { use } from 'react';
import { dataStore } from '@/lib/data-store';
import { Package, ArrowLeft, Building2, Calendar, ShieldCheck, Tag, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.productId;

  const products = dataStore.getProducts();
  const product = products.find(p => p.id === productId);
  const batches = dataStore.getBatches().filter(b => b.product_id === productId);

  if (!product) {
    return (
      <div className="p-8 text-center text-slate-500 space-y-4">
        <p className="text-base font-semibold">Product Record Not Found</p>
        <Link href="/inventory" className="text-emerald-700 underline text-sm font-semibold">
          ← Back to Inventory List
        </Link>
      </div>
    );
  }

  const totalStock = batches.reduce((sum, b) => sum + b.quantity_current, 0);

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div>
        <Link href="/inventory" className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 font-semibold text-xs">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Inventory</span>
        </Link>
      </div>

      {/* Product Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100 text-emerald-800 p-3 rounded-full">
              <Package className="h-7 w-7" />
            </div>
            <div>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-block mb-1">
                {product.company_name}
              </span>
              <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Active Ingredient: <span className="text-slate-800 font-semibold">{product.active_ingredient}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs pt-2">
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md font-medium">
              Formulation: {product.formulation_type}
            </span>
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md font-medium">
              Pack Size: {product.pack_size} {product.pack_unit}
            </span>
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md font-medium">
              Reorder Level: {product.reorder_level} units
            </span>
          </div>
        </div>

        <div className="bg-emerald-950 text-white rounded-xl p-5 text-right space-y-1 w-full md:w-auto">
          <span className="text-xs text-emerald-300 font-medium uppercase tracking-wider">Total Branch Stock</span>
          <div className="text-3xl font-semibold text-emerald-400">
            {totalStock} Packs
          </div>
        </div>
      </div>

      {/* Batches & Expiry List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 text-sm flex items-center justify-between">
          <span>Batches & FEFO Expiry Schedule</span>
          <span className="text-xs text-slate-500 font-normal">{batches.length} active batches</span>
        </div>

        <div className="divide-y divide-slate-100">
          {batches.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-normal">
              No stock batches found for this product.
            </div>
          ) : (
            batches.map(b => {
              const daysLeft = Math.ceil(
                (new Date(b.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
              );
              const isNearExpiry = daysLeft < 90;

              return (
                <div key={b.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900 text-sm">Batch: {b.batch_number}</span>
                      {isNearExpiry && (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Expiring Soon
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 flex items-center gap-2 font-normal">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Expiry: {b.expiry_date} ({daysLeft} days remaining)</span>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-semibold text-slate-900">
                      Sale Price: <span className="text-emerald-700 font-semibold">Rs. {b.sale_price.toLocaleString()}</span> (Cost: Rs. {b.cost_price})
                    </div>
                    <div className="text-slate-600 font-medium">
                      Current Stock: {b.quantity_current} / {b.quantity_received} units
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
