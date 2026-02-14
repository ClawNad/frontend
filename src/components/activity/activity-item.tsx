import { Link } from 'react-router-dom'
import { Rocket, ArrowUpCircle, ArrowDownCircle, Star } from 'lucide-react'
import type { ActivityEvent } from '@/types/activity'
import { truncateAddress, formatMon, formatTokenAmount, timeAgo, scoreToStars } from '@/lib/format'

interface ActivityItemProps {
  event: ActivityEvent
}

export function ActivityItem({ event }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3 py-2.5 px-3 border-b border-border/50 hover:bg-muted/20 transition-colors text-sm">
      <div className="shrink-0 mt-0.5">{getIcon(event)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white leading-relaxed">{getMessage(event)}</p>
      </div>
      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
        {timeAgo(event.timestamp)}
      </span>
    </div>
  )
}

function getIcon(event: ActivityEvent) {
  switch (event.type) {
    case 'launch':
      return <Rocket className="w-4 h-4 text-primary" />
    case 'trade':
      return event.tradeType === 'buy' ? (
        <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
      ) : (
        <ArrowDownCircle className="w-4 h-4 text-red-400" />
      )
    case 'feedback':
      return <Star className="w-4 h-4 text-yellow-400" />
  }
}

function getMessage(event: ActivityEvent) {
  switch (event.type) {
    case 'launch':
      return (
        <>
          <Link to={`/agents/${event.agentId}`} className="font-medium text-primary hover:underline">
            {event.tokenName || event.tokenSymbol || `Agent #${event.agentId}`}
          </Link>
          {' '}launched by{' '}
          <Link to={`/creator/${event.creator}`} className="text-muted-foreground hover:text-white font-mono">
            {truncateAddress(event.creator)}
          </Link>
        </>
      )
    case 'trade':
      return (
        <>
          <span className="text-muted-foreground font-mono">{truncateAddress(event.trader)}</span>
          {' '}{event.tradeType === 'buy' ? 'bought' : 'sold'}{' '}
          <span className="font-medium text-white">
            {formatTokenAmount(event.tokenAmount)} ${event.agent?.tokenSymbol ?? '???'}
          </span>
          {' '}for{' '}
          <span className="text-white">{formatMon(event.monAmount)} MON</span>
        </>
      )
    case 'feedback': {
      const stars = scoreToStars(event.score)
      const agentId = event.agent?.agentId
      return (
        <>
          <span className="text-muted-foreground font-mono">{truncateAddress(event.rater)}</span>
          {' '}rated{' '}
          {agentId ? (
            <Link to={`/agents/${agentId}`} className="font-medium text-primary hover:underline">
              Agent #{agentId}
            </Link>
          ) : (
            <span className="font-medium text-white">an agent</span>
          )}
          {' '}{stars.toFixed(1)}/5
          {event.tag1 && (
            <span className="text-muted-foreground"> [{event.tag1}]</span>
          )}
        </>
      )
    }
  }
}
