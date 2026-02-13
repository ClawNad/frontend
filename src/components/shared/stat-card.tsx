import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  className?: string
}

export function StatCard({ label, value, icon: Icon, className = '' }: StatCardProps) {
  return (
    <div className={`border border-border bg-card p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}
