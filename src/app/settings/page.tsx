'use client';

import React, { useState } from 'react';
import { dataStore } from '@/lib/data-store';
import { Settings, ShieldCheck, Store, Printer, Save, CheckCircle, Info } from 'lucide-react';
import { PrintSettings, DEFAULT_PRINT_SETTINGS } from '@/lib/types';
import PrintableReceipt from '@/components/PrintableReceipt';
import { usePrintReceipt } from '@/lib/use-print-receipt';
import { useToast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const [tenant, setTenant] = useState(() => dataStore.getTenant());
  const { triggerPrint } = usePrintReceipt();
  const { showToast } = useToast();

  const [printSettings, setPrintSettings] = useState<PrintSettings>(() => ({
    ...DEFAULT_PRINT_SETTINGS,
    ...(tenant.settings?.print_settings ?? {}),
  }));

  const handleBranchModeChange = (mode: 'consolidated' | 'independent' | 'hybrid') => {
    const updated = dataStore.updateTenantSettings({ branch_mode: mode });
    setTenant({ ...updated });
    showToast('Branch view mode updated successfully!', 'success');
  };

  const handleSavePrintSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = dataStore.updateTenantSettings({
      print_settings: printSettings,
    });
    setTenant({ ...updated });
    showToast('Thermal receipt print settings saved!', 'success');
  };

  const handleTestPrint = () => {
    // Save settings before test print
    dataStore.updateTenantSettings({
      print_settings: printSettings,
    });
    triggerPrint();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
          <div className="p-2 bg-slate-950 rounded-xl text-amber-400">
            <Settings className="h-5 w-5" />
          </div>
          <span>SaaS Tenant Settings &amp; Shop Profile</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Manage shop dealer license details, subscription status, and thermal receipt printer settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pesticide License Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="font-extrabold text-base text-slate-900 flex items-center space-x-2 border-b pb-2">
            <Store className="h-5 w-5 text-emerald-700" />
            <span>Pesticide License &amp; Business Details</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 font-bold mb-0.5">Shop Business Name:</label>
              <div className="font-extrabold text-slate-900 text-sm">{tenant.business_name}</div>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-0.5">Owner Name:</label>
              <div className="font-bold text-slate-800">{tenant.owner_name}</div>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-0.5">Agri Dealer License Number:</label>
              <div className="font-mono font-bold text-emerald-800">{tenant.dealer_license_number}</div>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-0.5">License Expiry Date:</label>
              <div className="font-bold text-slate-800">{tenant.license_expiry_date}</div>
            </div>
          </div>
        </div>

        {/* Subscription & Branch Mode Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="font-extrabold text-base text-slate-900 flex items-center space-x-2 border-b pb-2">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
            <span>SaaS Subscription &amp; Multi-Branch Mode</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 font-bold mb-0.5">Subscription Status:</label>
              <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded uppercase">
                {tenant.subscription_status} Plan
              </span>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-0.5">Branch View Mode Configuration:</label>
              <select
                value={tenant.settings.branch_mode}
                onChange={(e) => handleBranchModeChange(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded font-bold bg-slate-50 text-slate-900"
              >
                <option value="consolidated">🌐 Consolidated (All Branches Combined)</option>
                <option value="independent">📍 Independent (Per-Branch Isolation)</option>
                <option value="hybrid">⚡ Hybrid (Owner Choice)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ================= THERMAL RECEIPT PRINTER SETTINGS ================= */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-slate-950 text-amber-400 rounded-xl">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900">
                Thermal Receipt Printer Configuration (80mm / 58mm)
              </h2>
              <p className="text-2xs text-slate-500">
                Customize roll paper width, batch display, license header, and test thermal print hardware.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestPrint}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Test Thermal Print</span>
          </button>
        </div>

        {/* Printer Driver Advice Alert */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-xs text-amber-900">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-950">Important Printer Setup Guidelines for Shop Owners:</h4>
            <ul className="list-disc pl-4 space-y-0.5 text-2xs text-amber-900 font-medium">
              <li><strong>Chrome Print Dialog:</strong> Set <code>Destination</code> to your thermal printer (e.g. Xprinter, POS-80, Epson).</li>
              <li><strong>Paper Size:</strong> Select <code>80mm Roll</code> (or <code>58mm Roll</code>) in printer properties — NOT A4 or Letter.</li>
              <li><strong>Margins:</strong> Set Chrome margins to <code>None</code>.</li>
              <li><strong>Scale:</strong> Set scale to <code>100%</code>.</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Settings Form Controls */}
          <form onSubmit={handleSavePrintSettings} className="lg:col-span-7 space-y-5">
            {/* Paper Width Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thermal Paper Roll Width:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPrintSettings((prev) => ({ ...prev, paper_width: '80mm' }))}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    printSettings.paper_width === '80mm'
                      ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500 text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">80mm Paper (Standard)</div>
                    <div className="text-[10px] text-slate-500 font-normal">72mm printable content width</div>
                  </div>
                  {printSettings.paper_width === '80mm' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setPrintSettings((prev) => ({ ...prev, paper_width: '58mm' }))}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    printSettings.paper_width === '58mm'
                      ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500 text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">58mm Paper (Mini Roll)</div>
                    <div className="text-[10px] text-slate-500 font-normal">48mm printable content width</div>
                  </div>
                  {printSettings.paper_width === '58mm' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                </button>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printSettings.show_license}
                  onChange={(e) => setPrintSettings((prev) => ({ ...prev, show_license: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Print Dealer License Number in Receipt Header
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printSettings.show_batch}
                  onChange={(e) => setPrintSettings((prev) => ({ ...prev, show_batch: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Print Batch Number &amp; Expiry Date under Item Names
                </span>
              </label>
            </div>

            {/* Footer Message */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Receipt Footer Message (Supports English &amp; Urdu):
              </label>
              <textarea
                rows={2}
                value={printSettings.footer_message}
                onChange={(e) => setPrintSettings((prev) => ({ ...prev, footer_message: e.target.value }))}
                placeholder="e.g. جزاك اللهُ خيرًا — Thank you for choosing KisanDost"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Copies Count */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Default Number of Copies:</label>
              <input
                type="number"
                min={1}
                max={5}
                value={printSettings.copies}
                onChange={(e) => setPrintSettings((prev) => ({ ...prev, copies: parseInt(e.target.value) || 1 }))}
                className="w-32 p-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="bg-slate-950 hover:bg-slate-800 text-amber-400 font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Receipt Print Settings</span>
              </button>
            </div>
          </form>

          {/* Live Thermal Receipt Preview Box */}
          <div className="lg:col-span-5 flex flex-col items-center justify-start bg-slate-100 p-4 rounded-xl border border-slate-200">
            <span className="text-2xs font-extrabold text-slate-500 uppercase tracking-widest mb-3">
              Live Thermal Receipt Preview
            </span>
            <div className="bg-white p-2 shadow-md border border-slate-300 rounded max-w-full">
              <PrintableReceipt
                type="test_print"
                printSettingsOverride={printSettings}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
