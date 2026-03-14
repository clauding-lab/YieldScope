import { useState } from 'react'
import { useAIContext } from '../../contexts/AIContext'
import { validateKeyFormat } from '../../services/apiKeyStore'

export function APIKeySetup() {
  const { isConfigured, apiKey, setApiKey, clearApiKey } = useAIContext()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  function handleSave() {
    if (!validateKeyFormat(input)) {
      setError('Invalid key format. Should start with sk-ant-')
      return
    }
    setApiKey(input)
    setInput('')
    setError('')
  }

  if (isConfigured) {
    const masked = apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : ''
    return (
      <div className="rounded-xl bg-slate-800 p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Anthropic API Key</h3>
        <div className="flex items-center gap-3">
          <code className="flex-1 text-xs text-green-400 bg-slate-900 px-3 py-2 rounded-lg font-mono">
            {masked}
          </code>
          <button
            onClick={clearApiKey}
            className="px-3 py-2 text-xs text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors"
          >
            Remove
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          AI features (Curve Interpreter, Ask YieldScope) are active.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-slate-800 p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-1">Anthropic API Key</h3>
      <p className="text-xs text-slate-500 mb-3">
        Required for AI features: Curve Interpreter, Anomaly Explanations, Ask YieldScope.
        Your key is stored locally and never sent to our servers.
      </p>
      <div className="flex gap-2">
        <input
          type="password"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError('') }}
          placeholder="sk-ant-..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button
          onClick={handleSave}
          disabled={!input}
          className="px-4 py-2 bg-sky-600 text-white text-sm rounded-lg hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  )
}
