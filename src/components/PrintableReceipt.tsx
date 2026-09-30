'use client';

import React from 'react';
import { Sale, Tenant, DEFAULT_PRINT_SETTINGS, PrintSettings } from '@/lib/types';
import { dataStore } from '@/lib/data-store';

export type ReceiptType = 'sale' | 'farmer_payment' | 'supplier_payment' | 'day_closing' | 'test_print';

export interface FarmerPaymentData {
  voucher_number: string;
  customer_name: string;
  customer_phone?: string;
  date: string;
  previous_balance: number;
  amount_paid: number;
  new_balance: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  received_by?: string;
}

export interface SupplierPaymentData {
  voucher_number: string;
  supplier_name: string;
  date: string;
  previous_balance: number;
  amount_paid: number;
  new_balance: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
}

export interface DayClosingPrintData {
  closing_date: string;
  recorded_at: string;
  recorded_by: string;
  total_cash_sales: number;
  total_farmer_collections: number;
  expected_cash: number;
  actual_cash: number;
  variance: number;
  notes?: string;
}

interface PrintableReceiptProps {
  type: ReceiptType;
  sale?: Sale;
  farmerPayment?: FarmerPaymentData;
  supplierPayment?: SupplierPaymentData;
  dayClosing?: DayClosingPrintData;
  tenantOverride?: Tenant;
  // Allow overriding print settings if needed (e.g., live preview in settings)
  printSettingsOverride?: Partial<PrintSettings>;
  className?: string;
}

