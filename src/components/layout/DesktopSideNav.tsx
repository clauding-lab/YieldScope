import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Logo, Wordmark } from '../primitives/Logo'
import { NavIcon } from '../primitives/NavIcon'
import { NAV_ITEMS, activeKeyForPath } from '../../lib/routes'

function SideNavToggle({ pinned, expanded, onToggle }: { pinned: boolean; expanded: boolean; onToggle: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={pinned ? 'Collapse sidebar' : 'Pin sidebar open'}
      aria-label={pinned ? 'Collapse sidebar' : 'Pin sidebar open'}
      style={{
        position: 'absolute',
        right: -13,
        top: 38,
        width: 26,
        height: 26,
        borderRadius: 99,
        background: 'var(--paper)',
        border: '1px solid var(--line-2)',
        boxShadow: hover
          ? '0 4px 12px rgba(0, 0, 0, 0.18), 0 0 0 3px var(--accent-soft)'
          : '0 2px 6px rgba(0, 0, 0, 0.12)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 8,
        padding: 0,
        transition: 'all 0.18s ease',
        opacity: hover || expanded ? 1 : 0.55,
      }}
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 12 12"
        fill="none"
        style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.22s ease' }}
      >
        <path d="M7.5 2.5 L4 6 L7.5 9.5" stroke="var(--ink-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </button>
  )
}

export function DesktopSideNav() {
  const { pathname } = useLocation()
  const active = activeKeyForPath(pathname)
  const [pinned, setPinned] = useState(true)
  const [hovering, setHovering] = useState(false)
  const expanded = pinned || hovering

  return (
    <nav
      onMouseEnter={() => !pinned && setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        width: expanded ? 220 : 64,
        background: 'var(--paper-2)',
        borderRight: '1px solid var(--line)',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
        position: 'relative',
        zIndex: 6,
        boxShadow: !pinned && hovering ? '4px 0 24px rgba(0,0,0,0.18)' : 'none',
      }}
    >
      <div
        style={{
          padding: '0 14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: expanded ? 'flex-start' : 'center',
          height: 32,
        }}
      >
        <div style={{ padding: expanded ? '0 8px' : 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={30} />
          {expanded && <Wordmark size={17} />}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px' }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.key === active
          return (
            <Link
              key={item.key}
              to={item.path}
              title={!expanded ? item.label : undefined}
              style={{
                padding: expanded ? '9px 10px' : '10px 0',
                cursor: 'pointer',
                borderRadius: 10,
                background: isActive ? 'var(--paper)' : 'transparent',
                color: isActive ? 'var(--ink)' : 'var(--ink-2)',
                fontSize: 13.5,
                fontWeight: isActive ? 500 : 400,
                letterSpacing: '-0.005em',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                justifyContent: expanded ? 'flex-start' : 'center',
                border: isActive ? '1px solid var(--line)' : '1px solid transparent',
                transition: 'all 0.18s ease',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
              }}
            >
              <NavIcon name={item.icon} size={16} color={isActive ? 'var(--accent)' : 'var(--ink-3)'} />
              {expanded && <span style={{ flex: 1 }}>{item.label}</span>}
              {expanded && isActive && <span style={{ width: 4, height: 4, borderRadius: 99, background: 'var(--accent)' }} />}
            </Link>
          )
        })}
      </div>

      <div style={{ flex: 1 }} />

      <SideNavToggle pinned={pinned} expanded={expanded} onToggle={() => { setPinned(p => !p); setHovering(false) }} />
    </nav>
  )
}
