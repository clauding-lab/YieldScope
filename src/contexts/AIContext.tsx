import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AIConfig } from '../types'
import { getApiKey, saveApiKey, clearApiKey as clearStoredKey } from '../services/apiKeyStore'
import { initAIClient } from '../services/aiService'

interface AIContextValue extends AIConfig {
  setApiKey: (key: string) => void
  clearApiKey: () => void
}

const AIContext = createContext<AIContextValue>({
  apiKey: null,
  isConfigured: false,
  setApiKey: () => {},
  clearApiKey: () => {},
})

export function AIProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null)

  useEffect(() => {
    const stored = getApiKey()
    if (stored) {
      setApiKeyState(stored)
      initAIClient(stored)
    }
  }, [])

  const setApiKey = useCallback((key: string) => {
    saveApiKey(key)
    setApiKeyState(key)
    initAIClient(key)
  }, [])

  const clearApiKey = useCallback(() => {
    clearStoredKey()
    setApiKeyState(null)
  }, [])

  return (
    <AIContext.Provider value={{
      apiKey,
      isConfigured: apiKey !== null,
      setApiKey,
      clearApiKey,
    }}>
      {children}
    </AIContext.Provider>
  )
}

export function useAIContext(): AIContextValue {
  return useContext(AIContext)
}
