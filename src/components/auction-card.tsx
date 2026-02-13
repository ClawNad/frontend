import { useState } from 'react'
import { Clock, Play, Heart, Github, Shield } from 'lucide-react'

export interface AuctionCardProps {
  imageSrc: string
  imageAlt: string
  imageBadge?: string
  title: string
  /** Subtitle e.g. "GEOSCIENCE" */
  subtitle?: string
  /** Short status e.g. "Live", "Healthy" */
  statusLabel?: string
  /** Subtext next to status e.g. "2h left", "1403ms" */
  statusSubtext?: string
  /** 1–2 line description below status */
  description?: string
  /** API/source tag e.g. "NASA EONET" (red pill) */
  typeTag?: string
  /** Time/limit info e.g. "Ends in 2h", "60/min · 10 burst" */
  endTime?: string
  tags?: string[]
  progressPercent?: number
  progressLabel?: string
  progressValue?: string
  fullPrice?: string
  fullPriceSymbol?: string
  startFrom?: number
  startFromTotal?: number
  startFromSymbol?: string
  /** Grid buttons e.g. endpoint labels (2x3 grid), active = primary style */
  navButtons?: { label: string; active?: boolean }[]
  /** Footer badge e.g. "8004" shown with shield icon */
  footerBadge?: string
  onClick?: () => void
}

const DEFAULT_NAV_BUTTONS = [
  { label: 'ACTIVE EVENTS OVERVIEW', active: true },
  { label: 'EVENTS BY CATEGORY', active: false },
  { label: 'RECENT EVENTS', active: true },
  { label: 'EVENT DETAILS', active: false },
  { label: 'GEOGRAPHIC SEARCH', active: true },
  { label: 'FULL EVENT REPORTS', active: false },
]

export function AuctionCard({
  imageSrc,
  imageAlt,
  imageBadge,
  title,
  subtitle,
  statusLabel,
  statusSubtext,
  description,
  typeTag,
  endTime,
  tags = [],
  navButtons = DEFAULT_NAV_BUTTONS,
  footerBadge,
  onClick,
}: AuctionCardProps) {
  const displaySubtitle = subtitle ?? (tags.length > 0 ? tags[0].toUpperCase() : null)
  const [favorited, setFavorited] = useState(false)

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className="bg-[#171616] text-white group shadow-sm border border-white/10 relative h-full flex flex-col min-h-0 min-w-0 cursor-pointer"
    >
      {/* Top accent line */}
      <div className="w-full h-0.5 bg-primary shrink-0" aria-hidden />

      <div className="px-3 pt-3 pb-3 flex flex-col gap-3 flex-1 min-h-0 min-w-0">
        {/* Header: icon + title/subtitle, heart top right */}
        <div className="flex gap-3 items-start min-w-0">
          <div className="w-12 h-12 shrink-0 rounded overflow-hidden bg-muted relative">
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
              <span className="absolute bottom-0 left-0 right-0 text-center bg-primary/90 text-primary-foreground text-[9px] uppercase py-0.5 font-medium">
                {imageBadge}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold uppercase leading-tight truncate">
              {title}
            </p>
            {displaySubtitle != null && (
              <p className="text-xs text-muted-foreground uppercase mt-0.5">
                {displaySubtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setFavorited((v) => !v)
            }}
            className="p-1.5 -m-1.5 shrink-0 text-white hover:text-primary transition-colors outline-none focus:ring-2 focus:ring-primary rounded"
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-5 h-5 ${favorited ? 'fill-primary text-primary' : ''}`} />
          </button>
        </div>

        {/* Status */}
        {(statusLabel != null || statusSubtext != null) && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 shrink-0 rounded-sm" aria-hidden />
            <span className="text-xs text-white">
              {statusLabel}
              {statusSubtext != null && (
                <span className="text-muted-foreground"> ({statusSubtext})</span>
              )}
            </span>
          </div>
        )}

        {/* Description */}
        {description != null && description !== '' && (
          <p className="text-xs text-white leading-[135%] line-clamp-3">
            {description}
          </p>
        )}

        {/* API row: label + tag + clock + rate */}
        {(typeTag != null || endTime != null) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-white">API:</span>
            {typeTag != null && (
              <span className="bg-primary text-primary-foreground px-2 py-0.5 text-[10px] uppercase font-medium">
                {typeTag}
              </span>
            )}
            {endTime != null && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
                <Clock className="w-3 h-3 shrink-0" />
                {endTime}
              </span>
            )}
          </div>
        )}

        {/* Endpoint buttons grid (2 cols) */}
        {navButtons.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5 min-w-0">
            {navButtons.map((btn, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => e.stopPropagation()}
                className={`min-w-0 px-2 py-1.5 text-[10px] uppercase text-left transition-colors truncate border ${
                  btn.active
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-transparent border-white/30 text-white hover:border-white/50'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="w-full h-px bg-white/20 shrink-0" aria-hidden />

      {/* Footer: Try It, Code, Badge */}
      <div className="w-full px-3 py-3 min-w-0">
        <div className="flex gap-2 text-white text-xs">
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] uppercase bg-primary border border-primary text-primary-foreground truncate"
          >
            <Play className="w-3.5 h-3.5 shrink-0" />
            Try It
          </button>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] uppercase bg-transparent border border-white/30 text-white hover:border-white/50 truncate"
          >
            <Github className="w-3.5 h-3.5 shrink-0" />
            Code
          </button>
          {footerBadge != null && footerBadge !== '' && (
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] uppercase bg-transparent border border-white/30 text-white hover:border-white/50 min-w-0 shrink-0"
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              {footerBadge}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
