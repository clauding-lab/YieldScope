import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'

const Dashboard    = lazy(() => import('./pages/Dashboard'))
const Yields       = lazy(() => import('./pages/Yields'))
const Liquidity    = lazy(() => import('./pages/Liquidity'))
const Macro        = lazy(() => import('./pages/Macro'))
const Fiscal       = lazy(() => import('./pages/Fiscal'))
const Banking      = lazy(() => import('./pages/Banking'))
const Intelligence = lazy(() => import('./pages/Intelligence'))

function PageLoader() {
  return (
    <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ height: 32, background: 'var(--paper-2)', borderRadius: 8 }} />
      <div style={{ height: 192, background: 'var(--paper-2)', borderRadius: 14 }} />
      <div style={{ height: 128, background: 'var(--paper-2)', borderRadius: 14 }} />
    </div>
  )
}

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/yields"       element={<Yields />} />
          <Route path="/liquidity"    element={<Liquidity />} />
          <Route path="/macro"        element={<Macro />} />
          <Route path="/fiscal"       element={<Fiscal />} />
          <Route path="/banking"      element={<Banking />} />
          <Route path="/intelligence" element={<Intelligence />} />
          <Route path="/auctions"     element={<Navigate to="/yields" replace />} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}
