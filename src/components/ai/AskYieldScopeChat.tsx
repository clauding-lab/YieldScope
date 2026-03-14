import { useState, useRef, useEffect } from 'react'
import type { YieldData, AuctionData, PolicyData } from '../../types'
import { useAskYieldScope } from '../../hooks/useAskYieldScope'
import { AIFeatureGate } from './AIFeatureGate'

interface Props {
  yieldData?: YieldData | null
  auctionData?: AuctionData | null
  policyData?: PolicyData | null
}

export function AskYieldScopeChat({ yieldData, auctionData, policyData }: Props) {
  const { messages, isLoading, error, send, clearChat } = useAskYieldScope()
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    if (!input.trim() || isLoading) return
    send(input.trim(), yieldData, auctionData, policyData)
    setInput('')
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-sky-600 text-white shadow-lg hover:bg-sky-500 transition-colors flex items-center justify-center z-50"
        title="Ask YieldScope"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    )
  }

  return (
    <AIFeatureGate feature="Ask YieldScope">
      <div className="fixed bottom-20 right-4 w-80 max-h-[28rem] bg-slate-800 rounded-xl shadow-2xl border border-slate-700 flex flex-col z-50">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-medium text-slate-200">Ask YieldScope</h3>
          <div className="flex gap-2">
            {messages.length > 0 && (
              <button onClick={clearChat} className="text-xs text-slate-500 hover:text-slate-300">
                Clear
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[12rem] max-h-[18rem]">
          {messages.length === 0 && (
            <div className="text-center py-6">
              <p className="text-xs text-slate-500">Ask about Bangladesh treasury markets</p>
              <div className="mt-3 space-y-1">
                {['What is the 10Y-91D spread?', 'Which auction had the lowest bid-cover?', 'Is the curve steepening?'].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(q); }}
                    className="block w-full text-left text-xs text-sky-400/70 hover:text-sky-400 px-2 py-1 rounded hover:bg-slate-700/50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-700 text-slate-200'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 rounded-lg px-3 py-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about yields, auctions..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 disabled:opacity-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </AIFeatureGate>
  )
}
