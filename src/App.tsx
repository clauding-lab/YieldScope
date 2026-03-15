import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import YieldAuctionsPage from './pages/YieldAuctionsPage'
import LiquidityPage from './pages/LiquidityPage'
import MacroExternalPage from './pages/MacroExternalPage'
import FiscalSovereignPage from './pages/FiscalSovereignPage'
import IntelligencePage from './pages/IntelligencePage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <AppShell>
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
    </AppShell>
  )
}
