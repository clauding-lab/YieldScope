import type { NavIconName } from '../../lib/routes'

interface NavIconProps {
  name: NavIconName
  size?: number
  color?: string
}

export function NavIcon({ name, size = 16, color = 'currentColor' }: NavIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (name) {
    case 'dash':
      return (
        <svg {...common}>
          <circle cx="4"  cy="4"  r="1.2" fill={color} />
          <circle cx="4"  cy="12" r="1.2" fill={color} />
          <circle cx="12" cy="4"  r="1.2" fill={color} />
          <circle cx="12" cy="12" r="1.2" fill={color} />
        </svg>
      )
    case 'curve':
      return (
        <svg {...common}>
          <path d="M2 13 Q6 13 8 8 T14 3" />
          <circle cx="14" cy="3" r="1.4" fill={color} stroke="none" />
        </svg>
      )
    case 'wave':
      return (
        <svg {...common}>
          <path d="M2 7 Q4.5 4 7 7 T12 7 T14 7" />
          <path d="M2 11 Q4.5 8 7 11 T12 11 T14 11" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" />
          <path d="M2 8 H14 M8 2 Q11.5 5 11.5 8 T8 14 Q4.5 11 4.5 8 T8 2" />
        </svg>
      )
    case 'bars':
      return (
        <svg {...common}>
          <rect x="2"     y="9" width="2.5" height="5" />
          <rect x="6.75"  y="6" width="2.5" height="8" />
          <rect x="11.5"  y="3" width="2.5" height="11" />
        </svg>
      )
    case 'columns':
      return (
        <svg {...common}>
          <path d="M2 13 H14" />
          <path d="M3 13 V6 M6 13 V6 M10 13 V6 M13 13 V6" />
          <path d="M2 6 L8 3 L14 6" />
        </svg>
      )
    case 'note':
      return (
        <svg {...common}>
          <rect x="3" y="2.5" width="10" height="11" rx="1.5" />
          <path d="M5.5 6 H10.5 M5.5 8.5 H10.5 M5.5 11 H8.5" />
        </svg>
      )
  }
}
