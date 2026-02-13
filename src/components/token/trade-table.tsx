import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import type { TokenTrade } from '@/types/token'
import { formatMon, formatTokenAmount, truncateAddress, timeAgo, explorerUrl } from '@/lib/format'
import { EmptyState } from '@/components/shared/empty-state'

interface TradeTableProps {
  trades: TokenTrade[]
  tokenSymbol: string | null
}

export function TradeTable({ trades, tokenSymbol }: TradeTableProps) {
  const symbol = tokenSymbol ?? 'TOKEN'

  if (trades.length === 0) {
    return <EmptyState title="No trades yet" description="Be the first to trade this token" />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="text-left py-2 px-2 font-medium">Type</th>
            <th className="text-right py-2 px-2 font-medium">{symbol}</th>
            <th className="text-right py-2 px-2 font-medium">MON</th>
            <th className="text-left py-2 px-2 font-medium">Trader</th>
            <th className="text-right py-2 px-2 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id} className="border-b border-border/30 hover:bg-muted/10">
              <td className="py-2 px-2">
                <span className="inline-flex items-center gap-1">
                  {trade.tradeType === 'buy' ? (
                    <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ArrowDownCircle className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span className={trade.tradeType === 'buy' ? 'text-emerald-400' : 'text-red-400'}>
                    {trade.tradeType === 'buy' ? 'Buy' : 'Sell'}
                  </span>
                </span>
              </td>
              <td className="py-2 px-2 text-right text-white font-mono">
                {formatTokenAmount(trade.tokenAmount)}
              </td>
              <td className="py-2 px-2 text-right text-white font-mono">
                {formatMon(trade.monAmount, 4)}
              </td>
              <td className="py-2 px-2">
                <a
                  href={explorerUrl('address', trade.trader)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary font-mono"
                >
                  {truncateAddress(trade.trader)}
                </a>
              </td>
              <td className="py-2 px-2 text-right text-muted-foreground">
                {timeAgo(trade.blockTimestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
