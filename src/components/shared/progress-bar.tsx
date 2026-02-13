import { cn } from '@/lib/utils'

interface ProgressBarProps {
  percent: number
  graduated?: boolean
  showLabel?: boolean
  className?: string
}

export function ProgressBar({ percent, graduated = false, showLabel = true, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-1.5 bg-muted/50 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500',
            graduated ? 'bg-emerald-500' : 'bg-primary',
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {graduated ? 'Graduated' : `${clamped.toFixed(0)}%`}
        </span>
      )}
    </div>
  )
}
