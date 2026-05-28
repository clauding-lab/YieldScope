// EconDelta metric_id catalog. Sourced from
// econdelta/config/sources-v3.json and indicator-catalog.md (2026-05-27 inventory).
// Add new metric_ids here as they ship.

export const METRIC = {
  // Inflation
  CPI_HEADLINE:    'point_to_point_inflation',
  CPI_FOOD:        'food_inflation',
  CPI_NONFOOD:     'non_food_inflation',
  CPI_GENERAL:     'general_inflation',

  // FX
  USD_BDT:         'usd_bdt_exchange_rate',
  FX_RESERVES:     'fx_reserve_gross_and_bpm6',

  // Money market & yields
  CALL_MONEY:      'call_money_rate',
  POLICY_RATE:     'policy_rate_slf_sdf',
  TBILL_91:        'bill_bond_rates',
  TBILL_182:       'tbill_182d_yield',
  TBILL_364:       'tbill_364d_yield',
  TBOND_5Y:        'tbond_5y_yield',
  TBOND_10Y:       'tbond_10y_yield',
  GSEC_AUCTION:    'gsec_auction',
  INTERBANK_REPO:  'interbank_repo_data',
  TBILL_OUT:       'treasury_bill_outstanding',
  TBOND_OUT:       'treasury_bond_outstanding',

  // Monetary aggregates
  M2:              'broad_money',
  RESERVE_MONEY:   'reserve_money',
  EXCESS_LIQ:      'excess_liquid_asset_total_minimum',
  PRIV_CREDIT:     'private_sector_credit',
  PRIV_CREDIT_YOY: 'private_sector_credit_yoy_pct',
  TOTAL_DEPOSITS:  'deposits_of_the_system',
  NPL_RATIO:       'gross_npl_ratio',
  CRAR:            'banking_sector_crar',

  // External sector
  REMIT_MONTHLY:   'monthly_remittance',
  EXPORT_MONTHLY:  'monthly_export',
  IMPORT_MONTHLY:  'monthly_import',
  BOP:             'bop_summary',

  // Fiscal
  TAX_REV:         'tax_revenue',
  TOTAL_REV:       'total_revenue_budget_vs_actual',
  BUDGET_OPEX:     'budget_opex_of_the_fy_vs_utilization',
  BUDGET_ADPEX:    'budget_adpex_of_the_fy_vs_utilization',
  TAX_GDP:         'tax_gdp_ratio',
  REV_GDP:         'rev_gdp_ratio',
  DOMESTIC_BORROW: 'domestic_borrowing_for_budget_deficit',
  BANK_BORROW:     'bank_borrowing_for_deficit_financing',
  NSC_OUT:         'nsc_outstanding',

  // Commodities
  BRENT:           'brent_crude_usd_barrel',
  WTI:             'wti_crude_usd_barrel',
  GOLD:            'gold_usd_oz',

  // Equities
  DSEX:            'dsex',
  DSEX_CHG:        'dsex_change_pct',
  DS30:            'ds30',
  DSES:            'dses',
  DSE_TURNOVER:    'turnover_crore',

  // Monthly long-horizon (separate table)
  CPI_12M_AVG_M:   'cpi_12m_avg_monthly',
  CPI_FOOD_M:      'cpi_p2p_food_monthly',
  CPI_NONFOOD_M:   'cpi_p2p_nonfood_monthly',
} as const

export type MetricId = typeof METRIC[keyof typeof METRIC]

// Long-horizon metrics live in metric_history_monthly, not metric_history.
export const MONTHLY_METRICS: ReadonlySet<MetricId> = new Set([
  METRIC.CPI_12M_AVG_M,
  METRIC.CPI_FOOD_M,
  METRIC.CPI_NONFOOD_M,
])
