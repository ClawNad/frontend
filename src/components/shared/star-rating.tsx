import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  maxStars?: number
  interactive?: boolean
  onRate?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

const sizeMap = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

export function StarRating({
  rating,
  maxStars = 5,
  interactive = false,
  onRate,
  size = 'sm',
  showValue = false,
  className = '',
}: StarRatingProps) {
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starIndex = i + 1
        const filled = starIndex <= Math.floor(rating)
        const partial = !filled && starIndex <= Math.ceil(rating)

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(starIndex)}
            className={cn(
              'p-0',
              interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default',
            )}
          >
            <Star
              className={cn(
                sizeMap[size],
                filled ? 'fill-yellow-400 text-yellow-400' : partial ? 'fill-yellow-400/50 text-yellow-400' : 'text-muted-foreground',
              )}
            />
          </button>
        )
      })}
      {showValue && rating > 0 && (
        <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(2)}</span>
      )}
    </div>
  )
}
