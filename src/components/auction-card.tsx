import { Clock, Play } from 'lucide-react'

export interface AuctionCardProps {
  imageSrc: string
  imageAlt: string
  imageBadge?: string
  title: string
  /** Short status e.g. "Live", "Ended" */
  statusLabel?: string
  /** Subtext next to status e.g. "2h left", "2363ms" */
  statusSubtext?: string
  /** 1–2 line description below status */
  description?: string
  /** Type tag e.g. "AUCTION", "FIXED" */
  typeTag?: string
  /** Time/limit info e.g. "Ends in 2h", "60/min" */
  endTime?: string
  tags?: string[]
  progressPercent?: number
  progressLabel?: string
  progressValue?: string
  fullPrice: string
  fullPriceSymbol?: string
  startFrom: number
  startFromTotal: number
  startFromSymbol?: string
  /** Grid buttons e.g. [{ label: "ACTIVE BIDS", active: true }, ...] */
  navButtons?: { label: string; active?: boolean }[]
  /** Main actions e.g. [{ label: "PLACE BID", variant: "primary" }, ...] */
  actions?: { label: string; variant: 'primary' | 'outline' | 'muted' }[]
  onClick?: () => void
}

const DEFAULT_NAV_BUTTONS = [
  { label: 'ACTIVE BIDS', active: true },
  { label: 'HISTORY', active: false },
  { label: 'DETAILS', active: false },
  { label: 'SELLER', active: false },
]

const DEFAULT_ACTIONS = [
  { label: 'PLACE BID', variant: 'primary' as const },
  { label: 'WATCHLIST', variant: 'outline' as const },
  { label: 'SHARE', variant: 'muted' as const },
]

export function AuctionCard({
  imageSrc,
  imageAlt,
  imageBadge,
  title,
  statusLabel,
  statusSubtext,
  description,
  typeTag,
  endTime,
  tags = [],
  progressPercent = 0,
  progressLabel,
  progressValue,
  fullPrice,
  fullPriceSymbol,
  startFrom,
  startFromTotal,
  startFromSymbol,
  navButtons = DEFAULT_NAV_BUTTONS,
  actions = DEFAULT_ACTIONS,
  onClick,
}: AuctionCardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className="bg-[#171616] text-white group shadow-sm border relative h-full flex flex-col min-h-0 min-w-0 cursor-pointer border-primary/50"
    >
      <div className="w-full aspect-square relative bg-muted overflow-hidden">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        {imageBadge != null && imageBadge !== '' && (
          <div className="absolute bottom-0 w-full flex items-center justify-center h-[24px] bg-[#1c044f] uppercase text-primary text-xs leading-none overflow-hidden">
            <div className="whitespace-nowrap">
              <span>{imageBadge}</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-2 sm:px-3 pt-3 flex flex-col gap-3 flex-1 min-h-0 min-w-0">
        {/* Status row */}
        {(statusLabel != null || statusSubtext != null) && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 shrink-0" aria-hidden />
            <span className="text-xs text-white">
              {statusLabel}
              {statusSubtext != null && (
                <span className="text-muted-foreground"> ({statusSubtext})</span>
              )}
            </span>
          </div>
        )}

        {/* Title */}
        <p className="text-xs text-white leading-[135%] uppercase whitespace-nowrap w-full truncate">
          {title}
        </p>

        {/* Description */}
        {description != null && description !== '' && (
          <p className="text-xs text-muted-foreground leading-[135%] line-clamp-2">
            {description}
          </p>
        )}

        {/* Type + end time row */}
        {(typeTag != null || endTime != null) && (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {typeTag != null && (
              <span className="border border-white/30 bg-primary px-2 py-0.5 text-[10px] uppercase text-primary-foreground">
                {typeTag}
              </span>
            )}
            {endTime != null && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" />
                {endTime}
              </span>
            )}
          </div>
        )}

        {/* Nav buttons grid */}
        {navButtons.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5 min-w-0">
            {navButtons.map((btn, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => e.stopPropagation()}
                className={`min-w-0 px-2 py-1.5 text-[10px] uppercase border border-white/30 text-left transition-colors truncate ${btn.active
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-muted/30 text-muted-foreground hover:border-white/50'
                  }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Separator */}
        {/* {(navButtons.length > 0 || actions.length > 0) && (
          <div className="border-t border-border my-0.5" />
        )} */}

        {/* Action buttons */}
        {/* {actions.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {actions.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => e.stopPropagation()}
                className={`inline-flex items-center gap-1.5 px-2 py-1.5 text-[10px] uppercase border shrink-0 ${
                  action.variant === 'primary'
                    ? 'bg-primary border-primary text-primary-foreground'
                    : action.variant === 'outline'
                      ? 'bg-transparent border-white/30 text-white'
                      : 'bg-muted/50 border-border text-muted-foreground'
                }`}
              >
                {action.variant === 'primary' && <Play className="w-3 h-3" />}
                {action.label}
              </button>
            ))}
          </div>
        )} */}

        {/* Tags */}
        {/* {tags.length > 0 && (
          <div className="flex gap-x-2 flex-wrap">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="uppercase text-[10px] bg-muted/50 border border-border px-1.5 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )} */}
      </div>
      {/* 
      <div className="left-0 right-0 w-full px-3">
        <div className="w-full bg-[#211a4a] rounded-full h-2">
          <div
            className="bg-primary h-1 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.max(0, progressPercent))}%`,
              boxShadow: 'var(--primary) 0px 0px 3px 1px',
            }}
          />
        </div>
        {(progressLabel != null || progressValue != null) && (
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1">
              {progressLabel != null && <span className="text-[10px]">{progressLabel}</span>}
              {progressValue != null && (
                <span className="text-primary text-xs">{progressValue}</span>
              )}
            </div>
          </div>
        )}
      </div> */}

      <div className="w-full mt-4 min-w-0">
        <div className="flex w-full gap-2 text-white text-xs min-h-12 group relative overflow-hidden min-w-0">
          <div className="flex-1 min-w-0 flex flex-col justify-center pl-2 sm:pl-3">
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] uppercase border bg-primary border-primary text-primary-foreground min-w-0 truncate"
            >
              Try It
            </button>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center pr-2 sm:pr-3">
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-[10px] uppercase border bg-primary border-primary text-primary-foreground min-w-0 truncate"
            >
              Code
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
