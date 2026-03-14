import { useState, useCallback } from 'react'
import type { YieldData, AuctionData, PolicyData, ChatMessage } from '../types'
import { askYieldScope } from '../services/aiService'

export function useAskYieldScope() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(async (
    question: string,
    yieldData?: YieldData | null,
    auctionData?: AuctionData | null,
    policyData?: PolicyData | null,
  ) => {
    const userMsg: ChatMessage = {
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setError(null)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const reply = await askYieldScope(question, yieldData, auctionData, policyData, history)

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response')
    } finally {
      setIsLoading(false)
    }
  }, [messages])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, isLoading, error, send, clearChat }
}
