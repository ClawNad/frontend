import { useState, useCallback, useRef } from 'react'
import { useWalletClient } from 'wagmi'
import { fetchStreamWithPayment } from '@/lib/x402'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export type ChatStatus = 'idle' | 'signing' | 'streaming' | 'error'

/**
 * Chat hook — always uses x402 payment via fetchStreamWithPayment.
 * @param chatPath - Backend path (e.g. '/agents/summary/chat' or '/api/v1/chat')
 * @param extraBody - Extra fields to include in every request (e.g. persona, price)
 */
export function useChat(chatPath: string, extraBody?: Record<string, unknown>) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<ChatStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const { data: walletClient } = useWalletClient()
  const abortRef = useRef(false)

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      if (!walletClient) {
        setError('Please connect your wallet first')
        return
      }

      setError(null)
      abortRef.current = false

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])

      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: content.trim() },
      ]

      const onChunk = (chunk: string) => {
        if (abortRef.current) return
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last && last.id === assistantMsg.id) {
            updated[updated.length - 1] = { ...last, content: last.content + chunk }
          }
          return updated
        })
      }

      const onDone = () => setStatus('idle')

      const onError = (err: Error) => {
        setStatus('error')
        setError(err.message)
      }

      try {
        setStatus('signing')
        let firstChunk = true
        await fetchStreamWithPayment(
          chatPath,
          walletClient,
          { ...extraBody, messages: apiMessages },
          (chunk: string) => {
            if (firstChunk) { setStatus('streaming'); firstChunk = false }
            onChunk(chunk)
          },
          onDone,
          onError,
        )
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Failed to send message')
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id))
      }
    },
    [walletClient, chatPath, extraBody, messages],
  )

  const clearHistory = useCallback(() => {
    setMessages([])
    setStatus('idle')
    setError(null)
  }, [])

  return { messages, status, error, sendMessage, clearHistory }
}
