interface HeatmapProps<T = number> {
  rows: string[]
  cols: string[]
  data: T[][]
  getColor: (value: T, rowIdx: number, colIdx: number) => { bg: string; fg: string }
  cellH?: number
  leftW?: number
  fmt?: (value: T) => string
}

export function Heatmap<T = number>({
  rows,
  cols,
  data,
  getColor,
  cellH = 26,
  leftW = 110,
  fmt = (v: T) => (typeof v === 'number' ? (v as number).toFixed(1) : String(v)),
}: HeatmapProps<T>) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, marginBottom: 6 }}>
        <div style={{ width: leftW, flexShrink: 0 }} />
        {cols.map((c, j) => (
          <div key={j} className="caption" style={{ flex: 1, textAlign: 'center', fontSize: 10 }}>{c}</div>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3 }}>
          <div
            style={{
              width: leftW,
              flexShrink: 0,
              fontSize: 12,
              color: 'var(--ink-2)',
              paddingRight: 8,
              letterSpacing: '-0.005em',
            }}
          >
            {r}
          </div>
          {cols.map((_c, j) => {
            const v = data[i][j]
            const col = getColor(v, i, j)
            return (
              <div
                key={j}
                style={{
                  flex: 1,
                  height: cellH,
                  background: col.bg,
                  color: col.fg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 500,
                  borderRadius: 4,
                  letterSpacing: '-0.01em',
                }}
              >
                {fmt(v)}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
