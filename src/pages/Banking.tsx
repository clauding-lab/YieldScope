import type { ReactNode } from 'react'
import { useIsDesktop } from '../lib/hooks'
import { FX } from '../data/fixtures'
import { Bar, DemoBadge, ListRow, SectionTitle } from '../components/primitives'
import { AreaChart, Donut, DonutLegend, Heatmap, SlopeChart } from '../components/charts'
import type { SlopeItem } from '../components/charts/SlopeChart'
import { DesktopHeader } from '../components/layout/DesktopHeader'
import { useBanking } from '../hooks/useBanking'
import { monthLabel } from '../lib/dates'
import type { BankingData } from '../hooks/useBanking'

const NPL_BY_SEG = [
  { lbl: 'State-owned commercial', v: 22.4, sev: 'neg'  as const },
  { lbl: 'Private commercial',     v: 7.8,  sev: 'warn' as const },
  { lbl: 'Foreign',                v: 4.2,  sev: 'pos'  as const },
  { lbl: 'Specialised dev.',       v: 18.6, sev: 'neg'  as const },
]

const TOP_BANKS = [
  { name: 'Sonali',   car: 11.2, lcr: 138, nsfr: 116, npl: 24.8, cd: 78.2 },
  { name: 'Janata',   car: 10.4, lcr: 132, nsfr: 114, npl: 22.6, cd: 76.4 },
  { name: 'BRAC',     car: 13.8, lcr: 162, nsfr: 124, npl:  4.2, cd: 84.6 },
  { name: 'City',     car: 13.2, lcr: 158, nsfr: 122, npl:  5.4, cd: 86.2 },
  { name: 'Dutch-B.', car: 14.4, lcr: 168, nsfr: 126, npl:  3.8, cd: 82.4 },
  { name: 'Eastern',  car: 12.8, lcr: 152, nsfr: 120, npl:  4.6, cd: 85.8 },
  { name: 'HSBC',     car: 18.4, lcr: 184, nsfr: 138, npl:  2.8, cd: 62.4 },
  { name: 'Stan-C.',  car: 16.8, lcr: 178, nsfr: 134, npl:  3.2, cd: 64.8 },
  { name: 'BKB',      car:  9.6, lcr: 124, nsfr: 108, npl: 19.4, cd: 72.6 },
  { name: 'RAKUB',    car: 10.2, lcr: 128, nsfr: 110, npl: 16.8, cd: 74.2 },
]

const RANGES: { invert: boolean; good: number; warn: number }[] = [
  { invert: true,  good: 13,  warn: 10.5 }, // CAR
  { invert: true,  good: 150, warn: 120  }, // LCR
  { invert: true,  good: 120, warn: 105  }, // NSFR
  { invert: false, good: 5,   warn: 12   }, // NPL
  { invert: false, good: 75,  warn: 85   }, // C/D
]

function bankColor(v: number, _i: number, j: number) {
  const r = RANGES[j]
  let sev: 'good' | 'warn' | 'bad'
  if (r.invert) {
    sev = v >= r.good ? 'good' : v >= r.warn ? 'warn' : 'bad'
  } else {
    sev = v <= r.good ? 'good' : v <= r.warn ? 'warn' : 'bad'
  }
  if (sev === 'good') return { bg: 'rgba(146, 176, 149, 0.18)', fg: 'var(--pos)' }
  if (sev === 'warn') return { bg: 'rgba(215, 184, 114, 0.22)', fg: 'var(--warn)' }
  return { bg: 'rgba(213, 143, 118, 0.28)', fg: 'var(--neg)' }
}

const SLOPE_ITEMS: SlopeItem[] = [
  { label: 'State-owned',      a: 18.2, b: 22.4 },
  { label: 'Specialised dev.', a: 15.6, b: 18.6 },
  { label: 'Private comm.',    a:  6.4, b:  7.8 },
  { label: 'Foreign',          a:  5.2, b:  4.2 },
]

const DEPOSIT_SEGMENTS = [
  { value: 42, color: 'var(--accent)', label: 'State-owned' },
  { value: 48, color: 'var(--info)',   label: 'Private comm.' },
  { value: 6,  color: 'var(--pos)',    label: 'Foreign' },
  { value: 4,  color: 'var(--warn)',   label: 'Specialised' },
]

const DEPOSIT_LEGEND = [
  { value: '42%', color: 'var(--accent)', label: 'State-owned' },
  { value: '48%', color: 'var(--info)',   label: 'Private commercial' },
  { value: '6%',  color: 'var(--pos)',    label: 'Foreign' },
  { value: '4%',  color: 'var(--warn)',   label: 'Specialised dev.' },
]

function severityColor(sev: 'neg' | 'warn' | 'pos') {
  return sev === 'neg' ? 'var(--neg)' : sev === 'warn' ? 'var(--warn)' : 'var(--pos)'
}

