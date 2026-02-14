import type { AgentDetail } from '@/types/agent'
import { explorerUrl, truncateAddress } from '@/lib/format'
import { CONTRACTS } from '@/lib/contracts'
import { parseAgentURI } from '@/lib/agent-uri'

interface OverviewTabProps {
  agent: AgentDetail
}

export function OverviewTab({ agent }: OverviewTabProps) {
  const uriData = parseAgentURI(agent.agentURI || '')
  const description = uriData.persona || uriData.description || null

  return (
    <div className="space-y-6">
      {/* Description */}
      <section>
        <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2 mb-3">
          Description
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {description || 'No description available.'}
        </p>
      </section>

      {/* On-Chain Info */}
      <section>
        <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2 mb-3">
          On-Chain Info
        </h3>
        <div className="space-y-2 text-sm">
          <InfoRow label="Agent ID" value={agent.agentId} />
          <InfoRow
            label="Agent Factory"
            value={truncateAddress(CONTRACTS.agentFactory)}
            href={explorerUrl('address', CONTRACTS.agentFactory)}
          />
          <InfoRow
            label="Agent Wallet"
            value={truncateAddress(agent.agentWallet)}
            href={explorerUrl('address', agent.agentWallet)}
          />
          {agent.tokenAddress && (
            <InfoRow
              label="Token"
              value={truncateAddress(agent.tokenAddress)}
              href={explorerUrl('address', agent.tokenAddress)}
            />
          )}
          <InfoRow
            label="Creator"
            value={truncateAddress(agent.creator)}
            href={explorerUrl('address', agent.creator)}
          />
          <InfoRow label="Block" value={agent.blockNumber} />
          <InfoRow
            label="ERC-8004"
            value="View on 8004scan"
            href={`https://www.8004scan.io/agents/monad/${agent.agentId}`}
          />
        </div>
      </section>
    </div>
  )
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/30">
      <span className="text-xs text-muted-foreground">{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-primary hover:underline">
          {value}
        </a>
      ) : (
        <span className="text-xs font-mono text-white">{value}</span>
      )}
    </div>
  )
}
