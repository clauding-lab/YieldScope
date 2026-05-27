import { useState } from 'react'
import { useIsDesktop } from '../lib/hooks'
import { FX } from '../data/fixtures'
import { Delta, SectionTitle, Sparkline, Tabs } from '../components/primitives'
import { AreaChart, YieldCurve } from '../components/charts'
import { DesktopHeader } from '../components/layout/DesktopHeader'

type YieldsTab = 'curve' | 'series' | 'auctions'
type TenorKey = '91D' | '182D' | '364D' | '2Y' | '5Y' | '10Y'

const TENOR_LADDER: { tenor: string; yld: number; delta: number }[] = [
  { tenor: '91D',  yld: 11.42, delta: -0.08 },
  { tenor: '182D', yld: 11.60, delta: -0.05 },
  { tenor: '364D', yld: 11.71, delta:  0.02 },
  { tenor: '2Y',   yld: 11.85, delta:  0.04 },
  { tenor: '5Y',   yld: 12.04, delta:  0.01 },
  { tenor: '10Y',  yld: 12.18, delta: -0.02 },
  { tenor: '15Y',  yld: 12.31, delta:  0.00 },
  { tenor: '20Y',  yld: 12.40, delta:  0.00 },
]

const SPREADS = [
  { lbl: '10y – 91d', v: '+76',  u: 'bps' },
  { lbl: '5y – 2y',   v: '+19',  u: 'bps' },
  { lbl: '91d – SDF', v: '+492', u: 'bps' },
]

const HISTORY_SERIES: Record<TenorKey, number[]> = {
  '91D':  [10.80, 11.20, 11.55, 11.78, 11.85, 11.78, 11.65, 11.58, 11.52, 11.50, 11.42],
  '182D': [11.10, 11.40, 11.70, 11.85, 11.92, 11.85, 11.78, 11.72, 11.66, 11.62, 11.60],
  '364D': [11.30, 11.55, 11.82, 11.95, 12.01, 11.96, 11.88, 11.78, 11.74, 11.70, 11.71],
  '2Y':   [11.42, 11.65, 11.85, 11.92, 11.96, 11.93, 11.90, 11.87, 11.85, 11.84, 11.85],
  '5Y':   [11.62, 11.78, 11.95, 12.05, 12.10, 12.08, 12.06, 12.04, 12.03, 12.03, 12.04],
  '10Y':  [11.78, 11.92, 12.08, 12.18, 12.24, 12.22, 12.20, 12.18, 12.16, 12.18, 12.18],
}

const UPCOMING = [
  { date: '02 Jun', day: 'Tue', tenor: '91D · 182D · 364D', size: '50k Cr' },
  { date: '04 Jun', day: 'Thu', tenor: '5Y · 10Y',          size: '15k Cr' },
  { date: '09 Jun', day: 'Tue', tenor: '91D · 364D',        size: '32k Cr' },
]

