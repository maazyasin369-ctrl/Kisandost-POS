'use client';

import React from 'react';
import { Sale, Tenant } from '@/lib/types';
import { Printer, Share2, Download, CheckCircle, X } from 'lucide-react';
import { dataStore } from '@/lib/data-store';
import PrintableReceipt from './PrintableReceipt';
import { usePrintReceipt } from '@/lib/use-print-receipt';

interface ReceiptProps {
  sale: Sale;
  onClose: () => void;
  tenantOverride?: Tenant | null;
}

export default function ReceiptModal({ sale, onClose, tenantOverride }: ReceiptProps) {
  const tenant = tenantOverride ?? dataStore.getTenant();
  const { triggerPrint } = usePrintReceipt();

  const handlePrint = () => {
    triggerPrint();
  };

  const handleWhatsAppShare = () => {
    const itemsSummary = (sale.items ?? [])
      .map(
        (item) =>
          `• ${item.product_name_snapshot} (${item.quantity} x Rs. ${item.unit_price.toLocaleString()}) = Rs. ${item.line_total.toLocaleString()}`
      )
      .join('\n');

    const text =
      `*RECEIPT / PARCHI - ${tenant.business_name}*\n` +
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
      ((sale.remaining_balance || 0) > 0
        ? `*Remaining Udhaar: Rs. ${(sale.remaining_balance || 0).toLocaleString()}*\n`
        : '') +
      `--------------------------------\n` +
      `Thank you for choosing ${tenant.business_name}!\n` +
      `جزاك اللهُ خيرًا — Powered by KisanDost`;

    const encoded = encodeURIComponent(text);
    const phone = sale.customer_phone ? sale.customer_phone.replace(/[^0-9]/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const handlePDFExport = () => {
    const receiptElement = document.getElementById('printable-receipt');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt_${sale.sale_number}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: Inter, system-ui, -apple-system, sans-serif; margin: 0; padding: 4mm; background: #fff; color: #000; display: flex; justify-content: center; }
          .printable-receipt-root { width: 72mm; margin: 0 auto; }
          .tabular-nums { font-variant-numeric: tabular-nums; }
        </style>
      </head>
      <body>
        ${receiptElement ? receiptElement.outerHTML : ''}
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[var(--kd-surface)] rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-primary/20 animate-in fade-in zoom-in duration-200 my-auto">
        {/* Header Action Toolbar (hidden on print) */}
        <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">Sale Receipt ({sale.sale_number})</span>
          </div>
          <button onClick={onClose} className="text-primary hover:text-white p-1 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Buttons (hidden on print) */}
        <div className="p-3 bg-[var(--kd-primary-soft)] border-b border-emerald-100 flex flex-wrap gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 bg-primary text-primary-foreground hover:opacity-90 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-[var(--kd-shadow)] cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Thermal ({tenant.settings?.print_settings?.paper_width ?? '80mm'})</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="flex-1 bg-primary hover:bg-primary text-primary-foreground text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-[var(--kd-shadow)] cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            <span>Share WhatsApp</span>
          </button>

          <button
            onClick={handlePDFExport}
            className="bg-[var(--kd-surface)] border border-border hover:bg-[var(--kd-primary-soft)] text-foreground font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </button>
        </div>

        {/* Receipt Content Container - Exact layout used for both screen modal and print */}
        <div className="p-4 bg-background/70 flex justify-center max-h-[70vh] overflow-y-auto">
          <div className="bg-[var(--kd-surface)] shadow-md border border-border p-2 rounded">
            <PrintableReceipt type="sale" sale={sale} tenantOverride={tenant} />
          </div>
        </div>

        {/* Footer Close Button (hidden on print) */}
        <div className="p-3 bg-background border-t border-border text-right no-print">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:opacity-90 text-white font-semibold py-1.5 px-4 rounded-lg text-xs cursor-pointer"
          >
            Done &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
