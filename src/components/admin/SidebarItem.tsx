import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

export function SidebarItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  badge,
  onClick,
}: {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
  collapsed?: boolean
  badge?: number
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onClick={onClick}
      className={`relative flex items-center gap-3 rounded-[var(--kd-radius)] px-3 py-2 text-sm transition ${
        collapsed ? 'justify-center' : ''
      } ${
        active
          ? 'bg-[var(--kd-primary-soft)] font-medium text-primary'
          : 'text-muted-foreground hover:bg-[var(--kd-primary-soft)] hover:text-foreground'
      }`}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && badge ? (
        <span className="ml-auto rounded-full bg-[var(--kd-primary-soft)] px-1.5 py-0.5 text-xs font-medium text-primary tabular-nums">
          {badge}
        </span>
      ) : null}
    </Link>
  )
}
