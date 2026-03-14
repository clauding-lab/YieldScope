import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { YieldCurvePage } from './pages/YieldCurvePage'
import { AuctionsPage } from './pages/AuctionsPage'
import { PolicyPage } from './pages/PolicyPage'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<YieldCurvePage />} />
        <Route path="/auctions" element={<AuctionsPage />} />
        <Route path="/policy" element={<PolicyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
