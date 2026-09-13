import {
  BREAKEVEN_WIN_RATE,
  CHART_MONTHS_WINDOW,
  RISK_REWARD_RATIO,
} from '@/lib/constants'
import { sortTradesByExitDesc } from '@/lib/trade-utils'
import type { MonthlyMetrics, Trade } from '@/types/journal.types'

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

export function computeMonthlyMetrics(
  month: string,
  trades: Trade[],
): MonthlyMetrics {
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
    grossLoss === 0 ? (grossProfit > 0 ? Number.POSITIVE_INFINITY : 0) : grossProfit / grossLoss

  const winRateFraction = wins / (totalTrades || 1)
  const lossRateFraction = losses / (totalTrades || 1)
  const expectedValue =
    winRateFraction * RISK_REWARD_RATIO - lossRateFraction * 1

  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0)

  const avgRMultiple =
    totalTrades === 0
      ? 0
      : trades.reduce((sum, t) => sum + t.rMultiple, 0) / totalTrades

  const chronological = sortTradesByExitDesc(trades).reverse()

  return {
    month,
    totalTrades,
    wins,
    losses,
    breakEvens,
    winRate,
    netR,
    profitFactor,
    expectedValue,
    totalPnl,
    maxConsecutiveLoss: computeMaxConsecutive(chronological, 'Loss'),
    maxConsecutiveWin: computeMaxConsecutive(chronological, 'Win'),
    avgRMultiple,
  }
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

export interface StreakInfo {
  type: 'Win' | 'Loss' | 'None'
  count: number
  maxConsecutiveWin: number
  maxConsecutiveLoss: number
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
