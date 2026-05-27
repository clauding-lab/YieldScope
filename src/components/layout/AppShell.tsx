import type { ReactNode } from 'react'
import { useIsDesktop } from '../../lib/hooks'
import { BottomNav } from './BottomNav'
import { DesktopSideNav } from './DesktopSideNav'
import { MobileHeader } from './MobileHeader'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const isDesktop = useIsDesktop()

  if (isDesktop) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          background: 'var(--bg)',
          color: 'var(--ink)',
        }}
      >
        <DesktopSideNav />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            minWidth: 0,
          }}
        >
          {children}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        color: 'var(--ink)',
      }}
    >
      <MobileHeader />
      <main
        style={{
          flex: 1,
          paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
