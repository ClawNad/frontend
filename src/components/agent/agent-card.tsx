import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, MessageSquare, Play, Shield, Star } from 'lucide-react'
import type { Agent } from '@/types/agent'
import { displayTokenName, truncateAddress, formatMon, timeAgo, scoreToStars } from '@/lib/format'
import { ProgressBar } from '@/components/shared/progress-bar'
import { useTokenPrice, useTokenMetadata } from '@/hooks/use-token'
import { TryAgentModal, isAgentChattable } from './try-agent-modal'

interface AgentCardProps {
  agent: Agent
}

export function AgentCard({ agent }: AgentCardProps) {
  const [tryModalOpen, setTryModalOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const { data: priceData } = useTokenPrice(agent.tokenAddress || null)
  const { data: metaData } = useTokenMetadata(agent.tokenAddress || null)
  const tokenPrice = priceData?.data
  const imageUri = metaData?.data?.imageUri
  const name = displayTokenName(agent.tokenName, agent.tokenSymbol, agent.agentId)
  const symbol = agent.tokenSymbol ?? ''
  const avgScore = agent.totalFeedback > 0 ? Number(agent.totalScore) / agent.totalFeedback : 0
  const stars = scoreToStars(avgScore)
  const graduated = tokenPrice?.graduated ?? agent.tokenGraduated
  const progress = tokenPrice?.progress ?? 0
  const chattable = isAgentChattable(agent)

  return (
    <>
      <Link
        to={`/agents/${agent.agentId}`}
        className="bg-[#171616] text-white group shadow-sm border border-white/10 relative h-full flex flex-col min-h-0 min-w-0 cursor-pointer hover:border-primary/50 transition-colors"
      >
        {/* Top accent line */}
        <div className="w-full h-0.5 bg-primary shrink-0" aria-hidden />

        <div className="px-3 pt-3 pb-3 flex flex-col gap-2.5 flex-1 min-h-0 min-w-0">
          {/* Header: icon + title */}
          <div className="flex gap-3 items-start min-w-0">
            {imageUri && !imgError ? (
              <img
                src={imageUri}
                alt={name}
                className="w-10 h-10 shrink-0 rounded object-cover"
                loading="lazy"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-10 h-10 shrink-0 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-sm uppercase">
                {name.slice(0, 2)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold uppercase leading-tight truncate">{name}</p>
              {symbol && (
                <p className="text-xs text-primary font-medium mt-0.5">${symbol}</p>
              )}
            </div>
            <div className="shrink-0">
              {agent.active ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                  Inactive
                </span>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 text-[10px] flex-wrap">
            {agent.totalFeedback > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-yellow-400">
                <Star className="w-3 h-3 fill-yellow-400" />
                {stars.toFixed(2)} ({agent.totalFeedback})
              </span>
            ) : (
              <span className="text-muted-foreground">No ratings</span>
            )}
            {tokenPrice && (
              <span className="text-primary font-mono">
                {Number(tokenPrice.priceInMon).toFixed(6)} MON
              </span>
            )}
            <span className="text-muted-foreground">
              Rev: {formatMon(agent.totalRevenue)} MON
            </span>
          </div>

          {/* Creator + time */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>by {truncateAddress(agent.creator)}</span>
            <span>{timeAgo(agent.launchedAt)}</span>
          </div>

          {/* Bonding progress */}
          <ProgressBar percent={progress} graduated={graduated} />
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-white/20 shrink-0" aria-hidden />

        {/* Footer */}
        <div className="w-full px-3 py-2.5 min-w-0">
          <div className="flex gap-2 text-white text-xs">
            <span className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] uppercase bg-primary border border-primary text-primary-foreground truncate">
              <Play className="w-3 h-3 shrink-0" />
              View Agent
            </span>
            {chattable && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setTryModalOpen(true)
                }}
                className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] uppercase bg-transparent border border-primary/50 text-primary hover:bg-primary/10 transition-colors min-w-0 shrink-0 cursor-pointer"
              >
                <MessageSquare className="w-3 h-3 shrink-0" />
                Try
              </button>
            )}
            {graduated && (
              <span className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] uppercase bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 min-w-0 shrink-0">
                <GraduationCap className="w-3 h-3 shrink-0" />
                Grad
              </span>
            )}
            {agent.tokenAddress && (
              <span className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] uppercase bg-transparent border border-white/30 text-white min-w-0 shrink-0">
                <Shield className="w-3 h-3 shrink-0" />
                8004
              </span>
            )}
          </div>
        </div>
      </Link>

      {chattable && (
        <TryAgentModal
          open={tryModalOpen}
          onClose={() => setTryModalOpen(false)}
          agent={agent}
        />
      )}
    </>
  )
}
