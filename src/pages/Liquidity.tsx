import { useIsDesktop } from '../lib/hooks'
import { FX } from '../data/fixtures'
import { Bar, Delta, ListRow, SectionTitle } from '../components/primitives'
import { AreaChart, BarChart, Heatmap } from '../components/charts'
import { DesktopHeader } from '../components/layout/DesktopHeader'

function CorridorViz({ tall = false }: { tall?: boolean }) {
  const sdf = 6.50, slf = 10.50, repo = 9.00, call = 9.34
  const minV = 6, maxV = 11
  const pct = (v: number) => ((v - minV) / (maxV - minV)) * 100
  return (
    <div style={{ paddingBottom: tall ? 48 : 32 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
        <span className="caption">Standing deposit · 6.50</span>
        <span className="caption">Repo · 9.00</span>
        <span className="caption">Standing lending · 10.50</span>
      </div>
      <div style={{ position: 'relative', height: 8, background: 'var(--sunken)', borderRadius: 99 }}>
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
        {[sdf, repo, slf].map(v => (
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
        <div
          style={{
            position: 'absolute',
            left: `${pct(call)}%`,
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
            <div className="serif-num" style={{ fontSize: 18, color: 'var(--neg)' }}>{call.toFixed(2)}</div>
            <div className="caption" style={{ marginTop: -2 }}>Call · o/n</div>
          </div>
        </div>
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
  return (
    <>
      <SectionTitle kicker="System pulse" title="Liquidity" />

      <div style={{ padding: '0 22px 28px' }}>
        <div className="caption">Call money · overnight</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
          <span className="serif-num" style={{ fontSize: 64, color: 'var(--neg)' }}>9.34</span>
          <span className="caption">%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <Delta value={0.12} invert size="md" />
          <span className="caption">2nd session above repo</span>
        </div>
        <div style={{ marginTop: 18 }}>
          <AreaChart data={FX.liquidity.callSpark} w={346} h={70} color="var(--neg)" />
        </div>
      </div>

      <div style={{ padding: '0 22px 28px' }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Policy corridor</div>
        <CorridorViz />
      </div>

      <div style={{ padding: '0 22px 28px' }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Excess liquidity</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="serif-num" style={{ fontSize: 36 }}>184.2</span>
              <span className="caption">k Cr</span>
            </div>
            <Delta value={-35} suffix="% · 8w" size="sm" />
          </div>
          <AreaChart data={FX.liquidity.excessHistKCr} w={140} h={48} color="var(--neg)" />
        </div>
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        <div className="card-flat">
          <ListRow label="Money supply · M2 YoY" value="8.4%"      sub="vs target 10.5" />
          <ListRow label="CRR utilisation"       value="92%"       sub="Reserve ratio 4.0%" />
          <ListRow label="SLR utilisation"       value="86%"       sub="Statutory ratio 13.0%" />
          <ListRow label="Repo from BB"          value="124.6 k Cr" sub="↑ 42% in 8 weeks" last />
        </div>
      </div>
    </>
  )
}

function LiquidityDesktop() {
  const L = FX.liquidity
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
            <span className="serif-num" style={{ fontSize: 72, color: 'var(--neg)' }}>9.34</span>
            <span className="caption">%</span>
          </div>
          <p style={{ marginTop: 14, maxWidth: 520, fontSize: 22, lineHeight: 1.35, color: 'var(--ink)' }}>
            Second session above the repo. Session high <span className="num">9.34</span>, range opened at{' '}
            <span className="num">8.42</span>. Pressure now in the one-week segment.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 18 }}>
            <span className="chip chip-neg">Above repo +34 bps</span>
            <span className="chip">7d avg 8.94</span>
            <span className="chip">σ 30d 0.34</span>
          </div>
        </div>
        <div>
          <AreaChart data={L.callSpark} w={520} h={170} color="var(--neg)" />
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '36px 48px' }}>
        <div className="eyebrow" style={{ marginBottom: 22 }}>Policy rate corridor</div>
        <CorridorViz tall />
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '36px 48px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Excess liquidity</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="serif-num" style={{ fontSize: 48 }}>184.2</span>
            <span className="caption">k Cr</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <Delta value={-35} suffix="% in 8w" size="sm" />
          </div>
          <div style={{ marginTop: 16 }}>
            <BarChart
              w={400}
              h={130}
              threshold={150}
              data={['W14', 'W15', 'W16', 'W17', 'W18', 'W19', 'W20', 'W21'].map((w, i) => ({
                label: w,
                value: L.excessHistKCr[i],
                color: L.excessHistKCr[i] < 200 ? 'var(--warn)' : 'var(--accent)',
              }))}
              fmt={v => String(Math.round(v))}
            />
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Money supply · M2 YoY</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="serif-num" style={{ fontSize: 48 }}>8.4</span>
            <span className="caption">%</span>
          </div>
          <div className="caption" style={{ marginTop: 6 }}>vs target 10.5</div>
          <div style={{ marginTop: 16 }}>
            <AreaChart data={L.m2Hist} w={360} h={100} color="var(--info)" />
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Reserve utilisation</div>
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
            <div className="eyebrow" style={{ marginBottom: 6 }}>Call money · intraday this week</div>
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
