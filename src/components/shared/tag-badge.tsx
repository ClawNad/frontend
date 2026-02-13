import { cn } from '@/lib/utils'

interface TagBadgeProps {
  tag: string
  variant?: 'default' | 'primary' | 'success'
  className?: string
}

const variantStyles = {
  default: 'bg-muted/50 text-muted-foreground border-border',
  primary: 'bg-primary/10 text-primary border-primary/30',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
}

export function TagBadge({ tag, variant = 'default', className = '' }: TagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[10px] uppercase font-medium border',
        variantStyles[variant],
        className,
      )}
    >
      {tag}
    </span>
  )
}
