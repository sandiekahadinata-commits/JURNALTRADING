import { Link } from 'react-router-dom'

import { ResultBadge } from '@/components/trades/ResultBadge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDateID, formatR } from '@/lib/format'
import { sortTradesByExitDesc } from '@/lib/trade-utils'
import { cn } from '@/lib/utils'
import type { Trade } from '@/types/journal.types'

export function LastTradesTable({ trades }: { trades: Trade[] }) {
  const latest = sortTradesByExitDesc(trades).slice(0, 5)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Last 5 Trades</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link to="/trades">Lihat semua</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {latest.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Belum ada trade.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exit</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Setup</TableHead>
                <TableHead>Hasil</TableHead>
                <TableHead className="text-right">R</TableHead>
                <TableHead className="text-right">P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latest.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateID(trade.exitDate)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {trade.symbol}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {trade.direction}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {trade.setupTag ?? '-'}
                  </TableCell>
                  <TableCell>
                    <ResultBadge result={trade.result} />
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium tabular-nums',
                      trade.rMultiple >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400',
                    )}
                  >
                    {formatR(trade.rMultiple, { signed: true })}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium tabular-nums',
                      trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400',
                    )}
                  >
                    {formatCurrency(trade.pnl, { signed: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