function YieldsCurveTab() {
  return (
    <>
      <div style={{ padding: '0 22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div className="eyebrow">Slope 10y over 91d</div>
            <div className="serif-num" style={{ fontSize: 40, color: 'var(--accent)' }}>
              +76 <span className="caption" style={{ marginLeft: 4 }}>bps</span>
            </div>
          </div>
          <span className="caption">Flatter by 12 bps · last month</span>
        </div>
        <YieldCurve w={346} h={190} />
      </div>

      <div style={{ padding: '0 22px 16px' }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Spreads</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {SPREADS.map(s => (
            <div key={s.lbl}>
              <div className="caption">{s.lbl}</div>
              <div className="serif-num" style={{ fontSize: 24, marginTop: 4 }}>{s.v}</div>
              <div className="caption">{s.u}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 22px 24px' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Tenor ladder</div>
        <div className="card-flat">
          {TENOR_LADDER.map((row, i, arr) => (
            <div
              key={row.tenor}
              style={{
                padding: '14px 18px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
                display: 'grid',
                gridTemplateColumns: '50px 1fr auto',
                gap: 14,
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{row.tenor}</span>
              <Sparkline
                data={[row.yld - 0.2, row.yld - 0.15, row.yld - 0.1, row.yld - 0.05, row.yld - 0.02, row.yld]}
                w={120}
                h={20}
              />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span className="serif-num" style={{ fontSize: 20 }}>{row.yld.toFixed(2)}</span>
                <Delta value={row.delta} invert size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function YieldsHistoryTab() {
  const [tenor, setTenor] = useState<TenorKey>('91D')
  const data = HISTORY_SERIES[tenor]

  return (
    <>
      <div style={{ padding: '0 22px 18px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(Object.keys(HISTORY_SERIES) as TenorKey[]).map(t => (
          <button
            key={t}
            type="button"
            className={`btn btn-sm ${tenor === t ? 'btn-primary' : ''}`}
            onClick={() => setTenor(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div style={{ padding: '0 22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="caption">{tenor} · today</div>
            <div className="serif-num" style={{ fontSize: 44, marginTop: 4 }}>{data[data.length - 1].toFixed(2)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="caption">12-month range</div>
            <div style={{ fontSize: 14, color: 'var(--ink)', marginTop: 6 }}>
              <span className="num">{Math.min(...data).toFixed(2)}</span>
              <span className="dim" style={{ margin: '0 6px' }}>—</span>
              <span className="num">{Math.max(...data).toFixed(2)}</span>
            </div>
          </div>
        </div>
        <AreaChart data={data} w={346} h={150} color="var(--accent)" />
      </div>
    </>
  )
}

function YieldsAuctionsTab() {
  return (
    <>
      <div style={{ padding: '0 22px 18px' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Upcoming · Week 23</div>
        <div className="card-flat">
          {UPCOMING.map((a, i, arr) => (
            <div
              key={i}
              style={{
                padding: '14px 18px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
                display: 'grid',
                gridTemplateColumns: '70px 1fr auto',
                gap: 14,
                alignItems: 'center',
              }}
            >
              <div>
                <div className="serif-num" style={{ fontSize: 20 }}>{a.date}</div>
                <div className="caption">{a.day}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--ink)' }}>{a.tenor}</div>
                <div className="caption" style={{ marginTop: 2 }}>Notional {a.size}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 22px 24px' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Recent results</div>
        <div className="card-flat">
          {FX.auctions.map((a, i, arr) => (
            <div
              key={i}
              style={{
                padding: '16px 18px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 14, color: 'var(--ink)' }}>{a.tenor}</span>
                  <span className="caption" style={{ marginLeft: 8 }}>{a.date}</span>
                  {a.flag && <span className="chip chip-warn" style={{ marginLeft: 8 }}>Tight</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span className="serif-num" style={{ fontSize: 22 }}>{a.cutoff}</span>
                  <Delta value={a.delta} invert size="sm" />
                </div>
              </div>
              <div className="caption">
                Bid {a.bid} · Size {a.size} · Cover {a.cover}x · WAM {a.wam}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function YieldsMobile() {
  const [tab, setTab] = useState<YieldsTab>('curve')
  return (
    <>
      <SectionTitle kicker="Sovereign rates" title="Yields" />
      <div style={{ padding: '0 22px 18px' }}>
        <Tabs<YieldsTab>
          tabs={[
            { key: 'curve',    label: 'Curve' },
            { key: 'series',   label: 'History' },
            { key: 'auctions', label: 'Auctions' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>
      {tab === 'curve' && <YieldsCurveTab />}
      {tab === 'series' && <YieldsHistoryTab />}
      {tab === 'auctions' && <YieldsAuctionsTab />}
    </>
  )
}

function YieldsDesktop() {
  return (
    <>
      <DesktopHeader section="Yields" breadcrumb="YieldScope · Sovereign curve & auctions" />

      <div
        style={{
          padding: '36px 48px 28px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 48,
        }}
      >
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Slope 10y over 91d</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
            <span className="serif-num" style={{ fontSize: 60, color: 'var(--accent)' }}>+76</span>
            <span className="caption">bps</span>
          </div>
          <div className="caption" style={{ marginTop: 6 }}>Flatter by 12 bps vs last month</div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Front-end · 91d</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
            <span className="serif-num" style={{ fontSize: 60 }}>11.42</span>
            <span className="caption">%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <Delta value={-0.08} invert size="md" />
            <span className="caption">cleared 26 May</span>
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Long-end · 10y</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
            <span className="serif-num" style={{ fontSize: 60 }}>12.18</span>
            <span className="caption">%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <Delta value={-0.02} invert size="md" />
            <span className="caption">fairly priced vs CPI path</span>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '32px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Sovereign yield curve</div>
            <h3 className="display" style={{ fontSize: 28, margin: 0 }}>11 tenors · 5 overlays</h3>
          </div>
        </div>
        <YieldCurve w={1280} h={300} defaultOverlays={['latest', 'weekAgo', 'monthAgo', 'quarterAgo', 'yearAgo']} />
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '32px 48px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Recent auctions · Week 22</div>
            <h3 className="display" style={{ fontSize: 24, margin: 0 }}>Six prints</h3>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-sm">Filter</button>
            <button type="button" className="btn btn-sm">Export</button>
          </div>
        </div>
        <div className="card-flat">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 90px 100px 110px 100px 100px 1fr 100px 80px',
              padding: '14px 22px',
              borderBottom: '1px solid var(--line)',
              background: 'var(--paper-2)',
            }}
          >
            {['Tenor', 'Date', 'Size', 'Bid', 'Cover', 'WAM', 'Trend', 'Cutoff', 'Δ'].map(h => (
              <span key={h} className="caption" style={{ fontWeight: 500, color: 'var(--ink-2)' }}>{h}</span>
            ))}
          </div>
          {FX.auctions.map((a, i, arr) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 90px 100px 110px 100px 100px 1fr 100px 80px',
                padding: '14px 22px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--ink)' }}>{a.tenor}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{a.date}</span>
              <span className="num" style={{ fontSize: 13 }}>{a.size}</span>
              <span className="num" style={{ fontSize: 13 }}>{a.bid}</span>
              <span className="num" style={{ fontSize: 13, color: a.cover < 1.2 ? 'var(--warn)' : 'var(--ink)' }}>{a.cover}x</span>
              <span className="num" style={{ fontSize: 13 }}>{a.wam}</span>
              <Sparkline
                data={[
                  parseFloat(a.cutoff) - 0.15,
                  parseFloat(a.cutoff) - 0.1,
                  parseFloat(a.cutoff) - 0.05,
                  parseFloat(a.cutoff) - 0.03,
                  parseFloat(a.cutoff),
                ]}
                w={180}
                h={20}
              />
              <span className="serif-num" style={{ fontSize: 20 }}>{a.cutoff}</span>
              <Delta value={a.delta} invert size="sm" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default function Yields() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <YieldsDesktop /> : <YieldsMobile />
}
