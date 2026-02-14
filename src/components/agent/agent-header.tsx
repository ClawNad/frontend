import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Star } from 'lucide-react'
import type { AgentDetail } from '@/types/agent'
import { displayTokenName, truncateAddress, formatMon, timeAgo, scoreToStars, explorerUrl } from '@/lib/format'
import { TagBadge } from '@/components/shared/tag-badge'
import { AddressDisplay } from '@/components/shared/address-display'
import { useTokenMetadata } from '@/hooks/use-token'

interface AgentHeaderProps {
  agent: AgentDetail
}

export function AgentHeader({ agent }: AgentHeaderProps) {
  const name = displayTokenName(agent.tokenName, agent.tokenSymbol, agent.agentId)
  const symbol = agent.tokenSymbol ?? ''
  const avgScore = agent.totalFeedback > 0 ? Number(agent.totalScore) / agent.totalFeedback : 0
  const stars = scoreToStars(avgScore)
  const { data: metaData } = useTokenMetadata(agent.tokenAddress || null)
  const imageUri = metaData?.data?.imageUri
  const [imgError, setImgError] = useState(false)

  return (
    <div className="border-b border-border bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-4 items-start">
          {/* Avatar */}
          {imageUri && !imgError ? (
            <img
              src={imageUri}
              alt={name}
              className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xl uppercase">
              {name.slice(0, 2)}
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-2">
            {/* Name + symbol + status */}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{name}</h1>
              {symbol && <span className="text-sm text-primary font-medium">${symbol}</span>}
              {agent.active ? (
                <TagBadge tag="Active" variant="success" />
              ) : (
                <TagBadge tag="Inactive" />
              )}
              {agent.tokenGraduated && <TagBadge tag="Graduated" variant="primary" />}
            </div>

            {/* Creator + launched */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span>
                by{' '}
                <Link to={`/creator/${agent.creator}`} className="hover:text-primary transition-colors">
                  <AddressDisplay address={agent.creator} showExplorer={false} />
                </Link>
              </span>
              <span>Launched {timeAgo(agent.launchedAt)}</span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-xs flex-wrap">
              {agent.totalFeedback > 0 ? (
                <span className="inline-flex items-center gap-1 text-yellow-400">
                  <Star className="w-3.5 h-3.5 fill-yellow-400" />
                  {stars.toFixed(2)} ({agent.totalFeedback} reviews)
                </span>
              ) : (
                <span className="text-muted-foreground">No ratings yet</span>
              )}
              <span className="text-muted-foreground">Rev: {formatMon(agent.totalRevenue)} MON</span>
              {agent.endpoint && (
                <a
                  href={agent.endpoint}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  Endpoint <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* On-chain links */}
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
              <span>ID: {agent.agentId}</span>
              {agent.tokenAddress && (
                <a
                  href={explorerUrl('address', agent.tokenAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Token: {truncateAddress(agent.tokenAddress)}
                </a>
              )}
              <a
                href={explorerUrl('tx', agent.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                TX: {truncateAddress(agent.txHash)}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
