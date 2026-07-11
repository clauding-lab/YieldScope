export function OutageChip() {
  return (
    <span
      className="chip chip-warn"
      title="Couldn't reach the live data source. Values shown may be missing or stale — reload to retry."
    >
      Live data unavailable
    </span>
  )
}
