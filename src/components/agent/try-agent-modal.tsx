import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { Agent } from '@/types/agent'
import { TryAgentTab } from './try-agent-tab'
import { displayTokenName } from '@/lib/format'

interface TryAgentModalProps {
  open: boolean
  onClose: () => void
  agent: Agent
}

export function TryAgentModal({ open, onClose, agent }: TryAgentModalProps) {
  if (!open) return null

  const name = displayTokenName(agent.tokenName, agent.tokenSymbol, agent.agentId)

  return createPortal(
    <>
      <div className="fixed inset-0 z-[1000] bg-black/60" aria-hidden onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 z-[1001] w-full max-w-lg max-h-[85vh] -translate-x-1/2 -translate-y-1/2 bg-background border border-border shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
            Try {name}
          </h2>
          <button type="button" onClick={onClose} className="p-2 -m-2 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          <TryAgentTab agent={agent} />
        </div>
      </div>
    </>,
    document.body,
  )
}
