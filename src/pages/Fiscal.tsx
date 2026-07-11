import type { ReactNode } from 'react'
import { useIsDesktop } from '../lib/hooks'
import { useFiscal } from '../hooks/useFiscal'
import { useIssuance } from '../hooks/useIssuance'
import { roundTo } from '../lib/yieldMath'
import { monthLabel } from '../lib/dates'
import { DemoBadge, ListRow, OutageChip, SectionTitle } from '../components/primitives'
import { AreaChart } from '../components/charts'
import { DesktopHeader } from '../components/layout/DesktopHeader'

function FiscalMobile() {
  const { data, error } = useFiscal()
  const nbrFytdCr = data?.nbrFytdCr ?? null
  const nbrFytdAsOf = data?.nbrFytdAsOf ?? null
  const domesticBorrowingCr = data?.domesticBorrowingCr ?? null
  const debtGdpRatio = roundTo(data?.debtGdpRatio ?? null, 1)
  const debtGdpAsOf = data?.debtGdpAsOf ?? null
  const debtGdpHist = data?.debtGdpHist ?? []
  const demoLabel = (label: string): ReactNode => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {label}
      <DemoBadge />
    </span>
  )
  return (
    <>
      <SectionTitle kicker="Sovereign balance sheet" title="Fiscal" action={error != null ? <OutageChip /> : undefined} />

      <div style={{ padding: '0 16px 24px' }}>
        <div className="card-flat">
          <ListRow
            label={nbrFytdCr == null ? demoLabel('NBR revenue · FYTD') : 'NBR revenue · FYTD'}
            value={nbrFytdCr != null ? <><span className="num">{(nbrFytdCr / 1000).toFixed(1)}</span> k Cr</> : '—'}
            sub={monthLabel(nbrFytdAsOf) ?? undefined}
          />
          <ListRow
            label={debtGdpRatio == null ? demoLabel('Debt / GDP') : 'Debt / GDP'}
            value={debtGdpRatio != null ? `${debtGdpRatio}%` : '—'}
            sub={debtGdpRatio != null && debtGdpAsOf ? `FY${debtGdpAsOf.slice(0, 4)}` : undefined}
          />
          <ListRow
            label={domesticBorrowingCr == null ? demoLabel('Net dom. borrow') : 'Net dom. borrow'}
            value={domesticBorrowingCr != null ? `${(domesticBorrowingCr / 1000).toFixed(1)} k Cr` : '—'}
            last
          />
        </div>
      </div>

      <div style={{ padding: '0 22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div className="eyebrow">Public debt / GDP</div>
          {debtGdpHist.length === 0 && <DemoBadge />}
        </div>
        <AreaChart data={debtGdpHist} w={346} h={90} color="var(--neg)" />
      </div>
    </>
  )
}

function FiscalDesktop() {
  const { data, error } = useFiscal()
  const { data: issuance, error: issuanceError } = useIssuance()
  const nbrFytdCr = data?.nbrFytdCr ?? null
  const domesticBorrowingCr = data?.domesticBorrowingCr ?? null
  const debtGdpRatio = roundTo(data?.debtGdpRatio ?? null, 1)
  const debtGdpAsOf = data?.debtGdpAsOf ?? null
  const debtGdpHist = data?.debtGdpHist ?? []
  const debtDomesticCr = data?.debtDomesticCr ?? null
  const debtExternalCr = data?.debtExternalCr ?? null
  const imfEffSdrMn = data?.imfEffSdrMn ?? null
  const n = debtGdpHist.length
  const debtGdp24mBps = n >= 3 ? roundTo((debtGdpHist[n - 1] - debtGdpHist[n - 3]) * 100, 0) : null
  const demoLabel = (label: string): ReactNode => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {label}
      <DemoBadge />
    </span>
  )
  return (
    <>
      <DesktopHeader section="Fiscal" breadcrumb="YieldScope · Sovereign balance sheet" action={error != null ? <OutageChip /> : undefined} />

      <div style={{ padding: '40px 48px 32px' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Key fiscal metrics</div>
        <div className="card-flat" style={{ padding: 18, maxWidth: 540 }}>
          <ListRow
            label={nbrFytdCr == null ? demoLabel('NBR revenue · FYTD') : 'NBR revenue · FYTD'}
            value={nbrFytdCr != null ? `${(nbrFytdCr / 1000).toFixed(1)} k Cr` : '—'}
            sub={monthLabel(data?.nbrFytdAsOf ?? null) ?? undefined}
          />
          <ListRow
            label={debtGdpRatio == null ? demoLabel('Debt / GDP') : 'Debt / GDP'}
            value={debtGdpRatio != null ? `${debtGdpRatio}%` : '—'}
            sub={debtGdpRatio != null && debtGdpAsOf ? `FY${debtGdpAsOf.slice(0, 4)}` : undefined}
          />
          <ListRow
            label={domesticBorrowingCr == null ? demoLabel('Net dom. borrow') : 'Net dom. borrow'}
            value={domesticBorrowingCr != null ? `${(domesticBorrowingCr / 1000).toFixed(1)} k Cr` : '—'}
            last
          />
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '36px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div className="eyebrow">Public debt / GDP · trend</div>
          {debtGdpRatio == null && <DemoBadge />}
        </div>
        <div className="caption" style={{ marginBottom: 10 }}>
          {debtGdpRatio != null ? `${debtGdpRatio}%` : '—'}
          {debtGdpRatio != null && debtGdpAsOf ? ` · FY${debtGdpAsOf.slice(0, 4)}` : ''}
          {debtGdp24mBps != null ? ` · ${debtGdp24mBps >= 0 ? '↑' : '↓'} ${Math.abs(debtGdp24mBps)} bps / 24m` : ''}
        </div>
        <AreaChart data={debtGdpHist} w={760} h={140} color="var(--neg)" />
        <div style={{ display: 'flex', gap: 48, marginTop: 16 }}>
          <div><div className="caption">Domestic</div><div className="serif-num" style={{ fontSize: 20 }}>{debtDomesticCr != null ? `৳${(debtDomesticCr / 100000).toFixed(1)}L cr` : '—'}</div></div>
          <div><div className="caption">External</div><div className="serif-num" style={{ fontSize: 20 }}>{debtExternalCr != null ? `৳${(debtExternalCr / 100000).toFixed(1)}L cr` : '—'}</div></div>
          <div><div className="caption">IMF EFF</div><div className="serif-num" style={{ fontSize: 20 }}>{imfEffSdrMn != null ? `SDR ${(imfEffSdrMn / 1000).toFixed(2)}B` : '—'}</div></div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '36px 48px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <div className="eyebrow">
            Gross issuance calendar{issuanceError == null ? ` · next ${issuance?.length ?? 0} weeks` : ''} · BB forward calendar
          </div>
          {issuanceError == null && (issuance == null || issuance.length === 0) && <DemoBadge />}
        </div>
        {issuanceError != null ? (
          <div className="card-flat" style={{ padding: '20px 18px' }}>
            <div style={{ fontSize: 14, color: 'var(--warn)' }}>Couldn't load the auction calendar</div>
          </div>
        ) : issuance != null && issuance.length > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${issuance.length}, 1fr)`, gap: 8 }}>
              {issuance.map(w => {
                const maxTotal = Math.max(...issuance.map(x => x.tbillCr + x.tbondCr))
                const total = w.tbillCr + w.tbondCr
                return (
                  <div key={w.weekLabel} style={{ textAlign: 'center' }}>
                    <div style={{ height: 80, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2 }}>
                      {w.tbillCr > 0 && (
                        <div style={{ height: `${(w.tbillCr / maxTotal) * 100}%`, background: 'var(--accent)', borderRadius: '2px 2px 0 0' }} />
                      )}
                      {w.tbondCr > 0 && (
                        <div style={{ height: `${(w.tbondCr / maxTotal) * 100}%`, background: 'var(--info)', borderRadius: '2px 2px 0 0' }} />
                      )}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div className="caption">{w.weekLabel}</div>
                      <div className="serif-num" style={{ fontSize: 14, marginTop: 2 }}>{(total / 1000).toFixed(1)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, background: 'var(--accent)', borderRadius: 3 }} />
                <span className="caption">T-bills</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, background: 'var(--info)', borderRadius: 3 }} />
                <span className="caption">BGTB</span>
              </span>
              <span className="caption" style={{ marginLeft: 'auto' }}>k Cr / week</span>
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}

export default function Fiscal() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <FiscalDesktop /> : <FiscalMobile />
}
