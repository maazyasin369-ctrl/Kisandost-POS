'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast { id: string; message: string; type: ToastType; }
interface ToastCtx { showToast: (msg: string, type?: ToastType) => void; }

const Ctx = createContext<ToastCtx | undefined>(undefined);

const toastConfig = {
  success: {
    icon: CheckCircle2,
    classes: 'bg-emerald-900 border-emerald-700 text-white',
    iconClass: 'text-emerald-300',
  },
  error: {
    icon: AlertTriangle,
    classes: 'bg-status-alert-text border-red-800 text-white',
    iconClass: 'text-red-200',
  },
  info: {
    icon: Info,
    classes: 'bg-ink border-stone-700 text-white',
    iconClass: 'text-status-info-text',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <Ctx.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none no-print">
        {toasts.map(t => {
          const cfg = toastConfig[t.type];
          const Icon = cfg.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-modal text-xs font-semibold animate-fade-in-up ${cfg.classes}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${cfg.iconClass}`} strokeWidth={1.75} />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
