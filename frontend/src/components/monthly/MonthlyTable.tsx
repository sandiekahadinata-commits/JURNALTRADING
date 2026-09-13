import { ImproveStatusBadge } from '@/components/dashboard/ImproveStatusBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatCurrency,
  formatMonthLongID,
  formatPercent,
  formatProfitFactor,
  formatR,
} from '@/lib/format'
import { computeImproveStatus } from '@/lib/improve'
import type { MonthlyMetrics } from '@/types/journal.types'
import { cn } from '@/lib/utils'

export function MonthlyTable({ series }: { series: MonthlyMetrics[] }) {
  if (series.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        Belum ada data bulanan.
      </div>
    )
  }

  const rows = series
    .map((metrics, index) => ({
      metrics,
      previous: index > 0 ? series[index - 1] : null,
    }))
    .reverse()

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bulan</TableHead>
            <TableHead className="text-right">Trade</TableHead>
            <TableHead className="text-right">W / L / BE</TableHead>
            <TableHead className="text-right">Win Rate</TableHead>
            <TableHead className="text-right">Net R</TableHead>
            <TableHead className="text-right">Profit Factor</TableHead>
            <TableHead className="text-right">EV</TableHead>
            <TableHead className="text-right">Total P&L</TableHead>
            <TableHead className="text-right">Max Loss</TableHead>
            <TableHead className="text-right">Max Win</TableHead>
            <TableHead className="text-right">Avg R</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ metrics, previous }) => {
            const improve = computeImproveStatus(metrics, previous)
            return (
              <TableRow key={metrics.month}>
                <TableCell className="font-medium">
                  {formatMonthLongID(metrics.month)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {metrics.totalTrades}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {metrics.wins} / {metrics.losses} / {metrics.breakEvens}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-medium tabular-nums',
                    metrics.winRate > 33
                      ? 'text-emerald-400'
                      : metrics.winRate >= 25
                        ? 'text-amber-400'
                        : 'text-red-400',
                  )}
                >
                  {formatPercent(metrics.winRate)}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-medium tabular-nums',
                    metrics.netR >= 0 ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {formatR(metrics.netR, { signed: true })}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right tabular-nums',
                    metrics.profitFactor >= 1.5
                      ? 'text-emerald-400'
                      : metrics.profitFactor >= 1
                        ? 'text-amber-400'
                        : 'text-red-400',
                  )}
                >
                  {formatProfitFactor(metrics.profitFactor)}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right tabular-nums',
                    metrics.expectedValue >= 0
                      ? 'text-emerald-400'
                      : 'text-red-400',
                  )}
                >
                  {formatR(metrics.expectedValue, { signed: true })}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-medium tabular-nums',
                    metrics.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {formatCurrency(metrics.totalPnl, { signed: true })}
                </TableCell>
                <TableCell className="text-right tabular-nums text-red-400">
                  {metrics.maxConsecutiveLoss}x
                </TableCell>
                <TableCell className="text-right tabular-nums text-emerald-400">
                  {metrics.maxConsecutiveWin}x
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right tabular-nums',
                    metrics.avgRMultiple >= 0
                      ? 'text-emerald-400'
                      : 'text-red-400',
                  )}
                >
                  {formatR(metrics.avgRMultiple, { signed: true })}
                </TableCell>
                <TableCell>
                  {previous ? (
                    <ImproveStatusBadge verdict={improve.verdict} />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Baseline
                    </span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
