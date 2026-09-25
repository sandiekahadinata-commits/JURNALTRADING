import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ResultBadge } from '@/components/trades/ResultBadge'
import { formatCurrency, formatDateID, formatR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Trade } from '@/types/journal.types'

interface DayDetailDialogProps {
  dateKey: string | null
  trades: Trade[]
  onOpenChange: (open: boolean) => void
}

export function DayDetailDialog({
  dateKey,
  trades,
  onOpenChange,
}: DayDetailDialogProps) {
  const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0)

  return (
    <Dialog open={dateKey !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {dateKey ? `Trade ${formatDateID(dateKey)}` : 'Detail Trade'}
          </DialogTitle>
          <DialogDescription>
            {trades.length > 0
              ? `${trades.length} trade • Total ${formatCurrency(totalPnl, { signed: true })}`
              : 'Tidak ada trade pada tanggal ini.'}
          </DialogDescription>
        </DialogHeader>

        {trades.length > 0 ? (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {trades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/40 p-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{trade.symbol}</span>
                    <span className="text-xs text-muted-foreground">
                      {trade.direction} • {trade.timeframe}
                    </span>
                  </div>
                  {trade.setupTag ? (
                    <p className="text-xs text-muted-foreground">
                      {trade.setupTag}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <ResultBadge result={trade.result} />
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-sm font-semibold tabular-nums',
                        trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400',
                      )}
                    >
                      {formatCurrency(trade.pnl, { signed: true })}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {formatR(trade.rMultiple, { signed: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
