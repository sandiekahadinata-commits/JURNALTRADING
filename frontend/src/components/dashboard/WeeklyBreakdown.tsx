import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatCurrency, formatPercent, formatR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type {
  BreakdownDimension,
  DimensionBreakdown,
} from '@/types/journal.types'

const DIMENSION_LABELS: Record<BreakdownDimension, string> = {
  setupTag: 'Setup',
  session: 'Sesi',
  symbol: 'Symbol',
  direction: 'Arah',
  timeframe: 'Timeframe',
}

const DIMENSION_ORDER: BreakdownDimension[] = [
  'setupTag',
  'session',
  'symbol',
  'direction',
  'timeframe',
]

const MAX_ROWS = 6

function BreakdownTable({
  label,
  items,
}: {
  label: string
  items: DimensionBreakdown[]
}) {
  const rows = items.slice(0, MAX_ROWS)
  const hidden = items.length - rows.length

  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada data</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="pb-1 font-medium">Nama</th>
              <th className="pb-1 text-right font-medium">W/L</th>
              <th className="pb-1 text-right font-medium">WR</th>
              <th className="pb-1 text-right font-medium">Net R</th>
              <th className="pb-1 text-right font-medium">P&L</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-border/50">
                <td className="py-1 pr-2 font-medium">{row.key}</td>
                <td className="py-1 text-right text-muted-foreground tabular-nums">
                  {row.wins}/{row.losses}
                </td>
                <td className="py-1 text-right text-muted-foreground tabular-nums">
                  {formatPercent(row.winRate)}
                </td>
                <td
                  className={cn(
                    'py-1 text-right font-medium tabular-nums',
                    row.netR >= 0 ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {formatR(row.netR, { signed: true })}
                </td>
                <td
                  className={cn(
                    'py-1 text-right font-medium tabular-nums',
                    row.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {formatCurrency(row.totalPnl, { signed: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {hidden > 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">
          +{hidden} lainnya
        </p>
      ) : null}
    </div>
  )
}

export function WeeklyBreakdown({
  breakdowns,
}: {
  breakdowns: Record<BreakdownDimension, DimensionBreakdown[]>
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Breakdown Mingguan</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {DIMENSION_ORDER.map((dimension) => (
          <BreakdownTable
            key={dimension}
            label={DIMENSION_LABELS[dimension]}
            items={breakdowns[dimension]}
          />
        ))}
      </CardContent>
    </Card>
  )
}
