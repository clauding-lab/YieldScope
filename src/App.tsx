import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import DashboardPage from './pages/DashboardPage'

// Code-split heavy pages
const YieldAuctionsPage = lazy(() => import('./pages/YieldAuctionsPage'))
const LiquidityPage = lazy(() => import('./pages/LiquidityPage'))
const MacroExternalPage = lazy(() => import('./pages/MacroExternalPage'))
const FiscalSovereignPage = lazy(() => import('./pages/FiscalSovereignPage'))
const IntelligencePage = lazy(() => import('./pages/IntelligencePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function PageLoader() {
  return (
    <div className="py-6 space-y-4">
      <div className="h-8 bg-slate-800 rounded animate-pulse" />
      <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
      <div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
    </div>
  )
}

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/yields" element={<YieldAuctionsPage />} />
          <Route path="/liquidity" element={<LiquidityPage />} />
          <Route path="/macro" element={<MacroExternalPage />} />
          <Route path="/fiscal" element={<FiscalSovereignPage />} />
          <Route path="/intelligence" element={<IntelligencePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Legacy route redirects */}
          <Route path="/auctions" element={<Navigate to="/yields" replace />} />
          <Route path="/simulator" element={<Navigate to="/" replace />} />
          <Route path="/policy" element={<Navigate to="/intelligence" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}
