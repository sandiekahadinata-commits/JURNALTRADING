import {
  BREAKEVEN_WIN_RATE,
  CHART_MONTHS_WINDOW,
  RISK_REWARD_RATIO,
} from '@/lib/constants'
import { addDays, todayKey } from '@/lib/date'
import { buildWeeklyInsights } from '@/lib/insights'
import { sortTradesByExitDesc } from '@/lib/trade-utils'
import type {
  BreakdownDimension,
  DailyMetrics,
  DimensionBreakdown,
  MonthlyMetrics,
  PeriodMetrics,
  StreakInfo,
  Trade,
  WeeklyEvaluation,
  WeeklyVerdict,
} from '@/types/journal.types'

export type { StreakInfo } from '@/types/journal.types'

export function groupTradesByMonth(trades: Trade[]): Map<string, Trade[]> {
  const groups = new Map<string, Trade[]>()
  for (const trade of trades) {
    const key = trade.month
    if (!key) continue
    const bucket = groups.get(key)
    if (bucket) bucket.push(trade)
    else groups.set(key, [trade])
  }
  return groups
}

function computeMaxConsecutive(
  trades: Trade[],
  target: 'Win' | 'Loss',
): number {
  let max = 0
  let current = 0
  for (const trade of trades) {
    if (trade.result === target) {
      current += 1
      max = Math.max(max, current)
    } else {
      current = 0
    }
  }
  return max
}

/** Metrik inti bersama untuk agregasi harian/mingguan/bulanan. */
export function computePeriodMetrics(trades: Trade[]): PeriodMetrics {
  const totalTrades = trades.length
  const wins = trades.filter((t) => t.result === 'Win').length
  const losses = trades.filter((t) => t.result === 'Loss').length
  const breakEvens = trades.filter((t) => t.result === 'Break Even').length

  const winRate = totalTrades === 0 ? 0 : (wins / totalTrades) * 100

  // Net R mengikuti PRD: (Wins x 3R) - (Losses x 1R)
  const netR = wins * RISK_REWARD_RATIO - losses

  const grossProfit = trades
    .filter((t) => t.pnl > 0)
    .reduce((sum, t) => sum + t.pnl, 0)
  const grossLoss = Math.abs(
    trades.filter((t) => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0),
  )
  const profitFactor =
    grossLoss === 0
      ? grossProfit > 0
        ? Number.POSITIVE_INFINITY
        : 0
      : grossProfit / grossLoss

  const winRateFraction = wins / (totalTrades || 1)
  const lossRateFraction = losses / (totalTrades || 1)
  const expectedValue =
    winRateFraction * RISK_REWARD_RATIO - lossRateFraction * 1

  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0)

  const avgRMultiple =
    totalTrades === 0
      ? 0
      : trades.reduce((sum, t) => sum + t.rMultiple, 0) / totalTrades

  return {
    totalTrades,
    wins,
    losses,
    breakEvens,
    winRate,
    netR,
    profitFactor,
    expectedValue,
    totalPnl,
    avgRMultiple,
  }
}

export function computeMonthlyMetrics(
  month: string,
  trades: Trade[],
): MonthlyMetrics {
  const base = computePeriodMetrics(trades)
  const chronological = sortTradesByExitDesc(trades).reverse()

  return {
    month,
    ...base,
    maxConsecutiveLoss: computeMaxConsecutive(chronological, 'Loss'),
    maxConsecutiveWin: computeMaxConsecutive(chronological, 'Win'),
  }
}

export function computeDailyMetrics(
  date: string,
  trades: Trade[],
): DailyMetrics {
  return { date, ...computePeriodMetrics(trades) }
}

/** Semua bulan yang punya data, urut menaik (asc). */
export function getMonthKeys(trades: Trade[]): string[] {
  return [...new Set(trades.map((t) => t.month).filter(Boolean))].sort()
}

/** Series metrik bulanan urut menaik. */
export function computeMonthlySeries(trades: Trade[]): MonthlyMetrics[] {
  const groups = groupTradesByMonth(trades)
  return getMonthKeys(trades).map((month) =>
    computeMonthlyMetrics(month, groups.get(month) ?? []),
  )
}

/** Ambil N bulan terakhir (default 6) dari series. */
export function getRecentMonthlySeries(
  trades: Trade[],
  window: number = CHART_MONTHS_WINDOW,
): MonthlyMetrics[] {
  return computeMonthlySeries(trades).slice(-window)
}

/** Trade dengan exitDate dalam rentang [startDate, endDate] (inklusif). */
export function getTradesInRange(
  trades: Trade[],
  startDate: string,
  endDate: string,
): Trade[] {
  return trades.filter(
    (trade) =>
      trade.exitDate >= startDate && trade.exitDate <= endDate,
  )
}

/** Rentang N hari terakhir yang berakhir di `endKey` (inklusif). */
export function getLastNDaysRange(
  endKey: string,
  days: number,
): { startDate: string; endDate: string } {
  return { startDate: addDays(endKey, -(days - 1)), endDate: endKey }
}

