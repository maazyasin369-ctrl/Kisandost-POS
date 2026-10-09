export default function ModuleLocked({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[var(--kd-radius)] border border-border bg-[var(--kd-surface)] p-8 shadow-[var(--kd-shadow)]">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">{body}</p>
    </div>
  )
}
