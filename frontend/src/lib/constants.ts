import type {
  Direction,
  MarketSession,
  Timeframe,
  TradeResult,
} from '@/types/journal.types'

export const DIRECTIONS: Direction[] = ['Long', 'Short']

export const TIMEFRAMES: Timeframe[] = ['15m', '1H', '4H', '1D', '1W']

export const TRADE_RESULTS: TradeResult[] = ['Win', 'Loss', 'Break Even']

export const MARKET_SESSIONS: MarketSession[] = [
  'Asia',
  'London',
  'New York',
  'Overlap',
]

export const DEFAULT_SETUP_TAGS = [
  'Breakout',
  'Pullback',
  'Range',
  'OB',
  'FVG',
]

export const RISK_REWARD_RATIO = 3

/** Toleransi deviasi TP terhadap RR 1:3 (fraksi desimal, 0.005 = 0.5%). */
export const RR_TOLERANCE = 0.005

/** Batas breakeven win rate untuk RR 1:3 => 25%. */
export const BREAKEVEN_WIN_RATE = 25

export const IMPROVE_WIN_RATE_DELTA = 2
export const IMPROVE_PROFIT_FACTOR_DELTA = 0.1

export const CHART_MONTHS_WINDOW = 6
export const LAST_TRADES_LIMIT = 5

export const MONTH_LABELS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]
