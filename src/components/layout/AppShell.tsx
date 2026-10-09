'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TopHeader from './TopHeader';
import Sidebar from './Sidebar';
import { ShopChromeProvider } from './ShopChrome';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // POS gets maximum counter workspace — collapse sidebar automatically
  useEffect(() => {
    setIsCollapsed(pathname === '/pos');
  }, [pathname]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Auth routes & Super Admin routes render without shop tenant chrome
  if (pathname === '/login' || pathname === '/signup' || pathname.startsWith('/admin')) {
    return <main className="min-h-screen bg-background text-foreground">{children}</main>;
  }

  return (
    <ShopChromeProvider>
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Full-height sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Sidebar collapse toggle — fixed at root level, nothing can block it */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'fixed',
          top: '32px',
          left: isCollapsed ? '64px' : '256px',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          transition: 'left 200ms ease-in-out',
        }}
        className="hidden lg:flex size-8 cursor-pointer items-center justify-center rounded-full border border-border bg-[var(--kd-surface)] text-foreground shadow-[var(--kd-shadow)] no-print"
      >
        {isCollapsed
          ? <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
          : <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />}
      </button>

      {/* Right-hand column: header + main content, offset by sidebar width */}
      <div
        className={`flex flex-col min-h-screen transition-[padding] duration-200 ease-in-out ${
          isCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        <Suspense fallback={<div className="h-16 border-b border-border bg-[var(--kd-surface)]" />}>
          <TopHeader
            onToggleMobileSidebar={() => setIsMobileOpen(true)}
          />
        </Suspense>

        {/* Main workspace */}
        <main className="min-w-0 flex-1 bg-background">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
    </ShopChromeProvider>
  );
}
