import { useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import { DataTimestamp } from '../components/ui/DataTimestamp'
import { InsightPanel } from '../components/ui/InsightPanel'
import { useBankingData } from '../hooks/useBankingData'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatMonth(date: string) {
  const [y, m] = date.split('-')
  const mi = parseInt(m, 10) - 1
  return `${MONTH_NAMES[mi]} '${y.slice(2)}`
}

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#1e293b',
    border: '1px solid #475569',
    borderRadius: '8px',
    fontSize: '12px',
  },
  labelStyle: { color: '#94a3b8', fontWeight: 600, marginBottom: 4 },
  itemStyle: { padding: '1px 0' },
  cursor: { fill: 'rgba(148, 163, 184, 0.08)' },
} as const

const DOT_BANKS = { r: 3, fill: '#38bdf8', stroke: '#1e293b', strokeWidth: 2 }
const DOT_NBFI = { r: 3, fill: '#f59e0b', stroke: '#1e293b', strokeWidth: 2 }
const ACTIVE_DOT = { r: 5, stroke: '#fff', strokeWidth: 2 }

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        <p className="text-[10px] text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

export default function BankingPage() {
  const { data, isLoading } = useBankingData()

  const sorted = useMemo(() => {
    if (!data) return []
    return [...data.monthly].sort((a, b) => a.date.localeCompare(b.date))
  }, [data])

  const chartData = useMemo(() => sorted.map(s => ({ ...s, label: formatMonth(s.date) })), [sorted])

  if (isLoading) {
    return (
      <div className="py-4 space-y-4">
        <div className="h-8 bg-slate-800 rounded animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data || sorted.length === 0) {
    return (
      <div className="py-4">
        <p className="text-slate-400 text-sm">No banking data available.</p>
      </div>
    )
  }

  const latest = sorted[sorted.length - 1]

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Banking Sector</h1>
          <p className="text-xs text-slate-500">Credit, deposits, liquidity, NPL, trade & FX operations</p>
        </div>
        <DataTimestamp lastUpdated={data.lastUpdated} compact />
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryBox label="Credit Growth" value={`${latest.privateCreditGrowthBanks.toFixed(1)}%`} sub="Banks" color="text-sky-400" />
        <SummaryBox label="NPL Rate" value={`${latest.nplPctBanks.toFixed(1)}%`} sub="Banks" color="text-red-400" />
        <SummaryBox label="Excess Liq." value={`₹${(latest.excessLiquidityBanksCrore / 100000).toFixed(1)}L Cr`} sub="Banks" color="text-emerald-400" />
      </div>

      {/* 1. Private Sector Credit Growth */}
      <ChartCard title="1. Private Sector Credit Growth" subtitle="YoY growth rate — Banks vs NBFIs">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} domain={['auto', 'auto']} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number, name: string) => [`${v.toFixed(2)}%`, name]} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
            <Line type="monotone" dataKey="privateCreditGrowthBanks" name="Banks" stroke="#38bdf8" strokeWidth={2} dot={DOT_BANKS} activeDot={{ ...ACTIVE_DOT, fill: '#38bdf8' }} />
            <Line type="monotone" dataKey="privateCreditGrowthNBFIs" name="NBFIs" stroke="#f59e0b" strokeWidth={2} dot={DOT_NBFI} activeDot={{ ...ACTIVE_DOT, fill: '#f59e0b' }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2. Private Sector Deposit Growth */}
      <ChartCard title="2. Private Sector Deposit Growth" subtitle="YoY growth rate — Banks vs NBFIs">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} domain={['auto', 'auto']} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number, name: string) => [`${v.toFixed(2)}%`, name]} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
            <Line type="monotone" dataKey="privateDepositGrowthBanks" name="Banks" stroke="#38bdf8" strokeWidth={2} dot={DOT_BANKS} activeDot={{ ...ACTIVE_DOT, fill: '#38bdf8' }} />
            <Line type="monotone" dataKey="privateDepositGrowthNBFIs" name="NBFIs" stroke="#f59e0b" strokeWidth={2} dot={DOT_NBFI} activeDot={{ ...ACTIVE_DOT, fill: '#f59e0b' }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <InsightPanel
        tier={1}
        content="When credit growth outpaces deposit growth, the banking system's structural liquidity declines. Currently, deposit growth (12.0%) far exceeds credit growth (7.1%), creating a massive liquidity surplus — banks' excess liquid assets surged 64% to ₹3.35L Cr. But over 70% sits in government securities, not deployable for productive lending. Rising NPLs (30.5%) make banks reluctant to lend."
      />

      {/* 3. Banking Sector Liquidity */}
      <ChartCard title="3. Banking Sector Excess Liquidity" subtitle="Excess liquidity in BDT Crore — Banks vs NBFIs">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
            <defs>
              <linearGradient id="liqBanksGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="liqNbfiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number, name: string) => [`₹${v.toLocaleString()} Cr`, name]} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
            <Area type="monotone" dataKey="excessLiquidityBanksCrore" name="Banks" stroke="#38bdf8" strokeWidth={2} fill="url(#liqBanksGrad)" dot={DOT_BANKS} activeDot={{ ...ACTIVE_DOT, fill: '#38bdf8' }} />
            <Area type="monotone" dataKey="excessLiquidityNBFIsCrore" name="NBFIs" stroke="#f59e0b" strokeWidth={2} fill="url(#liqNbfiGrad)" dot={DOT_NBFI} activeDot={{ ...ACTIVE_DOT, fill: '#f59e0b' }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 4. Govt. Borrowing from Banking Sector */}
      <ChartCard title="4. Govt. Borrowing from Banking Sector" subtitle="Net borrowing in BDT Crore">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`₹${v.toLocaleString()} Cr`, 'Net Borrowing']} />
            <Bar dataKey="govtBorrowingNetCrore" name="Net Borrowing" fill="#a78bfa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <InsightPanel
        tier={1}
        content="Government borrowing from banks swung dramatically — from net repayment in early FY26 to ₹62,000 Cr net borrowing by February 2026 (nearly 5x YoY). A ₹33,542 Cr spike in just two weeks (Dec 2025) was driven by election spending and bank recapitalization. This crowds out private credit and absorbs the excess liquidity banks have parked in government securities."
      />

      {/* 5. Loan Disbursement by Category */}
      <ChartCard title="5. Loan Disbursement by Category" subtitle="SME, Consumer & Industrial — BDT Crore">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -5, bottom: 5 }} barCategoryGap="15%">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number, name: string) => [`₹${v.toLocaleString()} Cr`, name]} />
            <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
            <Bar dataKey="smeLoanDisbursementCrore" name="SME" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="consumerLoanDisbursementCrore" name="Consumer" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            <Bar dataKey="industrialLoanDisbursementCrore" name="Industrial" fill="#38bdf8" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 6. Export & Import */}
      <ChartCard title="6. Total Export & Import" subtitle="Monthly values in Billion USD">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}B`} domain={['auto', 'auto']} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number, name: string) => [`$${v.toFixed(2)}B`, name]} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
            <Line type="monotone" dataKey="exportBnUsd" name="Export" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981', stroke: '#1e293b', strokeWidth: 2 }} activeDot={{ ...ACTIVE_DOT, fill: '#10b981' }} />
            <Line type="monotone" dataKey="importBnUsd" name="Import" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444', stroke: '#1e293b', strokeWidth: 2 }} activeDot={{ ...ACTIVE_DOT, fill: '#ef4444' }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <InsightPanel
        tier={1}
        content="The trade deficit directly impacts forex reserves and BDT stability. Imports peaked at $7.16B in Dec 2024 before moderating, while exports recovered steadily (led by RMG, 80% of total). The narrowing trade gap, combined with record remittances ($32.81B in 2025, +22% YoY), enabled BB to shift from massive USD selling to net buying — rebuilding reserves from under $20B to $35.1B."
      />

      {/* 7. NPL Percentage */}
      <ChartCard title="7. Non-Performing Loan (NPL) Rate" subtitle="NPL as % of total loans — Banks vs NBFIs">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <defs>
              <linearGradient id="nplBanksGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="nplNbfiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
            <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} label={{ value: 'Danger 10%', position: 'right', fill: '#ef4444', fontSize: 9 }} />
            <Area type="monotone" dataKey="nplPctBanks" name="Banks" stroke="#ef4444" strokeWidth={2} fill="url(#nplBanksGrad)" dot={{ r: 3, fill: '#ef4444', stroke: '#1e293b', strokeWidth: 2 }} activeDot={{ ...ACTIVE_DOT, fill: '#ef4444' }} />
            <Area type="monotone" dataKey="nplPctNBFIs" name="NBFIs" stroke="#f59e0b" strokeWidth={2} fill="url(#nplNbfiGrad)" dot={DOT_NBFI} activeDot={{ ...ACTIVE_DOT, fill: '#f59e0b' }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 8. Rescheduled Loan Outstanding */}
      <ChartCard title="8. Rescheduled Loan Outstanding" subtitle="Outstanding rescheduled loans in BDT Crore">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -5, bottom: 5 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number, name: string) => [`₹${v.toLocaleString()} Cr`, name]} />
            <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
            <Bar dataKey="rescheduledLoanBanksCrore" name="Banks" fill="#ef4444" radius={[3, 3, 0, 0]} />
            <Bar dataKey="rescheduledLoanNBFIsCrore" name="NBFIs" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <InsightPanel
        tier={1}
        content="Rescheduled loans mask the true extent of NPLs. 38.42% of rescheduled loans turned bad again (₹1.34L Cr re-defaulted). Total distressed assets (NPL + rescheduled + written-off) reached ₹7.57L Cr by Dec 2024. The new BB policy allows rescheduling for up to 10 years with 2% down payment — 300+ companies applied for ₹2L Cr in restructuring in 2025 alone."
      />

      {/* 9. BB USD Buy/Sell */}
      <ChartCard title="9. BB USD Buy & Sell Operations" subtitle="Bangladesh Bank forex interventions in Million USD">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -5, bottom: 5 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number, name: string) => [`$${v} Mn`, name]} />
            <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
            <Bar dataKey="bbUsdBuyMnUsd" name="BB Buys USD" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="bbUsdSellMnUsd" name="BB Sells USD" fill="#ef4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <InsightPanel
        tier={1}
        content="BB's forex operations underwent a dramatic reversal. After selling $28B from mid-2021 to mid-2025 to defend the taka, BB became a net buyer from July 2025 — purchasing $4.3B in just 7 months through competitive auctions. This was enabled by record remittances, import moderation, and the IMF-mandated market-based exchange rate. Reserves recovered from under $20B to $35.1B."
      />
    </div>
  )
}

function SummaryBox({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-lg bg-slate-800/80 border border-slate-700/50 p-2">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`text-base font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-[9px] text-slate-500">{sub}</p>
    </div>
  )
}
