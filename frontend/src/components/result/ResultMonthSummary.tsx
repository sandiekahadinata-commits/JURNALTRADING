import { BarChart3, DollarSign, Hash, Percent } from 'lucide-react'

import { KpiCard, type KpiTone } from '@/components/dashboard/KpiCard'
import { formatCurrency, formatPercent, formatR } from '@/lib/format'
import type { MonthlyMetrics } from '@/types/journal.types'

function winRateTone(winRate: number, breakEven: number): KpiTone {
  if (winRate > 33) return 'positive'
  if (winRate >= breakEven) return 'warning'
  return 'negative'
}

export function ResultMonthSummary({
  metrics,
  breakevenWinRate,
}: {
  metrics: MonthlyMetrics
  breakevenWinRate: number
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Total P&L"
        value={formatCurrency(metrics.totalPnl, { signed: true })}
        hint={`${metrics.totalTrades} trades bulan ini`}
        tone={metrics.totalPnl >= 0 ? 'positive' : 'negative'}
        icon={DollarSign}
      />
      <KpiCard
        label="Jumlah Trade"
        value={`${metrics.totalTrades} trades`}
        hint={`${metrics.wins}W / ${metrics.losses}L / ${metrics.breakEvens}BE`}
        tone="neutral"
        icon={Hash}
      />
      <KpiCard
        label="Win Rate"
        value={formatPercent(metrics.winRate)}
        hint={`Target breakeven ${formatPercent(breakevenWinRate)}`}
        tone={winRateTone(metrics.winRate, breakevenWinRate)}
        icon={Percent}
      />
      <KpiCard
        label="Net R"
        value={formatR(metrics.netR, { signed: true })}
        hint={`Avg ${formatR(metrics.avgRMultiple, { signed: true })}`}
        tone={metrics.netR >= 0 ? 'positive' : 'negative'}
        icon={BarChart3}
      />
    </div>
  )
}
