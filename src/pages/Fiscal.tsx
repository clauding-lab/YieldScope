import type { ReactNode } from 'react'
import { useIsDesktop } from '../lib/hooks'
import { useFiscal } from '../hooks/useFiscal'
import { useIssuance } from '../hooks/useIssuance'
import { roundTo } from '../lib/yieldMath'
import { monthLabel } from '../lib/dates'
import { Bar, DemoBadge, ListRow, SectionTitle } from '../components/primitives'
import { AreaChart, RadialGauge } from '../components/charts'
import { DesktopHeader } from '../components/layout/DesktopHeader'

function FiscalMobile() {
  const { data } = useFiscal()
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
      <SectionTitle kicker="Sovereign balance sheet" title="Fiscal" />

      <div style={{ padding: '0 22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div className="caption">Fiscal pressure · composite</div>
          <DemoBadge />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
          <span className="serif-num" style={{ fontSize: 64, color: 'var(--warn)' }}>68</span>
          <span className="caption">/ 100</span>
        </div>

        <div style={{ marginTop: 18 }}>
          <Bar value={68} thresholds={[0.33, 0.66]} h={8} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span className="caption">Low</span>
            <span className="caption">Stress</span>
            <span className="caption">Crisis</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        <div className="card-flat">
          <ListRow
            label={nbrFytdCr == null ? demoLabel('NBR revenue · FYTD') : 'NBR revenue · FYTD'}
            value={nbrFytdCr != null ? <>{(nbrFytdCr / 1000).toFixed(1)}<span className="caption"> k Cr</span></> : '—'}
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
  const { data } = useFiscal()
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
      <DesktopHeader section="Fiscal" breadcrumb="YieldScope · Sovereign balance sheet" />

      <div
        style={{
          padding: '40px 48px 32px',
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: 48,
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <RadialGauge value={68} max={100} label="Fiscal pressure · 0–100" thresholds={[33, 66]} size={280} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div className="eyebrow">Fiscal pressure index</div>
            <DemoBadge />
          </div>
          <h2 className="display" style={{ fontSize: 36, margin: 0, color: 'var(--warn)' }}>Elevated.</h2>
          <div className="card-flat" style={{ padding: 18, marginTop: 22, maxWidth: 540 }}>
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
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '36px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div className="eyebrow">NBR revenue · FYTD</div>
            {nbrFytdCr == null && <DemoBadge />}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="serif-num" style={{ fontSize: 44 }}>{nbrFytdCr != null ? (nbrFytdCr / 1000).toFixed(1) : '—'}</span>
            <span className="caption">k Cr</span>
          </div>
          <div className="caption" style={{ marginTop: 4 }}>{monthLabel(data?.nbrFytdAsOf ?? null) ?? ''}</div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div className="eyebrow">Public debt / GDP</div>
            {debtGdpRatio == null && <DemoBadge />}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="serif-num" style={{ fontSize: 44, color: 'var(--neg)' }}>{debtGdpRatio != null ? debtGdpRatio : '—'}</span>
            <span className="caption">%</span>
          </div>
          <div className="caption" style={{ marginTop: 4 }}>
            {debtGdpRatio != null && debtGdpAsOf ? `FY${debtGdpAsOf.slice(0, 4)}` : ''}
            {debtGdp24mBps != null ? `${debtGdpAsOf ? ' · ' : ''}${debtGdp24mBps >= 0 ? '↑' : '↓'} ${Math.abs(debtGdp24mBps)} bps / 24m` : ''}
          </div>
          <div style={{ marginTop: 14 }}>
            <AreaChart data={debtGdpHist} w={360} h={100} color="var(--neg)" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <div><div className="caption">Domestic</div><div className="serif-num" style={{ fontSize: 18 }}>{debtDomesticCr != null ? `৳${(debtDomesticCr / 100000).toFixed(1)}L cr` : '—'}</div></div>
            <div><div className="caption">External</div><div className="serif-num" style={{ fontSize: 18 }}>{debtExternalCr != null ? `৳${(debtExternalCr / 100000).toFixed(1)}L cr` : '—'}</div></div>
            <div><div className="caption">IMF EFF</div><div className="serif-num" style={{ fontSize: 18 }}>{imfEffSdrMn != null ? `SDR ${(imfEffSdrMn / 1000).toFixed(2)}B` : '—'}</div></div>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '36px 48px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <div className="eyebrow">
            Gross issuance calendar · next {issuance?.length ?? 0} weeks · BB forward calendar
          </div>
          {(issuance == null || issuance.length === 0) && <DemoBadge />}
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
