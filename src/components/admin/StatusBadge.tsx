export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase()
  const tone =
    key === 'active' || key === 'paid'
      ? 'bg-[color-mix(in_srgb,var(--kd-success)_12%,transparent)] text-success'
      : key === 'trial' || key === 'due soon' || key === 'warning' || key === 'pending_approval'
        ? 'bg-[color-mix(in_srgb,var(--kd-warning)_14%,transparent)] text-warning'
        : key === 'overdue' || key === 'suspended' || key === 'rejected'
          ? 'bg-[color-mix(in_srgb,var(--kd-danger)_12%,transparent)] text-danger'
          : 'bg-[var(--kd-primary-soft)] text-primary'

  const label = status.replaceAll('_', ' ')

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tone}`}>
      {label}
    </span>
  )
}
