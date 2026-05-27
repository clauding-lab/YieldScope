interface LogoProps {
  size?: number
  accent?: string
}

export function Logo({ size = 28, accent }: LogoProps) {
  const accentColor = accent ?? 'var(--accent)'
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <linearGradient id="lg-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="var(--ink)"   stopOpacity="1" />
          <stop offset="100%" stopColor="var(--ink-2)" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#lg-bg)" />
      <rect width="32" height="32" rx="9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <path
        d="M6.5 23 Q12 23, 15 16 T24 8.5"
        stroke="var(--paper)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      <circle cx="24" cy="8.5" r="3.2" fill={accentColor} />
      <circle cx="24" cy="8.5" r="3.2" fill={accentColor} opacity="0.35" style={{ filter: 'blur(2px)' }} />
    </svg>
  )
}

export function Wordmark({ size = 18 }: { size?: number }) {
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 550,
        letterSpacing: '-0.022em',
        lineHeight: 1,
      }}
    >
      <span style={{ color: 'var(--ink)' }}>Yield</span>
      <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>Scope</span>
    </div>
  )
}
