import { useState } from 'react'
import { useIsDesktop } from '../lib/hooks'
import { FX } from '../data/fixtures'
import { Delta, DemoBadge, OutageChip, SectionTitle, Sparkline, Tabs } from '../components/primitives'
import { AreaChart, YieldCurve } from '../components/charts'
import { DesktopHeader } from '../components/layout/DesktopHeader'
import { useYields, type TenorKey, type YieldsData } from '../hooks/useYields'
import { useAuctions } from '../hooks/useAuctions'
import { fixtureToDisplay } from '../lib/auctions'
import { isLiveDataAvailable } from '../lib/econdelta'
import { spreadBps, roundTo } from '../lib/yieldMath'

type YieldsTab = 'curve' | 'series' | 'auctions'

const HISTORY_TENORS: TenorKey[] = ['91D', '182D', '364D', '2Y', '5Y', '10Y', '20Y']

const UPCOMING = [
  { date: '02 Jun', day: 'Tue', tenor: '91D · 182D · 364D', size: '50k Cr' },
  { date: '04 Jun', day: 'Thu', tenor: '5Y · 10Y',          size: '15k Cr' },
  { date: '09 Jun', day: 'Tue', tenor: '91D · 364D',        size: '32k Cr' },
]

function YieldsCurveTab({ data }: { data: YieldsData | null }) {
  const tenorLadder = HISTORY_TENORS.map(t => {
    const yld = data?.yields[t] ?? null
    const spark = data?.series[t] ?? []
    const delta = spark.length >= 2 ? roundTo(spark[spark.length - 1] - spark[spark.length - 2], 2) : null
    return { tenor: t, yld, spark, delta }
  })

  const slopeLabel = data?.spread10Y_91D_bps != null
    ? `+${data.spread10Y_91D_bps}`
    : '—'

  // 5y–2y now derived from the live rungs (both wired this branch); fall back to demo only if absent.
  const spread5y2y = spreadBps(data?.yields['5Y'] ?? null, data?.yields['2Y'] ?? null)
  const fmtBps = (n: number) => `${n >= 0 ? '+' : ''}${n}`

  const spread91dSdf = data?.spread91D_SDF_bps ?? null

  const liveSpreads = [
    { lbl: '10y – 91d', v: slopeLabel, u: 'bps', demo: false },
    { lbl: '5y – 2y',   v: spread5y2y != null ? fmtBps(spread5y2y) : '—', u: 'bps', demo: spread5y2y == null },
    { lbl: '91d – SDF', v: spread91dSdf != null ? fmtBps(spread91dSdf) : '—', u: 'bps', demo: spread91dSdf == null },
  ]

  return (
    <>
      <div style={{ padding: '0 22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div className="eyebrow">Slope 10y over 91d</div>
            <div className="serif-num" style={{ fontSize: 40, color: 'var(--accent)' }}>
              {slopeLabel} <span className="caption" style={{ marginLeft: 4 }}>bps</span>
            </div>
          </div>
        </div>
        {/* Honesty chrome (Demo badge / live coverage note) is rendered by YieldCurve itself. */}
        <div className="eyebrow" style={{ marginBottom: 10 }}>Sovereign yield curve</div>
        <YieldCurve w={346} h={190} />
      </div>

      <div style={{ padding: '0 22px 16px' }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Spreads</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {liveSpreads.map(s => (
            <div key={s.lbl}>
              <div className="caption" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {s.lbl}
                {s.demo && <DemoBadge />}
              </div>
              <div className="serif-num" style={{ fontSize: 24, marginTop: 4 }}>{s.v}</div>
              <div className="caption">{s.u}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 22px 24px' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Tenor ladder</div>
        <div className="card-flat">
          {tenorLadder.map((row, i, arr) => (
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
              <span style={{ fontSize: 13, color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {row.tenor}
                {row.yld == null && <DemoBadge />}
              </span>
              {row.spark.length >= 2 ? <Sparkline data={row.spark} w={120} h={20} /> : <span />}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span className="serif-num" style={{ fontSize: 20 }}>{row.yld != null ? row.yld.toFixed(2) : '—'}</span>
                {row.delta != null && <Delta value={row.delta} invert size="sm" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function YieldsHistoryTab({ data: yieldsData }: { data: YieldsData | null }) {
  const [tenor, setTenor] = useState<TenorKey>('91D')
  const series = yieldsData?.series[tenor] ?? []
  const hasData = series.length > 0
  const latest = hasData ? series[series.length - 1] : null

  return (
    <>
      <div style={{ padding: '0 22px 18px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {HISTORY_TENORS.map(t => (
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
            <div className="serif-num" style={{ fontSize: 44, marginTop: 4 }}>
              {latest != null ? latest.toFixed(2) : '—'}
            </div>
          </div>
          {hasData && (
            <div style={{ textAlign: 'right' }}>
              <div className="caption">Recent range</div>
              <div style={{ fontSize: 14, color: 'var(--ink)', marginTop: 6 }}>
                <span className="num">{Math.min(...series).toFixed(2)}</span>
                <span className="dim" style={{ margin: '0 6px' }}>—</span>
                <span className="num">{Math.max(...series).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
        {hasData && <AreaChart data={series} w={346} h={150} color="var(--accent)" />}
      </div>
    </>
  )
}

function YieldsAuctionsTab() {
  const { data: auctions, loading: auctionsLoading, error: auctionsError } = useAuctions()
  // With live credentials we show ONLY real forward-dated auctions (the mapper
  // already filters auction_date >= today) or an honest empty state — never
  // stale fixture dates. The fixture list is the offline/no-key fallback only,
  // and is unambiguously badged as demo. The definitive "No scheduled auctions"
  // claim may only render on a SUCCESSFUL fetch that returned zero future
  // auctions — loading renders nothing, a failed fetch renders an error line.
  const liveAvail = isLiveDataAvailable()
  const liveUpcoming = auctions?.upcoming ?? []
  const upcoming = liveAvail ? liveUpcoming : UPCOMING
  const noScheduled = liveAvail && !auctionsLoading && auctionsError == null && liveUpcoming.length === 0
  const upcomingErrored = liveAvail && !auctionsLoading && auctionsError != null
  const upcomingPending = liveAvail && auctionsLoading
  const recent = auctions?.results?.length ? auctions.results : fixtureToDisplay(FX.auctions)
  const recentLive = !!auctions?.results?.length
  return (
    <>
      <div style={{ padding: '0 22px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div className="eyebrow">Upcoming auctions</div>
          {!liveAvail && <DemoBadge />}
        </div>
        {upcomingPending ? null : upcomingErrored ? (
          <div className="card-flat" style={{ padding: '20px 18px' }}>
            <div style={{ fontSize: 14, color: 'var(--warn)' }}>Couldn't load the auction calendar</div>
            <div className="caption" style={{ marginTop: 4 }}>The forward-calendar fetch failed — retry by reloading.</div>
          </div>
        ) : noScheduled ? (
          <div className="card-flat" style={{ padding: '20px 18px' }}>
            <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>No scheduled auctions</div>
            <div className="caption" style={{ marginTop: 4 }}>The BB forward calendar has no dated auctions ahead of today.</div>
          </div>
        ) : (
          <div className="card-flat">
            {upcoming.map((a, i, arr) => (
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
        )}
      </div>

      <div style={{ padding: '20px 22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div className="eyebrow">Recent results</div>
          {!recentLive && <DemoBadge />}
        </div>
        <div className="card-flat">
          {recent.map((a, i, arr) => (
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
  // Single useYields() call shared by header and body — the curve/history tabs
  // used to call the hook independently, which could let the header chip and
  // tab body disagree under partial fetch failure (module-mocked in tests too).
  const { data, error } = useYields()
  return (
    <>
      <SectionTitle kicker="Sovereign rates" title="Yields" action={error != null ? <OutageChip /> : undefined} />
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
      {tab === 'curve' && <YieldsCurveTab data={data} />}
      {tab === 'series' && <YieldsHistoryTab data={data} />}
      {tab === 'auctions' && <YieldsAuctionsTab />}
    </>
  )
}

function YieldsDesktop() {
  const { data, error } = useYields()
  const { data: auctions } = useAuctions()
  const recent = auctions?.results?.length ? auctions.results : fixtureToDisplay(FX.auctions)
  const recentLive = !!auctions?.results?.length

  const slopeLabel = data?.spread10Y_91D_bps != null
    ? `+${data.spread10Y_91D_bps}`
    : '—'
  const yield91d = data?.yields['91D']?.toFixed(2) ?? '—'
  const yield10y = data?.yields['10Y']?.toFixed(2) ?? '—'

  const s91 = data?.series['91D'] ?? []
  const s10 = data?.series['10Y'] ?? []
  const delta91 = s91.length >= 2 ? roundTo(s91[s91.length - 1] - s91[s91.length - 2], 2) : null
  const delta10 = s10.length >= 2 ? roundTo(s10[s10.length - 1] - s10[s10.length - 2], 2) : null

  return (
    <>
      <DesktopHeader section="Yields" breadcrumb="YieldScope · Sovereign curve & auctions" action={error != null ? <OutageChip /> : undefined} />

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
            <span className="serif-num" style={{ fontSize: 60, color: 'var(--accent)' }}>{slopeLabel}</span>
            <span className="caption">bps</span>
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Front-end · 91d</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
            <span className="serif-num" style={{ fontSize: 60 }}>{yield91d}</span>
            <span className="caption">%</span>
          </div>
          {delta91 != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
              <Delta value={delta91} invert size="md" />
            </div>
          )}
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Long-end · 10y</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
            <span className="serif-num" style={{ fontSize: 60 }}>{yield10y}</span>
            <span className="caption">%</span>
          </div>
          {delta10 != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
              <Delta value={delta10} invert size="md" />
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '32px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            {/* Honesty chrome (Demo badge / live coverage note) is rendered by YieldCurve itself. */}
            <div className="eyebrow" style={{ marginBottom: 6 }}>Sovereign yield curve</div>
            <h3 className="display" style={{ fontSize: 28, margin: 0 }}>
              {isLiveDataAvailable() ? '7 live tenors · 91D–20Y' : '11 tenors · 5 overlays'}
            </h3>
          </div>
        </div>
        <YieldCurve w={1280} h={300} defaultOverlays={['latest', 'weekAgo', 'monthAgo', 'quarterAgo', 'yearAgo']} />
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '32px 48px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div className="eyebrow">Recent auctions</div>
              {!recentLive && <DemoBadge />}
            </div>
            <h3 className="display" style={{ fontSize: 24, margin: 0 }}>{recent.length} prints</h3>
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
          {recent.map((a, i, arr) => (
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
              <span className="num" style={{ fontSize: 13, color: a.cover != null && a.cover < 1.2 ? 'var(--warn)' : 'var(--ink)' }}>{a.cover != null ? `${a.cover}x` : '—'}</span>
              <span className="num" style={{ fontSize: 13 }}>{a.wam}</span>
              {a.cutoffHist.length >= 2
                ? <Sparkline data={a.cutoffHist} w={180} h={20} />
                : <span className="caption" style={{ color: 'var(--ink-3)' }}>—</span>}
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
