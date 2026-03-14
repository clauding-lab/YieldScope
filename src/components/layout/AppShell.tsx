import type { ReactNode } from 'react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { OfflineBanner } from './OfflineBanner'
import { InstallPrompt } from './InstallPrompt'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <OfflineBanner />
      <InstallPrompt />
      <main className="flex-1 overflow-y-auto pb-20 px-4">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
