import { ExternalLink } from 'lucide-react'
import { truncateAddress, explorerUrl } from '@/lib/format'

interface TxHashLinkProps {
  hash: string
  className?: string
}

export function TxHashLink({ hash, className = '' }: TxHashLinkProps) {
  return (
    <a
      href={explorerUrl('tx', hash)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-primary transition-colors ${className}`}
    >
      {truncateAddress(hash, 6, 4)}
      <ExternalLink className="w-3 h-3" />
    </a>
  )
}
