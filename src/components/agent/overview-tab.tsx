import type { AgentDetail } from '@/types/agent'
import { explorerUrl, truncateAddress } from '@/lib/format'
import { CONTRACTS } from '@/lib/contracts'

interface OverviewTabProps {
  agent: AgentDetail
}

export function OverviewTab({ agent }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Description */}
      <section>
        <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2 mb-3">
          Description
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {agent.agentURI ? (
            <>Agent registered with URI: <a href={agent.agentURI} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{agent.agentURI}</a></>
          ) : (
            'No description available.'
          )}
        </p>
      </section>

      {/* Endpoint */}
      {agent.endpoint && (
        <section>
          <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2 mb-3">
            API Endpoint
          </h3>
          <div className="border border-border bg-muted/20 p-3">
            <p className="text-sm font-mono text-white break-all">{agent.endpoint}</p>
          </div>
        </section>
      )}

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
