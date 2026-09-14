import {
  IMPROVE_PROFIT_FACTOR_DELTA,
  IMPROVE_WIN_RATE_DELTA,
} from '@/lib/constants'
import { formatProfitFactor } from '@/lib/format'
import type {
  ImproveDimension,
  ImproveStatus,
  ImproveVerdict,
  PeriodMetrics,
} from '@/types/journal.types'

function profitFactorDelta(current: number, previous: number): number {
  if (!Number.isFinite(current) && !Number.isFinite(previous)) return 0
  if (!Number.isFinite(current)) return Number.POSITIVE_INFINITY
  if (!Number.isFinite(previous)) return Number.NEGATIVE_INFINITY
  return current - previous
}

/**
 * Hitung status IMPROVING berdasarkan 3 dimensi (Section 4.2 PRD).
 * >= 2 dimensi improve => IMPROVING, 1 => NEEDS ATTENTION, 0 => DECLINING.
 */
export function computeImproveStatus(
  current: PeriodMetrics | null,
  previous: PeriodMetrics | null,
): ImproveStatus {
  if (!current || !previous) {
    return {
      verdict: 'NEEDS ATTENTION',
      dimensions: [],
      improvedCount: 0,
    }
  }

  const winRateDelta = current.winRate - previous.winRate
  const pfDelta = profitFactorDelta(current.profitFactor, previous.profitFactor)
  const netRImproved = current.netR > previous.netR && current.netR > 0

  const dimensions: ImproveDimension[] = [
    {
      label: 'Profitabilitas',
      improved: winRateDelta >= IMPROVE_WIN_RATE_DELTA,
      detail: `Win Rate ${winRateDelta >= 0 ? '+' : ''}${winRateDelta.toFixed(1)}% (min +${IMPROVE_WIN_RATE_DELTA}%)`,
    },
    {
      label: 'Efisiensi',
      improved: pfDelta >= IMPROVE_PROFIT_FACTOR_DELTA,
      detail:
        Number.isFinite(pfDelta) && pfDelta !== 0
          ? `Profit Factor ${pfDelta >= 0 ? '+' : ''}${pfDelta.toFixed(2)} (min +${IMPROVE_PROFIT_FACTOR_DELTA})`
          : `Profit Factor ${formatProfitFactor(current.profitFactor)} vs ${formatProfitFactor(previous.profitFactor)}`,
    },
    {
      label: 'Konsistensi',
      improved: netRImproved,
      detail: `Net R ${current.netR >= 0 ? '+' : ''}${current.netR.toFixed(1)}R vs ${previous.netR >= 0 ? '+' : ''}${previous.netR.toFixed(1)}R`,
    },
  ]

  const improvedCount = dimensions.filter((d) => d.improved).length

  const verdict: ImproveVerdict =
    improvedCount >= 2
      ? 'IMPROVING'
      : improvedCount === 1
        ? 'NEEDS ATTENTION'
        : 'DECLINING'

  return { verdict, dimensions, improvedCount }
}
