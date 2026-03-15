import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useYieldData } from '../../hooks/useYieldData'
import { differenceInHours } from 'date-fns'

const ADMIN_PASSWORD = 'yieldscope2026'

export function Header() {
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-accent" viewBox="0 0 64 64" fill="none">
            <path
              d="M12 44 C18 40, 24 36, 28 34 C32 32, 36 28, 40 25 C44 22, 48 20, 52 18"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-accent">Yield</span>
            <span className="text-slate-200">Scope</span>
            <span className="text-[11px] text-slate-500 ml-2 font-normal">v2.0</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <DataFreshnessDot />
          <button
            onClick={() => setShowPasswordModal(true)}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
        </div>
      </header>

      {showPasswordModal && (
        <AdminPasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </>
  )
}

function AdminPasswordModal({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      onClose()
      navigate('/settings')
    } else {
      setError(true)
      setPassword('')
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-xs rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <h2 className="text-sm font-semibold text-slate-200">Admin Access</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">Enter admin password to access Settings.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className={`w-full px-3 py-2.5 text-sm bg-slate-800 border rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none transition-colors ${
              error ? 'border-red-500 shake' : 'border-slate-700 focus:border-sky-500'
            }`}
          />
          {error && (
            <p className="text-xs text-red-400 mt-1.5">Incorrect password</p>
          )}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-xs font-medium text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 text-xs font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors"
            >
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DataFreshnessDot() {
  const { data } = useYieldData()

  if (!data?.lastUpdated) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
        <span>No data</span>
      </div>
    )
  }

  const hoursAgo = differenceInHours(new Date(), new Date(data.lastUpdated))

  let dotColor = 'bg-emerald-400'
  let label = 'Live'

  if (hoursAgo >= 72) {
    dotColor = 'bg-red-400 animate-pulse'
    label = 'Stale'
  } else if (hoursAgo >= 24) {
    dotColor = 'bg-amber-400 animate-pulse'
    label = `${Math.floor(hoursAgo / 24)}d ago`
  } else if (hoursAgo >= 1) {
    dotColor = 'bg-emerald-400'
    label = `${hoursAgo}h ago`
  }

  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </div>
  )
}
