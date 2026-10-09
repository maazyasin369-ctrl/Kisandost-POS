'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, X } from 'lucide-react'
import { dataStore } from '@/lib/data-store'
import { AdminNotification } from '@/lib/types'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { formatPkr } from '@/components/admin/format'

export default function AdminNotificationDropdown() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const loadNotifications = () => {
    setNotifications([...dataStore.getAdminNotifications()])
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 10000)
    const handleFocus = () => loadNotifications()
    window.addEventListener('focus', handleFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const overdueCount = notifications.filter((n) => n.severity === 'overdue').length
  const totalCount = notifications.length

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    dataStore.dismissNotification(id)
    loadNotifications()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Notifications"
        className="relative rounded-[var(--kd-radius)] p-2 text-muted-foreground hover:bg-[var(--kd-primary-soft)] hover:text-foreground"
      >
        <Bell className="size-5" />
        {totalCount > 0 && (
          <span className={`absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium text-white ${overdueCount > 0 ? 'bg-danger' : 'bg-accent'}`}>
            {totalCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] shadow-[var(--kd-shadow)] sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Billing</h3>
              <p className="text-xs text-muted-foreground">{totalCount} open alerts</p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close" className="rounded-full p-1 text-muted-foreground hover:bg-background">
              <X className="size-4" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No billing alerts.</p>
            ) : (
              <ul>
                {notifications.map((item) => (
                  <li key={item.id} className="border-b border-border px-4 py-3 last:border-0">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <StatusBadge status={item.severity === 'overdue' ? 'overdue' : 'due soon'} />
                      <button type="button" onClick={(e) => handleDismiss(e, item.id)} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false)
                        router.push(item.link_url)
                      }}
                      className="w-full text-left"
                    >
                      <p className="text-sm font-medium text-foreground">{item.tenant_name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.message}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-medium tabular-nums">{formatPkr(item.amount)}</span>
                        <span className="text-xs font-medium text-accent">Open billing</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border px-4 py-3 text-right">
            <Link href="/admin/tenants" onClick={() => setIsOpen(false)} className="text-sm font-medium text-accent">
              View shops
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
