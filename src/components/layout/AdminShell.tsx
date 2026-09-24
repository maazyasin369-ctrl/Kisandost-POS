'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Menu,
  X,
  Store,
  Bell,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthenticated(true);
      return;
    }
    const authFlag = localStorage.getItem('super_admin_authenticated');
    if (authFlag !== 'true') {
      setIsAuthenticated(false);
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router, isLoginPage]);

  if (isLoginPage) {
    return <main className="min-h-screen bg-[#F4F7FB]">{children}</main>;
  }

  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center text-slate-900 text-xs font-bold">
        Verifying Super Admin Authorization...
      </div>
    );
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Platform Dashboard', icon: LayoutDashboard },
    { href: '/admin/tenants', label: 'Registered Tenant Shops', icon: Building2 },
    { href: '/admin/approvals', label: 'Pending Approvals', icon: ShieldCheck, badge: 3 },
    { href: '/admin/audit-logs', label: 'Platform Audit Logs', icon: FileText },
  ];

  const handleLogout = () => {
    localStorage.removeItem('super_admin_authenticated');
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-slate-900 font-jakarta antialiased">
      {/* Super Admin Top Header matching Screenshot */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-2xs no-print">
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          
          {/* Brand Badge */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* Dark Curved Brand Badge */}
            <div className="bg-[#051329] text-white px-4 py-2 rounded-2xl flex items-center space-x-3 shadow-md border border-[#0B2347]">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V7l-9-5zm0 4a3 3 0 110 6 3 3 0 010-6zm0 14.3c-2.5-1-4.7-2.9-5.8-5.3 1.9-1.3 4.2-2 5.8-2s3.9.7 5.8 2c-1.1 2.4-3.3 4.3-5.8 5.3z"/>
                </svg>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>KisanDost</span>
                  <span className="bg-slate-800 text-blue-300 border border-blue-400/30 text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    SUPER ADMIN
                  </span>
                </div>
                <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">
                  MULTI-TENANT SAAS OPERATIONS CENTER
                </div>
              </div>
            </div>
          </div>

          {/* Right Header Controls matching Screenshot */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Bell Icon with Red Dot */}
            <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            {/* Administrator Profile Pill */}
            <div className="hidden sm:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                M
              </div>
              <div className="text-left text-2xs leading-tight">
                <div className="font-extrabold text-slate-900">Super Admin</div>
                <div className="text-slate-500 font-semibold">Administrator</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Switch to Counter Button */}
            <Link
              href="/dashboard"
              className="hidden md:flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-300 transition-colors shadow-2xs"
            >
              <Store className="w-4 h-4 text-blue-600" />
              <span>Switch to Shop Counter</span>
            </Link>

            {/* Sign Out Button matching Screenshot */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 relative">
        {/* Desktop Sidebar matching Screenshot */}
        <aside
          className={`hidden lg:block fixed top-16 bottom-0 left-0 z-30 transition-[width] duration-200 ease-in-out no-print bg-white text-slate-900 border-r border-slate-200 shadow-sm ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div className="flex flex-col h-full select-none overflow-hidden relative">
            {/* Header */}
            <div className={`h-14 flex items-center shrink-0 border-b border-slate-200 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
              {!isCollapsed && (
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-2xs font-bold uppercase tracking-widest text-slate-700">
                    SUPER ADMIN CONTROLS
                  </span>
                </div>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-auto border border-slate-200 cursor-pointer"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Nav Items */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={`
                      relative group flex items-center gap-3 rounded-xl text-xs transition-all duration-150
                      ${isCollapsed ? 'justify-center px-0 py-3' : 'px-3.5 py-3'}
                      ${active
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-600 font-bold hover:bg-slate-100 hover:text-slate-900'
                      }
                    `}
                  >
                    <Icon
                      className={`shrink-0 w-4 h-4 ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`}
                      strokeWidth={2.2}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                    {!isCollapsed && item.badge && (
                      <span className="ml-auto text-[10px] font-semibold bg-red-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Bottom Operator Status Badge */}
            <div className="shrink-0 border-t border-slate-200 p-3 bg-slate-50/80">
              {!isCollapsed ? (
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-2xs shadow-2xs">
                  <div className="flex items-center space-x-2 font-bold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-extrabold text-xs text-slate-900">System Operator Active</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    All systems are running smoothly. Platform is active and secure.
                  </p>
                </div>
              ) : (
                <div className="flex justify-center p-1 text-emerald-600" title="System Operator Active">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {isMobileOpen && (
          <div className="lg:hidden fixed inset-0 z-[90] flex no-print">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 max-w-[85vw] h-full z-10 bg-[#061226] p-4 space-y-4 text-white">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase text-blue-400">Super Admin Menu</span>
                <button onClick={() => setIsMobileOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold ${
                        active ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" strokeWidth={2} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-semibold bg-red-500 text-white px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Workspace */}
        <main
          className={`flex-1 min-w-0 transition-[margin] duration-200 ease-in-out bg-[#F4F7FB] ${
            isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          }`}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
