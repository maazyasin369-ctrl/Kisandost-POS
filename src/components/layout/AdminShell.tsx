'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  Search,
  Moon,
  Sun,
} from 'lucide-react'
import { dataStore } from '@/lib/data-store'
import { SidebarItem } from '@/components/admin/SidebarItem'
import AdminNotificationDropdown from '@/components/layout/AdminNotificationDropdown'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dark, setDark] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthenticated(true)
      return
    }
    const authFlag = localStorage.getItem('super_admin_authenticated')
    if (authFlag !== 'true') {
      setIsAuthenticated(false)
      router.push('/admin/login')
    } else {
      setIsAuthenticated(true)
    }
  }, [pathname, router, isLoginPage])

  useEffect(() => {
    const stored = localStorage.getItem('kd_admin_theme')
    const on = stored === 'dark'
    setDark(on)
    document.documentElement.classList.toggle('dark', on)
  }, [])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  if (isLoginPage) {
    return <main className="min-h-screen">{children}</main>
  }

  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Verifying Super Admin authorization...
      </div>
    )
  }

  const pending = dataStore.getPendingRegistrations().length
  const navItems = [
    { href: '/admin/dashboard', label: 'Platform dashboard', icon: LayoutDashboard },
    { href: '/admin/tenants', label: 'Registered tenant shops', icon: Building2 },
    { href: '/admin/approvals', label: 'Pending approvals', icon: ShieldCheck, badge: pending },
    { href: '/admin/audit-logs', label: 'Platform audit logs', icon: FileText },
  ]

  const handleLogout = () => {
    localStorage.removeItem('super_admin_authenticated')
    router.push('/admin/login')
  }

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const next = !dark
    const root = document.documentElement
    root.style.setProperty('--theme-x', `${event.clientX}px`)
    root.style.setProperty('--theme-y', `${event.clientY}px`)

    const apply = () => {
      setDark(next)
      root.classList.toggle('dark', next)
      localStorage.setItem('kd_admin_theme', next ? 'dark' : 'light')
    }

    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> }
    }
    if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply()
      return
    }

    root.classList.add('kd-theme-anim')
    doc.startViewTransition(apply).finished.finally(() => {
      root.classList.remove('kd-theme-anim')
    })
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/admin/tenants?q=${encodeURIComponent(q)}` : '/admin/tenants')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
      <header className="no-print sticky top-0 z-40 border-b border-border bg-[var(--kd-surface)]">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="rounded-[var(--kd-radius)] p-2 text-muted-foreground lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <Link href="/admin/dashboard" className="flex shrink-0 items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex size-7 overflow-hidden rounded-lg">
              <span className="w-1/2 bg-primary" />
              <span className="w-1/2 bg-accent" />
            </span>
            KisanDost
          </Link>
          <form onSubmit={submitSearch} className="relative mx-auto hidden w-full max-w-md md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dealers"
              className="w-full rounded-[var(--kd-radius)] border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--kd-primary-soft)]"
            />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <AdminNotificationDropdown />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex size-9 items-center justify-center rounded-full border border-border text-foreground hover:bg-[var(--kd-primary-soft)]"
            >
              <span key={dark ? 'sun' : 'moon'} className="kd-theme-icon">
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </span>
            </button>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-[var(--kd-radius)] border border-border px-2 py-1.5 text-sm"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-[var(--kd-primary-soft)] text-xs font-medium text-primary">
                  S
                </span>
                <span className="hidden sm:block">Super Admin</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-max rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] p-1 shadow-[var(--kd-shadow)]">
                  <Link href="/dashboard" className="flex items-center gap-2 whitespace-nowrap rounded-[var(--kd-radius)] px-3 py-2 text-sm hover:bg-[var(--kd-primary-soft)]" onClick={() => setMenuOpen(false)}>
                    <Store className="size-4 shrink-0" />
                    Switch to shop counter
                  </Link>
                  <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-[var(--kd-radius)] px-3 py-2 text-sm text-danger hover:bg-[var(--kd-primary-soft)]">
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative flex flex-1">
        <aside
          className={`no-print fixed bottom-0 left-0 top-14 z-30 hidden border-r border-border bg-[var(--kd-surface)] transition-[width] lg:block ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div className="flex h-full flex-col">
            <div className={`flex h-12 items-center border-b border-border ${isCollapsed ? 'justify-center' : 'justify-between px-3'}`}>
              {!isCollapsed && <span className="text-xs text-muted-foreground">Platform</span>}
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="rounded-[var(--kd-radius)] p-1.5 text-muted-foreground hover:bg-[var(--kd-primary-soft)]"
                aria-label="Collapse sidebar"
              >
                {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
              {navItems.map((item) => (
                <SidebarItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  badge={item.badge}
                  collapsed={isCollapsed}
                  active={pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))}
                />
              ))}
            </nav>
          </div>
        </aside>

        {isMobileOpen && (
          <div className="no-print fixed inset-0 z-[90] flex lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileOpen(false)} />
            <div className="relative z-10 flex h-full w-64 flex-col bg-[var(--kd-surface)] p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Menu</span>
                <button type="button" onClick={() => setIsMobileOpen(false)} aria-label="Close menu">
                  <X className="size-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    badge={item.badge}
                    active={pathname === item.href}
                    onClick={() => setIsMobileOpen(false)}
                  />
                ))}
              </nav>
            </div>
          </div>
        )}

        <main className={`min-w-0 flex-1 transition-[margin] ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
