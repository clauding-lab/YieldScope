interface Tab<K extends string> {
  key: K
  label: string
}

interface TabsProps<K extends string> {
  tabs: Tab<K>[]
  active: K
  onChange?: (key: K) => void
}

export function Tabs<K extends string>({ tabs, active, onChange }: TabsProps<K>) {
  return (
    <div className="segmented">
      {tabs.map(t => (
        <button
          key={t.key}
          className={active === t.key ? 'active' : ''}
          onClick={() => onChange?.(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
