import { HeaderActions } from '../primitives/HeaderActions'
import { Logo, Wordmark } from '../primitives/Logo'

export function MobileHeader() {
  return (
    <header className="mobile-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Logo size={32} />
        <Wordmark size={17} />
      </div>
      <HeaderActions compact />
    </header>
  )
}
