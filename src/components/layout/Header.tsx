export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <svg className="w-6 h-6 text-accent" viewBox="0 0 64 64" fill="none">
          <path
            d="M12 44 C18 40, 24 36, 28 34 C32 32, 36 28, 40 25 C44 22, 48 20, 52 18"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
        <h1 className="text-lg font-semibold tracking-tight">
          <span className="text-accent">Yield</span>
          <span className="text-slate-300">Scope</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <DataFreshnessDot />
      </div>
    </header>
  )
}

function DataFreshnessDot() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
      <span>Sample data</span>
    </div>
  )
}
