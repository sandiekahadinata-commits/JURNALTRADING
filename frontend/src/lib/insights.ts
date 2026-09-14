import { BREAKEVEN_WIN_RATE } from '@/lib/constants'
import { formatCurrency, formatPercent, formatR } from '@/lib/format'
import type {
  BreakdownDimension,
  DimensionBreakdown,
  PeriodMetrics,
  StreakInfo,
} from '@/types/journal.types'

type Breakdowns = Record<BreakdownDimension, DimensionBreakdown[]>

function topByNetR(
  items: DimensionBreakdown[],
  mode: 'best' | 'worst',
): DimensionBreakdown | null {
  const valid = items.filter((item) => item.totalTrades > 0)
  if (valid.length === 0) return null
  const sorted = [...valid].sort((a, b) => b.netR - a.netR)
  return mode === 'best' ? sorted[0] : sorted[sorted.length - 1]
}

function dimensionInsights(
  label: string,
  items: DimensionBreakdown[],
): string[] {
  const out: string[] = []
  const best = topByNetR(items, 'best')
  if (best && best.netR > 0) {
    out.push(
      `${label} paling profitable: ${best.key} (${formatR(best.netR, { signed: true })} dari ${best.totalTrades} trade).`,
    )
  }
  const worst = topByNetR(items, 'worst')
  if (worst && worst.netR < 0) {
    out.push(
      `${label} paling merugikan: ${worst.key} (${formatR(worst.netR, { signed: true })}).`,
    )
  }
  return out
}

/** Susun insight teks otomatis dari hasil trading 7 hari terakhir. */
export function buildWeeklyInsights(
  metrics: PeriodMetrics,
  breakdowns: Breakdowns,
  streaks: StreakInfo,
): string[] {
  if (metrics.totalTrades === 0) {
    return ['Belum ada trade dalam 7 hari terakhir.']
  }

  const insights: string[] = []

  const pnlLabel = metrics.totalPnl >= 0 ? 'profit' : 'rugi'
  insights.push(
    `Minggu ini ${pnlLabel} ${formatCurrency(metrics.totalPnl, { signed: true })} (${formatR(metrics.netR, { signed: true })}) dari ${metrics.totalTrades} trade.`,
  )

  if (metrics.winRate >= BREAKEVEN_WIN_RATE) {
    insights.push(
      `Win rate ${formatPercent(metrics.winRate)} sudah di atas breakeven ${BREAKEVEN_WIN_RATE}%.`,
    )
  } else {
    insights.push(
      `Win rate ${formatPercent(metrics.winRate)} masih di bawah breakeven ${BREAKEVEN_WIN_RATE}%; seleksi entry perlu diperbaiki.`,
    )
  }

  insights.push(...dimensionInsights('Setup', breakdowns.setupTag))
  insights.push(...dimensionInsights('Sesi', breakdowns.session))
  insights.push(...dimensionInsights('Symbol', breakdowns.symbol))

  const long = breakdowns.direction.find((item) => item.key === 'Long')
  const short = breakdowns.direction.find((item) => item.key === 'Short')
  if (long && short && long.totalTrades > 0 && short.totalTrades > 0 && long.netR !== short.netR) {
    const better = long.netR > short.netR ? 'Long' : 'Short'
    insights.push(`Arah ${better} lebih menguntungkan minggu ini.`)
  }

  if (streaks.type !== 'None' && streaks.count >= 2) {
    insights.push(`Sedang rentetan ${streaks.count}x ${streaks.type}.`)
  } else if (streaks.maxConsecutiveLoss >= 2) {
    insights.push(
      `Streak loss terpanjang ${streaks.maxConsecutiveLoss}x; pertimbangkan evaluasi ulang saat loss beruntun.`,
    )
  }

  return insights
}
