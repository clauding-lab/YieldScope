export interface PricePoint {
  date: string
  price: number
}

export interface OilData {
  brentUsd: number
  change1d: number
  change30d: number
  history: PricePoint[]
}

export interface LngData {
  jkmUsdMmbtu: number
  change30d: number
  history: PricePoint[]
}

export interface GoldData {
  priceUsd: number
  change30d: number
  history: PricePoint[]
}

export interface ImportBillImpact {
  monthlyOilImportBnUsd: number
  monthlyLngImportBnUsd: number
  estimatedAnnualEnergyBnUsd: number
  oilDependencyPct: number
  lngDependencyPct: number
}

export interface CommodityData {
  lastUpdated: string
  oil: OilData
  lng: LngData
  gold: GoldData
  importBillImpact: ImportBillImpact
}
