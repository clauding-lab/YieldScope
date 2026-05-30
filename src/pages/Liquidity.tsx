import { useIsDesktop } from '../lib/hooks'
import { FX } from '../data/fixtures'
import { useLiquidity } from '../hooks/useLiquidity'
import { monthLabel } from '../lib/dates'
import { Bar, DemoBadge, ListRow, SectionTitle } from '../components/primitives'
import { AreaChart, BarChart, Heatmap } from '../components/charts'
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

const INTRADAY_ROWS = ['Monday', 'Tuesday', 'Wed', 'Thursday', 'Sunday']
const INTRADAY_COLS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']
const INTRADAY_DATA = [
  [9.18, 9.22, 8.94, 8.78, 8.62, 8.55, 8.62, 8.74],
  [9.04, 9.08, 8.92, 8.74, 8.58, 8.52, 8.58, 8.68],
  [9.34, 9.32, 9.08, 8.92, 8.74, 8.64, 8.72, 8.84],
  [8.92, 8.96, 8.84, 8.68, 8.54, 8.48, 8.56, 8.66],
  [8.62, 8.54, 8.42, 8.34, 8.28, 8.24, 8.30, 8.42],
]

function intradayColor(v: number) {
  const pct = Math.max(0, Math.min(1, (v - 8.20) / (9.40 - 8.20)))
  if (pct > 0.66) return { bg: `rgba(213, 143, 118, ${0.30 + pct * 0.35})`, fg: 'var(--neg)' }
  if (pct > 0.33) return { bg: `rgba(215, 184, 114, ${0.25 + pct * 0.30})`, fg: 'var(--warn)' }
  return { bg: `rgba(146, 176, 149, ${0.18 + (1 - pct) * 0.22})`, fg: 'var(--pos)' }
}

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
          {(data?.policyRepo == null || data?.policySdf == null || data?.policySlf == null) && <DemoBadge />}
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
                {data?.excessLiquidityKCr?.toFixed(1) ?? '—'}
              </span>
              <span className="caption">k Cr</span>
            </div>
          </div>
          {data?.excessHistKCr?.length ? (
            <AreaChart data={data.excessHistKCr} w={140} h={48} color="var(--neg)" />
          ) : null}
        </div>
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 22px 10px' }}>
          <div className="caption">Reserve & money supply</div>
          <DemoBadge />
        </div>
        <div className="card-flat">
          <ListRow label="Money supply · M2 YoY" value={data?.m2YoY != null ? `${data.m2YoY.toFixed(1)}%` : '—'} sub={m2Vintage ?? undefined} />
          <ListRow label="CRR utilisation"       value="92%"       sub="Reserve ratio 4.0%" />
          <ListRow label="SLR utilisation"       value="86%"       sub="Statutory ratio 13.0%" />
          <ListRow label="Repo from BB"          value="124.6 k Cr" last />
        </div>
      </div>
    </>
  )
}

function LiquidityDesktop() {
  const { data } = useLiquidity()
  const L = FX.liquidity
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
          {(data?.policyRepo == null || data?.policySdf == null || data?.policySlf == null) && <DemoBadge />}
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
              {data?.excessLiquidityKCr?.toFixed(1) ?? '—'}
            </span>
            <span className="caption">k Cr</span>
          </div>
          {data?.excessHistKCr?.length ? (
            <div style={{ marginTop: 16 }}>
              <BarChart
                w={400}
                h={130}
                threshold={150}
                data={['W14', 'W15', 'W16', 'W17', 'W18', 'W19', 'W20', 'W21'].map((w, i) => ({
                  label: w,
                  value: data.excessHistKCr[i],
                  color: data.excessHistKCr[i] < 200 ? 'var(--warn)' : 'var(--accent)',
                }))}
                fmt={v => String(Math.round(v))}
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
          <div style={{ marginTop: 16 }}>
            <AreaChart data={data?.m2Hist?.length ? data.m2Hist : L.m2Hist} w={360} h={100} color="var(--info)" />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div className="eyebrow">Reserve utilisation</div>
            <DemoBadge />
          </div>
          {[
            { lbl: 'CRR',         v: 92, t: [0.7, 0.9] as [number, number] },
            { lbl: 'SLR',         v: 86, t: [0.7, 0.9] as [number, number] },
            { lbl: 'SLF draw',    v: 62, t: [0.6, 0.85] as [number, number] },
            { lbl: 'BB repo borrow', v: 71, t: [0.7, 0.9] as [number, number] },
          ].map((r, i) => (
            <div key={r.lbl} style={{ marginTop: i === 0 ? 14 : 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="label">{r.lbl}</span>
                <span className="num" style={{ fontSize: 14 }}>{r.v}%</span>
              </div>
              <Bar value={r.v} thresholds={r.t} h={6} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '36px 48px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div className="eyebrow">Call money · intraday this week</div>
              <DemoBadge />
            </div>
            <h3 className="display" style={{ fontSize: 22, margin: 0 }}>Pressure builds at the open</h3>
          </div>
          <div className="caption">Rates %, by hour</div>
        </div>
        <div className="card-flat" style={{ padding: '22px 24px' }}>
          <Heatmap
            rows={INTRADAY_ROWS}
            cols={INTRADAY_COLS}
            data={INTRADAY_DATA}
            leftW={110}
            cellH={34}
            fmt={v => v.toFixed(2)}
            getColor={intradayColor}
          />
          <div style={{ display: 'flex', gap: 20, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <span className="caption">
              Wednesday opened at 9.34 — second consecutive open above the repo. Afternoons consistently calmer.
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default function Liquidity() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <LiquidityDesktop /> : <LiquidityMobile />
}
