export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-primary">
      <span className="text-ink-faint">{'//'}</span>
      {children}
    </div>
  )
}
