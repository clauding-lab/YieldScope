import type { ReactNode } from 'react'
import { useIsDesktop } from '../lib/hooks'
import { Bar, DemoBadge, ListRow, OutageChip, SectionTitle } from '../components/primitives'
import { AreaChart } from '../components/charts'
import { DesktopHeader } from '../components/layout/DesktopHeader'
import { useBanking } from '../hooks/useBanking'
import { monthLabel } from '../lib/dates'
import type { BankingData } from '../hooks/useBanking'

function BankingMobile({ liveData, error }: { liveData: BankingData | null; error: Error | null }) {
  const nplRatio = liveData?.nplRatio ?? null
  const nplVintage = liveData?.nplVintage ?? null
  const crar     = liveData?.crar     ?? null  // plausibility-gated: null when fabricated/absent
  const crarVintage = liveData?.crarVintage ?? null
  const pvtCreditYoY = liveData?.pvtCreditYoY ?? null
  const pvtCreditVintage = monthLabel(liveData?.pvtCreditYoYAsOf)
  const cdRatio  = liveData?.cdRatio ?? null
  const repoBorrowCr = liveData?.repoBorrowCr ?? null
  const crarStale = liveData?.crarStale ?? false
  // Provenance qualifier comes from the HOOK, keyed to the specific print's
  // as_of (#25 review HIGH) — e.g. "BB QFSAR pre-shock" is true of the
  // Sep-2025 1.56% print only. A newer quarterly print arrives with vintage
  // alone; hardcoding the string here would attach a false provenance to it.
  const crarQualifier = liveData?.crarQualifier ?? undefined
  const prudential: { lbl: string; v: number | null; max: number; unit: string; live: boolean; vintage?: string | null; qualifier?: string; stale?: boolean }[] = [
    { lbl: 'CAR', v: crar, max: 16, unit: '%', live: true, vintage: crarVintage, qualifier: crarQualifier, stale: crarStale },
  ]
  return (
    <>
      <SectionTitle kicker="Sector health" title="Banks" action={error != null ? <OutageChip /> : undefined} />

      <div style={{ padding: '0 22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div className="caption">Pvt credit / deposits</div>
          {cdRatio == null && <DemoBadge />}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
          <span className="serif-num" style={{ fontSize: 64 }}>{cdRatio != null ? cdRatio.toFixed(1) : '—'}</span>
          <span className="caption">%</span>
        </div>
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        <div className="card-flat">
          <ListRow
            label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>NPL · industry {nplRatio == null && <DemoBadge />}</span> as ReactNode}
            value={nplRatio != null ? `${nplRatio.toFixed(1)}%` : '—'}
            sub={nplVintage ?? undefined}
          />
          <ListRow
            label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>Pvt sector credit · YoY {pvtCreditYoY == null && <DemoBadge />}</span> as ReactNode}
            value={pvtCreditYoY != null ? `${pvtCreditYoY.toFixed(1)}%` : '—'}
            sub={pvtCreditVintage ?? undefined}
          />
          <ListRow
            label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>Interbank repo · volume {repoBorrowCr == null && <DemoBadge />}</span> as ReactNode}
            value={repoBorrowCr != null ? `${(repoBorrowCr / 1000).toFixed(1)} k Cr` : '—'}
            last
          />
        </div>
      </div>

      <div style={{ padding: '0 22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div className="eyebrow">Capital adequacy</div>
        </div>
        {prudential.map(p => {
          const provenance = p.qualifier && p.v != null
            ? `${p.qualifier}${p.vintage ? ` · ${p.vintage}` : ''}`
            : p.vintage ?? null
          return (
            <div key={p.lbl} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {p.lbl}
                  {/* Badge when not-live OR when a live value was gated out (data fault/absent) */}
                  {(!p.live || p.v == null) && <DemoBadge />}
                  {provenance && <span className="caption">{provenance}</span>}
                  {p.stale && p.v != null && <span className="chip chip-warn">stale</span>}
                </span>
                <span className="serif-num" style={{ fontSize: 18 }}>{p.v != null ? `${p.v}${p.unit}` : '—'}</span>
              </div>
              {/* Bar is a 0-based magnitude — skip it for a negative print (possible under the widened CAR band). */}
              {p.v != null && p.v >= 0 && <Bar value={p.v} max={p.max} h={4} thresholds={[0.2, 0.5]} />}
            </div>
          )
        })}
      </div>

    </>
  )
}

function BankingDesktop({ liveData, error }: { liveData: BankingData | null; error: Error | null }) {
  const nplRatio = liveData?.nplRatio ?? null
  const nplVintage = liveData?.nplVintage ?? null
  const nplHist  = liveData?.nplHist?.length ? liveData.nplHist : null
  const cdRatio  = liveData?.cdRatio ?? null
  const repoBorrowCr = liveData?.repoBorrowCr ?? null
  const repoBorrowHist = liveData?.repoBorrowHist ?? []
  return (
    <>
      <DesktopHeader section="Banking" breadcrumb="YieldScope · Sector health & prudential" action={error != null ? <OutageChip /> : undefined} />

      <div
        style={{
          padding: '40px 48px 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 48,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div className="eyebrow">Pvt credit / deposits</div>
            {cdRatio == null && <DemoBadge />}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="serif-num" style={{ fontSize: 72 }}>{cdRatio != null ? cdRatio.toFixed(1) : '—'}</span>
            <span className="caption">%</span>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div className="eyebrow">NPL · industry</div>
            {nplRatio == null && <DemoBadge />}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="serif-num" style={{ fontSize: 72, color: 'var(--neg)' }}>{nplRatio != null ? nplRatio.toFixed(1) : '—'}</span>
            <span className="caption">%</span>
          </div>
          {nplVintage && <div className="caption" style={{ marginTop: 4 }}>{nplVintage}</div>}
          {nplHist && (
            <div style={{ marginTop: 18 }}>
              <AreaChart data={nplHist} w={400} h={100} color="var(--neg)" />
            </div>
          )}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div className="eyebrow">Interbank repo · volume</div>
            {repoBorrowCr == null && <DemoBadge />}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="serif-num" style={{ fontSize: 72, color: 'var(--neg)' }}>{repoBorrowCr != null ? (repoBorrowCr / 1000).toFixed(1) : '—'}</span>
            <span className="caption">k Cr</span>
          </div>
          {repoBorrowHist.length >= 2 && (
            <div style={{ marginTop: 18 }}>
              <AreaChart data={repoBorrowHist} w={400} h={100} color="var(--neg)" />
            </div>
          )}
        </div>
      </div>

    </>
  )
}

export default function Banking() {
  const isDesktop = useIsDesktop()
  const { data, error } = useBanking()
  return isDesktop
    ? <BankingDesktop liveData={data} error={error} />
    : <BankingMobile liveData={data} error={error} />
}
