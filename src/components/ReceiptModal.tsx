'use client';

import React from 'react';
import { Sale } from '@/lib/types';
import { Printer, Share2, Download, CheckCircle, X } from 'lucide-react';
import { dataStore } from '@/lib/data-store';

interface ReceiptProps {
  sale: Sale;
  onClose: () => void;
}

export default function ReceiptModal({ sale, onClose }: ReceiptProps) {
  const tenant = dataStore.getTenant();

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const itemsSummary = (sale.items ?? []).map(item =>
      `• ${item.product_name_snapshot} (${item.quantity} x Rs. ${item.unit_price.toLocaleString()}) = Rs. ${item.line_total.toLocaleString()}`
    ).join('\n');

    const text = `*RECEIPT / PARCHI - ${tenant.business_name}*\n` +
      `Sale #: ${sale.sale_number}\n` +
      `Date: ${new Date(sale.created_at).toLocaleString('en-PK')}\n` +
      `Branch: ${sale.branch_name ?? 'Main Outlet'}\n` +
      `Salesman: ${sale.sold_by_name ?? 'Staff'}\n` +
      `Dealer Lic #: ${tenant.dealer_license_number}\n` +
      `--------------------------------\n` +
      `Customer: ${sale.customer_name ?? 'Walk-in Farmer'}\n` +
      `--------------------------------\n` +
      `*Items Purchased:*\n${itemsSummary || '• General Products'}\n` +
      `--------------------------------\n` +
      `Subtotal: Rs. ${sale.subtotal.toLocaleString()}\n` +
      (sale.discount_total > 0 ? `Discount: -Rs. ${sale.discount_total.toLocaleString()}\n` : '') +
      `*Grand Total: Rs. ${sale.grand_total.toLocaleString()}*\n` +
      `Amount Paid: Rs. ${sale.amount_paid.toLocaleString()}\n` +
      ((sale.remaining_balance || 0) > 0 ? `*Remaining Udhaar: Rs. ${(sale.remaining_balance || 0).toLocaleString()}*\n` : '') +
      `--------------------------------\n` +
      `Thank you for choosing ${tenant.business_name}!\n` +
      `جزاك اللهُ خيرًا — Powered by KisanDost`;

    const encoded = encodeURIComponent(text);
    const phone = sale.customer_phone ? sale.customer_phone.replace(/[^0-9]/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const handlePDFExport = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt_${sale.sale_number}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: 'Courier New', monospace; font-size: 11px; padding: 4mm; margin: 0; width: 80mm; color: #000; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .dashed { border-bottom: 1px dashed #444; padding-bottom: 6px; margin-bottom: 6px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 4px; }
          th { border-bottom: 1px solid #000; text-align: left; }
          td { padding: 2px 0; }
        </style>
      </head>
      <body>
        <div class="center dashed">
          <div style="font-size: 14px; font-weight: bold; text-transform: uppercase;">${tenant.business_name}</div>
          <div>${sale.branch_name ?? 'Main Branch'}</div>
          <div>Lic #: ${tenant.dealer_license_number}</div>
          <div>Phone: ${tenant.phone}</div>
        </div>
        <div class="dashed">
          <div class="row"><span>Receipt #:</span><span class="bold">${sale.sale_number}</span></div>
          <div class="row"><span>Date/Time:</span><span>${new Date(sale.created_at).toLocaleString('en-PK')}</span></div>
          <div class="row"><span>Salesman:</span><span>${sale.sold_by_name ?? 'Staff'}</span></div>
          <div class="row"><span>Customer:</span><span class="bold">${sale.customer_name ?? 'Walk-in'}</span></div>
          <div class="row"><span>Payment:</span><span class="bold" style="text-transform: uppercase;">${sale.payment_type}</span></div>
        </div>
        <div class="dashed">
          <table>
            <thead>
              <tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th><th style="text-align:right;">Total</th></tr>
            </thead>
            <tbody>
              ${(sale.items ?? []).map(i => `
                <tr>
                  <td>${i.product_name_snapshot}<br><small style="color:#555;">Batch: ${i.batch_number ?? ''} (Exp: ${i.expiry_date ?? ''})</small></td>
                  <td style="text-align:center;">${i.quantity}</td>
                  <td style="text-align:right;">${i.unit_price}</td>
                  <td style="text-align:right;">${i.line_total.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="dashed">
          <div class="row"><span>Subtotal:</span><span>Rs. ${sale.subtotal.toLocaleString()}</span></div>
          ${sale.discount_total > 0 ? `<div class="row" style="color:red;"><span>Discount:</span><span>-Rs. ${sale.discount_total.toLocaleString()}</span></div>` : ''}
          <div class="row bold" style="font-size: 12px; margin-top: 4px; border-top: 1px solid #000; padding-top: 2px;">
            <span>GRAND TOTAL:</span><span>Rs. ${sale.grand_total.toLocaleString()}</span>
          </div>
          <div class="row"><span>Cash Paid:</span><span>Rs. ${sale.amount_paid.toLocaleString()}</span></div>
          ${(sale.remaining_balance || 0) > 0 ? `<div class="row bold" style="color: #b45309;"><span>Udhaar Added:</span><span>Rs. ${(sale.remaining_balance || 0).toLocaleString()}</span></div>` : ''}
        </div>
        <div class="center" style="font-size: 9px; margin-top: 8px; color: #555;">
          <p>Please check your items before leaving counter.</p>
          <p>Keep this receipt for expiry guarantee & returns.</p>
          <p style="font-weight: bold; color: #000;">جزاك اللهُ خيرًا — Powered by KisanDost</p>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
    } else {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${sale.sale_number}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-emerald-200 animate-in fade-in zoom-in duration-200">
        
        {/* Header Action Toolbar (hidden on print) */}
        <div className="bg-emerald-900 text-white p-4 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <span className="font-bold text-sm">Sale Receipt ({sale.sale_number})</span>
          </div>
          <button onClick={onClose} className="text-emerald-300 hover:text-white p-1 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex flex-wrap gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-sm cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Thermal (80mm)</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-sm cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            <span>Share WhatsApp</span>
          </button>

          <button
            onClick={handlePDFExport}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>PDF Export</span>
          </button>
        </div>

        {/* 80mm Thermal Receipt Content View */}
        <div className="p-6 bg-slate-50 flex justify-center">
          <div
            id="thermal-receipt"
            className="bg-white p-4 shadow-sm border border-slate-200 rounded w-[80mm] text-slate-900 font-mono text-[11px] leading-tight"
          >
            <div className="text-center pb-2 border-b border-dashed border-slate-400">
              <h2 className="font-extrabold text-sm uppercase tracking-wide text-black">{tenant.business_name}</h2>
              <p className="text-[10px] text-slate-700">{sale.branch_name ?? 'Main Branch'}</p>
              <p className="text-[9px] text-slate-600">Lic #: {tenant.dealer_license_number}</p>
              <p className="text-[9px] text-slate-600">Phone: {tenant.phone}</p>
            </div>

            <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">{sale.sale_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Date/Time:</span>
                <span>{new Date(sale.created_at).toLocaleString('en-PK')}</span>
              </div>
              <div className="flex justify-between">
                <span>Salesman:</span>
                <span>{sale.sold_by_name ?? 'Staff'}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold">{sale.customer_name ?? 'Walk-in Farmer'}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="uppercase font-bold">{sale.payment_type}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-2 border-b border-dashed border-slate-400">
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="pb-1">Item</th>
                    <th className="pb-1 text-center">Qty</th>
                    <th className="pb-1 text-right">Price</th>
                    <th className="pb-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1 pr-1 font-sans text-[10px] leading-tight font-medium">
                        {item.product_name_snapshot}
                        <span className="block text-[8px] text-slate-500 font-mono">
                          Batch: {item.batch_number ?? 'BCH-001'} (Exp: {item.expiry_date ?? '2026-12-31'})
                        </span>
                      </td>
                      <td className="py-1 text-center font-bold">{item.quantity}</td>
                      <td className="py-1 text-right">{item.unit_price}</td>
                      <td className="py-1 text-right font-bold">{item.line_total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rs. {sale.subtotal.toLocaleString()}</span>
              </div>
              {sale.discount_total > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>- Rs. {sale.discount_total.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-slate-300">
                <span>GRAND TOTAL:</span>
                <span>Rs. {sale.grand_total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cash Paid:</span>
                <span>Rs. {sale.amount_paid.toLocaleString()}</span>
              </div>
              {(sale.remaining_balance || 0) > 0 && (
                <div className="flex justify-between font-bold text-amber-800 pt-0.5">
                  <span>Udhaar Added:</span>
                  <span>Rs. {(sale.remaining_balance || 0).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="text-center pt-3 text-[9px] text-slate-500 font-sans italic space-y-1">
              <p>Please check your items before leaving counter.</p>
              <p>Keep this receipt for expiry guarantee & returns.</p>
              <p className="font-bold text-slate-800">جزاك اللهُ خيرًا — Powered by KisanDost</p>
            </div>
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-right no-print">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-1.5 px-4 rounded-lg text-xs cursor-pointer"
          >
            Done &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
