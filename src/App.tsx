import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { YieldCurvePage } from './pages/YieldCurvePage'
import { AuctionsPage } from './pages/AuctionsPage'
import IntelligencePage from './pages/IntelligencePage'
import SimulatorPage from './pages/SimulatorPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<YieldCurvePage />} />
        <Route path="/auctions" element={<AuctionsPage />} />
        <Route path="/intelligence" element={<IntelligencePage />} />
        <Route path="/simulator" element={<SimulatorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {/* Legacy route redirect */}
        <Route path="/policy" element={<Navigate to="/intelligence" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
