import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { truncateAddress, explorerUrl } from '@/lib/format'

interface AddressDisplayProps {
  address: string
  startLen?: number
  endLen?: number
  showCopy?: boolean
  showExplorer?: boolean
  className?: string
}

export function AddressDisplay({
  address,
  startLen = 6,
  endLen = 4,
  showCopy = true,
  showExplorer = true,
  className = '',
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs ${className}`}>
      <span className="text-muted-foreground">{truncateAddress(address, startLen, endLen)}</span>
      {showCopy && (
        <button
          type="button"
          onClick={handleCopy}
          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          title="Copy address"
        >
          {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
        </button>
      )}
      {showExplorer && (
        <a
          href={explorerUrl('address', address)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-0.5 text-muted-foreground hover:text-primary transition-colors"
          title="View on explorer"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </span>
  )
}
