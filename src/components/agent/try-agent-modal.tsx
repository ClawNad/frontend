import { useState, useRef, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { X, Send, Loader2, AlertCircle, MessageSquare, Trash2, Wallet } from 'lucide-react'
import type { Agent } from '@/types/agent'
import { detectServiceType, AGENT_SERVICES } from '@/lib/x402'
import { parseAgentURI } from '@/lib/agent-uri'
import { useChat, type ChatMessage } from '@/hooks/use-chat'
import { displayTokenName } from '@/lib/format'

interface TryAgentModalProps {
  open: boolean
  onClose: () => void
  agent: Agent
}

export function TryAgentModal({ open, onClose, agent }: TryAgentModalProps) {
  if (!open) return null

  const serviceType = detectServiceType(agent.agentId, agent.endpoint || '')
  const uriData = parseAgentURI(agent.agentURI || '')
  const persona = uriData.persona
  const agentName = displayTokenName(agent.tokenName, agent.tokenSymbol, agent.agentId)

  const chatPath = serviceType
    ? AGENT_SERVICES[serviceType].chatPath
    : '/api/v1/chat'

  const chatPrice = serviceType
    ? AGENT_SERVICES[serviceType].chatPrice
    : uriData.price && parseFloat(uriData.price) >= 0.01 ? `$${uriData.price}` : '$0.01'

  // Build extra body fields for generic agents
  const extraBody = serviceType
    ? undefined
    : { persona, price: uriData.price && parseFloat(uriData.price) >= 0.01 ? uriData.price : '0.01' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-[#171616] border border-white/10 w-full max-w-lg mx-4 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold uppercase text-white">Chat with {agentName}</span>
            <span className="text-[10px] text-muted-foreground">{chatPrice} USDC/msg</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat */}
        <ModalChat chatPath={chatPath} extraBody={extraBody} />
      </div>
    </div>
  )
}

function ModalChat({ chatPath, extraBody }: { chatPath: string; extraBody?: Record<string, unknown> }) {
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const stableExtraBody = useMemo(() => extraBody, [JSON.stringify(extraBody)])
  const { messages, status, error, sendMessage, clearHistory } = useChat(chatPath, stableExtraBody)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || status === 'streaming' || status === 'signing') return
    sendMessage(input)
    setInput('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isBusy = status === 'streaming' || status === 'signing'

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <Wallet className="w-8 h-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground mb-3">Connect wallet to chat</p>
        <button
          type="button"
          onClick={() => openConnectModal?.()}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase hover:bg-primary/90 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[50vh]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground/50">Send a message to start</p>
          </div>
        )}

        {messages.map((msg) => (
          <ModalBubble key={msg.id} message={msg} isStreaming={status === 'streaming'} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="border-t border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-400 flex items-center gap-1.5 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-3 shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={2}
            disabled={isBusy}
            autoFocus
            className="flex-1 bg-muted/30 border border-border text-sm text-white placeholder:text-muted-foreground/50 p-2.5 focus:outline-none focus:border-primary resize-none disabled:opacity-50"
          />
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleSend}
              disabled={isBusy || !input.trim()}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                disabled={isBusy}
                className="flex items-center justify-center px-3 py-1.5 text-muted-foreground border border-border hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function ModalBubble({ message, isStreaming }: { message: ChatMessage; isStreaming: boolean }) {
  const isUser = message.role === 'user'
  const isLastAssistant = !isUser && isStreaming && message.content.length > 0

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-primary/20 text-white border border-primary/30'
            : 'bg-muted/30 text-white border border-border'
        }`}
      >
        <div className="whitespace-pre-wrap break-words text-xs">
          {message.content || (
            <span className="text-muted-foreground/50 italic">Thinking...</span>
          )}
          {isLastAssistant && (
            <span className="inline-block w-1.5 h-3.5 bg-primary ml-0.5 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  )
}

/** Check if an agent can be chatted with */
export function isAgentChattable(agent: Pick<Agent, 'agentId' | 'agentURI' | 'endpoint'>): boolean {
  if (detectServiceType(agent.agentId, agent.endpoint || '')) return true
  const uriData = parseAgentURI(agent.agentURI || '')
  return !!uriData.persona
}