function BankingMobile({ liveData }: { liveData: BankingData | null }) {
  const B = FX.banking
  const nplRatio = liveData?.nplRatio ?? null
  const crar     = liveData?.crar     ?? null
  const pvtCreditYoY = liveData?.pvtCreditYoY ?? null
  const pvtCreditVintage = monthLabel(liveData?.pvtCreditYoYAsOf)
  const cdRatio  = liveData?.cdRatio ?? null
  const prudential: { lbl: string; v: number | null; max: number; unit: string; live: boolean }[] = [
    { lbl: 'CAR',  v: crar,   max: 16,  unit: '%', live: true  },
    { lbl: 'LCR',  v: B.lcr,  max: 180, unit: '%', live: false },
    { lbl: 'NSFR', v: B.nsfr, max: 140, unit: '%', live: false },
  ]
  return (
    <>
      <SectionTitle kicker="Sector health" title="Banks" />

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
          <ListRow label="NPL · industry"          value={nplRatio != null ? `${nplRatio.toFixed(1)}%` : '—'} />
          <ListRow
            label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>Pvt sector credit · YoY {pvtCreditYoY == null && <DemoBadge />}</span> as ReactNode}
            value={pvtCreditYoY != null ? `${pvtCreditYoY.toFixed(1)}%` : '—'}
            sub={pvtCreditVintage ?? undefined}
          />
          <ListRow
            label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>Repo borrow · from BB <DemoBadge /></span> as ReactNode}
            value="124.6 k Cr"
            last
          />
        </div>
      </div>

      <div style={{ padding: '12px 22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div className="eyebrow">NPL by segment</div>
          <DemoBadge />
        </div>
        {NPL_BY_SEG.map((s, i, arr) => (
          <div
            key={s.lbl}
            style={{
              padding: '14px 0',
              borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: 'var(--ink)' }}>{s.lbl}</span>
              <span className="serif-num" style={{ fontSize: 18 }}>{s.v}%</span>
            </div>
            <Bar value={s.v} max={25} h={4} color={severityColor(s.sev)} />
          </div>
        ))}
      </div>

      <div style={{ padding: '0 22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div className="eyebrow">Basel-III ratios</div>
        </div>
        {prudential.map(p => (
          <div key={p.lbl} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {p.lbl}
                {!p.live && <DemoBadge />}
              </span>
              <span className="serif-num" style={{ fontSize: 18 }}>{p.v != null ? `${p.v}${p.unit}` : '—'}</span>
            </div>
            {p.v != null && <Bar value={p.v} max={p.max} h={4} thresholds={[0.2, 0.5]} />}
          </div>
        ))}
      </div>

    </>
  )
}

function BankingDesktop({ liveData }: { liveData: BankingData | null }) {
  const B = FX.banking
  const nplRatio = liveData?.nplRatio ?? null
  const nplHist  = liveData?.nplHist?.length ? liveData.nplHist : null
  const cdRatio  = liveData?.cdRatio ?? null
  return (
    <>
      <DesktopHeader section="Banking" breadcrumb="YieldScope · Sector health & prudential" />

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
          <div className="eyebrow" style={{ marginBottom: 8 }}>NPL · industry</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="serif-num" style={{ fontSize: 72, color: 'var(--neg)' }}>{nplRatio != null ? nplRatio.toFixed(1) : '—'}</span>
            <span className="caption">%</span>
          </div>
          {nplHist && (
            <div style={{ marginTop: 18 }}>
              <AreaChart data={nplHist} w={400} h={100} color="var(--neg)" />
            </div>
          )}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div className="eyebrow">Repo borrow · from BB</div>
            <DemoBadge />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="serif-num" style={{ fontSize: 72, color: 'var(--neg)' }}>124.6</span>
            <span className="caption">k Cr</span>
          </div>
          <div style={{ marginTop: 18 }}>
            <AreaChart data={B.repoSpark} w={400} h={100} color="var(--neg)" />
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div style={{ padding: '36px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div className="eyebrow">Top 10 banks · Basel-III & asset quality</div>
              <DemoBadge />
            </div>
            <h3 className="display" style={{ fontSize: 24, margin: 0 }}>Where the stress sits</h3>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-sm">All 60 banks</button>
            <button type="button" className="btn btn-sm">Export</button>
          </div>
        </div>
        <div className="card-flat" style={{ padding: '22px 24px' }}>
          <Heatmap
            rows={TOP_BANKS.map(b => b.name)}
            cols={['CAR %', 'LCR %', 'NSFR %', 'NPL %', 'C/D %']}
            data={TOP_BANKS.map(b => [b.car, b.lcr, b.nsfr, b.npl, b.cd])}
            leftW={120}
            cellH={30}
            fmt={v => v.toFixed(1)}
            getColor={bankColor}
          />
          <div style={{ display: 'flex', gap: 20, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: 'rgba(146, 176, 149, 0.4)' }} />
              <span className="caption">Healthy</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: 'rgba(215, 184, 114, 0.5)' }} />
              <span className="caption">Watchlist</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: 'rgba(213, 143, 118, 0.6)' }} />
              <span className="caption">Stressed</span>
            </span>
            <span className="caption" style={{ marginLeft: 'auto' }}>Thresholds per regulator guidance</span>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '0 48px' }} />

      <div
        style={{
          padding: '36px 48px 48px',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 48,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div className="eyebrow">NPL trajectory · by segment</div>
            <DemoBadge />
          </div>
          <h3 className="display" style={{ fontSize: 22, margin: 0, marginBottom: 14 }}>
            State-owned widening, foreign tightening
          </h3>
          <SlopeChart
            w={500}
            h={240}
            leftLabel="12 months ago"
            rightLabel="Now"
            fmt={v => v.toFixed(1) + '%'}
            items={SLOPE_ITEMS}
          />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div className="eyebrow">System deposits · by ownership</div>
            <DemoBadge />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Donut size={150} thickness={22} segments={DEPOSIT_SEGMENTS} centerValue="৳18.4T" centerLabel="Total · BDT" />
            <div style={{ flex: 1 }}>
              <DonutLegend segments={DEPOSIT_LEGEND} />
            </div>
          </div>
          <div className="caption" style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            State-owned share down 240 bps YoY · private commercial gaining
          </div>
        </div>
      </div>
    </>
  )
}

export default function Banking() {
  const isDesktop = useIsDesktop()
  const { data } = useBanking()
  return isDesktop ? <BankingDesktop liveData={data} /> : <BankingMobile liveData={data} />
}