export default function PrintableReceipt({
  type,
  sale,
  farmerPayment,
  supplierPayment,
  dayClosing,
  tenantOverride,
  printSettingsOverride,
  className = '',
}: PrintableReceiptProps) {
  const tenant = tenantOverride ?? dataStore.getTenant();
  const printSettings: PrintSettings = {
    ...DEFAULT_PRINT_SETTINGS,
    ...(tenant.settings?.print_settings ?? {}),
    ...(printSettingsOverride ?? {}),
  };

  const is58mm = printSettings.paper_width === '58mm';
  const widthClass = is58mm ? 'w-[48mm] max-w-[48mm]' : 'w-[72mm] max-w-[72mm]';

  // Base typography sizes scaling for 58mm vs 80mm
  const titleSize = is58mm ? 'text-[12px]' : 'text-[14px]';
  const bodySize = is58mm ? 'text-[10px]' : 'text-[11px]';
  const smallSize = is58mm ? 'text-[9px]' : 'text-[10px]';
  const totalSize = is58mm ? 'text-[13px]' : 'text-[15px]';

  return (
    <div
      id="printable-receipt"
      className={`printable-receipt-root bg-white text-black font-sans leading-tight mx-auto p-1.5 ${widthClass} ${className}`}
      style={{
        color: '#000000',
        backgroundColor: '#ffffff',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Arabic', 'Noto Nastaliq Urdu', sans-serif",
      }}
    >
      {/* ================= HEADER SECTION ================= */}
      <div className="text-center pb-2 border-b-2 border-black space-y-0.5">
        <h1 className={`${titleSize} font-extrabold uppercase tracking-tight text-black`}>
          {tenant.business_name}
        </h1>
        <p className={`${bodySize} font-semibold text-black`}>
          {sale?.branch_name ?? 'Main Outlet'}
        </p>
        <p className={`${smallSize} font-medium text-black`}>
          Phone: {tenant.phone}
        </p>
        {printSettings.show_license && tenant.dealer_license_number && (
          <p className={`${smallSize} font-medium text-black`}>
            Agri Lic #: <span className="font-mono font-bold">{tenant.dealer_license_number}</span>
          </p>
        )}
      </div>

      {/* ================= RECEIPT SPECIFIC CONTENT ================= */}

      {/* 1. SALE RECEIPT (POS or REPRINT) */}
      {(type === 'sale' || type === 'test_print') && (() => {
        const currentSale: Partial<Sale> = type === 'test_print' ? {
          sale_number: 'SALE-TEST-999',
          created_at: new Date().toISOString(),
          sold_by_name: 'Test Staff',
          customer_name: 'Chaudhry Ahmad (Farmer)',
          payment_type: 'partial',
          subtotal: 12500,
          discount_total: 500,
          grand_total: 12000,
          amount_paid: 5000,
          remaining_balance: 7000,
          previous_udhaar_balance: 15000,
          total_udhaar_outstanding: 22000,
          items: [
            {
              id: 'item-1',
              sale_id: 'sale-test',
              batch_id: 'bch-1',
              product_name_snapshot: 'Belt Expert (Spirotetramat) 250ml',
              batch_number: 'BCH-2026-88',
              expiry_date: '2027-06-30',
              quantity: 2,
              unit_price: 3500,
              discount: 0,
              line_total: 7000,
            },
            {
              id: 'item-2',
              sale_id: 'sale-test',
              batch_id: 'bch-2',
              product_name_snapshot: 'NPK Granular 20-20-20 Fertilizer 50kg Bag',
              batch_number: 'BCH-2026-12',
              expiry_date: '2028-12-31',
              quantity: 1,
              unit_price: 5500,
              discount: 0,
              line_total: 5500,
            },
          ],
        } : (sale ?? {});

        const items = currentSale.items ?? [];
        const isCreditSale = currentSale.payment_type === 'credit' || currentSale.payment_type === 'partial';

        return (
          <>
            {/* Sale Meta */}
            <div className={`py-1.5 border-b border-dashed border-black ${smallSize} space-y-0.5`}>
              <div className="flex justify-between font-bold">
                <span>Receipt #:</span>
                <span className="font-mono">{currentSale.sale_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Date/Time:</span>
                <span>
                  {currentSale.created_at
                    ? new Date(currentSale.created_at).toLocaleString('en-PK', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Salesman:</span>
                <span>{currentSale.sold_by_name ?? 'Staff'}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Customer:</span>
                <span>{currentSale.customer_name ?? 'Walk-in Farmer'}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Payment Mode:</span>
                <span className="uppercase">{currentSale.payment_type ?? 'CASH'}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-1.5 border-b border-black">
              <table className={`w-full text-left ${smallSize}`}>
                <thead>
                  <tr className="border-b-2 border-black font-extrabold uppercase">
                    <th className="pb-1 pr-1">Item</th>
                    <th className="pb-1 text-center w-8">Qty</th>
                    <th className="pb-1 text-right tabular-nums w-12">Price</th>
                    <th className="pb-1 text-right tabular-nums w-14">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/30">
                  {items.map((item, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="py-1 pr-1 font-semibold leading-snug break-words">
                        {item.product_name_snapshot}
                        {printSettings.show_batch && (item.batch_number || item.expiry_date) && (
                          <span className="block text-[8px] font-mono font-normal">
                            B:{item.batch_number ?? '—'} E:{item.expiry_date ?? '—'}
                          </span>
                        )}
                      </td>
                      <td className="py-1 text-center font-bold">{item.quantity}</td>
                      <td className="py-1 text-right font-mono tabular-nums">{item.unit_price}</td>
                      <td className="py-1 text-right font-mono font-bold tabular-nums">
                        {item.line_total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className={`py-1.5 border-b-2 border-black ${bodySize} space-y-1`}>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono tabular-nums">Rs. {(currentSale.subtotal ?? 0).toLocaleString()}</span>
              </div>

              {(currentSale.discount_total ?? 0) > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Discount:</span>
                  <span className="font-mono tabular-nums">- Rs. {(currentSale.discount_total ?? 0).toLocaleString()}</span>
                </div>
              )}

              <div className={`flex justify-between font-extrabold ${totalSize} pt-1 border-t-2 border-black`}>
                <span>GRAND TOTAL:</span>
                <span className="font-mono tabular-nums">Rs. {(currentSale.grand_total ?? 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between font-semibold pt-0.5">
                <span>Cash Paid Now:</span>
                <span className="font-mono tabular-nums">Rs. {(currentSale.amount_paid ?? 0).toLocaleString()}</span>
              </div>

              {/* Udhaar / Balance lines */}
              {isCreditSale && (
                <div className="pt-1 mt-1 border-t border-dashed border-black space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span>This Sale Udhaar:</span>
                    <span className="font-mono tabular-nums">Rs. {(currentSale.remaining_balance ?? 0).toLocaleString()}</span>
                  </div>

                  {(currentSale.previous_udhaar_balance ?? 0) > 0 && (
                    <div className="flex justify-between font-medium">
                      <span>Previous Udhaar:</span>
                      <span className="font-mono tabular-nums">Rs. {(currentSale.previous_udhaar_balance ?? 0).toLocaleString()}</span>
                    </div>
                  )}

                  {(currentSale.total_udhaar_outstanding ?? (currentSale.remaining_balance || 0)) > 0 && (
                    <div className="flex justify-between font-extrabold text-[12px] pt-0.5 border-t border-black">
                      <span>Total Farmer Udhaar:</span>
                      <span className="font-mono tabular-nums">
                        Rs. {(currentSale.total_udhaar_outstanding ?? ((currentSale.previous_udhaar_balance || 0) + (currentSale.remaining_balance || 0))).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* 2. FARMER UDHAAR PAYMENT COLLECTION SLIP */}
      {type === 'farmer_payment' && farmerPayment && (
        <>
          <div className={`py-1.5 border-b border-dashed border-black ${smallSize} space-y-0.5`}>
            <div className="text-center font-extrabold text-[12px] uppercase py-0.5 bg-black text-white mb-1">
              FARMER UDHAAR PAYMENT RECEIPT
            </div>
            <div className="flex justify-between font-bold">
              <span>Voucher #:</span>
              <span className="font-mono">{farmerPayment.voucher_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Date/Time:</span>
              <span>{farmerPayment.date}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Farmer Name:</span>
              <span>{farmerPayment.customer_name}</span>
            </div>
            {farmerPayment.customer_phone && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span>{farmerPayment.customer_phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Method:</span>
              <span className="uppercase font-semibold">{farmerPayment.payment_method}</span>
            </div>
            {farmerPayment.reference_number && (
              <div className="flex justify-between">
                <span>Ref / Cheque #:</span>
                <span className="font-mono">{farmerPayment.reference_number}</span>
              </div>
            )}
          </div>

          <div className={`py-2 border-b-2 border-black ${bodySize} space-y-1`}>
            <div className="flex justify-between">
              <span>Previous Udhaar Balance:</span>
              <span className="font-mono tabular-nums">Rs. {farmerPayment.previous_balance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-extrabold text-[13px] py-1 border-y border-black">
              <span>AMOUNT COLLECTED:</span>
              <span className="font-mono tabular-nums">Rs. {farmerPayment.amount_paid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold pt-0.5">
              <span>REMAINING UDHAAR BALANCE:</span>
              <span className="font-mono tabular-nums">Rs. {farmerPayment.new_balance.toLocaleString()}</span>
            </div>
          </div>
        </>
      )}

      {/* 3. SUPPLIER PAYMENT SLIP */}
      {type === 'supplier_payment' && supplierPayment && (
        <>
          <div className={`py-1.5 border-b border-dashed border-black ${smallSize} space-y-0.5`}>
            <div className="text-center font-extrabold text-[12px] uppercase py-0.5 bg-black text-white mb-1">
              SUPPLIER PAYMENT VOUCHER
            </div>
            <div className="flex justify-between font-bold">
              <span>Voucher #:</span>
              <span className="font-mono">{supplierPayment.voucher_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{supplierPayment.date}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Supplier:</span>
              <span>{supplierPayment.supplier_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Method:</span>
              <span className="uppercase font-semibold">{supplierPayment.payment_method}</span>
            </div>
            {supplierPayment.reference_number && (
              <div className="flex justify-between">
                <span>Ref #:</span>
                <span className="font-mono">{supplierPayment.reference_number}</span>
              </div>
            )}
          </div>

          <div className={`py-2 border-b-2 border-black ${bodySize} space-y-1`}>
            <div className="flex justify-between">
              <span>Previous Payable:</span>
              <span className="font-mono tabular-nums">Rs. {supplierPayment.previous_balance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-extrabold text-[13px] py-1 border-y border-black">
              <span>PAYMENT PAID:</span>
              <span className="font-mono tabular-nums">Rs. {supplierPayment.amount_paid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold pt-0.5">
              <span>REMAINING PAYABLE:</span>
              <span className="font-mono tabular-nums">Rs. {supplierPayment.new_balance.toLocaleString()}</span>
            </div>
          </div>
        </>
      )}

      {/* 4. DAY CLOSING SUMMARY SLIP */}
      {type === 'day_closing' && dayClosing && (
        <>
          <div className={`py-1.5 border-b border-dashed border-black ${smallSize} space-y-0.5`}>
            <div className="text-center font-extrabold text-[12px] uppercase py-0.5 bg-black text-white mb-1">
              DAILY CASH REGISTER CLOSING
            </div>
            <div className="flex justify-between font-bold">
              <span>Closing Date:</span>
              <span className="font-mono">{dayClosing.closing_date}</span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span>{dayClosing.recorded_at}</span>
            </div>
            <div className="flex justify-between">
              <span>Manager:</span>
              <span>{dayClosing.recorded_by}</span>
            </div>
          </div>

          <div className={`py-2 border-b-2 border-black ${bodySize} space-y-1`}>
            <div className="flex justify-between">
              <span>System Cash Sales:</span>
              <span className="font-mono tabular-nums">Rs. {dayClosing.total_cash_sales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Farmer Cash Recoveries:</span>
              <span className="font-mono tabular-nums">Rs. {dayClosing.total_farmer_collections.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-black pt-1">
              <span>TOTAL EXPECTED CASH:</span>
              <span className="font-mono tabular-nums">Rs. {dayClosing.expected_cash.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-extrabold text-[13px] py-1 border-y border-black">
              <span>ACTUAL COUNTED CASH:</span>
              <span className="font-mono tabular-nums">Rs. {dayClosing.actual_cash.toLocaleString()}</span>
            </div>
            <div className={`flex justify-between font-extrabold ${dayClosing.variance === 0 ? 'text-black' : dayClosing.variance < 0 ? 'text-black font-mono' : 'text-black font-mono'}`}>
              <span>CASH VARIANCE:</span>
              <span className="font-mono tabular-nums">
                {dayClosing.variance === 0
                  ? 'Rs. 0 (MATCHED)'
                  : dayClosing.variance < 0
                  ? `- Rs. ${Math.abs(dayClosing.variance).toLocaleString()} (SHORT)`
                  : `+ Rs. ${dayClosing.variance.toLocaleString()} (EXCESS)`}
              </span>
            </div>
          </div>
        </>
      )}

      {/* ================= FOOTER SECTION ================= */}
      <div className="text-center pt-2 space-y-1">
        <p className={`${smallSize} font-bold leading-relaxed text-black`} dir="auto">
          {printSettings.footer_message || 'جزاك اللهُ خيرًا — Powered by KisanDost'}
        </p>
        <p className="text-[8px] font-mono text-black font-medium">
          Software: KisanDost POS • Support: +92 300 1234567
        </p>
      </div>
    </div>
  );
}