/** Series P&L harian N hari terakhir, urut menaik (paling lama -> hari ini). */
export function getRecentDailySeries(
  trades: Trade[],
  days = 7,
  endKey: string = todayKey(),
): DailyMetrics[] {
  const { startDate, endDate } = getLastNDaysRange(endKey, days)

  const byDate = new Map<string, Trade[]>()
  for (const trade of trades) {
    const key = trade.exitDate
    if (key < startDate || key > endDate) continue
    const bucket = byDate.get(key)
    if (bucket) bucket.push(trade)
    else byDate.set(key, [trade])
  }

  const series: DailyMetrics[] = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const key = addDays(endDate, -i)
    series.push(computeDailyMetrics(key, byDate.get(key) ?? []))
  }
  return series
}

function groupKey(trade: Trade, dimension: BreakdownDimension): string {
  const key = trade[dimension]
  return key && String(key).trim() ? String(key) : '—'
}

export function computeDimensionBreakdown(
  trades: Trade[],
  dimension: BreakdownDimension,
): DimensionBreakdown[] {
  const groups = new Map<string, Trade[]>()
  for (const trade of trades) {
    const key = groupKey(trade, dimension)
    const bucket = groups.get(key)
    if (bucket) bucket.push(trade)
    else groups.set(key, [trade])
  }

  return [...groups.entries()]
    .map(([key, group]) => {
      const base = computePeriodMetrics(group)
      return {
        key,
        totalTrades: base.totalTrades,
        wins: base.wins,
        losses: base.losses,
        breakEvens: base.breakEvens,
        winRate: base.winRate,
        netR: base.netR,
        totalPnl: base.totalPnl,
      }
    })
    .sort((a, b) => b.netR - a.netR)
}

export function computeAllBreakdowns(
  trades: Trade[],
): Record<BreakdownDimension, DimensionBreakdown[]> {
  return {
    setupTag: computeDimensionBreakdown(trades, 'setupTag'),
    session: computeDimensionBreakdown(trades, 'session'),
    symbol: computeDimensionBreakdown(trades, 'symbol'),
    direction: computeDimensionBreakdown(trades, 'direction'),
    timeframe: computeDimensionBreakdown(trades, 'timeframe'),
  }
}

export interface BestWorstTrade {
  best: Trade | null
  worst: Trade | null
}

export function computeBestWorstTrade(trades: Trade[]): BestWorstTrade {
  if (trades.length === 0) return { best: null, worst: null }
  const sorted = [...trades].sort((a, b) => b.pnl - a.pnl)
  return { best: sorted[0], worst: sorted[sorted.length - 1] }
}

export function weeklyVerdict(netR: number): WeeklyVerdict {
  if (netR > 0) return 'PROFITABLE'
  if (netR < 0) return 'RUGI'
  return 'FLAT'
}

/** Evaluasi hasil trading N hari terakhir (default 7, basis exitDate). */
export function computeWeeklyEvaluation(
  trades: Trade[],
  endKey: string = todayKey(),
  days = 7,
): WeeklyEvaluation {
  const { startDate, endDate } = getLastNDaysRange(endKey, days)
  const weekTrades = getTradesInRange(trades, startDate, endDate)
  const metrics = computePeriodMetrics(weekTrades)
  const { best, worst } = computeBestWorstTrade(weekTrades)
  const streaks = computeStreaks(weekTrades)
  const breakdowns = computeAllBreakdowns(weekTrades)

  return {
    startDate,
    endDate,
    metrics,
    verdict: weeklyVerdict(metrics.netR),
    bestTrade: best,
    worstTrade: worst,
    streaks,
    breakdowns,
    insights: buildWeeklyInsights(metrics, breakdowns, streaks),
  }
}

/** Streak saat ini + rekor streak win/loss. */
export function computeStreaks(trades: Trade[]): StreakInfo {
  const chronological = sortTradesByExitDesc(trades).reverse()
  const maxConsecutiveWin = computeMaxConsecutive(chronological, 'Win')
  const maxConsecutiveLoss = computeMaxConsecutive(chronological, 'Loss')

  let type: StreakInfo['type'] = 'None'
  let count = 0
  for (let i = chronological.length - 1; i >= 0; i -= 1) {
    const result = chronological[i].result
    if (result === 'Break Even') break
    if (type === 'None') type = result
    if (result !== type) break
    count += 1
  }

  return { type, count, maxConsecutiveWin, maxConsecutiveLoss }
}

export interface BestWorstMonth {
  best: MonthlyMetrics | null
  worst: MonthlyMetrics | null
}

/** Bulan terbaik & terburuk berdasarkan Net R. */
export function computeBestWorstMonth(trades: Trade[]): BestWorstMonth {
  const series = computeMonthlySeries(trades)
  if (series.length === 0) return { best: null, worst: null }
  const sorted = [...series].sort((a, b) => b.netR - a.netR)
  return { best: sorted[0], worst: sorted[sorted.length - 1] }
}

export function getBreakevenWinRate(): number {
  return BREAKEVEN_WIN_RATE
}
