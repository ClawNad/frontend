import type { AgentDetail } from '@/types/agent'
import { useTokenPrice, useTokenTrades } from '@/hooks/use-token'

import { PriceChart } from './price-chart'
import { TradeWidget } from './trade-widget'
import { TradeTable } from './trade-table'
import { ProgressBar } from '@/components/shared/progress-bar'
import { Skeleton } from '@/components/shared/loading-skeleton'

interface TokenTabProps {
  agent: AgentDetail
}

export function TokenTab({ agent }: TokenTabProps) {
  const { data: priceData, isLoading: priceLoading } = useTokenPrice(agent.tokenAddress)
  const { data: tradesData } = useTokenTrades(agent.tokenAddress, { limit: 50 })

  const price = priceData?.data
  const trades = tradesData?.data ?? agent.trades ?? []

  return (
    <div className="space-y-6">
      {/* MCAP Chart */}
      {trades.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2 mb-3">
            Market Cap (MON)
          </h3>
          <PriceChart trades={trades} />
        </section>
      )}

      {/* Token Metrics */}
      <section>
        <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2 mb-3">
          Token Metrics
        </h3>
        {priceLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : price ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="Price" value={`${Number(price.priceInMon).toFixed(10)} MON`} />
              <MetricCard label="Market Cap" value={`${price.marketCap} MON`} />
              <MetricCard label="Progress" value={`${price.progress.toFixed(1)}%`} />
              <MetricCard label="Status" value={price.graduated ? 'Graduated (DEX)' : 'Bonding Curve'} />
            </div>
            <ProgressBar percent={price.progress} graduated={price.graduated} />
            {price.reserves && (
              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div className="border border-border/30 p-2">
                  <span className="text-muted-foreground">Real MON: </span>
                  <span className="text-white font-mono">{Number(price.reserves.realMon).toFixed(4)}</span>
                </div>
                <div className="border border-border/30 p-2">
                  <span className="text-muted-foreground">Virtual MON: </span>
                  <span className="text-white font-mono">{Number(price.reserves.virtualMon).toFixed(4)}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No token data available</p>
        )}
      </section>

      {/* Trade Widget + Table layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trade widget */}
        <div className="lg:col-span-1">
          {agent.tokenAddress ? (
            <TradeWidget
              tokenAddress={agent.tokenAddress}
              tokenSymbol={agent.tokenSymbol}
              agentId={agent.agentId}
            />
          ) : (
            <div className="border border-border bg-card p-4 text-xs text-muted-foreground text-center">
              No token deployed for this agent
            </div>
          )}
        </div>

        {/* Trade history */}
        <div className="lg:col-span-2">
          <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2 mb-3">
            Recent Trades
          </h3>
          <TradeTable trades={trades} tokenSymbol={agent.tokenSymbol} />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-muted/20 p-3">
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className="text-sm font-medium text-white mt-0.5 truncate">{value}</p>
    </div>
  )
}
