import type { ReactNode } from 'react'
import { useAIContext } from '../../contexts/AIContext'
import { Link } from 'react-router-dom'

interface AIFeatureGateProps {
  children: ReactNode
  feature?: string
}

export function AIFeatureGate({ children, feature }: AIFeatureGateProps) {
  const { isConfigured } = useAIContext()

  if (!isConfigured) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-center">
        <div className="text-2xl mb-2">🔑</div>
        <p className="text-sm text-slate-400 mb-1">
          {feature ? `${feature} requires` : 'This feature requires'} an Anthropic API key
        </p>
        <Link
          to="/settings"
          className="inline-block mt-3 px-4 py-2 bg-sky-600 text-white text-sm rounded-lg hover:bg-sky-500 transition-colors"
        >
          Configure API Key
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
