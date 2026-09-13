export type Direction = 'Long' | 'Short'

export type Timeframe = '15m' | '1H' | '4H' | '1D' | '1W'

export type TradeResult = 'Win' | 'Loss' | 'Break Even'

export type MarketSession = 'Asia' | 'London' | 'New York' | 'Overlap'

export interface Trade {
  id: string
  entryDate: string
  exitDate: string
  symbol: string
  direction: Direction
  timeframe: Timeframe
  entryPrice: number
  stopLoss: number
  takeProfit: number
  positionSize: number
  riskPerTrade: number
  result: TradeResult
  exitPrice: number
  pnl: number
  setupTag?: string
  session?: MarketSession
  notes?: string
  screenshotUrl?: string
  /** Derived: P&L Aktual / Risk per Trade */
  rMultiple: number
  /** Derived: YYYY-MM from exitDate */
  month: string
}

export interface JournalConfig {
  accountBalance: number
  riskPercent: number
  targetWinRate: number
  setupTags: string[]
}

export interface MonthlyMetrics {
  month: string
  totalTrades: number
  wins: number
  losses: number
  breakEvens: number
  winRate: number
  netR: number
  profitFactor: number
  expectedValue: number
  totalPnl: number
  maxConsecutiveLoss: number
  maxConsecutiveWin: number
  avgRMultiple: number
}

export type ImproveVerdict = 'IMPROVING' | 'NEEDS ATTENTION' | 'DECLINING'

export interface ImproveDimension {
  label: string
  improved: boolean
  detail: string
}

export interface ImproveStatus {
  verdict: ImproveVerdict
  dimensions: ImproveDimension[]
  improvedCount: number
}
