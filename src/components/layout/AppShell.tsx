'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TopHeader from './TopHeader';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState('all');

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
    return <main className="min-h-screen bg-slate-950">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-jakarta antialiased">
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
        className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-slate-950 hover:bg-slate-900 active:bg-black text-amber-400 shadow-md ring-2 ring-white hover:scale-110 active:scale-95 cursor-pointer no-print"
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
        <TopHeader
          onToggleMobileSidebar={() => setIsMobileOpen(true)}
          selectedBranchId={selectedBranchId}
          onSelectBranch={setSelectedBranchId}
        />

        {/* Main workspace */}
        <main className="flex-1 min-w-0 bg-white">
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
