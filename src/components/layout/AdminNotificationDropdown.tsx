'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  X,
  CreditCard,
  Building2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { dataStore } from '@/lib/data-store';
import { AdminNotification } from '@/lib/types';

export default function AdminNotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    const list = dataStore.getAdminNotifications();
    setNotifications([...list]);
  };

  useEffect(() => {
    loadNotifications();

    // Refresh notifications every 10 seconds or on window focus
    const interval = setInterval(loadNotifications, 10000);
    const handleFocus = () => loadNotifications();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const overdueCount = notifications.filter((n) => n.severity === 'overdue').length;
  const totalCount = notifications.length;

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dataStore.dismissNotification(id);
    loadNotifications();
  };

  const handleNotificationClick = (linkUrl: string) => {
    setIsOpen(false);
    router.push(linkUrl);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className={`relative p-2 rounded-xl transition-all cursor-pointer ${
          isOpen
            ? 'bg-slate-100 text-slate-900 ring-2 ring-slate-300'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <Bell className="w-5 h-5" />

        {/* Badge Indicator */}
        {totalCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center text-white shadow-sm ring-2 ring-white animate-pulse ${
              overdueCount > 0 ? 'bg-red-600' : 'bg-amber-500 text-slate-950 font-extrabold'
            }`}
          >
            {totalCount}
          </span>
        )}
      </button>

      {/* Floating Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header Bar */}
          <div className="bg-slate-950 text-white p-4 px-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                <Bell className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Billing Notifications</span>
                  {overdueCount > 0 && (
                    <span className="bg-red-600 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase">
                      {overdueCount} Overdue
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-400 font-normal">
                  Tenant recurring billing dues &amp; upcoming charges
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of Notifications */}
          <div className="max-h-[75vh] overflow-y-auto divide-y divide-slate-100 p-2 space-y-2">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-900">All Clear!</div>
                <p className="text-2xs text-slate-500 max-w-xs mx-auto">
                  No upcoming recurring billing dues or overdue charges requiring attention.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isOverdue = item.severity === 'overdue';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item.link_url)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 group ${
                      isOverdue
                        ? 'bg-red-50/70 border-red-200 hover:bg-red-100/80 hover:border-red-300'
                        : 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/80 hover:border-amber-300'
                    }`}
                  >
                    {/* Top Status Badge & Close */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 ${
                            isOverdue
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-amber-400 text-slate-950 shadow-2xs'
                          }`}
                        >
                          {isOverdue ? (
                            <>
                              <ShieldAlert className="w-3 h-3" />
                              <span>OVERDUE ESCALATION</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-slate-950" />
                              <span>DUE SOON</span>
                            </>
                          )}
                        </span>

                        <span className="text-[11px] font-semibold text-slate-900 truncate max-w-[150px]">
                          {item.tenant_name}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDismiss(e, item.id)}
                        title="Dismiss alert"
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-white/80 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Notification Message */}
                    <p className={`text-xs leading-snug font-medium ${isOverdue ? 'text-red-950' : 'text-slate-800'}`}>
                      {item.message}
                    </p>

                    {/* Amount & Direct Link */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1 text-slate-700 font-semibold font-mono">
                        <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                        <span>Rs. {item.amount.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-900 group-hover:text-amber-700 group-hover:underline">
                        <span>Open Billing Tab</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="bg-slate-50 p-3 px-4 border-t border-slate-200 flex items-center justify-between text-2xs font-semibold text-slate-600">
            <span>{totalCount} Total Alerts Active</span>
            <Link
              href="/admin/tenants"
              onClick={() => setIsOpen(false)}
              className="text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1"
            >
              <span>View All Tenants</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}
