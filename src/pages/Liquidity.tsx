import { useIsDesktop } from '../lib/hooks'
import { useLiquidity } from '../hooks/useLiquidity'
import { monthLabel } from '../lib/dates'
import { DemoBadge, ListRow, SectionTitle } from '../components/primitives'
import { AreaChart, BarChart } from '../components/charts'
import { DesktopHeader } from '../components/layout/DesktopHeader'

interface CorridorVizProps {
  tall?: boolean
  callRate?: number | null
  repo: number | null
  sdf: number | null
  slf: number | null
}

function CorridorViz({ tall = false, callRate, repo, sdf, slf }: CorridorVizProps) {
  // Dynamic axis from whatever BB-published values are present. Pad ±1pp so
  // the markers don't sit flush at the rail edges. Fall back to the long-running
  // 6–12% band when no values are loaded yet — keeps the empty rail proportioned
  // the same as a populated one (avoids a layout jump on first fire).
  const fmt = (v: number | null) => (v == null ? '—' : v.toFixed(2))
  const presentValues = [sdf, repo, slf].filter((v): v is number => v != null)
  const callRateInRange = callRate != null
  const allValues = callRateInRange ? [...presentValues, callRate] : presentValues
  const minV = allValues.length ? Math.min(...allValues) - 1 : 6
  const maxV = allValues.length ? Math.max(...allValues) + 1 : 12
  const pct = (v: number) => ((v - minV) / (maxV - minV)) * 100

  return (
    <div style={{ paddingBottom: tall ? 48 : 32 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
        <span className="caption">Standing deposit · {fmt(sdf)}</span>
        <span className="caption">Repo · {fmt(repo)}</span>
        <span className="caption">Standing lending · {fmt(slf)}</span>
      </div>
      <div style={{ position: 'relative', height: 8, background: 'var(--sunken)', borderRadius: 99 }}>
        {sdf != null && slf != null && (
          <div
            style={{
              position: 'absolute',
              left: `${pct(sdf)}%`,
              right: `${100 - pct(slf)}%`,
              top: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, var(--pos), var(--warn) 70%, var(--neg))',
              opacity: 0.25,
              borderRadius: 99,
            }}
          />
        )}
        {presentValues.map(v => (
          <div
            key={v}
            style={{
              position: 'absolute',
              left: `${pct(v)}%`,
              top: -4,
              bottom: -4,
              width: 2,
              background: 'var(--ink-2)',
              transform: 'translateX(-1px)',
              borderRadius: 2,
            }}
          />
        ))}
        {callRate != null && (
          <div
            style={{
              position: 'absolute',
              left: `${pct(callRate)}%`,
              top: -10,
              bottom: -10,
              width: 3,
              background: 'var(--neg)',
              transform: 'translateX(-1.5px)',
              borderRadius: 99,
            }}
          >
            <div
              style={{
                position: 'absolute',
                bottom: -32,
                left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              <div className="serif-num" style={{ fontSize: 18, color: 'var(--neg)' }}>{callRate.toFixed(2)}</div>
              <div className="caption" style={{ marginTop: -2 }}>Call · o/n</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Excess-liquidity display thresholds, in LAKH crore (the unit the panel renders).
// These are a straight 100x rescale of the previous thousand-crore thresholds
// (warn < 200 → < 2.0; ref line 150 → 1.5), correcting the same k-vs-lakh unit
// confusion that produced the 100x label bug. FINANCIAL-JUDGMENT values — the exact
// warn/floor levels are flagged for Adnan's confirmation.
const EXCESS_LIQ_WARN_LAKH_CR = 2.0   // bars below this render warn (tightening liquidity)
const EXCESS_LIQ_FLOOR_LAKH_CR = 1.5  // reference line on the desktop bar chart

function LiquidityMobile() {
  const { data } = useLiquidity()
  const m2Vintage = monthLabel(data?.m2YoYAsOf)

  return (
    <>
      <SectionTitle kicker="System pulse" title="Liquidity" />

      <div style={{ padding: '0 22px 28px' }}>
        <div className="caption">Call money · overnight</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
          <span className="serif-num" style={{ fontSize: 64, color: 'var(--neg)' }}>
            {data?.callMoneyRate?.toFixed(2) ?? '—'}
          </span>
          <span className="caption">%</span>
        </div>
        {data?.callSpark?.length ? (
          <div style={{ marginTop: 18 }}>
            <AreaChart data={data.callSpark} w={346} h={70} color="var(--neg)" />
          </div>
        ) : null}
      </div>

      <div style={{ padding: '0 22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div className="eyebrow">Policy corridor</div>
          {(data?.policyRepo == null || data?.policySdf == null || data?.policySlf == null || data?.corridorCoherent === false) && <DemoBadge />}
        </div>
        <CorridorViz
          callRate={data?.callMoneyRate}
          repo={data?.policyRepo ?? null}
          sdf={data?.policySdf ?? null}
          slf={data?.policySlf ?? null}
        />
      </div>

      <div style={{ padding: '0 22px 28px' }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Excess liquidity</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="serif-num" style={{ fontSize: 36 }}>
                {data?.excessLiquidityLakhCr?.toFixed(1) ?? '—'}
              </span>
              <span className="caption">lakh Cr</span>
            </div>
          </div>
          {data?.excessHistLakhCr?.length ? (
            <AreaChart data={data.excessHistLakhCr} w={140} h={48} color="var(--neg)" />
          ) : null}
        </div>
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 22px 10px' }}>
          <div className="caption">Reserve & money supply</div>
          {(data?.crrMaintainedPct == null || data?.slrMaintainedPct == null) && <DemoBadge />}
        </div>
        <div className="card-flat">
          <ListRow label="Money supply · M2 YoY" value={data?.m2YoY != null ? `${data.m2YoY.toFixed(1)}%` : '—'} sub={m2Vintage ?? undefined} />
          <ListRow label="CRR maintained" value={data?.crrMaintainedPct != null ? `${data.crrMaintainedPct.toFixed(2)}%` : '—'} sub="of deposits" />
          <ListRow label="SLR maintained" value={data?.slrMaintainedPct != null ? `${data.slrMaintainedPct.toFixed(2)}%` : '—'} sub="of deposits" last />
        </div>
      </div>
    </>
  )
}

function LiquidityDesktop() {
  const { data } = useLiquidity()
  const m2Vintage = monthLabel(data?.m2YoYAsOf)
  return (
    <>
      <DesktopHeader section="Liquidity" breadcrumb="YieldScope · Money market & corridor" />

      <div
        style={{
          padding: '36px 48px 32px',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 48,
        }}
      >
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Call money · overnight</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="serif-num" style={{ fontSize: 72, color: 'var(--neg)' }}>
              {data?.callMoneyRate?.toFixed(2) ?? '—'}
            </span>
            <span className="caption">%</span>
          </div>
        </div>
        <div>
          {data?.callSpark?.length ? (
            <AreaChart data={data.callSpark} w={520} h={170} color="var(--neg)" />
          ) : null}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '36px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
          <div className="eyebrow">Policy rate corridor</div>
          {(data?.policyRepo == null || data?.policySdf == null || data?.policySlf == null || data?.corridorCoherent === false) && <DemoBadge />}
        </div>
        <CorridorViz
          tall
          callRate={data?.callMoneyRate}
          repo={data?.policyRepo ?? null}
          sdf={data?.policySdf ?? null}
          slf={data?.policySlf ?? null}
        />
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '36px 48px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Excess liquidity</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="serif-num" style={{ fontSize: 48 }}>
              {data?.excessLiquidityLakhCr?.toFixed(1) ?? '—'}
            </span>
            <span className="caption">lakh Cr</span>
          </div>
          {data?.excessHistLakhCr?.length ? (
            <div style={{ marginTop: 16 }}>
              <BarChart
                w={400}
                h={130}
                threshold={EXCESS_LIQ_FLOOR_LAKH_CR}
                data={['W14', 'W15', 'W16', 'W17', 'W18', 'W19', 'W20', 'W21'].map((w, i) => ({
                  label: w,
                  value: data.excessHistLakhCr[i],
                  color: data.excessHistLakhCr[i] < EXCESS_LIQ_WARN_LAKH_CR ? 'var(--warn)' : 'var(--accent)',
                }))}
                fmt={v => v.toFixed(1)}
              />
            </div>
          ) : null}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div className="eyebrow">Money supply · M2 YoY</div>
            {data?.m2YoY == null && <DemoBadge />}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="serif-num" style={{ fontSize: 48 }}>{data?.m2YoY != null ? data.m2YoY.toFixed(1) : '—'}</span>
            <span className="caption">%</span>
          </div>
          {m2Vintage && <div className="caption" style={{ marginTop: 4 }}>{m2Vintage}</div>}
          {data?.m2Hist?.length ? (
            <div style={{ marginTop: 16 }}>
              <AreaChart data={data.m2Hist} w={360} h={100} color="var(--info)" />
            </div>
          ) : null}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div className="eyebrow">Reserve ratios · maintained</div>
            {(data?.crrMaintainedPct == null || data?.slrMaintainedPct == null) && <DemoBadge />}
          </div>
          {[
            { lbl: 'CRR', v: data?.crrMaintainedPct ?? null },
            { lbl: 'SLR', v: data?.slrMaintainedPct ?? null },
          ].map((r, i) => (
            <div key={r.lbl} style={{ marginTop: i === 0 ? 14 : 22 }}>
              <div className="caption">{r.lbl} · of deposits</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                <span className="serif-num" style={{ fontSize: 34 }}>{r.v != null ? r.v.toFixed(2) : '—'}</span>
                <span className="caption">%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default function Liquidity() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <LiquidityDesktop /> : <LiquidityMobile />
}
