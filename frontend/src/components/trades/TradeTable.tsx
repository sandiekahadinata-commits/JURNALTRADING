import { ExternalLink, Pencil, Trash2 } from 'lucide-react'

import { ResultBadge } from '@/components/trades/ResultBadge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDateID, formatR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Trade } from '@/types/journal.types'

interface TradeTableProps {
  trades: Trade[]
  onEdit: (trade: Trade) => void
  onDelete: (id: string) => void
}

export function TradeTable({ trades, onEdit, onDelete }: TradeTableProps) {
  if (trades.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        Tidak ada trade yang cocok dengan filter.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Entry</TableHead>
            <TableHead>Exit</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead>Arah</TableHead>
            <TableHead>TF</TableHead>
            <TableHead>Setup</TableHead>
            <TableHead>Sesi</TableHead>
            <TableHead className="text-right">Entry</TableHead>
            <TableHead className="text-right">SL</TableHead>
            <TableHead className="text-right">TP</TableHead>
            <TableHead className="text-right">Risk</TableHead>
            <TableHead className="text-right">Exit</TableHead>
            <TableHead>Hasil</TableHead>
            <TableHead className="text-right">R</TableHead>
            <TableHead className="text-right">P&L</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {trade.id}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateID(trade.entryDate)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateID(trade.exitDate)}
              </TableCell>
              <TableCell className="font-medium">{trade.symbol}</TableCell>
              <TableCell>{trade.direction}</TableCell>
              <TableCell>{trade.timeframe}</TableCell>
              <TableCell>{trade.setupTag ?? '-'}</TableCell>
              <TableCell>{trade.session ?? '-'}</TableCell>
              <TableCell className="text-right tabular-nums">
                {trade.entryPrice}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {trade.stopLoss}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {trade.takeProfit}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(trade.riskPerTrade)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {trade.exitPrice}
              </TableCell>
              <TableCell>
                <ResultBadge result={trade.result} />
              </TableCell>
              <TableCell
                className={cn(
                  'text-right font-medium tabular-nums',
                  trade.rMultiple >= 0 ? 'text-emerald-400' : 'text-red-400',
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
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  {trade.screenshotUrl ? (
                    <Button asChild variant="ghost" size="icon">
                      <a
                        href={trade.screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Buka screenshot"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Edit"
                    onClick={() => onEdit(trade)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Hapus"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus trade {trade.id}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini tidak bisa dibatalkan. Trade {trade.symbol}{' '}
                          akan dihapus permanen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => onDelete(trade.id)}
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
