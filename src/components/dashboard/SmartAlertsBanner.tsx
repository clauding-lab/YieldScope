import { useMemo } from 'react'
import type { SmartAlert } from '../../types/alerts'
import { generateAlerts } from '../../services/alertEngine'
import { useYieldData } from '../../hooks/useYieldData'
import { useAuctionData } from '../../hooks/useAuctionData'
import { useMoneySupplyData } from '../../hooks/useMoneySupplyData'
import { useRepoData } from '../../hooks/useRepoData'

const SEVERITY_STYLES = {
  critical: 'border-red-500/50 bg-red-950/30 text-red-300',
  warning: 'border-amber-500/50 bg-amber-950/30 text-amber-300',
  positive: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300',
} as const

const SEVERITY_DOT = {
  critical: 'bg-red-400',
  warning: 'bg-amber-400',
  positive: 'bg-emerald-400',
} as const

export function SmartAlertsBanner() {
  const { data: yieldData } = useYieldData()
  const { data: auctionData } = useAuctionData()
  const { data: moneySupplyData } = useMoneySupplyData()
  const { data: repoData } = useRepoData()

  const alerts = useMemo<SmartAlert[]>(() => {
    return generateAlerts({
      yieldData,
      auctionData,
      moneySupplyData,
      repoData,
    })
  }, [yieldData, auctionData, moneySupplyData, repoData])

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3">
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          No active alerts — markets operating normally
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Smart Alerts
        </h2>
        <span className="text-[10px] text-slate-500">{alerts.length} active</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  )
}

function AlertCard({ alert }: { alert: SmartAlert }) {
  return (
    <div
      className={`rounded-lg border p-2.5 ${SEVERITY_STYLES[alert.severity]}`}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${SEVERITY_DOT[alert.severity]}`} />
        <div className="min-w-0">
          <p className="text-xs font-medium leading-tight">{alert.message}</p>
        </div>
      </div>
    </div>
  )
}
