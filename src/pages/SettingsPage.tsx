import { APIKeySetup } from '../components/ai/APIKeySetup'
import { AdminDataEntry } from '../components/admin/AdminDataEntry'
import { invalidateCache } from '../services/dataLoader'

export default function SettingsPage() {
  function handleClearCache() {
    invalidateCache()
    window.location.reload()
  }

  return (
    <div className="py-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Settings</h1>
        <p className="text-sm text-slate-400">Configure AI features, manage data, and app preferences</p>
      </div>

      {/* API Key */}
      <APIKeySetup />

      {/* Admin Data Entry Panel */}
      <AdminDataEntry />

      {/* Cache */}
      <div className="rounded-xl bg-slate-800 p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Data Cache</h3>
        <p className="text-xs text-slate-500 mb-3">
          Clear cached data to force a fresh fetch on next load.
        </p>
        <button
          onClick={handleClearCache}
          className="px-4 py-2 text-xs text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Clear Cache & Reload
        </button>
      </div>

      {/* About */}
      <div className="rounded-xl bg-slate-800 p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-2">About YieldScope</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Bangladesh's definitive fixed income and macroeconomic intelligence platform.
          Combines real-time data visualization with AI-powered contextual analysis.
        </p>
        <div className="mt-3 space-y-1 text-xs text-slate-500">
          <p>Version 2.0.0</p>
          <p>AI powered by Claude Opus 4.6</p>
          <p>Curated by Adnan Rashid</p>
        </div>
      </div>
    </div>
  )
}
