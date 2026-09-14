import { Award, TrendingDown } from 'lucide-react'

import { WeeklyVerdictBadge } from '@/components/dashboard/WeeklyVerdictBadge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  formatCurrency,
  formatDateRangeID,
  formatPercent,
  formatProfitFactor,
  formatR,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Trade, WeeklyEvaluation } from '@/types/journal.types'

function MetricCell({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-lg font-semibold tabular-nums', accent)}>
        {value}
      </p>
    </div>
  )
}

function TradeHighlight({
  title,
  trade,
  tone,
}: {
  title: string
  trade: Trade | null
  tone: 'positive' | 'negative'
}) {
  const accent = tone === 'positive' ? 'text-emerald-400' : 'text-red-400'
  const Icon = tone === 'positive' ? Award : TrendingDown

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="mb-1 flex items-center gap-2">
        <Icon
          className={cn('h-4 w-4', accent)}
        />
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
      </div>
      {trade ? (
        <>
          <p className="text-sm font-semibold">
            {trade.symbol}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {trade.direction} · {trade.result}
            </span>
          </p>
          <p className={cn('text-lg font-semibold', accent)}>
            {formatCurrency(trade.pnl, { signed: true })}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatR(trade.rMultiple, { signed: true })} ·{' '}
            {trade.setupTag || 'Tanpa setup'}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada data</p>
      )}
    </div>
  )
}

export function WeeklyEvaluationCard({
  evaluation,
}: {
  evaluation: WeeklyEvaluation
}) {
  const { metrics } = evaluation
  const pnlAccent = metrics.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
  const netRAccent = metrics.netR >= 0 ? 'text-emerald-400' : 'text-red-400'
  const evAccent =
    metrics.expectedValue >= 0 ? 'text-emerald-400' : 'text-red-400'

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">Ringkasan 7 Hari</CardTitle>
          <CardDescription>
            {formatDateRangeID(evaluation.startDate, evaluation.endDate)}
          </CardDescription>
        </div>
        <WeeklyVerdictBadge verdict={evaluation.verdict} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricCell
            label="P&L 7 Hari"
            value={formatCurrency(metrics.totalPnl, { signed: true })}
            accent={pnlAccent}
          />
          <MetricCell
            label="Win Rate"
            value={formatPercent(metrics.winRate)}
          />
          <MetricCell
            label="Net R"
            value={formatR(metrics.netR, { signed: true })}
            accent={netRAccent}
          />
          <MetricCell
            label="Jumlah Trade"
            value={`${metrics.totalTrades}`}
          />
          <MetricCell
            label="Profit Factor"
            value={formatProfitFactor(metrics.profitFactor)}
          />
          <MetricCell
            label="Expected Value"
            value={formatR(metrics.expectedValue, { signed: true })}
            accent={evAccent}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TradeHighlight
            title="Trade Terbaik"
            trade={evaluation.bestTrade}
            tone="positive"
          />
          <TradeHighlight
            title="Trade Terburuk"
            trade={evaluation.worstTrade}
            tone="negative"
          />
        </div>
      </CardContent>
    </Card>
  )
}
