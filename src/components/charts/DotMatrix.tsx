interface DotMatrixSegment {
  value: number
  color: string
}

interface DotMatrixProps {
  segments: DotMatrixSegment[]
  total?: number
  cols?: number
  dotSize?: number
  gap?: number
}

export function DotMatrix({ segments, total = 100, cols = 10, dotSize = 9, gap = 4 }: DotMatrixProps) {
  const dots: string[] = []
  segments.forEach(seg => {
    for (let i = 0; i < seg.value; i++) dots.push(seg.color)
  })
  while (dots.length < total) dots.push('var(--sunken)')

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${dotSize}px)`,
        gap,
        width: 'fit-content',
      }}
    >
      {dots.slice(0, total).map((c, i) => (
        <div
          key={i}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: 99,
            background: c,
            transition: 'background 0.3s',
          }}
        />
      ))}
    </div>
  )
}
