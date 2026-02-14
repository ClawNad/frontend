import { useRevenueEvents } from '@/hooks/use-revenue'
import { formatMon, truncateAddress, timeAgo } from '@/lib/format'
import { TxHashLink } from '@/components/shared/tx-hash-link'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/shared/loading-skeleton'

interface RevenueTabProps {
  agentId: string
}

export function RevenueTab({ agentId }: RevenueTabProps) {
  const { data, isLoading } = useRevenueEvents(agentId, { limit: 20 })
  const events = data?.data ?? []

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2 mb-3">
          Revenue Events
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState title="No revenue events yet" description="Revenue will appear here when the agent earns from x402 payments" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-2 font-medium">Type</th>
                  <th className="text-right py-2 px-2 font-medium">Amount</th>
                  <th className="text-left py-2 px-2 font-medium">From</th>
                  <th className="text-right py-2 px-2 font-medium">Time</th>
                  <th className="text-right py-2 px-2 font-medium">TX</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-border/30 hover:bg-muted/10">
                    <td className="py-2 px-2">
                      <span className={`uppercase font-medium ${
                        event.eventType === 'deposit' ? 'text-emerald-400' :
                        event.eventType === 'distribute' ? 'text-primary' : 'text-yellow-400'
                      }`}>
                        {event.eventType}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-mono">
                      <span className="text-white">{formatMon(event.amount, 4)} MON</span>
                      {event.eventType === 'distribute' && event.agentShare && (
                        <div className="text-[10px] text-muted-foreground mt-0.5 space-y-px">
                          <div>Agent: {formatMon(event.agentShare, 4)}</div>
                          {event.buybackShare && <div>Buyback: {formatMon(event.buybackShare, 4)}</div>}
                          {event.platformFee && <div>Fee: {formatMon(event.platformFee, 4)}</div>}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2 text-muted-foreground font-mono">
                      {event.fromAddress ? truncateAddress(event.fromAddress) :
                       event.toAddress ? truncateAddress(event.toAddress) : '—'}
                    </td>
                    <td className="py-2 px-2 text-right text-muted-foreground">
                      {timeAgo(event.blockTimestamp)}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <TxHashLink hash={event.txHash} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
