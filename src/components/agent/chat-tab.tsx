import { useState, useRef, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Wallet, Send, Loader2, AlertCircle, MessageSquare, Trash2 } from 'lucide-react'
import type { Agent } from '@/types/agent'
import { detectServiceType, AGENT_SERVICES } from '@/lib/x402'
import { parseAgentURI } from '@/lib/agent-uri'
import { useChat, type ChatMessage, type ChatStatus } from '@/hooks/use-chat'

interface ChatTabProps {
  agent: Pick<Agent, 'agentId' | 'agentURI' | 'endpoint' | 'tokenName' | 'tokenSymbol'>
}

export function ChatTab({ agent }: ChatTabProps) {
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()

  const serviceType = detectServiceType(agent.agentId, agent.endpoint || '')
  const uriData = parseAgentURI(agent.agentURI || '')
  const persona = uriData.persona
  const agentName = agent.tokenName || agent.tokenSymbol || `Agent #${agent.agentId}`

  // Determine chat availability and pricing
  const hasHardcodedChat = !!serviceType
  const hasGenericChat = !!persona

  if (!hasHardcodedChat && !hasGenericChat) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="w-10 h-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Chat not available</p>
        <p className="text-xs text-muted-foreground/70 mt-1">This agent was launched without a persona. Only agents with a persona can be chatted with.</p>
      </div>
    )
  }

  // Resolve chat path and price
  const chatPath = hasHardcodedChat
    ? AGENT_SERVICES[serviceType!].chatPath
    : '/api/v1/chat'
  const chatPrice = hasHardcodedChat
    ? AGENT_SERVICES[serviceType!].chatPrice
    : uriData.price && parseFloat(uriData.price) >= 0.01 ? `$${uriData.price}` : '$0.01'

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Wallet className="w-10 h-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Connect wallet to chat</p>
        <p className="text-xs text-muted-foreground/70 mt-1 mb-4">
          Chat with {agentName} — {chatPrice} USDC per message
        </p>
        <button
          type="button"
          onClick={() => openConnectModal?.()}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold uppercase hover:bg-primary/90 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  // Build extra body fields for generic agents
  const extraBody = hasHardcodedChat
    ? undefined
    : { persona, price: uriData.price && parseFloat(uriData.price) >= 0.01 ? uriData.price : '0.01' }

  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2 mb-3 flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5" />
          Chat with {agentName}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Responses stream in real-time. Cost: {chatPrice} USDC per message.
        </p>
      </section>

      <ChatInterface
        chatPath={chatPath}
        chatPrice={chatPrice}
        extraBody={extraBody}
      />
    </div>
  )
}

interface ChatInterfaceProps {
  chatPath: string
  chatPrice: string
  extraBody?: Record<string, unknown>
}

function ChatInterface({ chatPath, chatPrice, extraBody }: ChatInterfaceProps) {
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

  return (
    <div className="border border-border bg-muted/10">
      {/* Messages area */}
      <div className="h-[500px] overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground/50">Send a message to start the conversation</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isStreaming={status === 'streaming'} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="border-t border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={2}
            disabled={isBusy}
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
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <StatusLabel status={status} />
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send
                </>
              )}
            </button>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                disabled={isBusy}
                className="flex items-center justify-center gap-1 px-3 py-1.5 text-[10px] uppercase text-muted-foreground border border-border hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground/50">
          <span>{chatPrice} USDC per message</span>
          <span className="ml-auto">Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming: boolean }) {
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
        <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
          {isUser ? 'You' : 'Agent'}
        </div>
        <div className="whitespace-pre-wrap break-words">
          {message.content || (
            <span className="text-muted-foreground/50 italic">Thinking...</span>
          )}
          {isLastAssistant && (
            <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  )
}

function StatusLabel({ status }: { status: ChatStatus }) {
  switch (status) {
    case 'signing':
      return <span>Sign...</span>
    case 'streaming':
      return <span>...</span>
    default:
      return null
  }
}
