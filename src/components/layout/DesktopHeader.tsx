import { HeaderActions } from '../primitives/HeaderActions'

interface DesktopHeaderProps {
  section: string
  breadcrumb?: string
}

export function DesktopHeader({ section, breadcrumb }: DesktopHeaderProps) {
  return (
    <header
      className="desktop-header"
      style={{
        padding: '22px 36px 18px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 32,
      }}
    >
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>{breadcrumb ?? 'YieldScope · ALCO Intelligence'}</div>
        <h1 className="display" style={{ margin: 0, fontSize: 38 }}>{section}</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <HeaderActions />
        <span style={{ width: 1, height: 22, background: 'var(--line)' }} />
        <button type="button" className="btn btn-sm">Export brief</button>
      </div>
    </header>
  )
}
