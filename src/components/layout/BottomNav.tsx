import { Link, useLocation } from 'react-router-dom'
import { NavIcon } from '../primitives/NavIcon'
import { NAV_ITEMS, activeKeyForPath } from '../../lib/routes'

export function BottomNav() {
  const { pathname } = useLocation()
  const active = activeKeyForPath(pathname)

  return (
    <nav className="glass mobile-nav" aria-label="Main">
      {NAV_ITEMS.map(item => {
        const isActive = item.key === active
        return (
          <Link
            key={item.key}
            to={item.path}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <NavIcon name={item.icon} size={17} color={isActive ? 'var(--accent)' : 'var(--ink-3)'} />
            <span
              style={{
                fontSize: 9.5,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--ink)' : 'var(--ink-3)',
                letterSpacing: '-0.005em',
              }}
            >
              {item.shortLabel ?? item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
