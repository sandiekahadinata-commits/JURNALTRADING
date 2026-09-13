import { Award, TrendingDown } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  formatCurrency,
  formatMonthLongID,
  formatPercent,
  formatR,
} from '@/lib/format'
import type { BestWorstMonth as BestWorstMonthData } from '@/lib/metrics'

function MonthRow({
  title,
  icon,
  metric,
  accent,
}: {
  title: string
  icon: React.ReactNode
  metric: BestWorstMonthData['best']
  accent: string
}) {
  if (!metric) {
    return (
      <div className="rounded-lg border border-border bg-secondary/30 p-3">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">Belum ada data</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="mb-1 flex items-center gap-2">
        {icon}
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
      </div>
      <p className="text-sm font-semibold">
        {formatMonthLongID(metric.month)}
      </p>
      <p className={`text-lg font-semibold ${accent}`}>
        {formatR(metric.netR, { signed: true })}
      </p>
      <p className="text-xs text-muted-foreground">
        WR {formatPercent(metric.winRate)} · P&L{' '}
        {formatCurrency(metric.totalPnl, { signed: true })}
      </p>
    </div>
  )
}

export function BestWorstMonth({
  data,
}: {
  data: BestWorstMonthData
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Best / Worst Month</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <MonthRow
          title="Bulan Terbaik"
          icon={<Award className="h-4 w-4 text-emerald-400" />}
          metric={data.best}
          accent="text-emerald-400"
        />
        <MonthRow
          title="Bulan Terburuk"
          icon={<TrendingDown className="h-4 w-4 text-red-400" />}
          metric={data.worst}
          accent="text-red-400"
        />
      </CardContent>
    </Card>
  )
}
